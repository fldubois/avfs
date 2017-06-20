'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('lib/common/constants');

var Descriptor = require('lib/common/components/descriptor');

module.exports = function (fs, getElement, version) {

  describe('writeSync()', function () {

    it('should write the buffer in the file', function () {
      var fd = 0;

      fs.base.handles[fd] = new Descriptor(getElement('/tmp/empty'), '/tmp/empty', constants.O_RDWR);

      var written = fs.writeSync(fd, new Buffer('Hello, friend'), 0, 5, 0);

      expect(written).to.equal(5);

      expect(fs.storage.files).to.contain.an.avfs.file('/tmp/empty').that.contain('Hello');
    });

    it('should write the buffer in the file from position', function () {
      var fd = 0;

      fs.base.handles[fd] = new Descriptor(getElement('/tmp/empty'), '/tmp/empty', constants.O_RDWR);

      var written = fs.writeSync(fd, new Buffer('Hello, friend.'), 0, 5, 7);

      expect(written).to.equal(5);

      expect(fs.storage.files).to.contain.an.avfs.file('/tmp/empty').that.contain('       Hello');
    });

    it('should always append the buffer to the end in append mode', function () {
      var fd = 0;

      fs.base.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR | constants.O_APPEND);

      expect(fs.writeSync(fd, new Buffer(' Hello,'),  0, 7, 2)).to.equal(7);
      expect(fs.writeSync(fd, new Buffer(' world !'), 0, 8, 2)).to.equal(8);

      expect(fs.storage.files).to.contain.an.avfs.file('/tmp/file').that.contain('Hello, friend. Hello, world !');
    });

    it('should write the buffer from current position', function () {
      var fd = 0;

      fs.base.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      fs.base.handles[fd].write = 7;

      var written = fs.writeSync(fd, new Buffer('Hello, world !'), 0, 7, null);

      expect(written).to.equal(7);

      expect(fs.storage.files).to.contain.an.avfs.file('/tmp/file').that.contain('Hello, Hello, ');

      expect(fs.base.handles[fd].write).to.equal(14);
    });

    it('should read the buffer from offset', function () {
      var fd = 0;

      fs.base.handles[fd] = new Descriptor(getElement('/tmp/empty'), '/tmp/empty', constants.O_RDWR);

      var written = fs.writeSync(fd, new Buffer('Hello, friend'), 7, 6, null);

      expect(written).to.equal(6);

      expect(fs.storage.files).to.contain.an.avfs.file('/tmp/empty').that.contain('friend');
    });

    it('should fill unwritten parts before buffer with white spaces', function () {
      var fd = 0;

      fs.base.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      var written = fs.writeSync(fd, new Buffer('OK'), 0, 2, 20);

      expect(written).to.equal(2);

      expect(fs.storage.files).to.contain.an.avfs.file('/tmp/file').that.contain('Hello, friend.      OK');
    });

    it('should throw on non existing file descriptor', function () {
      expect(function () {
        fs.writeSync(0, new Buffer('Hello, friend'), 0, 5, 0);
      }).to.throw(Error, {code: 'EBADF'});
    });

    it('should throw on non integer file descriptor', function () {
      expect(function () {
        fs.writeSync(true, new Buffer('Hello, friend'), 0, 5, 0);
      }).to.throw(TypeError);
    });

    if (['v0.12', 'v4', 'v5'].indexOf(version) !== -1) {

      // fs.writeSync(fd, data[, position[, encoding]]);

      it('should write the string in the file', function () {
        var fd = 0;

        fs.base.handles[fd] = new Descriptor(getElement('/tmp/empty'), '/tmp/empty', constants.O_RDWR);

        expect(fs.writeSync(fd, 'Hello')).to.equal(5);

        expect(fs.storage.files).to.contain.an.avfs.file('/tmp/empty').that.contain('Hello');
      });

      it('should write the string in the file from position', function () {
        var fd = 0;

        fs.base.handles[fd] = new Descriptor(getElement('/tmp/empty'), '/tmp/empty', constants.O_RDWR);

        expect(fs.writeSync(fd, 'Hello', 7)).to.equal(5);

        expect(fs.storage.files).to.contain.an.avfs.file('/tmp/empty').that.contain('       Hello');
      });

      it('should write the string with the correct encoding', function () {
        var fd = 0;

        fs.base.handles[fd] = new Descriptor(getElement('/tmp/empty'), '/tmp/empty', constants.O_RDWR);

        expect(fs.writeSync(fd, 'aàâä', 0, 'ascii')).to.equal(4);

        var content = new Buffer('aàâä', 'ascii').toString();

        expect(fs.storage.files).to.contain.an.avfs.file('/tmp/empty').that.contain(content);
      });

      it('should always append the string to the end in append mode', function () {
        var fd    = 0;
        var flags = constants.O_RDWR | constants.O_APPEND;

        fs.base.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', flags);

        expect(fs.writeSync(fd, ' Hello,',  0)).to.equal(7);
        expect(fs.writeSync(fd, ' world !', 0)).to.equal(8);

        expect(fs.storage.files).to.contain.an.avfs.file('/tmp/file').that.contain('Hello, friend. Hello, world !');
      });

      it('should write the string from current position', function () {
        var fd = 0;

        fs.base.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

        fs.base.handles[fd].write = 7;

        expect(fs.writeSync(fd, 'world !')).to.equal(7);

        expect(fs.storage.files).to.contain.an.avfs.file('/tmp/file').that.contain('Hello, world !');

        expect(fs.base.handles[fd].write).to.equal(14);
      });

      it('should fill unwritten parts before string with white spaces', function () {
        var fd = 0;

        fs.base.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

        expect(fs.writeSync(fd, 'OK', 20)).to.equal(2);

        expect(fs.storage.files).to.contain.an.avfs.file('/tmp/file').that.contain('Hello, friend.      OK');
      });

      it('should throw on non existing file descriptor', function () {
        expect(function () {
          fs.writeSync(0, 'Hello, friend');
        }).to.throw(Error, {code: 'EBADF'});
      });

      it('should throw on non integer file descriptor', function () {
        expect(function () {
          fs.writeSync(true);
        }).to.throw(TypeError);
      });

    }

  });

};
