'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('lchownSync()', function () {

    var uid = process.getuid();

    it('should throw on bad path parameter type', function () {
      expect(function () {
        fs.lchownSync(false, 1001, 1001);
      }).to.throw(TypeError, 'path must be a string');
    });

    it('should throw on bad uid parameter type', function () {
      expect(function () {
        fs.lchownSync('/tmp/file', false, 1001);
      }).to.throw(TypeError, 'uid must be an unsigned int');
    });

    it('should throw on bad gid parameter type', function () {
      expect(function () {
        fs.lchownSync('/tmp/file', 1001, false);
      }).to.throw(TypeError, 'gid must be an unsigned int');
    });

    it('should throw on non existing file', function () {
      expect(function () {
        fs.lchownSync('/file', 1001, 1001);
      }).to.throw(Error, {code: 'ENOENT'});
    });

    it('should throw on non existing parent directory', function () {
      expect(function () {
        fs.lchownSync('/not/file', 1001, 1001);
      }).to.throw(Error, {code: 'ENOENT'});
    });

    it('should throw on not directory parent', function () {
      expect(function () {
        fs.lchownSync('/tmp/file/new', 1001, 1001);
      }).to.throw(Error, {code: 'ENOTDIR'});
    });

    it('should throw on permission denied', function () {
      expect(function () {
        fs.lchownSync('/dir/other', 0, 0);
      }).to.throw(Error, {code: 'EPERM'});

      expect(function () {
        fs.lchownSync('/tmp/file', uid, 0);
      }).to.throw(Error, {code: 'EPERM'});
    });

  });

};
