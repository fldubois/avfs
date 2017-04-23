'use strict';

var util = require('util');

var LegacyVFS = require('../v0.12/avfs');

function VirtualFS() {
  LegacyVFS.apply(this, arguments);
}

util.inherits(VirtualFS, LegacyVFS);

module.exports = VirtualFS;
