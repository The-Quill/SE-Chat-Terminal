const core      = require('./core');
const prompt    = require('./prompt');

core.start().then(function(){
    prompt.start();
});
