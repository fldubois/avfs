'use strict';

var events = require('events');
var util   = require('util');

function StatWatcher() {
  events.EventEmitter.call(this);
}

util.inherits(StatWatcher, events.EventEmitter);

StatWatcher.prototype.start = function () {
  return;
};


StatWatcher.prototype.stop = function () {
  return;
};

module.exports = StatWatcher;
