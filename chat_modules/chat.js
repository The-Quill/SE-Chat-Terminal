'use strict'
const config = require('./config')
const ITEMS = {
  messages: {},
  stars: {},
  flags: {},
  lastEvent: {}
}
const noFormattingLinked = function (event) {
  throw new Error('There is no formatting linked.')
}
let messageFormatting = {
  room: noFormattingLinked,
  user: noFormattingLinked,
  activity: noFormattingLinked,
  content: noFormattingLinked,
  edited: noFormattingLinked,
  messageId: noFormattingLinked,
  connection: noFormattingLinked
}
const getMessageFormatting = function() {
  return messageFormatting
}
const setMessageFormatting = function (formatting) {
  messageFormatting = formatting
}
const EVENT_TYPES = {
  MessagePosted: 1,
  MessageEdited: 2,
  UserEntered: 3,
  UserLeft: 4,
  RoomNameChanged: 5,
  MessageStarred: 6,
  UserMentioned: 8,
  MessageFlagged: 9,
  MessageDeleted: 10,
  UserNotification: 16,
  Invitation: 17,
  MessageReply: 18,
  MessageMovedOut: 19,
  MessageMovedIn: 20
}

const convert = function (str) {
  return !str ? '' // eslint-disable-line no-negated-condition
    : str.replace(/&amp;/g, '&')
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&quot;/g, '\'')
      .replace(/&#39;/g, '\'')
}

/* eslint-disable complexity, max-statements */
const processEvent = function (event) {
  if (event.content && JSON.stringify(event.content) === JSON.stringify(ITEMS.lastEventContent)) {
    return false
  }
  ITEMS.lastEventContent = event.content
  event.content = convert(event.content)
  switch (event.event_type) {
    case EVENT_TYPES.MessagePosted:
      console.log(
        messageFormatting.room(event) +
        messageFormatting.user(event) +
        messageFormatting.activity(': ') +
        messageFormatting.content(event)
      )
      ITEMS.messages[event.message_id] = event.content
      break
    case EVENT_TYPES.MessageEdited: {
      const message = ITEMS.messages[event.message_id]
      if (typeof message !== 'undefined' && typeof message === 'string') {
        console.log(
          messageFormatting.room(event) +
          messageFormatting.user(event) +
          messageFormatting.activity(' edited their post of \'') +
          messageFormatting.edited(event) +
          messageFormatting.activity('\' to say: ') +
          messageFormatting.content(event)
        )
      } else {
        console.log(
          messageFormatting.room(event) +
          messageFormatting.user(event) +
          messageFormatting.activity(' edited a post to say: ') +
          messageFormatting.content(event)
        )
      }
      ITEMS.messages[event.message_id] = event.content
      break
    }
    case EVENT_TYPES.UserEntered:
      console.log(
        messageFormatting.user(event) +
        messageFormatting.activity(' entered ') +
        messageFormatting.room(event)
      )
      break
    case EVENT_TYPES.UserLeft:
      console.log(
        messageFormatting.user(event) +
        messageFormatting.activity(' left ') +
        messageFormatting.room(event)
      )
      break
    case EVENT_TYPES.RoomNameChanged:
      console.log(
        messageFormatting.user(event) +
        messageFormatting.activity(' changed the name of ') +
        messageFormatting.room(event.room_name) +
        messageFormatting.activity(' to ') +
        messageFormatting.changedRoomName(event)
      )
      break
    case EVENT_TYPES.MessageStarred:
      if (!event.message_stars) {
        delete ITEMS.stars[event.message_id]
        return
      }
      ITEMS.stars[event.message_id] = event.message_stars
      if (ITEMS.stars[event.message_id] > config.star_threshold) {
        console.log(
          messageFormatting.room(event) +
          messageFormatting.activity(' highly starred message: ') +
          messageFormatting.content(event)
        )
      }
      break
    case EVENT_TYPES.UserMentioned:
      console.log(
        messageFormatting.user(event) +
        messageFormatting.activity(' mentioned you in ') +
        messageFormatting.room(event) +
        messageFormatting.activity('!')
      )
      console.log(messageFormatting.content(event))
      break
    case EVENT_TYPES.MessageFlagged:
      ITEMS.flags[event.message_id] = event
      console.log(
        messageFormatting.activity('A message was flagged in ') +
        messageFormatting.room(event) +
        messageFormatting.activity(':')
      )
      console.log(messageFormatting.content(event))
      break
    case EVENT_TYPES.MessageDeleted:
      if (!ITEMS.messages.hasOwnProperty(event.message_id)) { // eslint-disable-line no-negated-condition
        console.log(
          messageFormatting.room(event),
          messageFormatting.user(event) +
          messageFormatting.activity(' deleted a message')
        )
      } else {
        console.log(
          messageFormatting.room(event),
          messageFormatting.user(event) +
          messageFormatting.activity(' deleted a message of: ') +
          messageFormatting.messageId(event)
        )
      }
      break
    case EVENT_TYPES.UserNotification:
      console.log(
        messageFormatting.user(event) +
        messageFormatting.activity(' superpinged you into ') +
        messageFormatting.room(event) +
        messageFormatting.activity('!')
      )
      if (event.content) {
        console.log(messageFormatting.content(event))
      }
      break
    case EVENT_TYPES.Invitation:
      console.log(
        messageFormatting.user(event) +
        messageFormatting.activity(' invited you to join ') +
        messageFormatting.room(event) +
        messageFormatting.activity('!')
      )
      break
    case EVENT_TYPES.MessageReply:
      console.log(
        messageFormatting.room(event) +
        messageFormatting.user(event) +
        messageFormatting.activity(' replied to you!')
      )
      console.log(messageFormatting.content(event))
      break
    case EVENT_TYPES.MessageMovedOut:
      console.log(
        messageFormatting.user(event) +
        messageFormatting.activity(' moved a message out ') +
        messageFormatting.room(event) +
        messageFormatting.activity('!')
      )
      break
    case EVENT_TYPES.MessageMovedIn:
      console.log(
        messageFormatting.user(event) +
        messageFormatting.activity(' moved a message into ') +
        messageFormatting.room(event) +
        messageFormatting.activity('!')
      )
      console.log(messageFormatting.content(event))
      break
  }
}

/* eslint-enable complexity, max-statements */
module.exports = {
  processEvent,
  convert,
  getMessageFormatting,
  setMessageFormatting,
  ITEMS,
  EVENT_TYPES
}
