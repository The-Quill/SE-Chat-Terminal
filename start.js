"use strict";
var core = require("./chat_modules/core");
var prompt = require("./prompt");

core.start().then(function() {
    prompt.start();
});
