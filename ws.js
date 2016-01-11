var cheerio = require('cheerio');
var Promise = require("bluebird");
var request = Promise.promisifyAll(require('request'));
var WebSocket = require('ws');
var handler = require('./chat').modules

var email = "",
	password = "",
	roomid = 8595;

var j = request.jar()
request.getAsync({url:"https://codereview.stackexchange.com/users/login", jar:j}).then(function(response){
    var $ = cheerio.load(response.body)
    var fkey = $("input[name=fkey]").attr('value')
    return request.postAsync({url:"https://codereview.stackexchange.com/users/login", form: {email:email,password:password,fkey:fkey}, jar:j})
}).then(function(response){
    return request.getAsync({url:"http://chat.stackexchange.com/rooms/" + roomid, jar:j})
}).then(function(response){
    var $ = cheerio.load(response.body)
    var fkey = $("input[name=fkey]").attr('value')
    var url, time;
    request.postAsync({url:"http://chat.stackexchange.com/ws-auth",form:{fkey:fkey,roomid:roomid}, jar:j}).then(function(response){
        url = JSON.parse(response.body).url
        return request.postAsync({url:"http://chat.stackexchange.com/chats/" + roomid + "/events", form:{fkey:fkey}, jar:j})
    }).then(function(response){
        time = JSON.parse(response.body).time;
            
        function send(text, prefix){
            request.post({
                url: "http://chat.stackexchange.com/chats/" +
                     roomid + "/messages/new",
                form: {
                    fkey: fkey,
                    text: prefix
                        ? prefix + ' ' + text
                        : text
                }, 
                jar: j
            });
        }
        var ws = new WebSocket(url + "?l=" + time, null, {
            headers: { 
                'Origin': 'http://chat.stackexchange.com'
            }
        });
        ws.on('message', function(message) {
            var m = JSON.parse(message);
            var keys = Object.keys(m);
            for (var i = 0; i < keys.length; i++){
                if (m[keys[i]].e){
                    m[keys[i]].e.forEach(function(ev){
                        handler.processEvent(ev);
                    });
                }
            }
        });
        ws.on('open', function() {
            console.log('opened')
        });
        ws.on('error', function(e) {
            console.log(e)
        });
    })
})