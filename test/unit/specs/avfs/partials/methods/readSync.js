'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('lib/common/constants');

var Descriptor = require('lib/common/components/descriptor');

module.exports = function (fs, getElement) {

  describe('readSync()', function () {

    it('should read the file', function () {
      var fd = 0;

      fs.base.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      var buffer = new Buffer(5);

      var bytesRead = fs.readSync(fd, buffer, 0, 5, 0);

      expect(bytesRead).to.equal(5);
      expect(buffer.toString()).to.equal('Hello');
    });

    it('should read the file from position', function () {
      var fd = 0;

      fs.base.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      var buffer = new Buffer(5);

      var bytesRead = fs.readSync(fd, buffer, 0, 5, 5);

      expect(bytesRead).to.equal(5);
      expect(buffer.toString()).to.equal(', fri');
    });

    it('should read the file from current position', function () {
      var fd = 0;

      fs.base.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      fs.base.handles[fd].read = 5;

      var buffer = new Buffer(5);

      var bytesRead = fs.readSync(fd, buffer, 0, 5, null);

      expect(bytesRead).to.equal(5);
      expect(fs.base.handles[fd].read).to.equal(10);
      expect(buffer.toString()).to.equal(', fri');
    });

    it('should fill the buffer from offset', function () {
      var fd = 0;

      fs.base.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      var buffer = new Buffer('Hello, world!');

      var bytesRead = fs.readSync(fd, buffer, 7, 6, 7);

      expect(bytesRead).to.equal(6);
      expect(buffer.toString()).to.equal('Hello, friend');
    });

    it('should not read file beyond his length', function () {
      var fd = 0;

      fs.base.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      fs.base.handles[fd].read = 14;

      var buffer = new Buffer('Hello, world!');

      var bytesRead = fs.readSync(fd, buffer, 0, 10, null);

      expect(bytesRead).to.equal(0);
      expect(buffer.toString()).to.equal('Hello, world!');
    });

  });

};
