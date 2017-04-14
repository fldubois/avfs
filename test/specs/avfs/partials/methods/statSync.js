'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs, getElement) {

  describe('statSync()', function () {

    it('should return file stats', function () {
      var stats = fs.statSync('/tmp/file');

      expect(stats).to.be.an('object');

      var file = getElement('/tmp/file');

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

    it('should follow symlinks', function () {
      var statsFile = fs.statSync('/tmp/file');
      var statsLink = fs.statSync('/dir/link');

      expect(statsFile).to.deep.equal(statsLink);
    });

    it('should throw on non existing path', function () {
      expect(function () {
        fs.statSync('/not/test.txt');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/test.txt\'');
    });

    it('should throw on non directory parent', function () {
      expect(function () {
        fs.statSync('/tmp/file/file');
      }).to.throw(Error, 'ENOTDIR, not a directory \'/tmp/file/file\'');
    });

    it('should throw on non string path', function () {
      expect(function () {
        fs.statSync(true);
      }).to.throw(TypeError, 'path must be a string');
    });

  });

};
