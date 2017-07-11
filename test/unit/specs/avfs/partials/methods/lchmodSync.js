'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('lchmodSync()', function () {

    it('should throw on bad path parameter type', function () {
      expect(function () {
        fs.lchmodSync(false, '0700');
      }).to.throw(Error);
    });

    it('should throw on bad mode parameter type', function () {
      expect(function () {
        fs.lchmodSync('/file', false);
      }).to.throw(Error);
    });

    it('should throw on non existing file', function () {
      expect(function () {
        fs.lchmodSync('/file', '0700');
      }).to.throw(Error, {code: 'ENOENT'});
    });

    it('should throw on non existing parent directory', function () {
      expect(function () {
        fs.lchmodSync('/not/file', '0700');
      }).to.throw(Error, {code: 'ENOENT'});
    });

    it('should throw on not directory parent', function () {
      expect(function () {
        fs.lchmodSync('/tmp/file/new', '0700');
      }).to.throw(Error, {code: 'ENOTDIR'});
    });

    it('should throw on not owned files', function () {
      expect(function () {
        fs.lchmodSync('/dir/other', '0700');
      }).to.throw(Error, {code: 'EPERM'});
    });

  });

};
