var http = require('http'),
    io = require('socket.io'),
    redis = require('redis'),
    xmpp = require('node-xmpp'),
    flow = require('flow');

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
                process_add(message.id);
            };
        });
    });
});

var process_add = flow.define(

    function(msg_id) {
        db.hget('fosscomm2011:sessions:all', msg_id, this);
        this.msg_id = msg_id;
    },

    function(err, data) {
        db.hexists('fosscomm2011:sessions:current', this.msg_id, this);
        this.data = data;
    },

    function(err, reply) {
        if (!reply) {
            db.hsetnx('fosscomm2011:sessions:current', this.msg_id, this.data);
            var reply = {
                event: 'add',
                id: this.msg_id,
                session: JSON.parse(this.data)
            };
            socket.broadcast(JSON.stringify(reply));

            this.xmpp_msg = JSON.parse(this.data).title + ' @ ' + JSON.parse(this.data).room;

            db.smembers('fosscomm2011:session:' + this.msg_id, this);
        }
    },

    function(err, jids) {
        var that = this;
        jids.forEach(function (jid, i) {
            console.log('node-xmpp: sending to ' + jid);
            cl.send(new xmpp.Element('message', { to: jid, type: 'chat'}).c('body').t(that.xmpp_msg));
        });
    }
);
