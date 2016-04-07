const prompt = require('prompt');
const colors = require('colors');
const core   = require('./chat_modules/core');
const Promise= require('bluebird');

if (typeof Object.assign != 'function') {
    (function() {
        Object.assign = function(target) {
            'use strict';
            if (target === undefined || target === null) {
                throw new TypeError('Cannot convert undefined or null to object');
            }

            var output = Object(target);
            for (var index = 1; index < arguments.length; index++) {
                var source = arguments[index];
                if (source !== undefined && source !== null) {
                    for (var nextKey in source) {
                        if (source.hasOwnProperty(nextKey)) {
                            output[nextKey] = source[nextKey];
                        }
                    }
                }
            }
            return output;
        };
    })();
}
prompt.message = "";
var properties = {
    say: {
        properties: {
            domain: {
                description: colors.magenta('Chat Domain (abbreviated)'),
                pattern: /[mse|so|se]/i,
                message: 'Please enter either '.bold.red +
                    'MSE'.bold.white +
                    ', '.bold.red + 'SO'.bold.white +
                    ' or '.bold.red + 'SE'.bold.white +
                    ' as an abbreviated chat domain'.bold.red
            },
            'room_id': {
                description: colors.magenta('Room ID'),
                pattern: /^[0-9]+$/,
                message: colors.red('Room ID must be only numbers')
            },
            message: {
                description: colors.magenta("The message")
            }
        }
    },
    edit: {
        properties: {
            domain: {
                description: colors.magenta('Chat Domain (abbreviated)'),
                pattern: /[mse|so|se]/i,
                message: 'Please enter either '.bold.red +
                    'MSE'.bold.white +
                    ', '.bold.red + 'SO'.bold.white +
                    ' or '.bold.red + 'SE'.bold.white +
                    ' as an abbreviated chat domain'.bold.red
            },
            'message_id': {
                description: colors.magenta('Message ID'),
                pattern: /^[0-9]+$/,
                message: colors.red('Message ID must be only numbers')
            },
            message: {
                description: colors.magenta("The message")
            }
        }
    },
    join: {
        properties: {
            domain: {
                description: 'Chat Domain (abbreviated)',
                pattern: /[mse|so|se]/i,
                message: 'Please enter either '.bold.red +
                    'MSE'.bold.white +
                    ', '.bold.red + 'SO'.bold.white +
                    ' or '.bold.red + 'SE'.bold.white +
                    'as an abbreviated chat domain'.bold.red
            },
            'room_id': {
                description: 'room id',
                pattern: /^[0-9]+$/,
                message: colors.bold.red('Room ID must be only numbers')
            }
        }
    },
    star: {
        properties: {
            domain: {
                description: 'Chat Domain (abbreviated)',
                pattern: /[mse|so|se]/i,
                message: 'Please enter either '.bold.red +
                    'MSE'.bold.white +
                    ', '.bold.red + 'SO'.bold.white +
                    ' or '.bold.red + 'SE'.bold.white +
                    'as an abbreviated chat domain'.bold.red
            },
            'message_id': {
                description: 'Message id',
                pattern: /^[0-9]+$/,
                message: colors.bold.red('Message ID must be only numbers')
            }
        }
    },
    commands: {
        properties: {
            command: {
                description: 'Command name (do /help for a list of commands)',
                message: colors.bold.red(
                    "Command unrecognised. " +
                    "If this command shows up in /help, " +
                    "please leave an issue on the GitHub repo"
                )
            }
        }
    }
};
properties.leave  = properties.join;
properties.delete = properties.star;

var formattedCommandInstructions = [
    "/help".bold.white + " to get a list of commands".yellow,
    "/say".bold.white + " to send a message".yellow,
    "/join".bold.white + " to join a room".yellow,
    "/leave".bold.white + " to leave a room".yellow,
    "/star".bold.white + " to star a message".yellow,
    "/delete".bold.white + " to delete a message".yellow,
    "/edit".bold.white + " to edit a message".yellow,
]
var commands = {
    say: function() {
        prompt.get(properties.say, function(error, result) {
            if (error) {
                return (function(e) {
                    console.log(e);
                    return 1;
                })(error);
            }
            var chatDomain = core.chatAbbreviationToFull(result.domain)
            core.actions.send(chatDomain, result.room_id, result.message);
        });
    },
    join: function() {
        prompt.get(properties.join, function(error, result) {
            if (error) {
                return (function(e) {
                    console.log(e);
                    return 1;
                })(error);
            }
            var chatDomain = core.chatAbbreviationToFull(result.domain)
            core.actions.join(chatDomain, result.room_id);
        });
    },
    star: function() {
        prompt.get(properties.star, function(error, result) {
            if (error) {
                return (function(e) {
                    console.log(e);
                    return 1;
                })(error);
            }
            var chatDomain = core.chatAbbreviationToFull(result.domain)
            core.actions.star(chatDomain, result.message_id);
        });
    },
    edit: function() {
        prompt.get(properties.edit, function(error, result) {
            if (error) {
                return (function(e) {
                    console.log(e);
                    return 1;
                })(error);
            }
            var chatDomain = core.chatAbbreviationToFull(result.domain);
            core.actions.edit(chatDomain, result.message_id, result.message);
        });
    },
    delete: function() {
        prompt.get(properties.delete, function(error, result) {
            if (error) {
                return (function(e) {
                    console.log(e);
                    return 1;
                })(error);
            }
            var chatDomain = core.chatAbbreviationToFull(result.domain)
            core.actions.delete(chatDomain, result.message_id);
        });
    },
    leave: function(){
        prompt.get(properties.leave, function(error, result) {
            if (error) {
                return (function(e) {
                    console.log(e);
                    return 1;
                })(error);
            }
            var chatDomain = core.chatAbbreviationToFull(result.domain)
            core.actions.leave(chatDomain, result.room_id);
        });
    }
}
function start() {
    prompt.get(properties.commands, function(error, result) {
        if (error) {
            return (function(e) {
                console.log(e);
                return 1;
            })(error);
        }
        var command = result.command.replace('/', '');
        switch (command) {
            case "help":
                formattedCommandInstructions.forEach(function(commandInstruction){
                    console.log(commandInstruction);
                })
                break;
            default:
                if (!commands.hasOwnProperty(command)){
                    console.log(
                        colors.bold.red(
                            "Command unrecognised. " +
                            "If this command shows up in /help, " +
                            "please leave an issue on the GitHub repo"
                        )
                    );
                } else {
                    commands[command]();
                }
                break;
        }
    });
}
const messageFormatting = {
    room: function(event){
        return colors.green('[') +
        colors.bold.white(event.room_id) +
        colors.green(': ') +
        colors.bold.white(event.room_name) +
        colors.green(']');
    },
    user: function(event){
        return colors.bold.yellow(event.user_name);
    },
    activity: function(string){
        return colors.blue(string);
    },
    content: function(event){
        return colors.green(event.content);
    },
    edited: function(event){
        return colors.green(event.content.length > 25 ? event.content.substring(0, 12) + "..." : event.content);
    },
    changedRoomName: function(event){
        var name = event.content.substring(0, event.content.lastIndexOf(" /"));
        return colors.green('[') +
        colors.bold.white(event.room_id) +
        colors.green(': ') +
        colors.bold.white(name) +
        colors.green(']');
    },
    messageId: function(event){
        return colors.green(ITEMS.messages[event.message_id])
    }
}
core.setMessageFormatting(messageFormatting);
module.exports = {
    properties: properties,
    commands: commands,
    start: start
};
