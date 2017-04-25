'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('rmdirSync()', function () {

    it('should delete directory', function () {
      var result = fs.rmdirSync('/tmp');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.not.contain.keys('tmp');
    });

    it('should throw on non existing path', function () {
      expect(function () {
        fs.rmdirSync('/not');
      }).to.throw(Error, {code: 'ENOENT'});
    });

    it('should throw on file', function () {
      expect(function () {
        fs.rmdirSync('/tmp/file');
      }).to.throw(Error, {code: 'ENOTDIR'});
    });

    it('should throw on non string path', function () {
      expect(function () {
        fs.rmdirSync(true);
      }).to.throw(TypeError, 'path must be a string');
    });

    it('should throw on not writable parent directory', function () {
      expect(function () {
        fs.rmdirSync('/perm/dir');
      }).to.throw(Error, {code: 'EACCES'});
    });

  });

};
