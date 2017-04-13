'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('readlinkSync()', function () {

    it('should return the symlink target', function () {
      expect(fs.readlinkSync('/dir/link')).to.equal('/tmp/file');
    });

    it('should throw on non symlink', function () {
      expect(function () {
        fs.readlinkSync('/tmp/file');
      }).to.throw(Error, 'EINVAL, invalid argument \'/tmp/file\'');
    });

    it('should throw on non existing parent directory', function () {
      expect(function () {
        fs.readlinkSync('/not/link');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/link\'');
    });

    it('should throw on non directory parent', function () {
      expect(function () {
        fs.readlinkSync('/tmp/file/link');
      }).to.throw(Error, 'ENOTDIR, not a directory \'/tmp/file/link\'');
    });

    it('should throw on non string path', function () {
      expect(function () {
        fs.readlinkSync(true);
      }).to.throw(TypeError, 'path must be a string');
    });

  });

};
