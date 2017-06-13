'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('chownSync()', function () {

    var uid = process.getuid();
    var gid = process.getgroups()[0];

    it('should change the owner and group', function () {
      var result = fs.chownSync('/tmp/file', uid, gid);

      expect(result).to.be.an('undefined');
      expect(fs.storage.files).to.contain.an.avfs.file('/tmp/file').with.owner(uid, gid);
    });

    it('should follow symlinks', function () {
      var result = fs.chownSync('/dir/link', uid, gid);

      expect(result).to.be.an('undefined');
      expect(fs.storage.files).to.contain.an.avfs.symlink('/dir/link').with.owner(uid, process.getgid());
      expect(fs.storage.files).to.contain.an.avfs.file('/tmp/file').with.owner(uid, gid);
    });

  });

};
