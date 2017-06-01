'use strict';

var events = require('events');
var util   = require('util');

function FSWatcher() {
  events.EventEmitter.call(this);
}

util.inherits(FSWatcher, events.EventEmitter);

FSWatcher.prototype.start = function () {
  return;
};


FSWatcher.prototype.close = function () {
  return;
};

module.exports = FSWatcher;
