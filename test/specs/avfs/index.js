'use strict';

var chai   = require('chai');
var expect = chai.expect;

var elements = require('lib/common/elements');
var storage  = require('lib/common/storage');

var matches = /^(v(\d+))\.\d+/.exec(process.version);
var version = (parseInt(matches[2], 10) > 0) ? matches[1] : matches[0];

var specs = [
  './partials/members',
  './partials/methods/appendFileSync',
  './partials/methods/chmodSync',
  './partials/methods/chownSync',
  './partials/methods/closeSync',
  './partials/methods/createReadStream',
  './partials/methods/createWriteStream',
  './partials/methods/existsSync',
  './partials/methods/fchmodSync',
  './partials/methods/fchownSync',
  './partials/methods/fstatSync',
  './partials/methods/fsyncSync',
  './partials/methods/ftruncateSync',
  './partials/methods/futimesSync',
  './partials/methods/lchmodSync',
  './partials/methods/lchownSync',
  './partials/methods/linkSync',
  './partials/methods/lstatSync',
  './partials/methods/mkdirSync',
  './partials/methods/openSync',
  './partials/methods/readdirSync',
  './partials/methods/readFileSync',
  './partials/methods/readlinkSync',
  './partials/methods/readSync',
  './partials/methods/realpathSync',
  './partials/methods/renameSync',
  './partials/methods/rmdirSync',
  './partials/methods/statSync',
  './partials/methods/symlinkSync',
  './partials/methods/truncateSync',
  './partials/methods/unlinkSync',
  './partials/methods/utimesSync',
  './partials/methods/writeFileSync',
  './partials/methods/writeSync',
  './partials/async'
];

describe('avfs', function () {

  if (['v0.10'].indexOf(version) === -1) {

    it('should throw unsupported version error', function () {
      expect(function () {
        require('lib/avfs');
      }).to.throw(Error, 'Unsupported node version: ' + process.version);
    });

  } else {

    var AVFS = require('lib/avfs');

    var fs = new AVFS();

    var getElement = function (path) {
      var current = fs.files;

      storage.parse(path).forEach(function (element) {
        current = current.get('content')[element];
      });

      return current;
    };

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

  }

});
