'use strict';

var fs   = require('fs');
var path = require('path');

var elements = require('lib/common/elements');
var storage  = require('lib/common/storage');
var version  = require('lib/common/version');

var AVFS = require('lib/avfs');

var avfs = new AVFS();

var getElement = function (filepath) {
  var current = avfs.files;

  storage.parse(filepath).forEach(function (element) {
    current = current.get('content')[element];
  });

  return current;
};

var specs = fs.readdirSync(path.join(__dirname, 'partials/methods')).map(function (filename) {
  return './partials/methods/' + filename;
});

specs.unshift('./partials/members');
specs.push('./partials/async');

describe('avfs', function () {

  beforeEach('reset virtual file system', function () {
    var otherFile = elements.file(parseInt('0666', 8), new Buffer('Hello, friend.'));

    otherFile.set('uid', process.getuid() + 1);

    avfs.files = elements.directory(parseInt('0755', 8), {
      tmp: elements.directory(parseInt('0777', 8), {
        ascii: elements.file(parseInt('0666', 8), new Buffer('Hello, friend.')),
        empty: elements.file(parseInt('0666', 8), new Buffer(0)),
        file:  elements.file(parseInt('0666', 8), new Buffer('Hello, friend.'))
      }),
      dir: elements.directory(parseInt('0777', 8), {
        link:  elements.symlink(parseInt('0777', 8), '/tmp/file'),
        dlink: elements.symlink(parseInt('0777', 8), '/dir'),
        perm:  elements.file(parseInt('0000', 8), new Buffer('Hello, friend.')),
        other: otherFile
      }),
      perm: elements.directory(parseInt('0000', 8), {
        file: elements.file(parseInt('0666', 8), new Buffer('Hello, friend.')),
        dir:  elements.directory(parseInt('0777', 8))
      })
    });

    avfs.handles = {};
    avfs.next    = 0;
  });

  specs.forEach(function (spec) {
    require(spec)(avfs, getElement, version);
  });

});
