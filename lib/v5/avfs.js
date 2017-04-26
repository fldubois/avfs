'use strict';

var util = require('util');

var LegacyVFS = require('../v4/avfs');

function VirtualFS() {
  LegacyVFS.apply(this, arguments);
}

util.inherits(VirtualFS, LegacyVFS);

module.exports = VirtualFS;
