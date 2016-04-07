const config = require('./config');
const ITEMS = {
    messages: {},
    stars: {},
    flags: {},
    lastEvent: {}
};
var noFormattingLinked = function(){
    throw new Error("There is no formatting linked.");
}
var messageFormatting = {
    room: noFormattingLinked,
    user: noFormattingLinked,
    activity: noFormattingLinked,
    content: noFormattingLinked,
    edited: noFormattingLinked,
    messageId: noFormattingLinked
};
var setMessageFormatting = function(formatting){
    messageFormatting = formatting;
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
};

function convert(str) {
    return !str ? "" :
        str.replace(/&amp;/g, "&")
           .replace(/&gt;/g, ">")
           .replace(/&lt;/g, "<")
           .replace(/&quot;/g, "\"")
           .replace(/&#39;/g, "'");
}

function processEvent(event) {
    if (event.content == ITEMS.lastEventContent) {
        return false;
    }
    ITEMS.lastEventContent = event.content;
    event.content = convert(event.content);
    switch (event.event_type) {
        case EVENT_TYPES.MessagePosted:
            console.log(
                messageFormatting.room(event) ,
                messageFormatting.user(event) +
                messageFormatting.activity(': ') +
                messageFormatting.content(event)
            );
            ITEMS.messages[event.message_id] = event.content;
            break;
        case EVENT_TYPES.MessageEdited:
            var message = ITEMS.messages[event.message_id];
            if (typeof message != "undefined" && typeof message == "string") {
                console.log(
                    messageFormatting.room(event) +
                    messageFormatting.activity(" edited their post of '") +
                    messageFormatting.edited(event) +
                    messageFormatting.activity("' to say: ") +
                    messageFormatting.content(event)
                );
            } else {
                console.log(
                    messageFormatting.room(event) ,
                    messageFormatting.user(event) +
                    messageFormatting.activity(" edited a post to say: ") +
                    messageFormatting.content(event)
                )
            }
            ITEMS.messages[event.message_id] = event.content;
            break;
        case EVENT_TYPES.UserEntered:
            console.log(
                messageFormatting.user(event) +
                messageFormatting.activity(" entered ") +
                messageFormatting.room(event)
            );
            break;
        case EVENT_TYPES.UserLeft:
            console.log(
                messageFormatting.user(event) +
                messageFormatting.activity(" left ") +
                messageFormatting.room(event)
            );
            break;
        case EVENT_TYPES.RoomNameChanged:
            console.log(
                messageFormatting.user(event) +
                messageFormatting.activity(" changed the name of ") +
                messageFormatting.room(event.room_name) +
                messageFormatting.activity(" to ") +
                messageFormatting.changedRoomName(event)
            );
            break;
        case EVENT_TYPES.MessageStarred:
            if (!event.message_stars){
                delete ITEMS.stars[event.message_id];
                return;
            }
            ITEMS.stars[event.message_id] = event.message_stars;
            if (ITEMS.stars[event.message_id] > config.star_threshold) {
                console.log(
                    messageFormatting.room(event) +
                    messageFormatting.activity(" highly starred message: ") +
                    messageFormatting.content(event)
                );
            }
            break;
        case EVENT_TYPES.UserMentioned:
            console.log(
                messageFormatting.user(event) +
                messageFormatting.activity(" mentioned you in ") +
                messageFormatting.room(event) +
                messageFormatting.activity("!")
            );
            console.log(messageFormatting.content(event));
            break;
        case EVENT_TYPES.MessageFlagged:
            ITEMS.flags[event.message_id] = event;
            console.log(
                messageFormatting.activity("A message was flagged in ") +
                messageFormatting.room(event) +
                messageFormatting.activity(":")
            );
            console.log(messageFormatting.content(event));
            break;
        case EVENT_TYPES.MessageDeleted:
            if (!(event.message_id in ITEMS.messages)) {
                console.log(
                    messageFormatting.room(event) ,
                    messageFormatting.user(event) +
                    messageFormatting.activity(" deleted a message")
                );
            } else {
                console.log(
                    messageFormatting.room(event) ,
                    messageFormatting.user(event) +
                    messageFormatting.activity(" deleted a message of: ") +
                    messageFormatting.messageId(event)
                );
            }
            break;
        case EVENT_TYPES.UserNotification:
            console.log(
                messageFormatting.user(event) +
                messageFormatting.activity(" superpinged you into ") +
                messageFormatting.room(event) +
                messageFormatting.activity("!")
            );
            if (event.content){
                console.log(messageFormatting.content(event));
            }
            break;
        case EVENT_TYPES.Invitation:
            console.log(
                messageFormatting.user(event) +
                messageFormatting.activity(" invited you to join ") +
                messageFormatting.room(event) +
                messageFormatting.activity("!")
            );
            break;
        case EVENT_TYPES.MessageReply:
            console.log(
                messageFormatting.room(event) ,
                messageFormatting.user(event) +
                messageFormatting.activity(" replied to you!")
            );
            console.log(messageFormatting.content(event));
            break;
        case EVENT_TYPES.MessageMovedOut:
            console.log(
                messageFormatting.user(event) +
                messageFormatting.activity(" moved your message into ") +
                messageFormatting.room(event) +
                messageFormatting.activity("!")
            );
            break;
        case EVENT_TYPES.MessageMovedIn:
            console.log(
                messageFormatting.user(event) +
                messageFormatting.activity(" moved your message into ") +
                messageFormatting.room(event) +
                messageFormatting.activity("!")
            );
            console.log(messageFormatting.content(event));
            break;
    }
}

function removeMessage() {
    delete messages[Object.keys(messages)[0]];
}

module.exports = {
    processEvent: processEvent,
    convert: convert,
    setMessageFormatting: setMessageFormatting,
    ITEMS: ITEMS,
    EVENT_TYPES: EVENT_TYPES
};
