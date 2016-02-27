var config = {};

config.user = {
    'email': '',
    'password': ''
};
config.rooms = {};
config.web = {};

config.debug = true;
config.star_threshold = 5;
config.user.email = process.env.EMAIL;
config.user.password = process.env.PASSWORD;
config.room_domains = {
    "StackExchange": {
        "name": "StackExchange",
        "rooms": {
            8595: {
                "name": "The 2nd Monitor",
                "room_id": 8595
            },
            6697: {
                "name": "Maid Cafe",
                "room_id": 6697
            },
            240: {
                "name": "The Nineteenth Byte",
                "room_id": 240
            }
        }
    },
    "MetaStackExchange": {
        "name": "Meta.StackExchange",
        "rooms": {
            89: {
                "name": "Tavern on the Meta",
                "room_id": 89
            }
        }
    },
    "StackOverflow": {
        "name": "StackOverflow",
        "rooms": {
            17: {
                "name": "JavaScript",
                "room_id": 17
            },
            41570: {
                "name": "SO Close Vote Reviewers",
                "room_id": 41570
            }
        }
    }
};
module.exports = config;
