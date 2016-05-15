"use strict";
var colors = require("colors");
var cheerio = require("cheerio");
var readline = require('readline');
var Promise = require('bluebird');
var REPL = readline.createInterface(process.stdin, process.stdout);
var core = require("./chat_modules/core");

var columnedPrint = function(columnLimit, dataSet, titleString){
    var rows = [];
    var currentRow = [];
    dataSet.map(function(dataItem){
        if (currentRow.length !== columnLimit){
            currentRow.push(dataItem);
        } else {
            rows.push(currentRow);
            currentRow = [dataItem];
        }
    });
    if (currentRow.length != 0){
        rows.push(currentRow);
    }
    console.log(titleString);
    rows.forEach(function(row){
        console.log(row.join(', '));
    });
}

var properties = {
    say: {
        domain: {
            description: colors.magenta("Chat Domain (abbreviated)"),
            pattern: /^[mse|so|se]/i,
            message: "Please enter either ".bold.red +
                "MSE".bold.white +
                ", ".bold.red + "SO".bold.white +
                " or ".bold.red + "SE".bold.white +
                " as an abbreviated chat domain".bold.red
        },
        "room_id": {
            description: colors.magenta("Room ID"),
            pattern: /^[0-9]+$/,
            message: colors.red("Room ID must be only numbers")
        },
        message: {
            description: colors.magenta("The message")
        }
    },
    edit: {
        domain: {
            description: colors.magenta("Chat Domain (abbreviated)"),
            pattern: /[mse|so|se]/i,
            message: "Please enter either ".bold.red +
                "MSE".bold.white +
                ", ".bold.red + "SO".bold.white +
                " or ".bold.red + "SE".bold.white +
                " as an abbreviated chat domain".bold.red
        },
        "message_id": {
            description: colors.magenta("Message ID"),
            pattern: /^[0-9]+$/,
            message: colors.red("Message ID must be only numbers")
        },
        message: {
            description: colors.magenta("The message")
        }
    },
    join: {
        domain: {
            description: colors.magenta("Chat Domain (abbreviated)"),
            pattern: /[mse|so|se]/i,
            message: "Please enter either ".bold.red +
                "MSE".bold.white +
                ", ".bold.red + "SO".bold.white +
                " or ".bold.red + "SE".bold.white +
                "as an abbreviated chat domain".bold.red
        },
        "room_id": {
            description: colors.magenta("Room ID"),
            pattern: /^[0-9]+$/,
            message: colors.bold.red("Room ID must be only numbers")
        }
    },
    pingable: {
        domain: {
            description: colors.magenta("Chat Domain (abbreviated)"),
            pattern: /[mse|so|se]/i,
            message: "Please enter either ".bold.red +
                "MSE".bold.white +
                ", ".bold.red + "SO".bold.white +
                " or ".bold.red + "SE".bold.white +
                "as an abbreviated chat domain".bold.red
        },
        "room_id": {
            description: colors.magenta("Room ID"),
            pattern: /^[0-9]+$/,
            message: colors.bold.red("Room ID must be only numbers")
        }
    },
    roomlist: {
        domain: {
            description: colors.magenta("Chat Domain (abbreviated)")
        }
    },
    star: {
        domain: {
            description: colors.magenta("Chat Domain (abbreviated)"),
            pattern: /[mse|so|se]/i,
            message: "Please enter either ".bold.red +
                "MSE".bold.white +
                ", ".bold.red + "SO".bold.white +
                " or ".bold.red + "SE".bold.white +
                "as an abbreviated chat domain".bold.red
        },
        "message_id": {
            description: "Message id",
            pattern: /^[0-9]+$/,
            message: colors.bold.red("Message ID must be only numbers")
        }
    },
    commands: {
        command: {
            description: "Command name (do /help for a list of commands)",
            message: colors.bold.red(
                "Command unrecognised. " +
                "If this command shows up in /help, " +
                "please leave an issue on the GitHub repo"
            )
        }
    },
    clear: {}
};
properties.leave = properties.join;
properties.delete = properties.star;

var formattedCommandInstructions = [
    "/help".bold.white + " to get a list of commands".yellow,
    "/say".bold.white + " to send a message".yellow,
    "/join".bold.white + " to join a room".yellow,
    "/leave".bold.white + " to leave a room".yellow,
    "/star".bold.white + " to star a message".yellow,
    "/delete".bold.white + " to delete a message".yellow,
    "/edit".bold.white + " to edit a message".yellow,
    "/pingable".bold.white + " to see who you can ping".yellow,
    "/roomlist".bold.white + " to see the roomlist".yellow,
    "/clear".bold.white + " to clear the chat window".yellow
];
var commands = {
    say: function(chatDomainUnfixed, roomId, message) {
        var chatDomain = core.chatAbbreviationToFull(chatDomainUnfixed);
        core.actions.send(chatDomain, roomId, message);
    },
    join: function(chatDomainUnfixed, roomId) {
        var chatDomain = core.chatAbbreviationToFull(chatDomainUnfixed);
        core.actions.join(chatDomain, roomId);
    },
    star: function(chatDomainUnfixed, messageId) {
        var chatDomain = core.chatAbbreviationToFull(chatDomainUnfixed);
        core.actions.star(chatDomain, messageId);
    },
    edit: function(chatDomainUnfixed, messageId, message) {
        var chatDomain = core.chatAbbreviationToFull(chatDomainUnfixed);
        core.actions.edit(chatDomain, message_id, message);
    },
    delete: function(chatDomainUnfixed, messageId) {
        var chatDomain = core.chatAbbreviationToFull(chatDomainUnfixed);
        core.actions.delete(chatDomain, messageId);
    },
    leave: function(chatDomainUnfixed, roomId) {
        var chatDomain = core.chatAbbreviationToFull(chatDomainUnfixed);
        core.actions.leave(chatDomain, roomId);
    },
    roomlist: function(chatDomain){
        var rooms = core.actions.roomlist(chatDomain);
        columnedPrint(3, rooms, "The available rooms are: ");
    },
    clear: function(){
        var lines = process.stdout.getWindowSize()[1];
        for(var i = 0; i < lines; i++) {
            console.log('\r\n');
        }
    },
    pingable: function(chatDomainUnfixed, roomId) {
        var chatDomain = core.chatAbbreviationToFull(chatDomainUnfixed);
        core.actions.pingable(chatDomain, roomId).then(function(response){
            try {
                var users = JSON.parse(response.body).map(function(user){ return user[1] });
                columnedPrint(6, users, "columnedPrint")
            } catch (e) {
                return false;
            }
        });
    }
};

