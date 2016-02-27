const prompt = require('prompt');
const colors = require('colors');
const core   = require('./core');

prompt.message = "";
const properties = {
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
                description: 'room id',
                pattern: /^[0-9]+$/,
                message: colors.red('Room ID must be only numbers')
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
var formattedCommandInstructions = [
    "/help".bold.white + " to get a list of commands".yellow,
    "/say".bold.white + " to send a message".yellow,
    "/join".bold.white + " to join a room".yellow,
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
            core.send(chatDomain, result.room_id, result.message);
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
            core.joinRoom(chatDomain, result.room_id);
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
        switch (result.command.replace('/', '')) {
            case "say":
                commands.say();
                break;
            case "help":
                formattedCommandInstructions.forEach(function(commandMessage){
                    console.log(commandInstruction);
                })
                break;
            case "join":
                commands.join();
                break;
            default:
                console.log(
                    colors.bold.red(
                        "Command unrecognised. " +
                        "If this command shows up in /help, " +
                        "please leave an issue on the GitHub repo"
                    )
                );
                break;
        }
    });
}
module.exports = {
    properties: properties,
    commands: commands,
    start: start
};
