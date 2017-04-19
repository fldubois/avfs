'use strict';

var matches = /^(v(\d+))\.\d+/.exec(process.version);

module.exports = (parseInt(matches[2], 10) > 0) ? matches[1] : matches[0];
