'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('truncateSync()', function () {

    it('should truncate file', function () {
      var result = fs.truncateSync('/tmp/file');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').that.is.clear();
    });

    it('should truncate file to the specified length', function () {
      var content = new Buffer('Hello, friend.');

      var result = fs.truncateSync('/tmp/file', 3);

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').that.contain(content.slice(0, 3).toString());
    });

    it('should throw on non existing path', function () {
      expect(function () {
        fs.truncateSync('/not/file');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/file\'');
    });

    it('should throw on directory', function () {
      expect(function () {
        fs.truncateSync('/tmp');
      }).to.throw(Error, 'EISDIR, illegal operation on a directory \'/tmp\'');
    });

    it('should throw on non string path', function () {
      expect(function () {
        fs.truncateSync(true);
      }).to.throw(TypeError, 'path must be a string');
    });

    it('should throw on non integer length', function () {
      expect(function () {
        fs.truncateSync('/tmp/file', true);
      }).to.throw(TypeError, 'Not an integer');
    });

  });

};
