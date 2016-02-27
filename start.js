const core      = require('./core');
const Promise   = require('bluebird');
const prompt    = require('./prompt');
var connectToEachDomainRoom = Promise.promisify(core.start);
connectToEachDomainRoom();
prompt.start();

//TODO: Star Command
//TODO: Leave Command
