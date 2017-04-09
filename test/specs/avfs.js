'use strict';

var chai   = require('chai');
var expect = chai.expect;
var sinon  = require('sinon');

var constants = require('lib/common/constants');
var elements  = require('lib/common/elements');
var errors    = require('lib/common/errors');
var storage   = require('lib/common/storage');

var AVFS        = require('lib/avfs');
var Descriptor  = require('lib/common/descriptor');
var Stats       = require('lib/common/stats');

var ReadStream  = require('lib/common/read-stream');
var WriteStream = require('lib/common/write-stream');

chai.use(require('sinon-chai'));

var fs = new AVFS();

var noop = function () {
  return null;
};

var getElement = function (path) {
  var current = fs.files;

  storage.parse(path).forEach(function (element) {
    current = current.get('content')[element];
  });

  return current;
};

describe('avfs', function () {

  beforeEach('reset virtual file system', function () {
    var otherFile = elements.file(parseInt('0666', 8), new Buffer('Hello, friend.'));

    otherFile.set('uid', process.getuid() + 1);

    fs.files = elements.directory(parseInt('0755', 8), {
      tmp: elements.directory(parseInt('0777', 8), {
        ascii: elements.file(parseInt('0666', 8), new Buffer('Hello, friend.')),
        empty: elements.file(parseInt('0666', 8), new Buffer(0)),
        file:  elements.file(parseInt('0666', 8), new Buffer('Hello, friend.'))
      }),
      dir: elements.directory(parseInt('0777', 8), {
        link:  elements.symlink(parseInt('0777', 8), '/tmp/file'),
        dlink: elements.symlink(parseInt('0777', 8), '/dir'),
        perm:  elements.file(parseInt('0111', 8), new Buffer('Hello, friend.')),
        other: otherFile
      }),
      perm: elements.directory(parseInt('0111', 8), {
        file: elements.file(parseInt('0666', 8), new Buffer('Hello, friend.')),
        dir:  elements.directory(parseInt('0777', 8))
      })
    });

    fs.handles = {};
    fs.next    = 0;
  });

  it('should expose Stats', function () {
    expect(fs.Stats).to.equal(Stats);
  });

  it('should expose ReadStream', function (callback) {
    var stream  = new fs.ReadStream('/tmp/file');
    var content = '';

    expect(stream).to.be.an.instanceof(ReadStream);

    stream.on('readable', function () {
      var chunk = null;

      while ((chunk = stream.read()) !== null) {
        expect(chunk).to.be.an.instanceof(Buffer);

        content += chunk.toString();
      }
    });

    stream.on('error', callback);

    stream.on('end', function () {
      expect(content).to.equal('Hello, friend.');

      return callback();
    });
  });

  it('should expose WriteStream', function (callback) {
    var stream = new fs.WriteStream('/tmp/file');

    expect(stream).to.be.an.instanceof(WriteStream);

    stream.on('error', callback);

    stream.on('finish', function () {
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').that.contain('Hello, world !');

      return callback();
    });

    stream.write('Hello, ');
    stream.end('world !');
  });

  describe('appendFileSync()', function () {

    it('should append buffer to file', function () {
      var result = fs.appendFileSync('/tmp/file', new Buffer(' Hello, world !'));

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').that.contain('Hello, friend. Hello, world !');
    });

    it('should append string to file', function () {
      var result = fs.appendFileSync('/tmp/file', ' Hello, world !');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').that.contain('Hello, friend. Hello, world !');
    });

    it('should append encoded string to file', function () {
      var result = fs.appendFileSync('/tmp/empty', 'aàâäeéèâë', {encoding: 'ascii'});

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/empty').that.contain(new Buffer('aàâäeéèâë', 'ascii').toString());
    });

    it('should accept encoding option', function () {
      var result = fs.appendFileSync('/tmp/empty', 'aàâäeéèâë', 'ascii');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/empty').that.contain(new Buffer('aàâäeéèâë', 'ascii').toString());
    });

    it('should accept mode option', function () {
      var result = fs.appendFileSync('/file', 'OK', {mode: '0700'});

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/file').with.mode('0700');
    });

    it('should accept flag option', function () {
      expect(function () {
        fs.appendFileSync('/tmp/file', 'OK', {flag: 'r'});
      }).to.throw(Error, 'EBADF, bad file descriptor');
    });

    it('should create non existing file', function () {
      var result = fs.appendFileSync('/tmp/new', 'Hello, friend.');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/new').that.contain('Hello, friend.');
    });

    it('should throw on non existing parent directory', function () {
      expect(function () {
        fs.appendFileSync('/not/file', 'Hello, friend.');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/file\'');
    });

    it('should throw on not directory parent', function () {
      expect(function () {
        fs.appendFileSync('/tmp/file/new', 'Hello, friend.');
      }).to.throw(Error, 'ENOTDIR, not a directory \'/tmp/file/new\'');
    });

    it('should throw on directory path', function () {
      expect(function () {
        fs.appendFileSync('/tmp', 'Hello, friend.');
      }).to.throw(Error, 'EISDIR, illegal operation on a directory \'/tmp\'');
    });

    it('should throw on unknown encoding', function () {
      expect(function () {
        fs.appendFileSync('/tmp/file', 'Hello, friend.', 'utf5');
      }).to.throw(Error, 'Unknown encoding: utf5');
    });

    it('should throw on non string path', function () {
      expect(function () {
        fs.appendFileSync(true);
      }).to.throw(TypeError, 'path must be a string');
    });

    it('should throw on bad options type', function () {
      expect(function () {
        fs.appendFileSync('/tmp/file', 'Hello, friend.', true);
      }).to.throw(TypeError, 'Bad arguments');
    });

  });

  describe('chmodSync()', function () {

    it('should change the mode', function () {
      var result = fs.chmodSync('/tmp/file', '0700');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').with.mode('0700');
    });

    it('should follow symlinks', function () {
      var result = fs.chmodSync('/dir/link', '0700');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').with.mode('0700');
      expect(fs.files).to.contain.an.avfs.symlink('/dir/link').with.mode('0777');
    });

    it('should throw on bad path parameter type', function () {
      expect(function () {
        fs.chmodSync(false, '0700');
      }).to.throw(Error, 'Bad argument');
    });

    it('should throw on bad mode parameter type', function () {
      expect(function () {
        fs.chmodSync('/file', false);
      }).to.throw(Error, 'Bad argument');
    });

    it('should throw on non existing file', function () {
      expect(function () {
        fs.chmodSync('/file', '0700');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/file\'');
    });

    it('should throw on non existing parent directory', function () {
      expect(function () {
        fs.chmodSync('/not/file', '0700');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/file\'');
    });

    it('should throw on not directory parent', function () {
      expect(function () {
        fs.chmodSync('/tmp/file/new', '0700');
      }).to.throw(Error, 'ENOTDIR, not a directory \'/tmp/file/new\'');
    });

    it('should throw on not owned files', function () {
      expect(function () {
        fs.chmodSync('/dir/other', '0700');
      }).to.throw(Error, 'EPERM, operation not permitted \'/dir/other\'');
    });

  });

  describe('chownSync()', function () {

    it('should change the owner and group', function () {
      var result = fs.chownSync('/tmp/file', process.getuid(), process.getgroups()[0]);

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').with.owner(process.getuid(), process.getgroups()[0]);
    });

    it('should follow symlinks', function () {
      var result = fs.chownSync('/dir/link', process.getuid(), process.getgroups()[0]);

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.symlink('/dir/link').with.owner(process.getuid(), process.getgid());
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').with.owner(process.getuid(), process.getgroups()[0]);
    });

    it('should throw on bad path parameter type', function () {
      expect(function () {
        fs.chownSync(false, 1001, 1001);
      }).to.throw(TypeError, 'path must be a string');
    });

    it('should throw on bad uid parameter type', function () {
      expect(function () {
        fs.chownSync('/tmp/file', false, 1001);
      }).to.throw(TypeError, 'uid must be an unsigned int');
    });

    it('should throw on bad gid parameter type', function () {
      expect(function () {
        fs.chownSync('/tmp/file', 1001, false);
      }).to.throw(TypeError, 'gid must be an unsigned int');
    });

    it('should throw on non existing file', function () {
      expect(function () {
        fs.chownSync('/file', 1001, 1001);
      }).to.throw(Error, 'ENOENT, no such file or directory \'/file\'');
    });

    it('should throw on non existing parent directory', function () {
      expect(function () {
        fs.chownSync('/not/file', 1001, 1001);
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/file\'');
    });

    it('should throw on not directory parent', function () {
      expect(function () {
        fs.chownSync('/tmp/file/new', 1001, 1001);
      }).to.throw(Error, 'ENOTDIR, not a directory \'/tmp/file/new\'');
    });

    it('should throw on permission denied', function () {
      expect(function () {
        fs.chownSync('/dir/other', 0, 0);
      }).to.throw(Error, 'EPERM, operation not permitted \'/dir/other\'');

      expect(function () {
        fs.chownSync('/tmp/file', process.getuid(), 0);
      }).to.throw(Error, 'EPERM, operation not permitted \'/tmp/file\'');
    });

  });

  describe('closeSync()', function () {

    it('should close the file handle', function () {
      var fd = 0;

      fs.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      expect(fs.handles[fd].closed).to.equal(false);

      var result = fs.closeSync(fd);

      expect(result).to.be.an('undefined');
      expect(fs.handles[fd].closed).to.equal(true);
    });

    it('should throw on non existing file descriptor', function () {
      expect(function () {
        fs.closeSync(0);
      }).to.throw(Error, 'EBADF, bad file descriptor');
    });

    it('should throw on non integer file descriptor', function () {
      expect(function () {
        fs.closeSync('Hello');
      }).to.throw(Error, 'Bad argument');
    });

  });

  describe('createReadStream()', function () {

    it('should create a ReadStream instance', function (callback) {
      var stream  = fs.createReadStream('/tmp/file');
      var content = '';

      expect(stream).to.be.an.instanceof(ReadStream);

      stream.on('readable', function () {
        var chunk = null;

        while ((chunk = stream.read()) !== null) {
          expect(chunk).to.be.an.instanceof(Buffer);

          content += chunk.toString();
        }
      });

      stream.on('error', callback);

      stream.on('end', function () {
        expect(content).to.equal('Hello, friend.');

        return callback();
      });
    });

  });

  describe('createWriteStream()', function () {

    it('should create a WriteStream instance', function (callback) {
      var stream = fs.createWriteStream('/tmp/file');

      expect(stream).to.be.an.instanceof(WriteStream);

      stream.on('error', callback);

      stream.on('finish', function () {
        expect(fs.files).to.contain.an.avfs.file('/tmp/file').that.contain('Hello, world !');

        return callback();
      });

      stream.write('Hello, ');
      stream.end('world !');
    });

  });

  describe('existsSync()', function () {

    it('should return true for existing file', function () {
      expect(fs.existsSync('/tmp/file')).to.equal(true);
    });

    it('should return false for non existing file', function () {
      expect(fs.existsSync('/not/file')).to.equal(false);
    });

    it('should return false for bad parameter', function () {
      expect(fs.existsSync(0)).to.equal(false);
      expect(fs.existsSync(false)).to.equal(false);
      expect(fs.existsSync([])).to.equal(false);
      expect(fs.existsSync({})).to.equal(false);
    });

  });

  describe('fchmodSync()', function () {

    it('should change the mode', function () {
      var fd = 10;

      fs.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      var result = fs.fchmodSync(fd, '0700');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').with.mode('0700');
    });

    it('should throw on non existing file descriptor', function () {
      expect(function () {
        fs.fchmodSync(0, '0700');
      }).to.throw(Error, 'EBADF, bad file descriptor');
    });

    it('should throw on non integer file descriptor', function () {
      expect(function () {
        fs.fchmodSync(true, '0700');
      }).to.throw(TypeError, 'Bad argument');
    });

    it('should throw on bad mode parameter type', function () {
      expect(function () {
        fs.fchmodSync(0, false);
      }).to.throw(Error, 'Bad argument');
    });

  });

  describe('fchownSync()', function () {

    it('should change the owner and group', function () {
      var fd = 10;

      fs.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      var result = fs.fchownSync(fd, process.getuid(), process.getgroups()[0]);

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').with.owner(process.getuid(), process.getgroups()[0]);
    });

    it('should throw on non existing file descriptor', function () {
      expect(function () {
        fs.fchownSync(0, 1001, 1001);
      }).to.throw(Error, 'EBADF, bad file descriptor');
    });

    it('should throw on non integer file descriptor', function () {
      expect(function () {
        fs.fchownSync(true, 1001, 1001);
      }).to.throw(TypeError, 'Bad argument');
    });

    it('should throw on bad uid parameter type', function () {
      expect(function () {
        fs.fchownSync(0, false, 1001);
      }).to.throw(TypeError, 'uid must be an unsigned int');
    });

    it('should throw on bad gid parameter type', function () {
      expect(function () {
        fs.fchownSync(0, 1001, false);
      }).to.throw(TypeError, 'gid must be an unsigned int');
    });

  });

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

  describe('fstatSync()', function () {

    it('should return file stats', function () {
      var fd = 10;

      fs.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      var stats = fs.fstatSync(fd);

      expect(stats).to.be.an('object');

      var file = getElement('/tmp/file');

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

    it('should throw on non existing file descriptor', function () {
      expect(function () {
        fs.fstatSync(0);
      }).to.throw(Error, 'EBADF, bad file descriptor');
    });

    it('should throw on non integer file descriptor', function () {
      expect(function () {
        fs.fstatSync(true);
      }).to.throw(TypeError, 'Bad argument');
    });

  });

  describe('fsyncSync', function () {

    it('should return undefined', function () {
      var fd = 10;

      fs.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      expect(fs.fsyncSync(fd)).to.be.an('undefined');
    });

    it('should throw on non existing file descriptor', function () {
      expect(function () {
        fs.fsyncSync(0);
      }).to.throw(Error, 'EBADF, bad file descriptor');
    });

    it('should throw on non integer file descriptor', function () {
      expect(function () {
        fs.fsyncSync(true);
      }).to.throw(TypeError, 'Bad argument');
    });

  });

  describe('utimesSync()', function () {

    it('should change timestamps', function () {
      var date = new Date('2012-12-21T00:00:00.000Z');
      var fd   = 10;

      fs.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      var result = fs.futimesSync(fd, date, date);

      expect(result).to.be.an('undefined');
      expect(getElement('/tmp/file').get('atime').getTime()).to.equal(date.getTime());
      expect(getElement('/tmp/file').get('mtime').getTime()).to.equal(date.getTime());
    });

    it('should accept time as unix timestamp', function () {
      var date      = new Date('2012-12-21T00:00:00.000Z');
      var timestamp = date.getTime() / 1000;
      var fd        = 10;

      fs.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      var result = fs.futimesSync(fd, timestamp, timestamp);

      expect(result).to.be.an('undefined');
      expect(getElement('/tmp/file').get('atime').getTime()).to.equal(date.getTime());
      expect(getElement('/tmp/file').get('mtime').getTime()).to.equal(date.getTime());
    });

    it('should follow symlinks', function () {
      var date = new Date('2012-12-21T00:00:00.000Z');
      var fd   = 10;

      fs.handles[fd] = new Descriptor(getElement('/dir/link'), '/dir/link', constants.O_RDWR);

      var result = fs.futimesSync(fd, date, date);

      expect(result).to.be.an('undefined');

      expect(getElement('/dir/link').get('atime').getTime()).to.not.equal(date.getTime());
      expect(getElement('/dir/link').get('mtime').getTime()).to.not.equal(date.getTime());

      expect(getElement('/tmp/file').get('atime').getTime()).to.equal(date.getTime());
      expect(getElement('/tmp/file').get('mtime').getTime()).to.equal(date.getTime());
    });

    it('should throw on non existing file descriptor', function () {
      expect(function () {
        fs.futimesSync(0, 0, 0);
      }).to.throw(Error, 'EBADF, bad file descriptor');
    });

    it('should throw on non integer file descriptor', function () {
      expect(function () {
        fs.futimesSync(false, 0, 0);
      }).to.throw(TypeError, 'Bad argument');
    });

    it('should throw bad atime parameter type', function () {
      expect(function () {
        fs.futimesSync(0, false, 0);
      }).to.throw(Error, 'Cannot parse time: false');
    });

    it('should throw bad mtime parameter type', function () {
      expect(function () {
        fs.futimesSync(0, 0, false);
      }).to.throw(Error, 'Cannot parse time: false');
    });

  });

  describe('lchmodSync()', function () {

    it('should change the mode', function () {
      var result = fs.lchmodSync('/tmp/file', '0700');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').with.mode('0700');
    });

    it('should not follow symlinks', function () {
      var result = fs.lchmodSync('/dir/link', '0700');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').with.mode('0666');
      expect(fs.files).to.contain.an.avfs.symlink('/dir/link').with.mode('0700');
    });

    it('should throw on bad path parameter type', function () {
      expect(function () {
        fs.lchmodSync(false, '0700');
      }).to.throw(Error, 'Bad argument');
    });

    it('should throw on bad mode parameter type', function () {
      expect(function () {
        fs.lchmodSync('/file', false);
      }).to.throw(Error, 'Bad argument');
    });

    it('should throw on non existing file', function () {
      expect(function () {
        fs.lchmodSync('/file', '0700');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/file\'');
    });

    it('should throw on non existing parent directory', function () {
      expect(function () {
        fs.lchmodSync('/not/file', '0700');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/file\'');
    });

    it('should throw on not directory parent', function () {
      expect(function () {
        fs.lchmodSync('/tmp/file/new', '0700');
      }).to.throw(Error, 'ENOTDIR, not a directory \'/tmp/file/new\'');
    });

    it('should throw on not owned files', function () {
      expect(function () {
        fs.lchmodSync('/dir/other', '0700');
      }).to.throw(Error, 'EPERM, operation not permitted \'/dir/other\'');
    });

  });

  describe('lchownSync()', function () {

    it('should change the owner and group', function () {
      var result = fs.lchownSync('/tmp/file', process.getuid(), process.getgroups()[0]);

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').with.owner(process.getuid(), process.getgroups()[0]);
    });

    it('should follow symlinks', function () {
      var result = fs.lchownSync('/dir/link', process.getuid(), process.getgroups()[0]);

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.symlink('/dir/link').with.owner(process.getuid(), process.getgroups()[0]);
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').with.owner(process.getuid(), process.getgid());
    });

    it('should throw on bad path parameter type', function () {
      expect(function () {
        fs.lchownSync(false, 1001, 1001);
      }).to.throw(TypeError, 'path must be a string');
    });

    it('should throw on bad uid parameter type', function () {
      expect(function () {
        fs.lchownSync('/tmp/file', false, 1001);
      }).to.throw(TypeError, 'uid must be an unsigned int');
    });

    it('should throw on bad gid parameter type', function () {
      expect(function () {
        fs.lchownSync('/tmp/file', 1001, false);
      }).to.throw(TypeError, 'gid must be an unsigned int');
    });

    it('should throw on non existing file', function () {
      expect(function () {
        fs.lchownSync('/file', 1001, 1001);
      }).to.throw(Error, 'ENOENT, no such file or directory \'/file\'');
    });

    it('should throw on non existing parent directory', function () {
      expect(function () {
        fs.lchownSync('/not/file', 1001, 1001);
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/file\'');
    });

    it('should throw on not directory parent', function () {
      expect(function () {
        fs.lchownSync('/tmp/file/new', 1001, 1001);
      }).to.throw(Error, 'ENOTDIR, not a directory \'/tmp/file/new\'');
    });

    it('should throw on permission denied', function () {
      expect(function () {
        fs.lchownSync('/dir/other', 0, 0);
      }).to.throw(Error, 'EPERM, operation not permitted \'/dir/other\'');

      expect(function () {
        fs.lchownSync('/tmp/file', process.getuid(), 0);
      }).to.throw(Error, 'EPERM, operation not permitted \'/tmp/file\'');
    });

  });

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

  describe('lstatSync()', function () {

    it('should return file stats', function () {
      var stats = fs.lstatSync('/tmp/file');

      expect(stats).to.be.an('object');

      var file = getElement('/tmp/file');

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

    it('should not follow symlinks', function () {
      var statsFile = fs.lstatSync('/tmp/file');
      var statsLink = fs.lstatSync('/dir/link');

      expect(statsFile).to.not.deep.equal(statsLink);
    });

    it('should throw on non existing path', function () {
      expect(function () {
        fs.lstatSync('/not/test.txt');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/test.txt\'');
    });

    it('should throw on non directory parent', function () {
      expect(function () {
        fs.lstatSync('/tmp/file/file');
      }).to.throw(Error, 'ENOTDIR, not a directory \'/tmp/file/file\'');
    });

    it('should throw on non string path', function () {
      expect(function () {
        fs.lstatSync(true);
      }).to.throw(TypeError, 'path must be a string');
    });

  });

  describe('mkdirSync()', function () {

    it('should create a new directory', function () {
      var result = fs.mkdirSync('tmp/test');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.directory('/tmp/test').that.is.clear();
    });

    it('should create a new directory on root', function () {
      var result = fs.mkdirSync('/test');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.directory('/test').that.is.clear();
    });

    it('should accept mode parameter as string', function () {
      var result = fs.mkdirSync('/tmp/dir', '0500');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.directory('/tmp/dir').with.mode('0500').that.is.clear();
    });

    it('should accept mode parameter as number', function () {
      var result = fs.mkdirSync('/tmp/dir', 438);

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.directory('/tmp/dir').with.mode('0666').that.is.clear();
    });

    it('should set mode to 0777 by default', function () {
      var result = fs.mkdirSync('/tmp/dir');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.directory('/tmp/dir').with.mode('0777').that.is.clear();
    });

    it('should throw on existing path', function () {
      expect(function () {
        fs.mkdirSync('/tmp');
      }).to.throw(Error, 'EEXIST, file already exists \'/tmp\'');
    });

    it('should throw on non existing parent directory', function () {
      expect(function () {
        fs.mkdirSync('/not/dir');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/dir\'');
    });

    it('should throw on not directory parent', function () {
      expect(function () {
        fs.mkdirSync('/tmp/file/dir');
      }).to.throw(Error, 'ENOTDIR, not a directory \'/tmp/file/dir\'');
    });

    it('should throw on non string path', function () {
      expect(function () {
        fs.mkdirSync(true);
      }).to.throw(TypeError, 'Bad argument');
    });

  });

  describe('openSync()', function () {

    it('should return a file descriptor', function () {
      var fd = fs.openSync('/tmp/file', 'r');

      expect(fd).to.be.a('number');

      var key = fd.toString();

      expect(fs.handles).to.contain.keys(key);
      expect(fs.handles[key].path).to.equal('/tmp/file');
    });

    it('should open directory in read mode', function () {
      var fd = fs.openSync('/tmp', 'r');

      expect(fd).to.be.a('number');

      var key = fd.toString();

      expect(fs.handles).to.contain.keys(key);
      expect(fs.handles[key].path).to.equal('/tmp');
    });

    it('should throw on bad path type', function () {
      expect(function () {
        fs.openSync(false, 'r');
      }).to.throw(Error, 'path must be a string');
    });

    it('should throw on bad flags type', function () {
      expect(function () {
        fs.openSync('/tmp/file', false);
      }).to.throw(Error, 'flags must be an int');
    });

    it('should throw on non unknown flags', function () {
      expect(function () {
        fs.openSync('/tmp/file', 'p');
      }).to.throw(Error, 'Unknown file open flag: p');
    });

    it('should throw on non existing file in read mode', function () {
      ['r', 'r+', 'rs', 'rs+'].forEach(function (fgs) {
        expect(function () {
          fs.openSync('/tmp/not', fgs);
        }).to.throw(Error, 'ENOENT, no such file or directory \'/tmp/not\'', 'with flags \'' + fgs + '\'');
      });
    });

    it('should throw on existing file in exclusive mode', function () {
      ['wx', 'xw', 'wx+', 'xw+', 'ax', 'xa', 'ax+', 'xa+'].forEach(function (fgs) {
        expect(function () {
          fs.openSync('/tmp/file', fgs);
        }).to.throw(Error, 'EEXIST, file already exists \'/tmp/file\'', 'with flags \'' + fgs + '\'');
      });
    });

    it('should throw on directory in write mode', function () {
      ['r+', 'rs+', 'w', 'w+', 'a', 'a+'].forEach(function (fgs) {
        expect(function () {
          fs.openSync('/tmp', fgs);
        }).to.throw(Error, 'EISDIR, illegal operation on a directory \'/tmp\'', 'with flags \'' + fgs + '\'');
      });
    });

    it('should throw on non existing parent directory', function () {
      expect(function () {
        fs.openSync('/not/file', 'w');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/file\'');
    });

    it('should throw on non directory parent', function () {
      expect(function () {
        fs.openSync('/tmp/file/file', 'w');
      }).to.throw(Error, 'ENOTDIR, not a directory \'/tmp/file/file\'');
    });

    it('should throw on permission denied', function () {
      ['r', 'r+', 'w', 'w+', 'a', 'a+'].forEach(function (fgs) {
        expect(function () {
          fs.openSync('/dir/perm', fgs);
        }).to.throw(Error, 'EACCES, permission denied \'/dir/perm\'');
      });
    });

    it('should create non existing file in create mode', function () {
      [
        'w',  'wx',  'xw',
        'w+', 'wx+', 'xw+',
        'a',  'ax',  'xa',
        'a+', 'ax+', 'xa+'
      ].forEach(function (fgs) {
        var filename = 'file-' + fgs + '';

        var fd = fs.openSync('/' + filename, fgs);

        expect(fd).to.be.a('number');
        expect(fs.files).to.contain.an.avfs.file(filename).that.is.clear();
      });
    });

    it('should set mode on new file', function () {
      var fd = fs.openSync('/file', 'w', '0500');

      expect(fd).to.be.a('number');
      expect(fs.files).to.contain.an.avfs.file('/file').with.mode('0500').that.is.clear();
    });

    it('should set mode to 0666 by default', function () {
      var fd = fs.openSync('/file', 'w');

      expect(fd).to.be.a('number');
      expect(fs.files).to.contain.an.avfs.file('/file').with.mode('0666').that.is.clear();
    });

    it('should erase existing file in truncate mode', function () {
      ['w',  'w+'].forEach(function (fgs) {
        var filename = 'file-' + fgs + '';

        fs.files[filename] = elements.file('0666', new Buffer('Hello, friend.'));

        var fd = fs.openSync('/' + filename, fgs);

        expect(fd).to.be.a('number');
        expect(fs.files).to.contain.an.avfs.file(filename).that.is.clear();
      });
    });

    it('should not erase existing file in append mode', function () {
      ['a',  'a+'].forEach(function (fgs) {
        var fd = fs.openSync('/tmp/file', fgs);

        expect(fd).to.be.a('number');
        expect(fs.files).to.contain.an.avfs.file('/tmp/file').that.contain('Hello, friend.');
      });
    });

  });

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

  describe('readdirSync()', function () {

    it('should list directory files', function () {
      var result = fs.readdirSync('/tmp');

      expect(result).to.be.an('array');
      expect(result).to.deep.equal([
        'ascii',
        'empty',
        'file'
      ]);
    });

    it('should throw on non existing path', function () {
      expect(function () {
        fs.readdirSync('/not');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not\'');
    });

    it('should throw on file', function () {
      expect(function () {
        fs.readdirSync('/tmp/file');
      }).to.throw(Error, 'ENOTDIR, not a directory \'/tmp/file\'');
    });

    it('should throw on non string path', function () {
      expect(function () {
        fs.readdirSync(true);
      }).to.throw(TypeError, 'path must be a string');
    });

  });

  describe('readFileSync()', function () {

    it('should return the file buffer', function () {
      var content = fs.readFileSync('/tmp/file');

      expect(content).to.be.an.instanceof(Buffer);
      expect(content.toString()).to.equal('Hello, friend.');
    });

    it('should return an encoded string', function () {
      var content = fs.readFileSync('/tmp/file', {encoding: 'utf8'});

      expect(content).to.be.a('string');
      expect(content).to.equal('Hello, friend.');
    });

    it('should accept encoding option', function () {
      var content = fs.readFileSync('/tmp/file', 'utf8');

      expect(content).to.be.a('string');
      expect(content).to.equal('Hello, friend.');
    });

    it('should throw on non existing file', function () {
      expect(function () {
        fs.readFileSync('/not/file');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/file\'');
    });

    it('should throw on directory', function () {
      expect(function () {
        fs.readFileSync('/tmp');
      }).to.throw(Error, 'EISDIR, illegal operation on a directory');
    });

    it('should throw on unknown encoding', function () {
      expect(function () {
        fs.readFileSync('/tmp/file', 'utf5');
      }).to.throw(Error, 'Unknown encoding: utf5');
    });

    it('should throw on non string path', function () {
      expect(function () {
        fs.readFileSync(true);
      }).to.throw(TypeError, 'path must be a string');
    });

    it('should throw on bad options type', function () {
      expect(function () {
        fs.readFileSync('/tmp/file', true);
      }).to.throw(TypeError, 'Bad arguments');
    });

  });

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

  describe('realpathSync()', function () {

    it('should resolve symlinks and cached links', function () {
      expect(fs.realpathSync('/cache/link', {'/cache': '/dir/dlink'})).to.equal('/tmp/file');
    });

    it('should throw on non existing element', function () {
      expect(function () {
        fs.realpathSync('/not/test.txt');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not\'');
    });

    it('should throw on not string path', function () {
      expect(function () {
        fs.realpathSync(false);
      }).to.throw(TypeError, 'Arguments to path.resolve must be strings');
    });

    it('should throw on not string path in cache', function () {
      expect(function () {
        fs.realpathSync('/not', {'/not': false});
      }).to.throw(TypeError, 'Arguments to path.resolve must be strings');
    });

  });

  describe('renameSync()', function () {

    it('should rename files', function () {
      var result = fs.renameSync('/tmp/file', '/tmp/new');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/new').that.contain('Hello, friend.');
    });

    it('should move files', function () {
      var result = fs.renameSync('/tmp/file', '/dir/file');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/dir/file').that.contain('Hello, friend.');
    });

    it('should throw on non existing path', function () {
      expect(function () {
        fs.renameSync('/tmp/not', '/tmp/new');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/tmp/not\'');
    });

    it('should throw on new path under old path', function () {
      expect(function () {
        fs.renameSync('/tmp/file', '/tmp/file/new');
      }).to.throw(Error, 'EINVAL, invalid argument \'/tmp/file\'');
    });

    it('should throw on not directory parent', function () {
      expect(function () {
        fs.renameSync('/tmp/file/file', '/dir/file');
      }).to.throw(Error, 'ENOTDIR, not a directory \'/tmp/file/file\'');
    });

    it('should throw on not writable parent directory', function () {
      expect(function () {
        fs.renameSync('/perm/file', '/tmp/new');
      }).to.throw(Error, 'EACCES, permission denied \'/perm/file\'');
    });

    it('should throw on not writable destination directory', function () {
      expect(function () {
        fs.renameSync('/tmp/file', '/perm/new');
      }).to.throw(Error, 'EACCES, permission denied \'/tmp/file\'');
    });

  });

  describe('rmdirSync()', function () {

    it('should delete directory', function () {
      var result = fs.rmdirSync('/tmp');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.not.contain.keys('tmp');
    });

    it('should throw on non existing path', function () {
      expect(function () {
        fs.rmdirSync('/not');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not\'');
    });

    it('should throw on file', function () {
      expect(function () {
        fs.rmdirSync('/tmp/file');
      }).to.throw(Error, 'ENOTDIR, not a directory \'/tmp/file\'');
    });

    it('should throw on non string path', function () {
      expect(function () {
        fs.rmdirSync(true);
      }).to.throw(TypeError, 'path must be a string');
    });

    it('should throw on not writable parent directory', function () {
      expect(function () {
        fs.rmdirSync('/perm/dir');
      }).to.throw(Error, 'EACCES, permission denied \'/perm/dir\'');
    });

  });

  describe('statSync()', function () {

    it('should return file stats', function () {
      var stats = fs.statSync('/tmp/file');

      expect(stats).to.be.an('object');

      var file = getElement('/tmp/file');

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

    it('should follow symlinks', function () {
      var statsFile = fs.statSync('/tmp/file');
      var statsLink = fs.statSync('/dir/link');

      expect(statsFile).to.deep.equal(statsLink);
    });

    it('should throw on non existing path', function () {
      expect(function () {
        fs.statSync('/not/test.txt');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/test.txt\'');
    });

    it('should throw on non directory parent', function () {
      expect(function () {
        fs.statSync('/tmp/file/file');
      }).to.throw(Error, 'ENOTDIR, not a directory \'/tmp/file/file\'');
    });

    it('should throw on non string path', function () {
      expect(function () {
        fs.statSync(true);
      }).to.throw(TypeError, 'path must be a string');
    });

  });

  describe('symlinkSync()', function () {

    it('should create a symbolic link on file', function () {
      var result = fs.symlinkSync('/tmp/file', '/tmp/link');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.symlink('/tmp/link').with.mode('0777').that.target('/tmp/file');
    });

    it('should create a symbolic link on folder', function () {
      var result = fs.symlinkSync('/tmp', '/tmp/link');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.symlink('/tmp/link').with.mode('0777').that.target('/tmp');
    });

    it('should create a symbolic link on nonexistent target', function () {
      var result = fs.symlinkSync('/not/file', '/tmp/link');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.symlink('/tmp/link').with.mode('0777').that.target('/not/file');
    });

    it('should throw on existing destination', function () {
      expect(function () {
        fs.symlinkSync('/tmp/file', '/tmp/ascii');
      }).to.throw(Error, 'EEXIST, file already exists \'/tmp/file\'');
    });

    it('should throw on non existing parent directory in destination path', function () {
      expect(function () {
        fs.symlinkSync('/tmp/file', '/not/link');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/link\'');
    });

    it('should throw on not directory parent in destination path', function () {
      expect(function () {
        fs.symlinkSync('/tmp/file', '/tmp/ascii/link');
      }).to.throw(Error, 'ENOTDIR, not a directory \'/tmp/ascii/link\'');
    });

    it('should throw on non string source path', function () {
      expect(function () {
        fs.symlinkSync(true, '/dir/file');
      }).to.throw(TypeError, 'dest path must be a string');
    });

    it('should throw on non string destination path', function () {
      expect(function () {
        fs.symlinkSync('/tmp/file', true);
      }).to.throw(TypeError, 'src path must be a string');
    });

    it('should throw on not writable destination directory', function () {
      expect(function () {
        fs.symlinkSync('/tmp/file', '/perm/link');
      }).to.throw(Error, 'EACCES, permission denied \'/perm/link\'');
    });

  });

  describe('truncateSync()', function () {

    it('should truncate file', function () {
      var result = fs.truncateSync('/tmp/file');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').that.is.clear();
    });

    it('should truncate file to the specified length', function () {
      var content = new Buffer('Hello, friend.');

      var result = fs.truncateSync('/tmp/file', 3);

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').that.contain(content.slice(0, 3).toString());
    });

    it('should throw on non existing path', function () {
      expect(function () {
        fs.truncateSync('/not/file');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/file\'');
    });

    it('should throw on directory', function () {
      expect(function () {
        fs.truncateSync('/tmp');
      }).to.throw(Error, 'EISDIR, illegal operation on a directory \'/tmp\'');
    });

    it('should throw on non string path', function () {
      expect(function () {
        fs.truncateSync(true);
      }).to.throw(TypeError, 'path must be a string');
    });

    it('should throw on non integer length', function () {
      expect(function () {
        fs.truncateSync('/tmp/file', true);
      }).to.throw(TypeError, 'Not an integer');
    });

  });

  describe('unlinkSync()', function () {

    it('should delete file', function () {
      var result = fs.unlinkSync('/tmp/file');

      expect(result).to.be.an('undefined');
      expect(getElement('/tmp')).to.not.contain.keys('file');
    });

    it('should decrement the number of links', function () {
      var file = getElement('/tmp/file');

      file.set('nlink', 5);

      var result = fs.unlinkSync('/tmp/file');

      expect(result).to.be.an('undefined');
      expect(file.get('nlink')).to.equal(4);
    });

    it('should throw on non existing path', function () {
      expect(function () {
        fs.unlinkSync('/not/file');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/file\'');
    });

    it('should throw on directory', function () {
      expect(function () {
        fs.unlinkSync('/tmp');
      }).to.throw(Error, 'EISDIR, illegal operation on a directory \'/tmp\'');
    });

    it('should throw on non string path', function () {
      expect(function () {
        fs.unlinkSync(true);
      }).to.throw(TypeError, 'path must be a string');
    });

    it('should throw on not writable parent directory', function () {
      expect(function () {
        fs.unlinkSync('/perm/file');
      }).to.throw(Error, 'EACCES, permission denied \'/perm/file\'');
    });

  });

  describe('utimesSync()', function () {

    it('should change timestamps', function () {
      var date = new Date('2012-12-21T00:00:00.000Z');

      var result = fs.utimesSync('/tmp/file', date, date);

      expect(result).to.be.an('undefined');
      expect(getElement('/tmp/file').get('atime').getTime()).to.equal(date.getTime());
      expect(getElement('/tmp/file').get('mtime').getTime()).to.equal(date.getTime());
    });

    it('should accept time as unix timestamp', function () {
      var date      = new Date('2012-12-21T00:00:00.000Z');
      var timestamp = date.getTime() / 1000;

      var result = fs.utimesSync('/tmp/file', timestamp, timestamp);

      expect(result).to.be.an('undefined');
      expect(getElement('/tmp/file').get('atime').getTime()).to.equal(date.getTime());
      expect(getElement('/tmp/file').get('mtime').getTime()).to.equal(date.getTime());
    });

    it('should follow symlinks', function () {
      var date = new Date('2012-12-21T00:00:00.000Z');

      var result = fs.utimesSync('/dir/link', date, date);

      expect(result).to.be.an('undefined');

      expect(getElement('/dir/link').get('atime').getTime()).to.not.equal(date.getTime());
      expect(getElement('/dir/link').get('mtime').getTime()).to.not.equal(date.getTime());

      expect(getElement('/tmp/file').get('atime').getTime()).to.equal(date.getTime());
      expect(getElement('/tmp/file').get('mtime').getTime()).to.equal(date.getTime());
    });

    it('should throw on non existing path', function () {
      expect(function () {
        fs.utimesSync('/not/file', 0, 0);
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/file\'');
    });

    it('should throw on non existing parent directory', function () {
      expect(function () {
        fs.chownSync('/not/file', 0, 0);
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/file\'');
    });

    it('should throw on not directory parent', function () {
      expect(function () {
        fs.chownSync('/tmp/file/new', 0, 0);
      }).to.throw(Error, 'ENOTDIR, not a directory \'/tmp/file/new\'');
    });

    it('should throw on non string path', function () {
      expect(function () {
        fs.utimesSync(true, 0, 0);
      }).to.throw(TypeError, 'path must be a string');
    });

    it('should throw bad atime parameter type', function () {
      expect(function () {
        fs.utimesSync('/tmp/file', false, 0);
      }).to.throw(Error, 'Cannot parse time: false');
    });

    it('should throw bad mtime parameter type', function () {
      expect(function () {
        fs.utimesSync('/tmp/file', 0, false);
      }).to.throw(Error, 'Cannot parse time: false');
    });

  });

  describe('writeSync()', function () {

    it('should write in the file', function () {
      var fd = 0;

      fs.handles[fd] = new Descriptor(getElement('/tmp/empty'), '/tmp/empty', constants.O_RDWR);

      var written = fs.writeSync(fd, new Buffer('Hello, friend'), 0, 5, 0);

      expect(written).to.equal(5);

      expect(fs.files).to.contain.an.avfs.file('/tmp/empty').that.contain('Hello');
    });

    it('should write the file from position', function () {
      var fd = 0;

      fs.handles[fd] = new Descriptor(getElement('/tmp/empty'), '/tmp/empty', constants.O_RDWR);

      var written = fs.writeSync(fd, new Buffer('Hello, friend.'), 0, 5, 7);

      expect(written).to.equal(5);

      expect(fs.files).to.contain.an.avfs.file('/tmp/empty').that.contain('       Hello');
    });

    it('should always append data to the end in append mode', function () {
      var fd = 0;

      fs.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR | constants.O_APPEND);

      expect(fs.writeSync(fd, new Buffer(' Hello,'),  0, 7, 2)).to.equal(7);
      expect(fs.writeSync(fd, new Buffer(' world !'), 0, 8, 2)).to.equal(8);

      expect(fs.files).to.contain.an.avfs.file('/tmp/file').that.contain('Hello, friend. Hello, world !');
    });

    it('should write the file from current position', function () {
      var fd = 0;

      fs.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      fs.handles[fd].write = 7;

      var written = fs.writeSync(fd, new Buffer('Hello, world !'), 0, 7, null);

      expect(written).to.equal(7);

      expect(fs.files).to.contain.an.avfs.file('/tmp/file').that.contain('Hello, Hello, ');

      expect(fs.handles[fd].write).to.equal(14);
    });

    it('should read the buffer from offset', function () {
      var fd = 0;

      fs.handles[fd] = new Descriptor(getElement('/tmp/empty'), '/tmp/empty', constants.O_RDWR);

      var written = fs.writeSync(fd, new Buffer('Hello, friend'), 7, 6, null);

      expect(written).to.equal(6);

      expect(fs.files).to.contain.an.avfs.file('/tmp/empty').that.contain('friend');
    });

    it('should fill unwritten parts with white spaces', function () {
      var fd = 0;

      fs.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      var written = fs.writeSync(fd, new Buffer('OK'), 0, 2, 20);

      expect(written).to.equal(2);

      expect(fs.files).to.contain.an.avfs.file('/tmp/file').that.contain('Hello, friend.      OK');
    });

    it('should fail on non existing fd', function () {
      expect(function () {
        fs.writeSync(0, new Buffer('Hello, friend'), 0, 5, 0);
      }).to.throw(Error, 'EBADF, bad file descriptor');
    });

    it('should fail on closed fd', function () {
      var fd = 0;

      fs.handles[fd] = new Descriptor({}, '/tmp/file', constants.O_RDWR);

      fs.handles[fd].close();

      expect(function () {
        fs.writeSync(fd, new Buffer('Hello, friend'), 0, 5, 0);
      }).to.throw(Error, 'EBADF, bad file descriptor');
    });

    it('should fail on non writing fd', function () {
      var fd = 0;

      fs.handles[fd] = new Descriptor({}, '/tmp/file', constants.O_RDONLY);

      expect(function () {
        fs.writeSync(fd, new Buffer('Hello, friend'), 0, 5, 0);
      }).to.throw(Error, 'EBADF, bad file descriptor');
    });

    it('should throw on bad fd type', function () {
      expect(function () {
        fs.writeSync(true);
      }).to.throw(TypeError, 'Bad arguments');
    });

    it('should throw on offset out of bounds', function () {
      expect(function () {
        fs.writeSync(0, new Buffer('Hello, friend'), 1000, 0, 0, noop);
      }).to.throw(Error, 'Offset is out of bounds');
    });

    it('should throw on length beyond buffer', function () {
      expect(function () {
        fs.writeSync(0, new Buffer('Hello, friend'), 0, 1000, 0, noop);
      }).to.throw(Error, 'off + len > buffer.length');
    });

  });

  describe('writeFileSync()', function () {

    it('should write buffer to file', function () {
      var result = fs.writeFileSync('/file', new Buffer('Hello, friend.'));

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/file').that.contain('Hello, friend.');
    });

    it('should write string to file', function () {
      fs.files = elements.directory('0755', {
        tmp: elements.directory('0777', {})
      });

      var result = fs.writeFileSync('/file', 'Hello, friend.');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/file').that.contain('Hello, friend.');
    });

    it('should write encoded string to file', function () {
      fs.files = elements.directory('0755', {
        tmp: elements.directory('0777', {})
      });

      var result = fs.writeFileSync('/file', 'aàâäeéèâë', {encoding: 'ascii'});

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/file').that.contain(new Buffer('aàâäeéèâë', 'ascii').toString());
    });

    it('should accept encoding option', function () {
      var result = fs.writeFileSync('/file', 'aàâäeéèâë', 'ascii');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/file').that.contain(new Buffer('aàâäeéèâë', 'ascii').toString());
    });

    it('should accept mode option', function () {
      var result = fs.writeFileSync('/file', 'OK', {mode: '0700'});

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/file').with.mode('0700');
    });

    it('should accept flag option', function () {
      expect(function () {
        fs.writeFileSync('/tmp/file', 'OK', {flag: 'r'});
      }).to.throw(Error, 'EBADF, bad file descriptor');
    });

    it('should throw on non existing parent directory', function () {
      expect(function () {
        fs.writeFileSync('/not/file', 'Hello, friend.');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/file\'');
    });

    it('should throw on not directory parent', function () {
      expect(function () {
        fs.writeFileSync('/tmp/file/file', 'Hello, friend.');
      }).to.throw(Error, 'ENOTDIR, not a directory \'/tmp/file/file\'');
    });

    it('should throw on directory path', function () {
      expect(function () {
        fs.writeFileSync('/tmp', 'Hello, friend.');
      }).to.throw(Error, 'EISDIR, illegal operation on a directory \'/tmp\'');
    });

    it('should throw on unknown encoding', function () {
      expect(function () {
        fs.writeFileSync('/file', 'Hello, friend.', 'utf5');
      }).to.throw(Error, 'Unknown encoding: utf5');
    });

    it('should throw on non string path', function () {
      expect(function () {
        fs.writeFileSync(true);
      }).to.throw(TypeError, 'path must be a string');
    });

    it('should throw on bad options type', function () {
      expect(function () {
        fs.writeFileSync('/tmp/file', 'Hello, friend.', true);
      }).to.throw(TypeError, 'Bad arguments');
    });

  });

  describe('Asynchronous methods', function () {

    before(function () {
      sinon.stub(fs, 'openSync');
      sinon.stub(console, 'error');
    });

    beforeEach(function () {
      fs.openSync.reset();
    });

    it('should expose asynchronous methods', function () {
      expect(AVFS).to.respondTo('appendFile');
      expect(AVFS).to.respondTo('chmod');
      expect(AVFS).to.respondTo('chown');
      expect(AVFS).to.respondTo('close');
      expect(AVFS).to.respondTo('exists');
      expect(AVFS).to.respondTo('fchmod');
      expect(AVFS).to.respondTo('fchown');
      expect(AVFS).to.respondTo('ftruncate');
      expect(AVFS).to.respondTo('fstat');
      expect(AVFS).to.respondTo('fsync');
      expect(AVFS).to.respondTo('futimes');
      expect(AVFS).to.respondTo('lchmod');
      expect(AVFS).to.respondTo('lchown');
      expect(AVFS).to.respondTo('link');
      expect(AVFS).to.respondTo('lstat');
      expect(AVFS).to.respondTo('mkdir');
      expect(AVFS).to.respondTo('open');
      expect(AVFS).to.respondTo('read');
      expect(AVFS).to.respondTo('readdir');
      expect(AVFS).to.respondTo('readFile');
      expect(AVFS).to.respondTo('readlink');
      expect(AVFS).to.respondTo('realpath');
      expect(AVFS).to.respondTo('rename');
      expect(AVFS).to.respondTo('rmdir');
      expect(AVFS).to.respondTo('stat');
      expect(AVFS).to.respondTo('symlink');
      expect(AVFS).to.respondTo('truncate');
      expect(AVFS).to.respondTo('unlink');
      expect(AVFS).to.respondTo('utimes');
      expect(AVFS).to.respondTo('write');
      expect(AVFS).to.respondTo('writeFile');
    });

    it('should call the synchronous couterpart', function (done) {
      fs.openSync.returns(1);

      fs.open('/file', 'w+', '0755', function (error, fd) {
        expect(error).to.equal(null);
        expect(fd).to.equal(1);

        expect(fs.openSync).to.have.callCount(1);
        expect(fs.openSync).to.have.been.calledWithExactly('/file', 'w+', '0755');

        return done();
      });
    });

    it('should work without callback', function (done) {
      fs.openSync.returns(1);

      fs.open('/file', 'w+', '0755');

      setImmediate(function () {
        expect(fs.openSync).to.have.callCount(1);
        expect(fs.openSync).to.have.been.calledWithExactly('/file', 'w+', '0755');

        return done();
      });
    });

    it('should pass error to the callback', function (done) {
      var error = new Error('Fake open error');

      fs.openSync.throws(error);

      fs.open('/file', 'w+', '0755', function (error, fd) {
        expect(error).to.equal(error);
        expect(fd).to.be.an('undefined');

        return done();
      });
    });

    it('should log error without callback', function (done) {
      var error = new Error('Fake open error');

      fs.openSync.throws(error);

      fs.open('/file', 'w+', '0755');

      setImmediate(function () {
        expect(console.error).to.have.been.calledWithExactly('fs: missing callback Fake open error');

        return done();
      });
    });

    describe('read()', function () {

      var fd       = 12;
      var inBuffer = new Buffer(5);
      var offset   = 1;
      var length   = 3;
      var position = 7;

      before(function () {
        sinon.stub(fs, 'readSync');
      });

      beforeEach(function () {
        fs.readSync.reset();
      });

      it('should call readSync', function (done) {
        fs.readSync.returns(5);

        fs.read(fd, inBuffer, offset, length, position, function (error, bytesRead, outBuffer) {
          expect(error).to.equal(null);

          expect(fs.readSync).to.have.callCount(1);
          expect(fs.readSync).to.have.been.calledWithExactly(fd, inBuffer, offset, length, position);

          expect(bytesRead).to.equal(5);
          expect(outBuffer).to.equal(inBuffer);

          return done();
        });
      });

      it('should work without callback', function (done) {
        fs.readSync.returns(5);

        fs.read(fd, inBuffer, offset, length, position);

        setImmediate(function () {
          expect(fs.readSync).to.have.callCount(1);
          expect(fs.readSync).to.have.been.calledWithExactly(fd, inBuffer, offset, length, position);

          return done();
        });
      });

      it('should rethrow non fs errors', function () {
        var error = new Error('Fake open error');

        fs.readSync.throws(error);

        expect(function () {
          fs.read(fd, inBuffer, offset, length, position);
        }).to.throw(error);
      });

      it('should pass fs error to the callback', function (done) {
        var error = errors.EBADF('read');

        fs.readSync.throws(error);

        fs.read(fd, inBuffer, offset, length, position, function (err, bytesRead, outBuffer) {
          expect(err).to.equal(error);

          expect(fs.readSync).to.have.callCount(1);
          expect(fs.readSync).to.have.been.calledWithExactly(fd, inBuffer, offset, length, position);

          expect(bytesRead).to.equal(0);
          expect(outBuffer).to.equal(inBuffer);

          return done();
        });
      });

      after(function () {
        fs.readSync.restore();
      });

    });

    describe('write()', function () {

      var fd       = 12;
      var inBuffer = new Buffer('Hello');
      var offset   = 1;
      var length   = 3;
      var position = 7;

      before(function () {
        sinon.stub(fs, 'writeSync');
      });

      beforeEach(function () {
        fs.writeSync.reset();
      });

      it('should call writeSync', function (done) {
        fs.writeSync.returns(5);

        fs.write(fd, inBuffer, offset, length, position, function (error, written, outBuffer) {
          expect(error).to.equal(null);

          expect(fs.writeSync).to.have.callCount(1);
          expect(fs.writeSync).to.have.been.calledWithExactly(fd, inBuffer, offset, length, position);

          expect(written).to.equal(5);
          expect(outBuffer).to.equal(inBuffer);

          return done();
        });
      });

      it('should work without callback', function (done) {
        fs.writeSync.returns(5);

        fs.write(fd, inBuffer, offset, length, position);

        setImmediate(function () {
          expect(fs.writeSync).to.have.callCount(1);
          expect(fs.writeSync).to.have.been.calledWithExactly(fd, inBuffer, offset, length, position);

          return done();
        });
      });

      it('should do nothing with falsy length', function (done) {
        fs.writeSync.returns(5);

        fs.write(fd, inBuffer, offset, 0, position, function (error, written, outBuffer) {
          expect(error).to.equal(null);
          expect(written).to.equal(0);
          expect(outBuffer).to.be.an('undefined');

          expect(fs.writeSync).to.have.callCount(0);

          return done();
        });
      });

      it('should do nothing with falsy length and without callback', function (done) {
        fs.writeSync.returns(5);

        fs.write(fd, inBuffer, offset, 0, position);
        fs.write(fd, inBuffer, offset, null, position);
        fs.write(fd, inBuffer, offset, false, position);

        setImmediate(function () {
          expect(fs.writeSync).to.have.callCount(0);

          return done();
        });
      });

      it('should rethrow non fs errors', function () {
        var error = new Error('Fake open error');

        fs.writeSync.throws(error);

        expect(function () {
          fs.write(fd, inBuffer, offset, length, position);
        }).to.throw(error);
      });

      it('should pass fs error to the callback', function (done) {
        var error = errors.EBADF('write');

        fs.writeSync.throws(error);

        fs.write(fd, inBuffer, offset, length, position, function (err, written, outBuffer) {
          expect(err).to.equal(error);

          expect(fs.writeSync).to.have.callCount(1);
          expect(fs.writeSync).to.have.been.calledWithExactly(fd, inBuffer, offset, length, position);

          expect(written).to.equal(0);
          expect(outBuffer).to.equal(inBuffer);

          return done();
        });
      });

      it('should log fs error without callback', function (done) {
        fs.writeSync.throws(errors.EBADF('write'));

        fs.write(fd, inBuffer, offset, length, position);

        setImmediate(function () {
          expect(console.error).to.have.been.calledWithExactly('fs: missing callback EBADF, bad file descriptor');

          return done();
        });
      });

      after(function () {
        fs.writeSync.restore();
      });

    });

    after(function () {
      fs.openSync.restore();
      console.error.restore();
    });

  });

});
