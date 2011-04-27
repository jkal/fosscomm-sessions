var http = require('http'),
    io = require('socket.io'),
    redis = require('redis'),
    xmpp = require('node-xmpp');

server = http.createServer(function(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('O Hai.');
});
server.listen(8000);

// -- Needs testing.
// -- See: https://github.com/LearnBoost/Socket.IO-node/pull/176
var socket = io.listen(server, { origins:'localhost:*' });

var db = redis.createClient();

db.on('error', function (err) {
    console.log(err.message);
});

var cl = new xmpp.Client({
    jid: 'admin@fosscomm.ceid.upatras.gr',
    password: ''
});

cl.on('error', function(e) {
    console.log('node-xmpp:' + e);
});

cl.on('online', function() {

    socket.on('connection', function(client) {

        client.on('message', function (data) {
            var message = JSON.parse(data);

            if (message.event == 'delete') {
                db.hdel('fosscomm2011:sessions:current', message.id);
                socket.broadcast(JSON.stringify(message));
            };

            if (message.event == 'add') {
                db.hget('fosscomm2011:sessions:all', message.id, function(err, data) {
                    db.hexists('fosscomm2011:sessions:current', message.id, function (err, reply) {
                        if (!reply) {
                            db.hsetnx('fosscomm2011:sessions:current', message.id, data);
                            var reply = {
                                event: 'add',
                                id: message.id,
                                session: JSON.parse(data)
                            };
                            socket.broadcast(JSON.stringify(reply));
                        };

                        var xmpp_msg = JSON.parse(data).title + ' @ ' + JSON.parse(data).room;
                        db.smembers('fosscomm2011:session:' + message.id, function(err, jids) {
                            jids.forEach(function (jid, i) {
                                console.log('node-xmpp: sending to ' + jid);
                                cl.send(new xmpp.Element('message', { to: jid, type: 'chat'}).c('body').t(xmpp_msg));
                            });
                        });

                    });
                });
            };
        });
    });

});
