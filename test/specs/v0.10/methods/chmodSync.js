'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('chmodSync()', function () {

    it('should change the mode', function () {
      var result = fs.chmodSync('/tmp/file', '0700');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').with.mode('0700');
    });

    it('should follow symlinks', function () {
      var result = fs.chmodSync('/dir/link', '0700');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').with.mode('0700');
      expect(fs.files).to.contain.an.avfs.symlink('/dir/link').with.mode('0777');
    });

    it('should throw on bad path parameter type', function () {
      expect(function () {
        fs.chmodSync(false, '0700');
      }).to.throw(Error, 'Bad argument');
    });

    it('should throw on bad mode parameter type', function () {
      expect(function () {
        fs.chmodSync('/file', false);
      }).to.throw(Error, 'Bad argument');
    });

    it('should throw on non existing file', function () {
      expect(function () {
        fs.chmodSync('/file', '0700');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/file\'');
    });

    it('should throw on non existing parent directory', function () {
      expect(function () {
        fs.chmodSync('/not/file', '0700');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/file\'');
    });

    it('should throw on not directory parent', function () {
      expect(function () {
        fs.chmodSync('/tmp/file/new', '0700');
      }).to.throw(Error, 'ENOTDIR, not a directory \'/tmp/file/new\'');
    });

    it('should throw on not owned files', function () {
      expect(function () {
        fs.chmodSync('/dir/other', '0700');
      }).to.throw(Error, 'EPERM, operation not permitted \'/dir/other\'');
    });

  });

};
