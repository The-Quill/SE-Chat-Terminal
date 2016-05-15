"use strict";
var cheerio = require("cheerio");
var Promise = require("bluebird");
var request = Promise.promisifyAll(require("request"));
var config = require("./config");
var WebSocket = require("ws");
var ChatHandler = require("./chat");

var domainVars = {
    fkey: {},
    jars: {}
};
var actions = {
    join: function(domain, roomId, fkey) {
        var fkeyProper = fkey || domainVars.fkey[domain];
        return request.postAsync({
            url: "http://chat." + domain + ".com/ws-auth",
            form: {
                fkey: fkeyProper,
                roomid: roomId
            },
            jar: domainVars.jars[domain]
        });
    },
    pingable: function(domain, roomId) {
        if (!domain || !roomId) {
            console.log("You're missing a part of that argument");
            return;
        }
        var fkey = domainVars.fkey[domain];
        return request.getAsync({
            url: "http://chat." + domain + ".com/rooms/pingable/" + roomId,
            jar: domainVars.jars[domain]
        });
    },
    leave: function(domain, roomId) {
        if (!domain || !roomId) {
            console.log("You're missing a part of that argument");
            return;
        }
        var fkey = domainVars.fkey[domain];
        return request.postAsync({
            url: "http://chat." + domain + ".com/chats/leave/" + roomId,
            form: {
                fkey: fkey
            },
            jar: domainVars.jars[domain]
        });
    },
    send: function(domain, roomId, text, prefix) {
        if (!domain || !roomId || !text) {
            console.log("You're missing a part of that command");
            return;
        }
        request.postAsync({
            url: "http://chat." + domain + ".com/chats/" + roomId + "/messages/new",
            form: {
                fkey: domainVars.fkey[domain],
                text: prefix ? prefix + " " + text : text
            },
            jar: domainVars.jars[domain]
        });
    },
    star: function(domain, messageId) {
        if (!domain || !messageId) {
            console.log("You're missing a part of that command");
            return;
        }
        var fkey = domainVars.fkey[domain];
        return request.postAsync({
            url: "http://chat." + domain + ".com/messages/" + messageId + "/star",
            form: {
                fkey: fkey
            },
            jar: domainVars.jars[domain]
        });
    },
    edit: function(domain, messageId, text) {
        if (!domain || !messageId || !text) {
            console.log("You're missing a part of that command");
            return;
        }
        var fkey = domainVars.fkey[domain];
        return request.postAsync({
            url: "http://chat." + domain + ".com/messages/" + messageId,
            form: {
                fkey: fkey,
                text: text
            },
            jar: domainVars.jars[domain]
        });
    },
    delete: function(domain, messageId) {
        if (!domain || !messageId) {
            console.log("You're missing a part of that command");
            return;
        }
        var fkey = domainVars.fkey[domain];
        return request.postAsync({
            url: "http://chat." + domain + ".com/messages/" + messageId + "/delete",
            form: {
                fkey: fkey
            },
            jar: domainVars.jars[domain]
        });
    }
};
var openWebSocket = function(url, time, domain) {
    return new Promise(function(resolve, reject) {
        var ws = new WebSocket(url + "?l=" + time, null, {
            headers: {
                "Origin": "http://chat." + domain + ".com"
            }
        });
        ws.on("message", function(jsonMessage) {
            var message = JSON.parse(jsonMessage);
            var keys = Object.keys(message);
            keys.forEach(function(key) {
                if (message[key].e) { // eslint-disable-line id-length
                    message[key].e.forEach(ChatHandler.processEvent); // eslint-disable-line id-length
                }
            });
        });
        ws.on("open", function() {
            resolve(domain);
        });
        ws.on("error", function(error) {
            reject(error);
        });
    });
};

var connectDomainRooms = function(domainMultiCase, initialRoom, rooms) {
    var initialRoomId = initialRoom.room_id;
    var domain = domainMultiCase.toLowerCase();
    domainVars.jars[domain] = request.jar();

    return request.getAsync({
        url: "https://" + (domain === "stackexchange" ? config.default_se_to_login_into + "." : "") + domain + ".com/users/login",
        jar: domainVars.jars[domain]
    })
    .then(function(response) {
        var dom = cheerio.load(response.body);
        var fkey = dom("input[name=fkey]").attr("value");
        return request.postAsync({
            url: "https://" + (domain === "stackexchange" ? config.default_se_to_login_into + "." : "") + domain + ".com/users/login",
            form: {
                email: config.user.email,
                password: config.user.password,
                fkey: fkey
            },
            jar: domainVars.jars[domain]
        });
    })
    .then(function() {
        return request.getAsync({
            url: "http://chat." + domain + ".com/rooms/" + initialRoomId + "/events",
            jar: domainVars.jars[domain]
        });
    })
    .then(function(response) {
        var dom = cheerio.load(response.body);
        var fkey = dom("input[name=fkey]").attr("value");
        domainVars.fkey[domain] = fkey;
        var url; // eslint-disable-line init-declarations
        var time; // eslint-disable-line init-declarations
        request.postAsync({
            url: "http://chat." + domain + ".com/ws-auth",
            form: {
                fkey: fkey,
                roomid: initialRoomId
            },
            jar: domainVars.jars[domain]
        })
        .then(function(secondLevelResponse) {
            if (secondLevelResponse.body.indexOf("<!DOCTYPE HTML PUBLIC") !== -1) {
                throw new Error("There was an issue with the response. Check your config is correct.");
            }
            url = JSON.parse(secondLevelResponse.body).url;
            var connectionPromises = Object.keys(rooms).map(function(roomName) {
                return new Promise(function(resolve, reject){
                    var room = rooms[roomName];
                    console.log("Connected to " + room.name);
                    return actions.join(domain, room.room_id, fkey)
                    .then(function(){
                        resolve();
                    })
                    .error(function(){
                        reject();
                    });
                });
            });
            connectionPromises.push(request.postAsync({
                url: "http://chat." + domain + ".com/ws-auth",
                form: {
                    fkey: fkey,
                    roomid: initialRoomId
                },
                jar: domainVars.jars[domain]
            }));
            return Promise.all(connectionPromises);
        })
        .then(function() {
            time = Math.floor(Date.now() / 1000);
            return openWebSocket(url, time, domain)
            .then(function() {
                console.log("Connected to " + domain);
            })
            .catch(function(err) {
                console.error(err);
            });
        });
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
var domainNameFixer = function(unfixedName) {
    var name = unfixedName.replace(" ", "").toLowerCase();
    if (name === "metastackexchange" || name === "mse") {
        return "meta.stackexchange";
    } else if (name === "so") {
        return "stackoverflow";
    } else if (name === "se") {
        return "stackexchange";
    }
    return name;
};
var start = function() {
    var promises = Object.keys(config.room_domains).map(function(domainName) {
        var domain = config.room_domains[domainName];
        if (domain.rooms.length == 0) {
            return new Promise()
            .then()
            .error();
        }
        var domainNameFixed = domainNameFixer(domainName);
        var firstDomain = domain.rooms[Object.keys(domain.rooms)[0]];
        return connectDomainRooms(domainNameFixed, firstDomain, domain.rooms);
    });
    return Promise.all(promises);
};
module.exports = {
    actions: actions,
    chatAbbreviationToFull: chatAbbreviationToFull,
    start: start,
    setMessageFormatting: ChatHandler.setMessageFormatting
};
