'use strict';

var elements = require('lib/common/elements');
var storage  = require('lib/common/storage');

var AVFS = require('lib/avfs');

var fs = new AVFS();

var getElement = function (path) {
  var current = fs.files;

  storage.parse(path).forEach(function (element) {
    current = current.get('content')[element];
  });

  return current;
};

var specs = [
  './members',
  './methods/appendFileSync',
  './methods/chmodSync',
  './methods/chownSync',
  './methods/closeSync',
  './methods/createReadStream',
  './methods/createWriteStream',
  './methods/existsSync',
  './methods/fchmodSync',
  './methods/fchownSync',
  './methods/fstatSync',
  './methods/fsyncSync',
  './methods/ftruncateSync',
  './methods/futimesSync',
  './methods/lchmodSync',
  './methods/lchownSync',
  './methods/linkSync',
  './methods/lstatSync',
  './methods/mkdirSync',
  './methods/openSync',
  './methods/readdirSync',
  './methods/readFileSync',
  './methods/readlinkSync',
  './methods/readSync',
  './methods/realpathSync',
  './methods/renameSync',
  './methods/rmdirSync',
  './methods/statSync',
  './methods/symlinkSync',
  './methods/truncateSync',
  './methods/unlinkSync',
  './methods/utimesSync',
  './methods/writeFileSync',
  './methods/writeSync',
  './methods.async'
];

describe('avfs', function () {

  beforeEach('reset virtual file system', function () {
    var otherFile = elements.file(parseInt('0666', 8), new Buffer('Hello, friend.'));

    otherFile.set('uid', process.getuid() + 1);

    fs.files = elements.directory(parseInt('0755', 8), {
      tmp: elements.directory(parseInt('0777', 8), {
        ascii: elements.file(parseInt('0666', 8), new Buffer('Hello, friend.')),
        empty: elements.file(parseInt('0666', 8), new Buffer(0)),
        file:  elements.file(parseInt('0666', 8), new Buffer('Hello, friend.'))
      }),
      dir: elements.directory(parseInt('0777', 8), {
        link:  elements.symlink(parseInt('0777', 8), '/tmp/file'),
        dlink: elements.symlink(parseInt('0777', 8), '/dir'),
        perm:  elements.file(parseInt('0111', 8), new Buffer('Hello, friend.')),
        other: otherFile
      }),
      perm: elements.directory(parseInt('0111', 8), {
        file: elements.file(parseInt('0666', 8), new Buffer('Hello, friend.')),
        dir:  elements.directory(parseInt('0777', 8))
      })
    });

    fs.handles = {};
    fs.next    = 0;
  });

  specs.forEach(function (spec) {
    require(spec)(fs, getElement);
  });

});
