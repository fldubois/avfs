'use strict';

var matches = /^(v(\d+))\.\d+/.exec(process.version);

var version = (parseInt(matches[2], 10) > 0) ? matches[1] : matches[0];

try {
  module.exports = require('./' + version + '/avfs');
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    throw new Error('Unsupported node version: ' + process.version);
  }

  throw error;
}
