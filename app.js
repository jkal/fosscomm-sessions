var express = require('express'),
    io = require('socket.io'),
    redis = require("redis");

var app = express.createServer();
var db = redis.createClient();

app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.set('view options', { layout: false });
    app.use(express.bodyDecoder());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.staticProvider(__dirname + '/public'));
});

app.get('/', function(req, res) {
    db.hgetall("fosscomm2011:sessions:current", function (err, curdata) {
        res.render('index.ejs', {
            locals: { cursessions: curdata }
        });
    });
});

if (!module.parent) {
    app.listen(3000);
    console.log("server listening on port %d", app.address().port)
}

var socket = io.listen(app);
var pubsub = redis.createClient();

pubsub.subscribe("fosscomm2011:pubsub");
socket.on('connection', function(client) {

    client.on('message', function(msg) { })
    client.on('disconnect', function() { })

    pubsub.on("message", function (channel, data) {
        var msg = JSON.parse(data);
        if (msg.event == 'add') {
            db.hget("fosscomm2011:sessions:all", msg.id, function(err, data){
                var reply = {
                    event: "add",
                    id: msg.id,
                    data: JSON.parse(data)
                };
                client.send(JSON.stringify(reply));
            });
        } else if (msg.event == 'delete') {
            client.send(data);
        };
    });
});
