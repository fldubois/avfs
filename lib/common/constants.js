'use strict';

var version = require('./version');

try {
  module.exports = require('../' + version + '/constants');
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') {
    throw error;
  }

  module.exports = require('../v0.10/constants');
}
