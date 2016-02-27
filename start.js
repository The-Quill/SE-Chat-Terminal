const core      = require('./core');
const Promise   = require('bluebird');

var connectToEachDomainRoom = Promise.promisify(core.start);
connectToEachDomainRoom();
core.prompt.start();

//TODO: Star Command
//TODO: Leave Command
