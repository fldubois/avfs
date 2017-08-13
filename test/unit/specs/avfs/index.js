'use strict';

var constants = require('test/unit/fixtures/constants');

var elements = require('lib/common/elements')(constants);

var AVFS = require('lib/avfs');

var avfs = new AVFS();

var specs = [
  './partials/async',
  './partials/base',
  './partials/buffer',
  './partials/members',
  './partials/methods',
  './partials/uint8array',
  './partials/url'
];

describe('avfs', function () {

  beforeEach('reset virtual file system', function () {
    var files = {
      file:  elements.file(parseInt('0666', 8), new Buffer('Hello, friend.')),
      other: elements.file(parseInt('0666', 8), new Buffer('Hello, friend.'))
    };

    files.other.set('uid', process.getuid() + 1);

    avfs.storage.files = elements.directory(parseInt('0755', 8), files);
  });

  specs.forEach(function (spec) {
    require(spec)(avfs);
  });

});
