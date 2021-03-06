'use strict';
const path = require('path');
const core = require('./chat_modules/core');
const config = require('./chat_modules/config');
const prompt = require('./prompt');
const fs = require('fs')

let time = new Date()

function handleError(error) {
  console.log(`Error occurred. Logs written to ${time.getTime().toString().slice(6)}.json`)
  // console.error(error.message)
  const out = JSON.stringify(error, Object.getOwnPropertyNames(error))
  const dir = path.join(__dirname, 'logs')
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir)
  }
  require('fs').writeFileSync(path.join(__dirname, 'logs', `${time.getTime().toString().slice(6)}.json`), out)
  process.exit(0)
}

global.handleError = handleError;

global.log = (...args) => {
  if (config.debug) {
    console.log(...args)
  }
}

try {
  core.start().then(function () {
    prompt.start();
  }).catch(handleError)
} catch(error) {
  handleError(error)
}