var handleInput = function(STDIN){
    var input = STDIN.replace('/', '');
    var storedValues = {};
    var previousPromise = Promise.resolve();
    if (Object.keys(properties).indexOf(input) !== -1){
        var commandPropertyPromises = [];
        Object.keys(properties[input]).map(function(subCommandName){
            var subCommand = properties[input][subCommandName];
            previousPromise = previousPromise.then(function(){
                return new Promise(function(resolve, reject){
                    REPL.question(subCommand.description + '> '.green.bold, function(response){
                        if (Object.keys(subCommand).indexOf('pattern') === -1 && Object.keys(subCommand).indexOf('message') === -1){
                            storedValues[subCommandName] = response;
                            resolve(response);
                        }
                        if (response.match(subCommand.pattern) != null){
                            storedValues[subCommandName] = response;
                            resolve(response);
                        } else {
                            console.log(subCommand.message || "Wrong answer, punk. Try again.");
                            reject(response);
                        }
                    });
                });
            });
        });
        previousPromise.then(function(){
            // The null needs to be used here so the scope of the function isn't defined.
            // Read here for more info: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply
            commands[input].apply(null, Object.keys(storedValues).map(function(valueName){
                return storedValues[valueName];
            }));
        });
    } else {
        switch (input) {
            case "help":
                formattedCommandInstructions.forEach(function(commandInstruction) {
                    console.log(commandInstruction);
                });
                break;
            default:
                console.log(
                    colors.bold.red(
                        "Command unrecognised. " +
                        "If this command shows up in /help, " +
                        "please leave an issue on the GitHub repo"
                    )
                );
        }
    }
    return new Promise(function(resolve){
        resolve()
    });
}

var start = function(){
    REPL.prompt();

    REPL.on('line', function(STDIN) {
        handleInput(STDIN).then(function(){
            REPL.prompt();
        });
    })
    .on('close', function(){ process.exit(0) });
}
// From here: http://stackoverflow.com/a/24519813/3296811
var fixedPrint = function(type, args) {
    var indent = Math.ceil((REPL.line.length + 3) / process.stdout.columns);
    var text = require('util').format.apply(console, args);
    REPL.output.write("\n\x1B[" + indent + "A\x1B[0J"); // No idea at all....
    REPL.output.write(text + "\n");
    REPL.output.write(Array(indent).join("\n\x1B[E"));
    REPL._refreshLine();
};

console.log = function() {
    fixedPrint("log", arguments);
};
console.warn = function() {
    fixedPrint("warn", arguments);
};
console.info = function() {
    fixedPrint("info", arguments);
};
console.error = function() {
    fixedPrint("error", arguments);
};
var HTMLtoMarkdown = function(string){
    // var globals = {
    //     strike: '---',
    //     i: '_',
    //     b: '**'
    // };
    // // Object.keys(globals).forEach(function(global){
    // //     var element =
    // //     dom(global).parent.html(dom(global).parent.html().replace('<' + global + '>'));
    // // });
    // if (string.indexOf('<') !== -1){
    //     var dom = cheerio.load(string);
    //     var post = dom(".ob-post-title a");
    //     if (post != null){
    //         return "[" + post.text() + "](" + post.attr("href") + ")";
    //     }
    //     post = dom(".ob-image a");
    //     if (post != null){
    //         return "![" + post.attr('alt') + "](" + post.attr("href") + ")";
    //     }
    // }

    return string;
}
var messageFormatting = {
    room: function(event) {
        return colors.green("[") +
            colors.bold.white(event.room_id) +
            colors.green(": ") +
            colors.bold.white(event.room_name) +
            colors.green("] ");
    },
    user: function(event) {
        return colors.bold.yellow(event.user_name);
    },
    activity: function(string) {
        return colors.blue(string);
    },
    content: function(event) {
        return colors.green(HTMLtoMarkdown(event.content));
    },
    edited: function(event) {
        var maxStringLength = 25;
        var editedStringLength = Math.ceil(maxStringLength / 2);
        return colors.green(event.content.length > maxStringLength ? event.content.substring(0, editedStringLength) + "..." : event.content);
    },
    changedRoomName: function(event) {
        var name = event.content.substring(0, event.content.lastIndexOf(" /"));
        return colors.green("[") +
            colors.bold.white(event.room_id) +
            colors.green(": ") +
            colors.bold.white(name) +
            colors.green("]");
    },
    messageId: function(event) {
        return colors.green(event.message_id);
    },
    connection: function(event) {
        return colors.green("Connecting to ") + colors.bold.white(event.name);
    },
};
core.setMessageFormatting(messageFormatting);
module.exports = {
    properties: properties,
    commands: commands,
    start: start
};
