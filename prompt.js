'use strict';
const colors = require('colors');
const cheerio = require('cheerio');
const readline = require('readline');
const util = require('util')
const Promise = require('bluebird');
const REPL = readline.createInterface(process.stdin, process.stdout);
const core = require('./chat_modules/core');
const markdown = require('./chat_modules/markdown');

const columnedPrint = function (columnLimit, dataSet, titleString) {
  const rows = [];
  const currentRow = [];
  dataSet.map(function (dataItem) {
    if (currentRow.length !== columnLimit) {
      currentRow.push(dataItem);
    } else {
      rows.push(currentRow);
      currentRow = [dataItem];
    }
  });
  if (currentRow.length != 0) {
    rows.push(currentRow);
  }
  console.log(titleString);
  rows.forEach(row => console.log(row.join(', ')));
}

const properties = {
  say: {
    domain: {
      description: colors.magenta('Chat Domain (abbreviated)'),
      pattern: /^([m]?se|so)/i,
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
      description: colors.magenta('The message')
    }
  },
  edit: {
    domain: {
      description: colors.magenta('Chat Domain (abbreviated)'),
      pattern: /([mse|se|so]+)/i,
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
      description: colors.magenta('The message')
    }
  },
  join: {
    domain: {
      description: colors.magenta('Chat Domain (abbreviated)'),
      pattern: /([mse|se|so]+)/i,
      message: 'Please enter either '.bold.red +
        'MSE'.bold.white +
        ', '.bold.red + 'SO'.bold.white +
        ' or '.bold.red + 'SE'.bold.white +
        'as an abbreviated chat domain'.bold.red
    },
    'room_id': {
      description: colors.magenta('Room ID'),
      pattern: /^[0-9]+$/,
      message: colors.bold.red('Room ID must be only numbers')
    }
  },
  pingable: {
    domain: {
      description: colors.magenta('Chat Domain (abbreviated)'),
      pattern: /([mse|se|so]+)/i,
      message: 'Please enter either '.bold.red +
        'MSE'.bold.white +
        ', '.bold.red + 'SO'.bold.white +
        ' or '.bold.red + 'SE'.bold.white +
        'as an abbreviated chat domain'.bold.red
    },
    'room_id': {
      description: colors.magenta('Room ID'),
      pattern: /^[0-9]+$/,
      message: colors.bold.red('Room ID must be only numbers')
    }
  },
  roomlist: {
    domain: {
      description: colors.magenta('Chat Domain (abbreviated)')
    }
  },
  star: {
    domain: {
      description: colors.magenta('Chat Domain (abbreviated)'),
      pattern: /([mse|se|so]+)/i,
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
  },
  commands: {
    command: {
      description: 'Command name (do /help for a list of commands)',
      message: colors.bold.red(
        'Command unrecognised. ' +
        'If this command shows up in /help, ' +
        'please leave an issue on the GitHub repo'
      )
    }
  },
  clear: {},
  help: {}
};
properties.leave = properties.join;
properties.delete = properties.star;

const formattedCommandInstructions = [
  '/help'.bold.white + ' to get a list of commands'.yellow,
  '/say'.bold.white + ' to send a message'.yellow,
  '/join'.bold.white + ' to join a room'.yellow,
  '/leave'.bold.white + ' to leave a room'.yellow,
  '/star'.bold.white + ' to star a message'.yellow,
  '/delete'.bold.white + ' to delete a message'.yellow,
  '/edit'.bold.white + ' to edit a message'.yellow,
  '/pingable'.bold.white + ' to see who you can ping'.yellow,
  '/roomlist'.bold.white + ' to see the roomlist'.yellow,
  '/clear'.bold.white + ' to clear the chat window'.yellow
];
const commands = {
  help: () => formattedCommandInstructions.forEach(commandInstruction => console.log(commandInstruction)),
  say: async function (chatDomainUnfixed, roomId, message) {
    const chatDomain = core.chatAbbreviationToFull(chatDomainUnfixed);
    return core.actions.send(chatDomain, roomId, message);
  },
  join: async function (chatDomainUnfixed, roomId) {
    const chatDomain = core.chatAbbreviationToFull(chatDomainUnfixed);
    return core.actions.join(chatDomain, roomId);
  },
  star: async function (chatDomainUnfixed, messageId) {
    const chatDomain = core.chatAbbreviationToFull(chatDomainUnfixed);
    return core.actions.star(chatDomain, messageId);
  },
  edit: async function (chatDomainUnfixed, messageId, message) {
    const chatDomain = core.chatAbbreviationToFull(chatDomainUnfixed);
    return core.actions.edit(chatDomain, messageId, message);
  },
  delete: async function (chatDomainUnfixed, messageId) {
    const chatDomain = core.chatAbbreviationToFull(chatDomainUnfixed);
    return core.actions.delete(chatDomain, messageId);
  },
  leave: async function (chatDomainUnfixed, roomId) {
    const chatDomain = core.chatAbbreviationToFull(chatDomainUnfixed);
    return core.actions.leave(chatDomain, roomId);
  },
  roomlist: async function (chatDomain) {
    const rooms = core.actions.roomlist(chatDomain);
    columnedPrint(3, rooms, 'The available rooms are: ');
  },
  clear: async function () {
    const lines = process.stdout.getWindowSize()[1];
    for (let i = 0; i < lines; i++) {
      console.log('\r\n');
    }
  },
  pingable: async function (chatDomainUnfixed, roomId) {
    const chatDomain = core.chatAbbreviationToFull(chatDomainUnfixed);
    core.actions.pingable(chatDomain, roomId).then(function (response) {
      try {
        const users = JSON.parse(response).map(user => user[1]);
        columnedPrint(6, users, 'users')
      } catch (e) {
        return false;
      }
    });
  }
};

async function handleInput(STDIN) {
  const storedValues = {};
  const input = STDIN.replace('/', '');
  const commandArgs = input.split(' ');
  const commandName = commandArgs.splice(0, 1)[0];
  if (commandName.length === 0) return
  let commandArgsIndex = 0;
  if (Object.keys(properties).indexOf(commandName) === -1) {
    console.log(
      colors.bold.red(
        'Command (' + commandName + ') unrecognised. ' +
        'If this command shows up in /help, ' +
        'please leave an issue on the GitHub repo'
      )
    );
    return
  }
  const subCommandProperties = Object.keys(properties[commandName]);
  if (commandArgs.length > subCommandProperties.length) {
    const potentialStringArray = commandArgs.splice(subCommandProperties.length - 1);
    commandArgs[subCommandProperties.length - 1] = potentialStringArray.join(' ');
  }
  for (const subCommandName of subCommandProperties) {
    const subCommand = properties[commandName][subCommandName];
    await new Promise(function (resolve, reject) {
      if (commandArgs.length > commandArgsIndex) {
        if (Object.keys(subCommand).indexOf('pattern') === -1 && Object.keys(subCommand).indexOf('message') === -1) {
          storedValues[subCommandName] = commandArgs[commandArgsIndex];
          resolve(commandArgs[commandArgsIndex]);
        }
        if (commandArgs[commandArgsIndex].match(subCommand.pattern) != null) {
          storedValues[subCommandName] = commandArgs[commandArgsIndex];
          resolve(commandArgs[commandArgsIndex])
        } else {
          console.log(subCommand.message || 'Wrong answer, punk. Try again.');
          reject(commandArgs[commandArgsIndex])
        }
        commandArgsIndex++;
      } else {
        REPL.question(subCommand.description + '> '.green.bold, function (response) {
          if (Object.keys(subCommand).indexOf('pattern') === -1 && Object.keys(subCommand).indexOf('message') === -1) {
            storedValues[subCommandName] = response;
            resolve(response);
          }
          if (response.match(subCommand.pattern) != null) {
            storedValues[subCommandName] = response;
            resolve(response);
          } else {
            console.log(subCommand.message || 'Wrong answer, punk. Try again.');
            reject(response);
          }
        });
      }
    });
  }
  // The null needs to be used here so the scope of the function isn't defined.
  // Read here for more info: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply
  await commands[commandName].apply(null, Object.keys(storedValues).map(
    valueName => storedValues[valueName]
  ));
}

function start() {
  REPL.prompt();
  REPL
  .on('line', STDIN => handleInput(STDIN).then(() => REPL.prompt()))
  .on('close', () => process.exit(0));
}
// From here: http://stackoverflow.com/a/24519813/3296811
const fixedPrint = function (type, args) {
  const indent = Math.ceil((REPL.line.length + 3) / process.stdout.columns);
  const text = util.format.apply(console, args);
  REPL.output.write('\n\x1B[' + indent + 'A\x1B[0J'); // No idea at all....
  REPL.output.write(text + '\n');
  REPL.output.write(Array(indent).join('\n\x1B[E'));
  REPL._refreshLine();
};

console.log = (...args) => fixedPrint('log', args);
console.warn = (...args) => fixedPrint('warn', args);
console.info = (...args) => fixedPrint('info', args);
console.error = (...args) => fixedPrint('error', args);
const HTMLtoMarkdown = function (string) {
  return markdown(string)
  // const globals = {
  //     strike: '---',
  //     i: '_',
  //     b: '**'
  // };
  // // Object.keys(globals).forEach(function(global){
  // //     const element =
  // //     dom(global).parent.html(dom(global).parent.html().replace('<' + global + '>'));
  // // });
  // if (string.indexOf('<') !== -1){
  //     const dom = cheerio.load(string);
  //     const post = dom('.ob-post-title a');
  //     if (post != null){
  //         return '[' + post.text() + '](' + post.attr('href') + ')';
  //     }
  //     post = dom('.ob-image a');
  //     if (post != null){
  //         return '![' + post.attr('alt') + '](' + post.attr('href') + ')';
  //     }
  // }

  // return string;
}
const messageFormatting = {
  room: function (event) {
    return colors.green('[') +
      colors.bold.white(event.room_id) +
      colors.green(': ') +
      colors.bold.white(event.room_name || '') +
      colors.green('] ');
  },
  user: event => colors.bold.yellow(event.user_name),
  activity: string => colors.blue(string),
  content: event => colors.green(HTMLtoMarkdown(event.content)),
  edited: function (event) {
    const maxStringLength = 25;
    const editedStringLength = Math.ceil(maxStringLength / 2);
    return colors.green(event.content.length > maxStringLength ? event.content.substring(0, editedStringLength) + '...' : event.content);
  },
  changedRoomName: function (event) {
    const name = event.content.substring(0, event.content.lastIndexOf(' /'));
    return colors.green('[') +
      colors.bold.white(event.room_id) +
      colors.green(': ') +
      colors.bold.white(name) +
      colors.green(']');
  },
  messageId: event => colors.green(event.message_id),
  connection: event => colors.green('Connecting to ') + colors.bold.green(event.name) + colors.bold.white(':') + colors.bold.green(event.room_id),
};
core.setMessageFormatting(messageFormatting);
module.exports = {
  properties: properties,
  commands: commands,
  start: start
};
