'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('test/unit/fixtures/constants');

var elements = require('lib/common/elements')(constants);
var factory  = require('lib/base/descriptors');

var AVFSError  = require('lib/common/avfs-error');
var Descriptor = require('lib/common/components/descriptor')(constants);
var Storage    = require('lib/common/storage');

var BAD_FD = 1000000000;

describe('base/descriptors', function () {

  var storage = new Storage(constants);
  var handles = {next: 0};

  var base = factory(storage, constants, handles);

  beforeEach(function () {
    storage.files = elements.directory(parseInt('0755', 8), {
      file: elements.file(parseInt('0777', 8), new Buffer('Hello, friend.')),
      perm: elements.file(parseInt('0000', 8), new Buffer('Hello, friend.')),
      link: elements.symlink(parseInt('0777', 8), '/file')
    });

    Object.keys(handles).forEach(function (fd) {
      if (fd !== 'next') {
        delete handles[fd];
      }
    });
  });

  describe('open()', function () {

    it('should return a file descriptor', function () {
      var fd = base.open('/file', constants.O_WRONLY | constants.O_APPEND);

      expect(fd).to.be.a('number');
      expect(fd).to.equal(handles.next - 1);

      var key = fd.toString();

      expect(handles).to.contain.keys(key);
      expect(handles[key].path).to.equal('/file');
    });

    it('should open directory in read mode', function () {
      var fd = base.open('/', constants.O_RDONLY);

      expect(fd).to.be.a('number');
      expect(fd).to.equal(handles.next - 1);

      var key = fd.toString();

      expect(handles).to.contain.keys(key);
      expect(handles[key].path).to.equal('/');
    });

    it('should create non existing file in create mode', function () {
      var fd = base.open('/new', constants.O_RDWR | constants.O_CREAT);

      expect(fd).to.be.a('number');
      expect(fd).to.equal(handles.next - 1);

      expect(storage.files).to.contain.an.avfs.file('/new').that.is.clear();
    });

    it('should set mode on new file', function () {
      var fd = base.open('/new', constants.O_RDWR | constants.O_CREAT, '0500');

      expect(fd).to.be.a('number');
      expect(fd).to.equal(handles.next - 1);

      expect(storage.files).to.contain.an.avfs.file('/new').with.mode('0500').that.is.clear();
    });

    it('should set mode to 0666 by default', function () {
      var fd = base.open('/new', constants.O_RDWR | constants.O_CREAT);

      expect(fd).to.be.a('number');
      expect(fd).to.equal(handles.next - 1);

      expect(storage.files).to.contain.an.avfs.file('/new').with.mode('0666').that.is.clear();
    });

    it('should not create new file in truncate mode', function () {
      var inode = storage.get('/file').get('inode');

      var fd = base.open('/file', constants.O_RDWR | constants.O_TRUNC);

      expect(fd).to.be.a('number');
      expect(fd).to.equal(handles.next - 1);

      expect(storage.get('/file').get('inode')).to.equal(inode);
    });

    it('should not change mode of existing file in truncate mode', function () {
      var mode = storage.get('/file').get('mode');

      var fd = base.open('/file', constants.O_RDWR | constants.O_TRUNC, '0700');

      expect(fd).to.be.a('number');
      expect(fd).to.equal(handles.next - 1);

      expect(storage.get('/file').get('mode')).to.equal(mode);
    });

    it('should erase existing file in truncate mode', function () {
      var fd = base.open('/file', constants.O_RDWR | constants.O_TRUNC);

      expect(fd).to.be.a('number');
      expect(fd).to.equal(handles.next - 1);

      expect(storage.files).to.contain.an.avfs.file('/file').that.is.clear();
    });

    it('should not erase existing file in append mode', function () {
      ['a',  'a+'].forEach(function (flags) {
        var fd = base.open('/file', flags);

        expect(fd).to.be.a('number');
        expect(fd).to.equal(handles.next - 1);

        expect(storage.files).to.contain.an.avfs.file('/file').that.contain('Hello, friend.');
      });
    });

    it('should throw path:type error on bad path type', function () {
      [void 0, null, 0, false, {}, []].forEach(function (path) {
        expect(base.open.bind(null, path, 'r')).to.throw(AVFSError).with.property('code', 'path:type');
      });
    });

    it('should throw flags:type on bad flags type', function () {
      expect(function () {
        base.open('/file', false);
      }).to.throw(AVFSError).with.property('code', 'flags:type');
    });

    it('should throw ENOENT on non existing file in read mode', function () {
      expect(function () {
        base.open('/not', constants.O_RDONLY);
      }).to.throw(AVFSError).with.property('code', 'ENOENT');
    });

    it('should throw EEXIST on existing file in exclusive mode', function () {
      expect(function () {
        base.open('/file', constants.O_RDWR | constants.O_EXCL);
      }).to.throw(AVFSError).with.property('code', 'EEXIST');
    });

    it('should throw EISDIR on directory in write mode', function () {
      [constants.O_RDWR, constants.O_WRONLY].forEach(function (flags) {
        expect(function () {
          base.open('/', flags);
        }).to.throw(AVFSError).with.property('code', 'EISDIR');
      });
    });

    it('should throw EACCES on permission denied', function () {
      expect(function () {
        base.open('/perm', constants.O_RDONLY);
      }).to.throw(AVFSError).with.property('code', 'EACCES');
    });

  });

  describe('fchmod()', function () {

    it('should change the mode', function () {
      var fd = 10;

      handles[fd] = new Descriptor(storage.get('/file'), '/file', constants.O_RDWR);

      var result = base.fchmod(fd, '0700');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').with.mode('0700');
    });

    it('should throw fd:type on non integer file descriptor', function () {
      expect(function () {
        base.fchmod(false, '0700');
      }).to.throw(AVFSError).with.property('code', 'fd:type');
    });

    it('should throw mode:type error on bad mode type', function () {
      var fd = 10;

      handles[fd] = new Descriptor(storage.get('/file'), '/file', constants.O_RDWR);

      [void 0, null, false, {}, []].forEach(function (mode) {
        expect(base.fchmod.bind(null, fd, mode)).to.throw(AVFSError).with.property('code', 'mode:type');
      });
    });

    it('should throw EBADF on non existing file descriptor', function () {
      expect(function () {
        base.fchmod(BAD_FD, '0700');
      }).to.throw(AVFSError).with.property('code', 'EBADF');
    });

  });

  describe('fchown()', function () {

    var gid  = process.getgroups()[0];
    var uid  = process.getuid();

    it('should change the owner and group', function () {
      var fd   = 10;
      var file = storage.get('/file');

      file.set('gid', 3000);

      handles[fd] = new Descriptor(file, '/file', constants.O_RDWR);

      var result = base.fchown(fd, uid, gid);

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').with.owner(uid, gid);
    });

    it('should throw fd:type on non integer file descriptor', function () {
      expect(function () {
        base.fchown(false, '0700');
      }).to.throw(AVFSError).with.property('code', 'fd:type');
    });

    it('should throw uid:type error on bad uid type', function () {
      var fd = 10;

      handles[fd] = new Descriptor(storage.get('/file'), '/file', constants.O_RDWR);

      [void 0, null, -1, false, 'test', {}, []].forEach(function (value) {
        expect(base.fchown.bind(null, fd, value, gid)).to.throw(AVFSError).with.property('code', 'uid:type');
      });
    });

    it('should throw gid:type error on bad gid type', function () {
      var fd = 10;

      handles[fd] = new Descriptor(storage.get('/file'), '/file', constants.O_RDWR);

      [void 0, null, -1, false, 'test', {}, []].forEach(function (value) {
        expect(base.fchown.bind(null, fd, uid, value)).to.throw(AVFSError).with.property('code', 'gid:type');
      });
    });

    it('should throw EBADF on non existing file descriptor', function () {
      expect(function () {
        base.fchown(BAD_FD, 0, 0);
      }).to.throw(AVFSError).with.property('code', 'EBADF');
    });

  });

  describe('fdatasync()', function () {

    it('should return undefined', function () {
      var fd = 10;

      handles[fd] = new Descriptor(storage.get('/file'), '/file', constants.O_RDWR);

      expect(base.fdatasync(fd)).to.be.an('undefined');
    });

    it('should throw fd:type on non integer file descriptor', function () {
      expect(function () {
        base.fdatasync(false);
      }).to.throw(AVFSError).with.property('code', 'fd:type');
    });

    it('should throw EBADF on non existing file descriptor', function () {
      expect(function () {
        base.fdatasync(BAD_FD);
      }).to.throw(AVFSError).with.property('code', 'EBADF');
    });

  });

  describe('fstat()', function () {

    it('should return file stats', function () {
      var fd   = 10;
      var file = storage.get('/file');

      handles[fd] = new Descriptor(file, '/file', constants.O_RDWR);

      var stats = base.fstat(fd);

      expect(stats).to.be.an('object');

      expect(stats.dev).to.equal(1);
      expect(stats.ino).to.equal(file.get('inode'));
      expect(stats.mode).to.equal(file.get('mode') + file.get('type'));
      expect(stats.nlink).to.equal(file.get('nlink'));
      expect(stats.uid).to.equal(file.get('uid'));
      expect(stats.gid).to.equal(file.get('gid'));
      expect(stats.rdev).to.equal(0);
      expect(stats.size).to.equal(0);
      expect(stats.blksize).to.equal(512);
      expect(stats.blocks).to.equal(0);
      expect(stats.atime).to.equal(file.get('atime'));
      expect(stats.mtime).to.equal(file.get('mtime'));
      expect(stats.ctime).to.equal(file.get('ctime'));
    });

    it('should throw fd:type on non integer file descriptor', function () {
      expect(function () {
        base.fstat(false);
      }).to.throw(AVFSError).with.property('code', 'fd:type');
    });

    it('should throw EBADF on non existing file descriptor', function () {
      expect(function () {
        base.fstat(BAD_FD);
      }).to.throw(AVFSError).with.property('code', 'EBADF');
    });

  });

  describe('fsync()', function () {

    it('should return undefined', function () {
      var fd = 10;

      handles[fd] = new Descriptor(storage.get('/file'), '/file', constants.O_RDWR);

      expect(base.fsync(fd)).to.be.an('undefined');
    });

    it('should throw fd:type on non integer file descriptor', function () {
      expect(function () {
        base.fsync(false);
      }).to.throw(AVFSError).with.property('code', 'fd:type');
    });

    it('should throw EBADF on non existing file descriptor', function () {
      expect(function () {
        base.fsync(BAD_FD);
      }).to.throw(AVFSError).with.property('code', 'EBADF');
    });

  });

  describe('ftruncate()', function () {

    it('should truncate file', function () {
      var fd = 10;

      handles[fd] = new Descriptor(storage.get('/file'), '/file', constants.O_RDWR);

      var result = base.ftruncate(fd);

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').that.is.clear();
    });

    it('should truncate file to the specified length', function () {
      var content = new Buffer('Hello, friend.');
      var fd = 10;

      handles[fd] = new Descriptor(storage.get('/file'), '/file', constants.O_RDWR);

      var result = base.ftruncate(fd, 3);

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').that.contain(content.slice(0, 3).toString());
    });

    it('should throw fd:type on non integer file descriptor', function () {
      expect(function () {
        base.ftruncate(false);
      }).to.throw(AVFSError).with.property('code', 'fd:type');
    });

    it('should throw length:type on bad length type', function () {
      [null, false, 'test', {}, []].forEach(function (length) {
        expect(base.ftruncate.bind(null, 0, length)).to.throw(AVFSError).with.property('code', 'length:type');
      });
    });

    it('should throw EBADF on non existing file descriptor', function () {
      expect(function () {
        base.ftruncate(BAD_FD);
      }).to.throw(AVFSError).with.property('code', 'EBADF');
    });

  });

  describe('futimes()', function () {

    it('should change timestamps', function () {
      var date = new Date('2012-12-21T00:00:00.000Z');
      var fd   = 10;
      var file = storage.get('/file');

      handles[fd] = new Descriptor(file, '/file', constants.O_RDWR);

      var result = base.futimes(fd, date, date);

      expect(result).to.be.an('undefined');
      expect(file.get('atime').getTime()).to.equal(date.getTime());
      expect(file.get('mtime').getTime()).to.equal(date.getTime());
    });

    it('should accept time as unix timestamp', function () {
      var date      = new Date('2012-12-21T00:00:00.000Z');
      var fd        = 10;
      var file      = storage.get('/file');
      var timestamp = date.getTime() / 1000;

      handles[fd] = new Descriptor(file, '/file', constants.O_RDWR);

      var result = base.futimes(fd, timestamp, timestamp);

      expect(result).to.be.an('undefined');
      expect(file.get('atime').getTime()).to.equal(date.getTime());
      expect(file.get('mtime').getTime()).to.equal(date.getTime());
    });

    it('should follow symlinks', function () {
      var date = new Date('2012-12-21T00:00:00.000Z');
      var fd   = 10;
      var file = storage.get('/file');
      var link = storage.get('/link', false);

      handles[fd] = new Descriptor(link, '/link', constants.O_RDWR);

      var result = base.futimes(fd, date, date);

      expect(result).to.be.an('undefined');

      expect(link.get('atime').getTime()).to.not.equal(date.getTime());
      expect(link.get('mtime').getTime()).to.not.equal(date.getTime());

      expect(file.get('atime').getTime()).to.equal(date.getTime());
      expect(file.get('mtime').getTime()).to.equal(date.getTime());
    });

    it('should throw fd:type on non integer file descriptor', function () {
      expect(function () {
        base.futimes(false, 0, 0);
      }).to.throw(AVFSError).with.property('code', 'fd:type');
    });

    it('should throw atime:type on bad atime type', function () {
      [void 0, null, false, 'test', {}, []].forEach(function (atime) {
        expect(base.futimes.bind(null, 0, atime, 0)).to.throw(AVFSError).with.property('code', 'atime:type');
      });
    });

    it('should throw mtime:type on bad mtime type', function () {
      [void 0, null, false, 'test', {}, []].forEach(function (mtime) {
        expect(base.futimes.bind(null, 0, 0, mtime)).to.throw(AVFSError).with.property('code', 'mtime:type');
      });
    });

    it('should throw EBADF on non existing file descriptor', function () {
      expect(function () {
        base.futimes(BAD_FD, 0, 0);
      }).to.throw(AVFSError).with.property('code', 'EBADF');
    });

  });

  describe('close()', function () {

    it('should close the file handle', function () {
      var fd = 0;

      handles[fd] = new Descriptor(storage.get('/file'), '/file', constants.O_RDWR);

      expect(handles[fd].closed).to.equal(false);

      var result = base.close(fd);

      expect(result).to.be.an('undefined');
      expect(handles[fd].closed).to.equal(true);
    });

    it('should throw fd:type on non integer file descriptor', function () {
      expect(function () {
        base.close(false);
      }).to.throw(AVFSError).with.property('code', 'fd:type');
    });

    it('should throw EBADF on non existing file descriptor', function () {
      expect(function () {
        base.close(BAD_FD);
      }).to.throw(AVFSError).with.property('code', 'EBADF');
    });

  });


});
