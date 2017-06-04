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

  });

};
