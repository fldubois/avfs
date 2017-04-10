'use strict';

var matches = /^(v(\d+))\.\d+/.exec(process.version);

var version = (parseInt(matches[2], 10) > 0) ? matches[1] : matches[0];

module.exports = require('./' + version + '/avfs');
