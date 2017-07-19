'use strict';

var chai   = require('chai');
var expect = chai.expect;

var elements = require('lib/common/elements');
var factory  = require('lib/common/avfs/access');

var AVFSError = require('lib/common/avfs-error');
var Storage   = require('lib/common/storage');

var constants = {
  S_IFLNK: 40960, // 0120000 - symbolic link
  S_IFDIR: 16384, // 0040000 - directory

  F_OK: 0,
  R_OK: 4,
  W_OK: 2,
  X_OK: 1
};

describe('common/avfs/access', function () {

  var storage = new Storage(constants);

  var base = factory(storage, constants);

  before(function () {
    storage.files = elements.directory(parseInt('0755', 8), {
      r: elements.file(parseInt('0444', 8), new Buffer('Hello, friend.')),
      w: elements.file(parseInt('0222', 8), new Buffer('Hello, friend.')),
      x: elements.file(parseInt('0111', 8), new Buffer('Hello, friend.'))
    });
  });

  describe('access()', function () {

    it('should return undefined on existing file and F_OK mode', function () {
      expect(base.access('/r', constants.F_OK)).to.be.an('undefined');
    });

    it('should return undefined on accessible file', function () {
      expect(base.access('/r', constants.R_OK)).to.be.an('undefined');
      expect(base.access('/w', constants.W_OK)).to.be.an('undefined');
      expect(base.access('/x', constants.X_OK)).to.be.an('undefined');
    });

    it('should return undefined on existing file and falsy mode', function () {
      [void 0, null, false, ''].forEach(function (mode) {
        expect(base.access('/r', mode)).to.be.an('undefined');
      });
    });

    it('should return undefined on executable file and truthy mode', function () {
      [true, 'test', {}].forEach(function (mode) {
        expect(base.access('/x', mode)).to.be.an('undefined');
      });
    });

    it('should throw EACCESS non accessible file', function () {
      expect(base.access.bind(null, '/r', constants.W_OK)).to.throw(AVFSError, {code: 'EACCESS'});
      expect(base.access.bind(null, '/r', constants.X_OK)).to.throw(AVFSError, {code: 'EACCESS'});

      expect(base.access.bind(null, '/w', constants.R_OK)).to.throw(AVFSError, {code: 'EACCESS'});
      expect(base.access.bind(null, '/w', constants.X_OK)).to.throw(AVFSError, {code: 'EACCESS'});

      expect(base.access.bind(null, '/x', constants.R_OK)).to.throw(AVFSError, {code: 'EACCESS'});
      expect(base.access.bind(null, '/x', constants.W_OK)).to.throw(AVFSError, {code: 'EACCESS'});
    });

    it('should throw EINVAL non bad mode parameter', function () {
      expect(base.access.bind(null, '/r', -1)).to.throw(AVFSError, {code: 'EINVAL'});
      expect(base.access.bind(null, '/r',  8)).to.throw(AVFSError, {code: 'EINVAL'});
    });

  });

});
