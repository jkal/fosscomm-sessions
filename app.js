var http = require('http'),
    io = require('socket.io'),
    redis = require('redis');

server = http.createServer(function(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('O Hai.');
});
server.listen(8000);
  
var socket = io.listen(server); 
var db = redis.createClient();

socket.on('connection', function(client) {

    client.on('message', function (data) {
        var message = JSON.parse(data);

        if (message.event == 'delete') {
            db.hdel('fosscomm2011:sessions:current', message.id);
            socket.broadcast(JSON.stringify(message));
        };

        if (message.event == 'add') {
            db.hget('fosscomm2011:sessions:all', message.id, function(err, data) {
                db.hset('fosscomm2011:sessions:current', message.id, data);
                var reply = {
                    event: 'add',
                    id: message.id,
                    session: JSON.parse(data)
                };
                socket.broadcast(JSON.stringify(reply));
            });
        };
    });

});