const core      = require('./chat_modules/core');
const prompt    = require('./chat_modules/prompt');
core.start().then(function(){
    prompt.start();
});
