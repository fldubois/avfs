'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('chmodSync()', function () {

    it('should change the mode', function () {
      var result = fs.chmodSync('/tmp/file', '0700');

      expect(result).to.be.an('undefined');
      expect(fs.storage.files).to.contain.an.avfs.file('/tmp/file').with.mode('0700');
    });

    it('should follow symlinks', function () {
      var result = fs.chmodSync('/dir/link', '0700');

      expect(result).to.be.an('undefined');
      expect(fs.storage.files).to.contain.an.avfs.file('/tmp/file').with.mode('0700');
      expect(fs.storage.files).to.contain.an.avfs.symlink('/dir/link').with.mode('0777');
    });

  });

};
