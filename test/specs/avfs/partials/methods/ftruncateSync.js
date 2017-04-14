'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('lib/common/constants');

var Descriptor = require('lib/common/descriptor');

module.exports = function (fs, getElement) {

  describe('ftruncateSync()', function () {

    it('should truncate file', function () {
      var fd = 10;

      fs.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      var result = fs.ftruncateSync(fd);

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').that.is.clear();
    });

    it('should truncate file to the specified length', function () {
      var content = new Buffer('Hello, friend.');
      var fd = 10;

      fs.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      var result = fs.ftruncateSync(fd, 3);

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').that.contain(content.slice(0, 3).toString());
    });

    it('should throw on non writing file descriptor', function () {
      var fd = 10;

      fs.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDONLY);

      expect(function () {
        fs.ftruncateSync(fd);
      }).to.throw(Error, 'EBADF, bad file descriptor');
    });

    it('should throw on non existing file descriptor', function () {
      expect(function () {
        fs.ftruncateSync(0);
      }).to.throw(Error, 'EBADF, bad file descriptor');
    });

    it('should throw on non integer file descriptor', function () {
      expect(function () {
        fs.ftruncateSync(true);
      }).to.throw(TypeError, 'Bad argument');
    });

    it('should throw on non integer length', function () {
      expect(function () {
        fs.ftruncateSync(0, true);
      }).to.throw(TypeError, 'Not an integer');
    });

  });

};
