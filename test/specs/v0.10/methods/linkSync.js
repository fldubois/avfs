'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs, getElement) {

  describe('linkSync()', function () {

    it('should create a hard link', function () {
      var result = fs.linkSync('/tmp/file', '/dir/file');

      expect(result).to.be.an('undefined');
      expect(getElement('/tmp/file')).to.equal(getElement('/dir/file'));
    });

    it('should increment the number of links', function () {
      expect(getElement('/tmp/file').get('nlink')).to.equal(1);

      var result = fs.linkSync('/tmp/file', '/dir/file');

      expect(result).to.be.an('undefined');
      expect(getElement('/tmp/file').get('nlink')).to.equal(2);
    });

    it('should throw on directory source', function () {
      expect(function () {
        fs.linkSync('/tmp', '/dir');
      }).to.throw(Error, 'EPERM, operation not permitted \'/dir\'');
    });

    it('should throw on existing destination', function () {
      expect(function () {
        fs.linkSync('/tmp/file', '/tmp/ascii');
      }).to.throw(Error, 'EEXIST, file already exists \'/tmp/ascii\'');
    });

    it('should throw on non existing parent directory in source path', function () {
      expect(function () {
        fs.linkSync('/not/file', '/dir/file');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/file\'');
    });

    it('should throw on not directory parent in source path', function () {
      expect(function () {
        fs.linkSync('/tmp/file/link', '/dir/file');
      }).to.throw(Error, 'ENOTDIR, not a directory \'/tmp/file/link\'');
    });

    it('should throw on non existing parent directory in destination path', function () {
      expect(function () {
        fs.linkSync('/tmp/file', '/not/file');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/tmp/file\'');
    });

    it('should throw on not directory parent in destination path', function () {
      expect(function () {
        fs.linkSync('/tmp/file', '/tmp/ascii/link');
      }).to.throw(Error, 'ENOTDIR, not a directory \'/tmp/file\'');
    });

    it('should throw on non string source path', function () {
      expect(function () {
        fs.linkSync(true, '/dir/file');
      }).to.throw(TypeError, 'dest path must be a string');
    });

    it('should throw on non string destination path', function () {
      expect(function () {
        fs.linkSync('/tmp/file', true);
      }).to.throw(TypeError, 'src path must be a string');
    });

  });

};
