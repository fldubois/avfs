'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('test/unit/fixtures/constants');

var elements = require('lib/common/elements')(constants);
var factory  = require('lib/base/copy');

var AVFSError = require('lib/common/avfs-error');
var Storage   = require('lib/common/storage');

describe('base/copy', function () {

  var storage = new Storage(constants);
  var handles = {next: 0};

  var base = factory(storage, constants, handles);

  beforeEach(function () {
    storage.files = elements.directory(parseInt('0755', 8), {
      src:    elements.file(parseInt('0700', 8), new Buffer('Hello, friend.')),
      exists: elements.file(parseInt('0777', 8), new Buffer('This file exists.')),
      link:   elements.symlink(parseInt('0777', 8), '/src')
    });
  });

  describe('copyFile()', function () {

    it('should copy content from src to dest', function () {
      var result = base.copyFile('/src', '/dest');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/dest').that.contain('Hello, friend.').with.mode('0700');
    });

    it('should follow links', function () {
      var result = base.copyFile('/link', '/dest');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/dest').that.contain('Hello, friend.').with.mode('0700');
    });

    it('should overwrite existing destination', function () {
      var result = base.copyFile('/src', '/exists');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/exists').that.contain('Hello, friend.').with.mode('0700');
    });

    it('should support COPYFILE_EXCL mode', function () {
      expect(function () {
        base.copyFile('/src', '/exists', constants.COPYFILE_EXCL);
      }).to.throw(AVFSError).with.property('code', 'EEXIST');
    });

    it('should throw src:type error on bad src type', function () {
      [void 0, null, 0, false, {}, []].forEach(function (src) {
        expect(function () {
          base.copyFile(src);
        }).to.throw(AVFSError).with.property('code', 'src:type');
      });
    });

    it('should throw dest:type error on bad dest type', function () {
      [void 0, null, 0, false, {}, []].forEach(function (dest) {
        expect(function () {
          base.copyFile('/file', dest);
        }).to.throw(AVFSError).with.property('code', 'dest:type');
      });
    });

  });

});
