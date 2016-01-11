    var messages = {};
    var stars = {};
    var flagged = [];
    var EVENT_TYPES = {
          MessagePosted: 1
        , MessageEdited: 2
        , UserEntered: 3
        , UserLeft: 4
        , RoomNameChanged: 5
        , MessageStarred: 6
        , UserMentioned: 8
        , MessageFlagged: 9
        , MessageDeleted: 10
        , UserNotification: 16
        , Invitation: 17
        , MessageReply: 18
        , MessageMovedOut: 19
        , MessageMovedIn: 20
    };
    function convert(str){
        return !str ? "":
        str.replace(/&amp;/g, "&")
           .replace(/&gt;/g, ">")
           .replace(/&lt;/g, "<")
           .replace(/&quot;/g, "\"")
           .replace(/&#39;/g, "'");
    }
    var LAST_EVENT;
    function processEvent(event){
        if (event.content == LAST_EVENT){
            return false;
        }
        LAST_EVENT = event.content;
        event.content = convert(event.content);
        switch (event.event_type){
            case EVENT_TYPES.MessagePosted:
                say(
                    event.user_name + ": " + event.content,
                    event.room_name
                );
                messages[event.message_id] = event.content;
                break;
            case EVENT_TYPES.MessageEdited:
            var message = messages[event.message_id];
                if (typeof message != "undefined" && typeof message == "string"){
                    say(
                        event.user_name + " edited their post of '" + (message.length > 25 ? message.substring(0, 12) + "..." : message) + "' to say: " + event.content,
                        event.room_name
                    );
                } else {
                    say (
                        event.user_name + "edited a post to say: " + event.content,
                        event.room_name
                    )
                }
                messages[event.message_id] = event.content;
                break;
            case EVENT_TYPES.UserEntered:
                say(event.user_name + " entered " + event.room_name);
                break;
            case EVENT_TYPES.UserLeft:
                say(event.user_name + " left " + event.room_name);
                break;
            case EVENT_TYPES.RoomNameChanged:
                say(event.user_name + " changed the name of " + event.room_name + " to " + event.content.substring(0, event.content.lastIndexOf(" /")));
                break;
            case EVENT_TYPES.MessageStarred:
                event.message_id in stars ? event.message_id++ : event.message_id = 1;
                if (messages[event.message_id] > 3){
                    say(
                        "highly starred message: " + event.content,
                        event.room_name
                    );
                }
                break;
            case EVENT_TYPES.UserMentioned:
                say("@" + event.user_name + " mentioned you in " + event.room_name + "!");
                say(event.content);
                break;
            case EVENT_TYPES.MessageFlagged:
            flagged.push(event);
                say("A message was flagged in " + event.room_name + ":");
                say(event.content);
                break;
            case EVENT_TYPES.MessageDeleted:
                if (event.message_id in messages){
                    say(
                        event.user_name + " deleted a message",
                        event.room_name
                    );
                } else {
                    say(
                        event.user_name + " deleted their message of: " + messages[event.message_id],
                        event.room_nmae
                    );
                }
                break;
            case EVENT_TYPES.UserNotification:
                say("@" + event.user_name + " superpinged you into " + event.room_name);
                if (event.content) say(event.content);
                break;
            case EVENT_TYPES.Invitation:
                say("@" + event.user_name + " invited you to join " + event.room_name);
                break;
            case EVENT_TYPES.MessageReply:
                say(
                    "@" + event.user_name + " replied to you",
                    event.room_name
                );
                say(event.content);
                break;
            case EVENT_TYPES.MessageMovedOut:
                say("You had a message moved into" + event.room_name + "by @" + event.user_name);
                break;
            case EVENT_TYPES.MessageMovedIn:
                say("Your messaged was moved into " + event.room_name);
                say(event.content);
                break;
        }
    }
    function removeMessage(){
        delete messages[Object.keys(messages)[0]];
    }
    function say(message, room){
        if (!message) throw new Error("No message provided.");
        var finalMessage = room ? ' [' + room + '] ' : "";
        console.log(finalMessage + message);
    }
    
exports.modules = {
    processEvent: processEvent
};