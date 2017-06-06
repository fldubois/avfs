'use strict';

var path = require('path');

var readdir = require('fs-readdir-recursive');

var specs = readdir(path.join(__dirname, 'specs/common')).map(function (filepath) {
  return path.join(__dirname, 'specs/common', filepath);
});

specs.unshift(path.join(__dirname, 'specs/avfs'));

specs.forEach(require);
