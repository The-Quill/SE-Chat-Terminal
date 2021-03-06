'use strict'

/* eslint-disable camelcase, no-process-env */
const loadedConfig = require('../config.json')
if (!loadedConfig) {
  throw new Error('No config file found')
}
if (!loadedConfig.hasOwnProperty('room_domains') || typeof loadedConfig.room_domains !== 'object') {
  throw new Error('the loaded config files has incorrectly formatted or missing room domains')
}
if (!Object.keys(loadedConfig.room_domains).length > 0) {
  throw new Error('room config missing')
}
if (!loadedConfig.hasOwnProperty('default_se_to_login_into')) {
  throw new Error('No default SE site added.')
}
const config = {
  user: {},
  rooms: {}
}
const processValues = {}
process.argv.forEach(function (value) {
  if (value.indexOf('email=') !== -1) {
    processValues.email = value.replace('email=', '')
  } else if (value.indexOf('password=') !== -1) {
    processValues.password = value.replace('password=', '')
  }
})


config.debug = loadedConfig.debug || false
config.star_threshold = loadedConfig.star_threshold || 5
config.default_se_to_login_into = loadedConfig.default_se_to_login_into
config.user.email = process.env.EMAIL || processValues.email
config.user.password = process.env.PASSWORD || processValues.password

if (!config.user.email) {
  throw new Error('Email config missing')
}
if (!config.user.password) {
  throw new Error('password config missing')
}

config.room_domains = loadedConfig.room_domains || {
  'StackExchange': [240],
  'MetaStackExchange': [89],
  'StackOverflow': [17, 41570]
}
module.exports = config
