'use strict';

var path = require('path');

var get = require('lodash.get');

var getPathElements = function (filepath) {
  return path.normalize(filepath).replace(/\/|\\/g, path.sep).replace(new RegExp('^' + path.sep), '').split(path.sep);
};

function VirtualFS() {
  this.files = {};
}

VirtualFS.prototype.existsSync = function(filepath) {
  return get(this.files, getPathElements(filepath), null) !== null;
};

module.exports = VirtualFS;
