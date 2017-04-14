'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('lib/common/constants');

var Descriptor = require('lib/common/descriptor');

var noop = function () {
  return null;
};

module.exports = function (fs, getElement) {

  describe('readSync()', function () {

    it('should read the file', function () {
      var fd = 0;

      fs.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      var buffer = new Buffer(5);

      var bytesRead = fs.readSync(fd, buffer, 0, 5, 0);

      expect(bytesRead).to.equal(5);
      expect(buffer.toString()).to.equal('Hello');
    });

    it('should read the file from position', function () {
      var fd = 0;

      fs.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      var buffer = new Buffer(5);

      var bytesRead = fs.readSync(fd, buffer, 0, 5, 5);

      expect(bytesRead).to.equal(5);
      expect(buffer.toString()).to.equal(', fri');
    });

    it('should read the file from current position', function () {
      var fd = 0;

      fs.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      fs.handles[fd].read = 5;

      var buffer = new Buffer(5);

      var bytesRead = fs.readSync(fd, buffer, 0, 5, null);

      expect(bytesRead).to.equal(5);
      expect(fs.handles[fd].read).to.equal(10);
      expect(buffer.toString()).to.equal(', fri');
    });

    it('should fill the buffer from offset', function () {
      var fd = 0;

      fs.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      var buffer = new Buffer('Hello, world!');

      var bytesRead = fs.readSync(fd, buffer, 7, 6, 7);

      expect(bytesRead).to.equal(6);
      expect(buffer.toString()).to.equal('Hello, friend');
    });

    it('should not read file beyond his length', function () {
      var fd = 0;

      fs.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      fs.handles[fd].read = 14;

      var buffer = new Buffer('Hello, world!');

      var bytesRead = fs.readSync(fd, buffer, 0, 10, null);

      expect(bytesRead).to.equal(0);
      expect(buffer.toString()).to.equal('Hello, world!');
    });

    it('should fail on non existing fd', function () {
      expect(function () {
        fs.readSync(0, new Buffer(5), 0, 5, 0);
      }).to.throw(Error, 'EBADF, bad file descriptor');
    });

    it('should fail on closed fd', function () {
      var fd = 0;

      fs.handles[fd] = new Descriptor({}, '/tmp/file', constants.O_RDWR);

      fs.handles[fd].close();

      expect(function () {
        fs.readSync(fd, new Buffer(5), 0, 5, 0);
      }).to.throw(Error, 'EBADF, bad file descriptor');
    });

    it('should fail on non reading fd', function () {
      var fd = 0;

      fs.handles[fd] = new Descriptor({}, '/tmp/file', constants.O_WRONLY);

      expect(function () {
        fs.readSync(fd, new Buffer(5), 0, 5, 0);
      }).to.throw(Error, 'EBADF, bad file descriptor');
    });

    it('should fail on directory', function () {
      var fd = 0;

      fs.handles[fd] = new Descriptor(getElement('/tmp'), '/tmp', constants.O_RDWR);

      expect(function () {
        fs.readSync(fd, new Buffer(5), 0, 5, 0);
      }).to.throw(Error, 'EISDIR, read');
    });

    it('should throw on bad fd type', function () {
      expect(function () {
        fs.readSync(true);
      }).to.throw(TypeError, 'Bad arguments');
    });

    it('should throw on offset out of bounds', function () {
      expect(function () {
        fs.readSync(0, new Buffer(10), 1000, 0, 0, noop);
      }).to.throw(Error, 'Offset is out of bounds');
    });

    it('should throw on length beyond buffer', function () {
      expect(function () {
        fs.readSync(0, new Buffer(10), 0, 1000, 0, noop);
      }).to.throw(Error, 'Length extends beyond buffer');
    });

  });

};
