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
    var sessions = [];
    db.hgetall("fosscomm2011:sessions:all", function (err, alldata) {
        db.hgetall("fosscomm2011:sessions:current", function (err, curdata) {
            res.render('admin.ejs', {
                locals: {
                    allsessions: alldata,
                    cursessions: curdata
                }
            });
        });
    });
});

if (!module.parent) {
    app.listen(8000);
    console.log("server listening on port %d", app.address().port)
}

var socket = io.listen(app);
var pubsub = redis.createClient();

socket.on('connection', function(client) {
    client.on('message', function(data) {
        var msg = JSON.parse(data);
        if (msg.event == 'add') {
            db.hget("fosscomm2011:sessions:all", msg.id, function(err, data){
                db.hset("fosscomm2011:sessions:current", msg.id, data);
                var t = JSON.stringify({
                    event: "add",
                    id: msg.id,
                    data: JSON.parse(data)
                })
                client.send(t);
            });
        } else if (msg.event == 'delete') {
            db.hdel("fosscomm2011:sessions:current", msg.id);
        }
        pubsub.publish("fosscomm2011:pubsub", data);
    });
});
