'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs, getElement, version) {

  if (['v0.12', 'v4'].indexOf(version) !== -1) {

    describe('accessSync()', function () {

      it('should return undefined on existing file and no mode', function () {
        expect(fs.accessSync('/tmp/file')).to.be.an('undefined');
      });

      it('should return undefined on existing file and F_OK mode', function () {
        expect(fs.accessSync('/tmp/file', fs.F_OK)).to.be.an('undefined');
      });

      it('should throw on non readable file and R_OK mode', function () {
        expect(function () {
          fs.accessSync('/dir/perm', fs.R_OK);
        }).to.throw(Error, 'EACCES, permission denied \'/dir/perm\'');
      });

      it('should throw on non writable file and W_OK mode', function () {
        expect(function () {
          fs.accessSync('/dir/perm', fs.W_OK);
        }).to.throw(Error, 'EACCES, permission denied \'/dir/perm\'');
      });

      it('should throw on non executable file and X_OK mode', function () {
        expect(function () {
          fs.accessSync('/dir/perm', fs.X_OK);
        }).to.throw(Error, 'EACCES, permission denied \'/dir/perm\'');
      });

      it('should throw on non existing file', function () {
        expect(function () {
          fs.accessSync('/file');
        }).to.throw(Error, 'ENOENT, no such file or directory \'/file\'');
      });

      it('should throw on non existing parent directory', function () {
        expect(function () {
          fs.accessSync('/not/file', 'Hello, friend.');
        }).to.throw(Error, 'ENOENT, no such file or directory \'/not/file\'');
      });

      it('should throw on not directory parent', function () {
        expect(function () {
          fs.accessSync('/tmp/file/new');
        }).to.throw(Error, 'ENOTDIR, not a directory \'/tmp/file/new\'');
      });

      it('should throw on non string path', function () {
        expect(function () {
          fs.accessSync(true);
        }).to.throw(TypeError, 'path must be a string');
      });

    });

  }

};
