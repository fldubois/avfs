'use strict';

var version = require('./common/version');

try {
  module.exports = require('./' + version + '/avfs');
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    throw new Error('Unsupported node version: ' + process.version);
  }

  throw error;
}
