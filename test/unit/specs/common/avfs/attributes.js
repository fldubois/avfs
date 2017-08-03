'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('test/unit/fixtures/constants');

var elements = require('lib/common/elements')(constants);
var factory  = require('lib/common/avfs/attributes');

var AVFSError = require('lib/common/avfs-error');
var Storage   = require('lib/common/storage');

describe('common/avfs/attributes', function () {

  var storage = new Storage(constants);

  var base = factory(storage, constants);

  before(function () {
    storage.files = elements.directory(parseInt('0755', 8), {
      file: elements.file(parseInt('0777', 8), new Buffer('Hello, friend.')),
      link: elements.symlink(parseInt('0777', 8), '/file')
    });
  });

  describe('stat()', function () {

    it('should return file stats', function () {
      var stats = base.stat('/file');

      var file = storage.get('/file');

      expect(stats.dev).to.equal(1);
      expect(stats.ino).to.equal(file.get('inode'));
      expect(stats.mode).to.equal(file.get('mode') + file.get('type'));
      expect(stats.nlink).to.equal(file.get('nlink'));
      expect(stats.uid).to.equal(file.get('uid'));
      expect(stats.gid).to.equal(file.get('gid'));
      expect(stats.rdev).to.equal(0);
      expect(stats.size).to.equal(0);
      expect(stats.blksize).to.equal(512);
      expect(stats.blocks).to.equal(0);
      expect(stats.atime).to.equal(file.get('atime'));
      expect(stats.mtime).to.equal(file.get('mtime'));
      expect(stats.ctime).to.equal(file.get('ctime'));
    });

    it('should throw path:type error on bad path type', function () {
      [void 0, null, 0, false, {}, []].forEach(function (path) {
        expect(base.stat.bind(null, path)).to.throw(AVFSError).with.property('code', 'path:type');
      });
    });

  });

  describe('utimes()', function () {

    it('should change timestamps', function () {
      var date = new Date('2012-12-21T00:00:00.000Z');

      var result = base.utimes('/file', date, date);

      var file = storage.get('/file');

      expect(result).to.be.an('undefined');
      expect(file.get('atime').getTime()).to.equal(date.getTime());
      expect(file.get('mtime').getTime()).to.equal(date.getTime());
    });

    it('should accept time as unix timestamp', function () {
      var date      = new Date('2012-12-21T00:00:00.000Z');
      var timestamp = date.getTime() / 1000;

      var result = base.utimes('/file', timestamp, timestamp);

      var file = storage.get('/file');

      expect(result).to.be.an('undefined');
      expect(file.get('atime').getTime()).to.equal(date.getTime());
      expect(file.get('mtime').getTime()).to.equal(date.getTime());
    });

    it('should follow symlinks', function () {
      var date = new Date('2012-12-21T00:00:00.000Z');

      var result = base.utimes('/link', date, date);

      expect(result).to.be.an('undefined');

      var file = storage.get('/file');
      var link = storage.get('/link', false);

      expect(link.get('atime').getTime()).to.not.equal(date.getTime());
      expect(link.get('mtime').getTime()).to.not.equal(date.getTime());

      expect(file.get('atime').getTime()).to.equal(date.getTime());
      expect(file.get('mtime').getTime()).to.equal(date.getTime());
    });

    it('should throw path:type error on bad path type', function () {
      [void 0, null, 0, false, {}, []].forEach(function (path) {
        expect(base.utimes.bind(null, path, 0, 0)).to.throw(AVFSError).with.property('code', 'path:type');
      });
    });

    it('should throw atime:type on bad atime type', function () {
      [void 0, null, false, 'test', {}, []].forEach(function (atime) {
        expect(base.utimes.bind(null, '/file', atime, 0)).to.throw(AVFSError).with.property('code', 'atime:type');
      });
    });

    it('should throw mtime:type on bad mtime type', function () {
      [void 0, null, false, 'test', {}, []].forEach(function (mtime) {
        expect(base.utimes.bind(null, '/file', 0, mtime)).to.throw(AVFSError).with.property('code', 'mtime:type');
      });
    });

  });

});
