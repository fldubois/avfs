'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('test/unit/fixtures/constants');

var elements = require('lib/common/elements')(constants);
var factory  = require('lib/common/avfs/directories');

var AVFSError = require('lib/common/avfs-error');
var Storage   = require('lib/common/storage');

describe('common/avfs/directories', function () {

  var storage = new Storage(constants);

  var base = factory(storage, constants);

  describe('mkdir()', function () {

    beforeEach(function () {
      storage.files = elements.directory(parseInt('0755', 8), {
        dir: elements.directory(parseInt('0755', 8), {})
      });
    });

    it('should create a new directory', function () {
      var result = base.mkdir('/new');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.directory('/new').that.is.clear();
    });

    it('should accept mode parameter as string', function () {
      var result = base.mkdir('/new', '0500');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.directory('/new').with.mode('0500').that.is.clear();
    });

    it('should accept mode parameter as number', function () {
      var result = base.mkdir('/new', 438);

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.directory('/new').with.mode('0666').that.is.clear();
    });

    it('should set mode to 0777 by default', function () {
      var result = base.mkdir('/new');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.directory('/new').with.mode('0777').that.is.clear();
    });

    it('should throw path:type error on bad path type', function () {
      [void 0, null, 0, false, {}, []].forEach(function (path) {
        expect(base.mkdir.bind(null, path)).to.throw(AVFSError, {code: 'path:type'});
      });
    });

    it('should throw EEXIST on non existing directory', function () {
      expect(base.mkdir.bind(null, '/dir')).to.throw(AVFSError, {code: 'EEXIST'});
    });

  });

  describe('mkdtemp()', function () {

    it('should create a unique temporary directory', function () {
      var nameA = base.mkdtemp('test-');
      var nameB = base.mkdtemp('/test-');

      expect(nameA).to.match(/^\/test-[A-Za-z0-9]{6}/);
      expect(nameB).to.match(/^\/test-[A-Za-z0-9]{6}/);

      expect(nameA).to.not.equal(nameB);

      expect(storage.files).to.contain.an.avfs.directory(nameA).with.mode('0700').that.is.clear();
      expect(storage.files).to.contain.an.avfs.directory(nameB).with.mode('0700').that.is.clear();
    });

  });

  describe('readdir()', function () {

    before(function () {
      storage.files = elements.directory(parseInt('0755', 8), {
        dir: elements.directory(parseInt('0755', 8), {
          fileA: elements.file(parseInt('0666', 8), new Buffer(0)),
          fileB: elements.file(parseInt('0666', 8), new Buffer(0)),
          fileC: elements.file(parseInt('0666', 8), new Buffer(0))
        }),
        file: elements.file(parseInt('0666', 8), new Buffer(0))
      });
    });

    it('should list directory files', function () {
      var result = base.readdir('/dir');

      expect(result).to.be.an('array');
      expect(result).to.deep.equal([
        'fileA',
        'fileB',
        'fileC'
      ]);
    });

    it('should throw path:type error on bad path type', function () {
      [void 0, null, 0, false, {}, []].forEach(function (path) {
        expect(base.readdir.bind(null, path)).to.throw(AVFSError, {code: 'path:type'});
      });
    });

    it('should throw ENOTDIR on non directory', function () {
      expect(base.readdir.bind(null, '/file')).to.throw(AVFSError, {code: 'ENOTDIR'});
    });

  });

  describe('rmdir()', function () {

    before(function () {
      storage.files = elements.directory(parseInt('0755', 8), {
        dir:  elements.directory(parseInt('0755', 8), {}),
        file: elements.file(parseInt('0666', 8), new Buffer(0))
      });
    });

    it('should delete directory', function () {
      var result = base.rmdir('/dir');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.not.contain.keys('dir');
    });

    it('should throw path:type error on bad path type', function () {
      [void 0, null, 0, false, {}, []].forEach(function (path) {
        expect(base.rmdir.bind(null, path)).to.throw(AVFSError, {code: 'path:type'});
      });
    });

    it('should throw ENOTDIR on non directory', function () {
      expect(base.rmdir.bind(null, '/file')).to.throw(AVFSError, {code: 'ENOTDIR'});
    });

  });

});
