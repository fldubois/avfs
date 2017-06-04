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

  });

};
