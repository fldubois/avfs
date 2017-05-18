'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('symlinkSync()', function () {

    it('should create a symbolic link on file', function () {
      var result = fs.symlinkSync('/tmp/file', '/tmp/link');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.symlink('/tmp/link').with.mode('0777').that.target('/tmp/file');
    });

    it('should create a symbolic link on folder', function () {
      var result = fs.symlinkSync('/tmp', '/tmp/link');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.symlink('/tmp/link').with.mode('0777').that.target('/tmp');
    });

    it('should create a symbolic link on nonexistent target', function () {
      var result = fs.symlinkSync('/not/file', '/tmp/link');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.symlink('/tmp/link').with.mode('0777').that.target('/not/file');
    });

    it('should throw on existing destination', function () {
      expect(function () {
        fs.symlinkSync('/tmp/file', '/tmp/ascii');
      }).to.throw(Error, {code: 'EEXIST'});
    });

    it('should throw on non existing parent directory in destination path', function () {
      expect(function () {
        fs.symlinkSync('/tmp/file', '/not/link');
      }).to.throw(Error, {code: 'ENOENT'});
    });

    it('should throw on not directory parent in destination path', function () {
      expect(function () {
        fs.symlinkSync('/tmp/file', '/tmp/ascii/link');
      }).to.throw(Error, {code: 'ENOTDIR'});
    });

    it('should throw on non string source path', function () {
      expect(function () {
        fs.symlinkSync(true, '/dir/file');
      }).to.throw(TypeError);
    });

    it('should throw on non string destination path', function () {
      expect(function () {
        fs.symlinkSync('/tmp/file', true);
      }).to.throw(TypeError);
    });

    it('should throw on not writable destination directory', function () {
      expect(function () {
        fs.symlinkSync('/tmp/file', '/perm/link');
      }).to.throw(Error, {code: 'EACCES'});
    });

  });

};
