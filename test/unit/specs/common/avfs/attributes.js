'use strict';

var chai   = require('chai');
var expect = chai.expect;

var elements = require('lib/common/elements');
var factory  = require('lib/common/avfs/attributes');

var Storage = require('lib/common/storage');
var Stats   = require('lib/common/components/stats');

var constants = {
  S_IFLNK: 40960, // 0120000 - symbolic link
  S_IFDIR: 16384  // 0040000 - directory
};

describe('common/avfs/attributes', function () {

  var storage = new Storage(constants);

  var base = factory(storage);

  before(function () {
    storage.files = elements.directory(parseInt('0755', 8), {
      file: elements.file(parseInt('0777', 8), new Buffer('Hello, friend.')),
      link: elements.symlink(parseInt('0777', 8), '/file')
    });
  });

  describe('stat()', function () {

    it('should return file stats', function () {
      var stats = base.stat('/file');

      expect(stats).to.be.an.instanceOf(Stats);

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

  });

});
