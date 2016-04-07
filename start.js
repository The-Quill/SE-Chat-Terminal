const core      = require('./chat_modules/core');
const prompt    = require('./prompt');
core.start().then(function(){
    prompt.start();
});
