'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('mkdirSync()', function () {

    it('should create a new directory', function () {
      var result = fs.mkdirSync('tmp/test');

      expect(result).to.be.an('undefined');
      expect(fs.storage.files).to.contain.an.avfs.directory('/tmp/test').that.is.clear();
    });

    it('should create a new directory on root', function () {
      var result = fs.mkdirSync('/test');

      expect(result).to.be.an('undefined');
      expect(fs.storage.files).to.contain.an.avfs.directory('/test').that.is.clear();
    });

    it('should accept mode parameter as string', function () {
      var result = fs.mkdirSync('/tmp/dir', '0500');

      expect(result).to.be.an('undefined');
      expect(fs.storage.files).to.contain.an.avfs.directory('/tmp/dir').with.mode('0500').that.is.clear();
    });

    it('should accept mode parameter as number', function () {
      var result = fs.mkdirSync('/tmp/dir', 438);

      expect(result).to.be.an('undefined');
      expect(fs.storage.files).to.contain.an.avfs.directory('/tmp/dir').with.mode('0666').that.is.clear();
    });

    it('should set mode to 0777 by default', function () {
      var result = fs.mkdirSync('/tmp/dir');

      expect(result).to.be.an('undefined');
      expect(fs.storage.files).to.contain.an.avfs.directory('/tmp/dir').with.mode('0777').that.is.clear();
    });

  });

};
