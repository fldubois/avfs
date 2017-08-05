'use strict';

var path = require('path');

var readdir = require('fs-readdir-recursive');

var getSpecs = function (directory) {
  return readdir(path.join(__dirname, directory)).map(function (filepath) {
    return path.join(__dirname, directory, filepath);
  });
};

var specs = [].concat(path.join(__dirname, 'specs/avfs'), getSpecs('specs/base'), getSpecs('specs/common'));

specs.forEach(require);
