'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs, getElement) {

  describe('utimesSync()', function () {

    it('should change timestamps', function () {
      var date = new Date('2012-12-21T00:00:00.000Z');

      var result = fs.utimesSync('/tmp/file', date, date);

      expect(result).to.be.an('undefined');
      expect(getElement('/tmp/file').get('atime').getTime()).to.equal(date.getTime());
      expect(getElement('/tmp/file').get('mtime').getTime()).to.equal(date.getTime());
    });

    it('should accept time as unix timestamp', function () {
      var date      = new Date('2012-12-21T00:00:00.000Z');
      var timestamp = date.getTime() / 1000;

      var result = fs.utimesSync('/tmp/file', timestamp, timestamp);

      expect(result).to.be.an('undefined');
      expect(getElement('/tmp/file').get('atime').getTime()).to.equal(date.getTime());
      expect(getElement('/tmp/file').get('mtime').getTime()).to.equal(date.getTime());
    });

    it('should follow symlinks', function () {
      var date = new Date('2012-12-21T00:00:00.000Z');

      var result = fs.utimesSync('/dir/link', date, date);

      expect(result).to.be.an('undefined');

      expect(getElement('/dir/link').get('atime').getTime()).to.not.equal(date.getTime());
      expect(getElement('/dir/link').get('mtime').getTime()).to.not.equal(date.getTime());

      expect(getElement('/tmp/file').get('atime').getTime()).to.equal(date.getTime());
      expect(getElement('/tmp/file').get('mtime').getTime()).to.equal(date.getTime());
    });

    it('should throw on non existing path', function () {
      expect(function () {
        fs.utimesSync('/not/file', 0, 0);
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/file\'');
    });

    it('should throw on non existing parent directory', function () {
      expect(function () {
        fs.chownSync('/not/file', 0, 0);
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/file\'');
    });

    it('should throw on not directory parent', function () {
      expect(function () {
        fs.chownSync('/tmp/file/new', 0, 0);
      }).to.throw(Error, 'ENOTDIR, not a directory \'/tmp/file/new\'');
    });

    it('should throw on non string path', function () {
      expect(function () {
        fs.utimesSync(true, 0, 0);
      }).to.throw(TypeError, 'path must be a string');
    });

    it('should throw bad atime parameter type', function () {
      expect(function () {
        fs.utimesSync('/tmp/file', false, 0);
      }).to.throw(Error, 'Cannot parse time: false');
    });

    it('should throw bad mtime parameter type', function () {
      expect(function () {
        fs.utimesSync('/tmp/file', 0, false);
      }).to.throw(Error, 'Cannot parse time: false');
    });

  });

};
