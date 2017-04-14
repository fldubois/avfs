'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs, getElement) {

  describe('unlinkSync()', function () {

    it('should delete file', function () {
      var result = fs.unlinkSync('/tmp/file');

      expect(result).to.be.an('undefined');
      expect(getElement('/tmp')).to.not.contain.keys('file');
    });

    it('should decrement the number of links', function () {
      var file = getElement('/tmp/file');

      file.set('nlink', 5);

      var result = fs.unlinkSync('/tmp/file');

      expect(result).to.be.an('undefined');
      expect(file.get('nlink')).to.equal(4);
    });

    it('should throw on non existing path', function () {
      expect(function () {
        fs.unlinkSync('/not/file');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/file\'');
    });

    it('should throw on directory', function () {
      expect(function () {
        fs.unlinkSync('/tmp');
      }).to.throw(Error, 'EISDIR, illegal operation on a directory \'/tmp\'');
    });

    it('should throw on non string path', function () {
      expect(function () {
        fs.unlinkSync(true);
      }).to.throw(TypeError, 'path must be a string');
    });

    it('should throw on not writable parent directory', function () {
      expect(function () {
        fs.unlinkSync('/perm/file');
      }).to.throw(Error, 'EACCES, permission denied \'/perm/file\'');
    });

  });

};
