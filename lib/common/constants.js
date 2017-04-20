'use strict';

var version = require('./version');

try {
  module.exports = require('../' + version + '/constants');
} catch (error) {
  module.exports = {};
}
