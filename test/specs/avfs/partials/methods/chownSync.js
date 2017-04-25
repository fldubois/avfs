'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('chownSync()', function () {

    it('should change the owner and group', function () {
      var result = fs.chownSync('/tmp/file', process.getuid(), process.getgroups()[0]);

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').with.owner(process.getuid(), process.getgroups()[0]);
    });

    it('should follow symlinks', function () {
      var result = fs.chownSync('/dir/link', process.getuid(), process.getgroups()[0]);

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.symlink('/dir/link').with.owner(process.getuid(), process.getgid());
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').with.owner(process.getuid(), process.getgroups()[0]);
    });

    it('should throw on bad path parameter type', function () {
      expect(function () {
        fs.chownSync(false, 1001, 1001);
      }).to.throw(TypeError, 'path must be a string');
    });

    it('should throw on bad uid parameter type', function () {
      expect(function () {
        fs.chownSync('/tmp/file', false, 1001);
      }).to.throw(TypeError, 'uid must be an unsigned int');
    });

    it('should throw on bad gid parameter type', function () {
      expect(function () {
        fs.chownSync('/tmp/file', 1001, false);
      }).to.throw(TypeError, 'gid must be an unsigned int');
    });

    it('should throw on non existing file', function () {
      expect(function () {
        fs.chownSync('/file', 1001, 1001);
      }).to.throw(Error, {code: 'ENOENT'});
    });

    it('should throw on non existing parent directory', function () {
      expect(function () {
        fs.chownSync('/not/file', 1001, 1001);
      }).to.throw(Error, {code: 'ENOENT'});
    });

    it('should throw on not directory parent', function () {
      expect(function () {
        fs.chownSync('/tmp/file/new', 1001, 1001);
      }).to.throw(Error, {code: 'ENOTDIR'});
    });

    it('should throw on permission denied', function () {
      expect(function () {
        fs.chownSync('/dir/other', 0, 0);
      }).to.throw(Error, {code: 'EPERM'});

      expect(function () {
        fs.chownSync('/tmp/file', process.getuid(), 0);
      }).to.throw(Error, {code: 'EPERM'});
    });

  });

};
