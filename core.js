const cheerio = require('cheerio');
const Promise = require("bluebird");
const request = Promise.promisifyAll(require('request'));
const config = require('./config');
const WebSocket = require('ws');
const ChatHandler = require('./chat');
const colors = require('colors');

if (!config.user.hasOwnProperty("email") || !config.user.hasOwnProperty("password") || !Object.keys(config.room_domains).length > 0) {
    throw new Error("Default configurations missing");
}
var domainVars = {
    fkey: {},
    jars: {}
};

function openWebSocket(url, time, domain) {
    return new Promise(function(resolve, reject) {
        const ws = new WebSocket(url + "?l=" + time, null, {
            headers: {
                'Origin': 'http://chat.' + domain + '.com'
            }
        });
        ws.on('message', function(jsonMessage) {
            var message = JSON.parse(jsonMessage)
            var keys = Object.keys(message)
            keys.forEach(function(key) {
                message[key].e && message[key].e.forEach(ChatHandler.processEvent);
            });
        });
        ws.on('open', function() {
            resolve(domain);
        });
        ws.on('error', function() {
            reject(e);
        });
    });
};

var connectDomainRooms = function(domain, initialRoom, rooms) {
    var initialRoomId = initialRoom.room_id;
    domain = domain.toLowerCase();
    domainVars.jars[domain] = request.jar();

    // Return a promise here
    return request.getAsync({
        url: 'https://' + (domain == "stackexchange" ? "codereview." : "") + domain + '.com/users/login',
        jar: domainVars.jars[domain]
    }).then(function(response) {
        var $ = cheerio.load(response.body);
        var fkey = $("input[name=fkey]").attr('value');
        return request.postAsync({
            url: 'https://' + (domain == "stackexchange" ? "codereview." : "") + domain + '.com/users/login',
            form: {
                email: config.user.email,
                password: config.user.password,
                fkey: fkey
            },
            jar: domainVars.jars[domain]
        });
    }).then(function(response) {
        return request.getAsync({
            url: 'http://chat.' + domain + '.com/rooms/' + initialRoomId + '/events',
            jar: domainVars.jars[domain]
        });
    }).then(function(response) {
        var $ = cheerio.load(response.body)
        var fkey = $("input[name=fkey]").attr('value');
        domainVars.fkey[domain] = fkey;
        var url;
        var time;
        request.postAsync({
            url: 'http://chat.' + domain + '.com/ws-auth',
            form: {
                fkey: fkey,
                roomid: initialRoomId
            },
            jar: domainVars.jars[domain]
        }).then(function(response) {
            if (response.body.indexOf("<!DOCTYPE HTML PUBLIC") !== -1) {
                throw "There was an issue with the response. Check your config is correct.";
            }
            url = JSON.parse(response.body).url;
            Object.keys(rooms).forEach(function(room) {
                room = rooms[room];
                debug(colors.yellow("Connecting to ") + colors.bold.white(room.name));
                joinRoom(domain, room.room_id, fkey);
            });
            debug(colors.yellow("Connecting to ") + colors.bold.white(initialRoom.name));
            return request.postAsync({
                url: 'http://chat.' + domain + '.com/ws-auth',
                form: {
                    fkey: fkey,
                    roomid: initialRoomId
                },
                jar: domainVars.jars[domain]
            });
        }).then(function(response) {
            time = Math.floor(Date.now() / 1000);
            // Where are you getting url from?
            return openWebSocket(url, time, domain)
            .then(function(){
                debug('Opened a connection to '.yellow + colors.bold.white(domain)
            )})
            .catch(function(err){
                console.log(colors.bold.red(err))
            });
        });
    });
};
var send = function(domain, roomId, text, prefix) {
    if (!domain || !roomId || !text) {
        console.log(colors.bold.red("[Chat Client] You're missing a part of that message"));
        return;
    }
    request.post({
        url: 'http://chat.' + domain + '.com/chats/' + roomId + '/messages/new',
        form: {
            fkey: domainVars.fkey[domain],
            text: prefix ? prefix + ' ' + text : text
        },
        jar: domainVars.jars[domain]
    });
};

function debug(message) {
    if (config.debug) {
        console.log(message);
    }
}
var joinRoom = function(domain, roomId, fkey) {
    fkey = fkey || domainVars.fkey[domain];
    return request.postAsync({
        url: 'http://chat.' + domain + '.com/ws-auth',
        form: {
            fkey: fkey,
            roomid: roomId
        },
        jar: domainVars.jars[domain]
    });
};
var chatAbbreviationToFull = function(domainAbbreviation) {
    if (typeof domainAbbreviation !== "string") throw new Error("Abbeviation must be a string");
    return {
        mse: "meta.stackexchange",
        so: "stackoverflow",
        se: "stackexchange"
    }[domainAbbreviation.toString().toLowerCase()];
};
var start = function() {
    const promises = Object.keys(config.room_domains).map(function(domain) {
        domain = config.room_domains[domain];
        var firstDomainName = Object.keys(domain.rooms)[0];
        var domainRooms = JSON.parse(JSON.stringify(domain.rooms));
        delete domainRooms[firstDomainName];
        return connectDomainRooms(domain.name, domain.rooms[firstDomainName], domainRooms);
    })
    return Promise.all(promises)
};
module.exports = {
    joinRoom: joinRoom,
    chatAbbreviationToFull: chatAbbreviationToFull,
    send: send,
    start: start
};
