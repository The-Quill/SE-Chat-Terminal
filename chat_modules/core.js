'use strict'
const cheerio = require('cheerio')
const colors = require('colors')
const request = require('request-promise-native')
const config = require('./config')
const WebSocket = require('ws')
const ChatHandler = require('./chat')

const wait = time => new Promise(resolve => setTimeout(() => resolve(), time))

const domainVars = {
  fkey: {},
  jars: {},
  ws: {}
}

function setCookie(jar, domain) {
  return res => {
    const cookie = res.headers['set-cookie']
    if (!cookie) {
      global.log({ statusCode: res.statusCode, headers: res.headers })
      return
    }
    let value = request.cookie(cookie[0].replace('.stack', 'stack'))
    jar.setCookie(value, domain, (err) => err && console.error(err))
    jar.setCookie(value, domain.replace(/http(s)?:\/\//i, 'http$1://chat.'), (err) => err && console.error(err))
  }
}

const openWebSocket = function (url, time, domain) {
  return new Promise(function (resolve) {
    if (domainVars.ws[domain]) {
      // return
      domainVars.ws[domain].close()
    }
    domainVars.ws[domain] = new WebSocket(url + '?l=' + time, null, {
      headers: {
        'Origin': `https://chat.${domain}.com`
      }
    })
    domainVars.ws[domain].on('message', function (jsonMessage) {
      resolve()
      const message = JSON.parse(jsonMessage)
      global.log({ message })
      const keys = Object.keys(message)
      keys.forEach(function (key) {
        if (message[key].e) { // eslint-disable-line id-length
          global.log(message[key].e)
          message[key].e.forEach(ChatHandler.processEvent) // eslint-disable-line id-length
        }
      })
    })
    domainVars.ws[domain].on('error', error => global.log({ error: { body: error.body, message: error.message } }))
  })
}

const actions = {
  join: async function (domainMultiCase, roomid) {
    const domain = domainMultiCase.toLowerCase()
    const fkey = domainVars.fkey[domain]
    const addCookie = setCookie(domainVars.jars[domain], `https://${domain}.com`)
    global.log({
      url: `https://chat.${domain}.com/ws-auth`,
      form: { fkey, roomid }
    })
    const { events } = await request.post({
      url: `https://chat.${domain}.com/chats/${roomid}/events`,
      jar: domainVars.jars[domain],
      json: true,
      form: {
        since: 0,
        mode: 'Messages',
        msgCount: 100,
        fkey
      }
    })
    // global.log({ events })
    const join = await request.post({
      url: `https://chat.${domain}.com/ws-auth`,
      form: { fkey, roomid },
      resolveWithFullResponse: true,
      jar: domainVars.jars[domain]
    })
    addCookie(join)
    const { url } = JSON.parse(join.body)
    let time = Math.floor(Date.now() / 1000)
    await openWebSocket(url, time, domain)
    return events[events.length - 1]
    // return wait(2000)
  },
  roomlist: function (domain) {
    let domainFixed = ''
    if (domain !== '' && domain !== null) {
      const construct = {
        'mse': 'MetaStackExchange',
        'se': 'StackExchange',
        'so': 'StackOverflow'
      }
      domainFixed = construct[domain.toLowerCase()]
    }
    const rooms = []
    if (config.room_domains.hasOwnProperty(domainFixed)) {
      Object.keys(config.room_domains[domainFixed].rooms).forEach(function (room) {
        rooms.push(config.room_domains[domainFixed].rooms[room].name)
      })
    } else {
      Object.keys(config.room_domains).forEach(function (domainName) {
        Object.keys(config.room_domains[domainName].rooms).forEach(function (room) {
          rooms.push(config.room_domains[domainName].rooms[room].name)
        })
      })
    }
    return rooms
  },
  pingable: function (domain, roomId) {
    if (!domain || !roomId) {
      console.log('You\'re missing a part of that argument')
      return
    }
    // const fkey = domainVars.fkey[domain];
    return request({
      url: `https://chat.${domain}.com/rooms/pingable/${roomId}`,
      jar: domainVars.jars[domain]
    })
  },
  leave: function (domain, roomId) {
    if (!domain || !roomId) {
      console.log('You\'re missing a part of that argument')
      return
    }
    const fkey = domainVars.fkey[domain]
    return request.post({
      url: `https://chat.${domain}.com/chats/leave/${roomId}`,
      form: { fkey },
      jar: domainVars.jars[domain]
    })
  },
  send: function (domain, roomId, text, prefix) {
    if (!domain || !roomId || !text) {
      console.log('You\'re missing a part of that command')
      return
    }
    request.post({
      url: `https://chat.${domain}.com/chats/${roomId}/messages/new`,
      form: {
        fkey: domainVars.fkey[domain],
        text: prefix ? prefix + ' ' + text : text
      },
      jar: domainVars.jars[domain]
    })
  },
  star: function (domain, messageId) {
    if (!domain || !messageId) {
      console.log('You\'re missing a part of that command')
      return
    }
    const fkey = domainVars.fkey[domain]
    return request.post({
      url: `https://chat.${domain}.com/messages/${messageId}/star`,
      form: { fkey },
      jar: domainVars.jars[domain]
    })
  },
  edit: function (domain, messageId, text) {
    if (!domain || !messageId || !text) {
      console.log('You\'re missing a part of that command')
      return
    }
    const fkey = domainVars.fkey[domain]
    return request.post({
      url: `https://chat.${domain}.com/messages/${messageId}`,
      form: {
        fkey,
        text
      },
      jar: domainVars.jars[domain]
    })
  },
  delete: function (domain, messageId) {
    if (!domain || !messageId) {
      console.log('You\'re missing a part of that command')
      return
    }
    const fkey = domainVars.fkey[domain]
    return request.post({
      url: `https://chat.${domain}.com/messages/${messageId}/delete`,
      form: { fkey },
      jar: domainVars.jars[domain]
    })
  }
}

function getFkey(res) {
  const dom = cheerio.load(res)
  return dom('input[name=fkey]').attr('value')
}

function logJar(jar, domain) {
  return () => {
    return {
      [domain]: jar.getCookies(domain),
      [domain.replace(/http(s)?:\/\//i, 'http$1://chat.')]: jar.getCookies(domain.replace(/http(s)?:\/\//i, 'http$1://chat.'))
    }
  }
}

const connectDomainRooms = async function (domainMultiCase, initialRoom, rooms) {
  const initialRoomId = initialRoom.room_id
  const domain = domainMultiCase.toLowerCase()
  domainVars.jars[domain] = request.jar()
  let addCookie = setCookie(domainVars.jars[domain], `https://${domain}.com`)
  let getCookies = logJar(domainVars.jars[domain], `https://${domain}.com`)
  global.log({ domain, url: `https://${(domain === 'stackexchange' ? `${config.default_se_to_login_into}.` : '')}${domain}.com/users/login?returnurl=%2f`, type: 'firstRes' })
  const firstRes = await request({
    url: `https://${(domain === 'stackexchange' ? `${config.default_se_to_login_into}.` : '')}${domain}.com/users/login?returnurl=%2f`,
    resolveWithFullResponse: true,
    followAllRedirects: true,
    jar: domainVars.jars[domain]
  })
  addCookie(firstRes)
  const loginFkey = getFkey(firstRes.body)
  global.log({ statusCode: firstRes.statusCode, stage: 'firstFkey', loginFkey, cookie: firstRes.headers['set-cookie'], jar: getCookies() })
  const login = await request.post({
    url: `https://${(domain === 'stackexchange' ? `${config.default_se_to_login_into}.` : '')}${domain}.com/users/login`,
    resolveWithFullResponse: true,
    followAllRedirects: true,
    form: {
      email: config.user.email,
      password: config.user.password,
      fkey: loginFkey
    },
    jar: domainVars.jars[domain]
  })
  if (login.body.includes('The email or password is incorrect')) {
    console.log('Your username or password is incorrect. Please fix your config.')
    process.exit(1)
  }
  addCookie(login)
  global.log({ headers: login.headers, login: login.statusCode })

  global.log({ domain, url: `https://chat.${domain}.com/rooms/${initialRoomId}`, type: 'chatPage' })
  const chatPageRes = await request({
    resolveWithFullResponse: true,
    url: `https://chat.${domain}.com/rooms/${initialRoomId}`,
    jar: domainVars.jars[domain]
  })
  const chatFkey = getFkey(chatPageRes.body)
  addCookie(chatPageRes)
  domainVars.fkey[domain] = chatFkey
  global.log({ stage: 'chatFkey', chatFkey, statusCode: chatPageRes.statusCode })
  // const eventsRes = await request.post({
  //   resolveWithFullResponse: true,
  //   url: `https://chat.${domain}.com/chats/${initialRoomId}/events`,
  //   jar: domainVars.jars[domain],
  //   form: {
  //     since: 0,
  //     mode: 'Messages',
  //     msgCount: 100,
  //     fkey: chatFkey
  //   }
  // })
  // global.log({ stage: 'events', statusCode: eventsRes.statusCode })
  let url // eslint-disable-line init-declarations
  let time // eslint-disable-line init-declarations

  global.log({ domain, url: `https://chat.${domain}.com/ws-auth`, type: 'ws-auth', form: {
    fkey: domainVars.fkey[domain],
    roomid: initialRoomId
  } })
  let secondLevelResponse = null
  try {
    secondLevelResponse = await request.post({
      url: `https://chat.${domain}.com/ws-auth`,
      form: {
        fkey: domainVars.fkey[domain],
        roomid: initialRoomId
      },
      resolveWithFullResponse: true,
      jar: domainVars.jars[domain]
    })
    addCookie(secondLevelResponse)
  } catch (err) {
    global.log({ jar: getCookies(), opts: err.options })
    console.error(err)
  }
  if (!secondLevelResponse || secondLevelResponse.body.indexOf('<!DOCTYPE HTML PUBLIC') !== -1) {
    throw new Error('There was an issue with the response. Check your config is correct.')
  }
  global.log({ secondLevelResponse: secondLevelResponse && secondLevelResponse.statusCode })

  url = JSON.parse(secondLevelResponse.body).url
  global.log('done ws-auth')
  const mainJoinRes = await request.post({
    url: `https://chat.${domain}.com/ws-auth`,
    form: {
      fkey: domainVars.fkey[domain],
      roomid: initialRoomId
    },
    resolveWithFullResponse: true,
    jar: domainVars.jars[domain]
  })
  const ONE_SECOND = 1000
  const TWO_SECONDS = ONE_SECOND * 2
  addCookie(mainJoinRes)
  time = Math.floor(Date.now() / ONE_SECOND)
  await openWebSocket(url, time, domain)
  await wait(TWO_SECONDS)

  for (const room of Object.values(rooms)) {
    const event = await actions.join(domain, room.room_id)
    ChatHandler.processEvent(Object.assign({ room_name: room.name }, event)) // eslint-disable-line camelcase
    console.log(
      `Connected to ${colors.bold.white(room.name)}:${colors.bold.white(room.room_id)}`
    )
  }
  console.log(`Connected to all rooms on ${domain} domain successfully`)
}
function chatAbbreviationToFull(domainAbbreviation) {
  if (typeof domainAbbreviation !== 'string') throw new Error('Abbeviation must be a string')
  return {
    mse: 'meta.stackexchange',
    so: 'stackoverflow',
    se: 'stackexchange'
  }[domainAbbreviation.toString().toLowerCase()]
}
function domainNameFixer(unfixedName) {
  const name = unfixedName.replace(' ', '').toLowerCase()
  if (name === 'metastackexchange' || name === 'mse') {
    return 'meta.stackexchange'
  } else if (name === 'so') {
    return 'stackoverflow'
  } else if (name === 'se') {
    return 'stackexchange'
  }
  return name
}
async function start() {
  for (let domainName of Object.keys(config.room_domains)) {
    const domain = config.room_domains[domainName]
    if (domain.rooms.length === 0) {
      return new Promise()
    }
    const domainNameFixed = domainNameFixer(domainName)
    const firstDomain = domain.rooms[Object.keys(domain.rooms)[0]]
    try {
      await connectDomainRooms(domainNameFixed, firstDomain, domain.rooms)
    } catch (error) {
      console.error(error)
      console.log(`Error out ${domainName}`)
      process.exit(0)
    }
  }
  // return Promise.all(promises).catch(global.handleError);
}
module.exports = {
  actions,
  chatAbbreviationToFull,
  start,
  setMessageFormatting: ChatHandler.setMessageFormatting
}
