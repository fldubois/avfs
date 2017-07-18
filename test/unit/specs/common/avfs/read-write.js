'use strict';

var chai   = require('chai');
var expect = chai.expect;

var elements = require('lib/common/elements');
var factory  = require('lib/common/avfs/read-write');

var AVFSError  = require('lib/common/avfs-error');
var Descriptor = require('lib/common/components/descriptor');
var Storage    = require('lib/common/storage');

var constants = {
  S_IFDIR: 16384, // 0040000 - directory

  O_RDWR:   4,
  O_APPEND: 64
};

var FD = 10;

describe('common/avfs/read-write', function () {

  var storage = new Storage();
  var handles = {next: 0};

  var base = factory(storage, constants, handles);

  beforeEach(function () {
    storage.files = elements.directory(parseInt('0755', 8), {
      dir:   elements.directory(parseInt('0755', 8)),
      empty: elements.file(parseInt('0666', 8), new Buffer(0)),
      file:  elements.file(parseInt('0666', 8), new Buffer('Hello, friend.'))
    });

    Object.keys(handles).forEach(function (fd) {
      if (fd !== 'next') {
        delete handles[fd];
      }
    });
  });

  describe('read()', function () {

    it('should read the file', function () {
      handles[FD] = new Descriptor(storage.get('/file'), '/file', constants.O_RDWR);

      var buffer = new Buffer(5);

      var bytesRead = base.read(FD, buffer, 0, 5, 0);

      expect(bytesRead).to.equal(5);
      expect(buffer.toString()).to.equal('Hello');
    });

    it('should read the file from position', function () {
      handles[FD] = new Descriptor(storage.get('/file'), '/file', constants.O_RDWR);

      var buffer = new Buffer(5);

      var bytesRead = base.read(FD, buffer, 0, 5, 5);

      expect(bytesRead).to.equal(5);
      expect(buffer.toString()).to.equal(', fri');
    });

    it('should read the file from current position', function () {
      handles[FD] = new Descriptor(storage.get('/file'), '/file', constants.O_RDWR);

      handles[FD].read = 5;

      var buffer = new Buffer(5);

      var bytesRead = base.read(FD, buffer, 0, 5, null);

      expect(bytesRead).to.equal(5);
      expect(handles[FD].read).to.equal(10);
      expect(buffer.toString()).to.equal(', fri');
    });

    it('should fill the buffer from offset', function () {
      handles[FD] = new Descriptor(storage.get('/file'), '/file', constants.O_RDWR);

      var buffer = new Buffer('Hello, world!');

      var bytesRead = base.read(FD, buffer, 7, 6, 7);

      expect(bytesRead).to.equal(6);
      expect(buffer.toString()).to.equal('Hello, friend');
    });

    it('should not read file beyond his length', function () {
      handles[FD] = new Descriptor(storage.get('/file'), '/file', constants.O_RDWR);

      handles[FD].read = 14;

      var buffer = new Buffer('Hello, world!');

      var bytesRead = base.read(FD, buffer, 0, 10, null);

      expect(bytesRead).to.equal(0);
      expect(buffer.toString()).to.equal('Hello, world!');
    });

    it('should throw EISDIR on directory', function () {
      handles[FD] = new Descriptor(storage.get('/dir'), '/dir', constants.O_RDWR);

      expect(function () {
        base.read(FD, new Buffer(5), 0, 10, null);
      }).to.throw(AVFSError, {code: 'EISDIR'});
    });

    it('should throw EBADF on non existing file descriptor', function () {
      expect(function () {
        base.read(FD, new Buffer(5), 0, 10, null);
      }).to.throw(AVFSError, {code: 'EBADF'});
    });

    it('should throw EBADF on non integer file descriptor', function () {
      expect(function () {
        base.read(false, new Buffer(5), 0, 10, null);
      }).to.throw(AVFSError, {code: 'EBADF'});
    });

  });

  describe('write()', function () {

    // write(fd, buffer, offset, length[, position]);

    it('should write the buffer in the file', function () {
      handles[FD] = new Descriptor(storage.get('/empty'), '/empty', constants.O_RDWR);

      var written = base.write(FD, new Buffer('Hello, friend'), 0, 5);

      expect(written).to.equal(5);

      expect(storage.files).to.contain.an.avfs.file('/empty').that.contain('Hello');
    });

    it('should write the buffer in the file from position', function () {
      handles[FD] = new Descriptor(storage.get('/empty'), '/empty', constants.O_RDWR);

      var written = base.write(FD, new Buffer('Hello, friend.'), 0, 5, 7);

      expect(written).to.equal(5);

      expect(storage.files).to.contain.an.avfs.file('/empty').that.contain('       Hello');
    });

    it('should always append the buffer to the end in append mode', function () {
      handles[FD] = new Descriptor(storage.get('/file'), '/file', constants.O_RDWR | constants.O_APPEND);

      expect(base.write(FD, new Buffer(' Hello,'),  0, 7, 2)).to.equal(7);
      expect(base.write(FD, new Buffer(' world !'), 0, 8, 2)).to.equal(8);

      expect(storage.files).to.contain.an.avfs.file('/file').that.contain('Hello, friend. Hello, world !');
    });

    it('should write the buffer from current position', function () {
      handles[FD] = new Descriptor(storage.get('/file'), '/file', constants.O_RDWR);

      handles[FD].write = 7;

      var written = base.write(FD, new Buffer('Hello, world !'), 0, 7, null);

      expect(written).to.equal(7);

      expect(storage.files).to.contain.an.avfs.file('/file').that.contain('Hello, Hello, ');

      expect(handles[FD].write).to.equal(14);
    });

    it('should read the buffer from offset', function () {
      handles[FD] = new Descriptor(storage.get('/empty'), '/empty', constants.O_RDWR);

      var written = base.write(FD, new Buffer('Hello, friend'), 7, 6, null);

      expect(written).to.equal(6);

      expect(storage.files).to.contain.an.avfs.file('/empty').that.contain('friend');
    });

    it('should fill unwritten parts before buffer with white spaces', function () {
      handles[FD] = new Descriptor(storage.get('/file'), '/file', constants.O_RDWR);

      var written = base.write(FD, new Buffer('OK'), 0, 2, 20);

      expect(written).to.equal(2);

      expect(storage.files).to.contain.an.avfs.file('/file').that.contain('Hello, friend.      OK');
    });

    it('should do nothing with a falsy length', function () {
      handles[FD] = new Descriptor(storage.get('/file'), '/file', constants.O_RDWR | constants.O_APPEND);

      expect(base.write(FD, new Buffer(' Hello,'),  0, 0,     2)).to.equal(0);
      expect(base.write(FD, new Buffer(' world !'), 0, false, 2)).to.equal(0);

      expect(storage.files).to.contain.an.avfs.file('/file').that.contain('Hello, friend.');
    });

    // write(fd, data[, position[, encoding]]);

    it('should write the string in the file', function () {
      handles[FD] = new Descriptor(storage.get('/empty'), '/empty', constants.O_RDWR);

      expect(base.write(FD, 'Hello')).to.equal(5);

      expect(storage.files).to.contain.an.avfs.file('/empty').that.contain('Hello');
    });

    it('should write the string in the file from position', function () {
      handles[FD] = new Descriptor(storage.get('/empty'), '/empty', constants.O_RDWR);

      expect(base.write(FD, 'Hello', 7)).to.equal(5);

      expect(storage.files).to.contain.an.avfs.file('/empty').that.contain('       Hello');
    });

    it('should write the string with the correct encoding', function () {
      handles[FD] = new Descriptor(storage.get('/empty'), '/empty', constants.O_RDWR);

      expect(base.write(FD, 'aàâä', 0, 'ascii')).to.equal(4);

      var content = new Buffer('aàâä', 'ascii').toString();

      expect(storage.files).to.contain.an.avfs.file('/empty').that.contain(content);
    });

    it('should write the string and ignore bad encoding', function () {
      handles[FD] = new Descriptor(storage.get('/empty'), '/empty', constants.O_RDWR);

      expect(base.write(FD, 'aàâä', 0, 'nope')).to.equal(7);

      var content = new Buffer('aàâä', 'utf8').toString();

      expect(storage.files).to.contain.an.avfs.file('/empty').that.contain(content);
    });

    it('should always append the string to the end in append mode', function () {
      var flags = constants.O_RDWR | constants.O_APPEND;

      handles[FD] = new Descriptor(storage.get('/file'), '/file', flags);

      expect(base.write(FD, ' Hello,',  0)).to.equal(7);
      expect(base.write(FD, ' world !', 0)).to.equal(8);

      expect(storage.files).to.contain.an.avfs.file('/file').that.contain('Hello, friend. Hello, world !');
    });

    it('should write the string from current position', function () {
      handles[FD] = new Descriptor(storage.get('/file'), '/file', constants.O_RDWR);

      handles[FD].write = 7;

      expect(base.write(FD, 'world !')).to.equal(7);

      expect(storage.files).to.contain.an.avfs.file('/file').that.contain('Hello, world !');

      expect(handles[FD].write).to.equal(14);
    });

    it('should fill unwritten parts before string with white spaces', function () {
      handles[FD] = new Descriptor(storage.get('/file'), '/file', constants.O_RDWR);

      expect(base.write(FD, 'OK', 20)).to.equal(2);

      expect(storage.files).to.contain.an.avfs.file('/file').that.contain('Hello, friend.      OK');
    });

    // errors

    it('should throw EBADF on non existing file descriptor', function () {
      expect(function () {
        base.write(FD, new Buffer('Hello, friend'), 0, 5, 0);
      }).to.throw(AVFSError, {code: 'EBADF'});
    });

    it('should throw EBADF on non integer file descriptor', function () {
      expect(function () {
        base.write(true, new Buffer('Hello, friend'), 0, 5, 0);
      }).to.throw(AVFSError, {code: 'EBADF'});
    });

  });

});
