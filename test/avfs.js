'use strict';

var chai   = require('chai');
var expect = chai.expect;

var PassThrough = require('stream').PassThrough;

var flags = require('../lib/common/flags');

var AVFS       = require('../lib/avfs');
var Descriptor = require('../lib/common/descriptor');

var fs = new AVFS();

function d(directory) {
  Object.defineProperty(directory, '@type', {
    value:        'directory',
    configurable: false,
    enumerable:   false,
    writable:     false
  });

  return directory;
}

function f(file) {
  Object.defineProperty(file, '@type', {
    value:        'file',
    configurable: false,
    enumerable:   false,
    writable:     false
  });

  return file;
}

describe('avfs', function () {

  beforeEach('reset virtual file system', function () {
    fs.files   = {};
    fs.handles = {};
    fs.next    = 0;
  });

  describe('appendFileSync()', function () {

    it('should append buffer to file', function () {
      fs.files = {tmp: d({file: f(new Buffer('Hello, '))})};

      var result = fs.appendFileSync('/tmp/file', new Buffer('friend.'));

      expect(result).to.be.an('undefined');
      expect(fs.files.tmp).to.contain.keys('file');
      expect(fs.files.tmp.file).to.be.an.instanceof(Buffer);
      expect(fs.files.tmp.file.toString()).to.equal('Hello, friend.');
    });

    it('should append string to file', function () {
      fs.files = {tmp: d({file: f(new Buffer('Hello, '))})};

      var result = fs.appendFileSync('/tmp/file', 'friend.');

      expect(result).to.be.an('undefined');
      expect(fs.files.tmp).to.contain.keys('file');
      expect(fs.files.tmp.file).to.be.an.instanceof(Buffer);
      expect(fs.files.tmp.file.toString()).to.equal('Hello, friend.');
    });

    it('should append encoded string to file', function () {
      fs.files = {tmp: d({file: f(new Buffer('Hello, ', 'ascii'))})};

      var result = fs.appendFileSync('/tmp/file', 'aàâäeéèâë', {encoding: 'ascii'});

      expect(result).to.be.an('undefined');
      expect(fs.files.tmp).to.contain.keys('file');
      expect(fs.files.tmp.file).to.be.an.instanceof(Buffer);
      expect(fs.files.tmp.file.toString()).to.equal(new Buffer('Hello, aàâäeéèâë', 'ascii').toString());
      expect(fs.files.tmp.file.toString()).to.not.equal(new Buffer('Hello, aàâäeéèâë', 'utf8').toString());
    });

    it('should accept the encoding as options', function () {
      fs.files = {tmp: d({file: f(new Buffer('Hello, '))})};

      var result = fs.appendFileSync('/tmp/file', 'aàâäeéèâë', 'ascii');

      expect(result).to.be.an('undefined');
      expect(fs.files.tmp).to.contain.keys('file');
      expect(fs.files.tmp.file).to.be.an.instanceof(Buffer);
      expect(fs.files.tmp.file.toString()).to.equal(new Buffer('Hello, aàâäeéèâë', 'ascii').toString());
      expect(fs.files.tmp.file.toString()).to.not.equal(new Buffer('Hello, aàâäeéèâë', 'utf8').toString());
    });

    it('should create non existing file', function () {
      fs.files = {tmp: d({})};

      var result = fs.appendFileSync('/tmp/file', 'Hello, friend.');

      expect(result).to.be.an('undefined');
      expect(fs.files.tmp).to.contain.keys('file');
      expect(fs.files.tmp.file).to.be.an.instanceof(Buffer);
      expect(fs.files.tmp.file.toString()).to.equal('Hello, friend.');
    });

    it('should throw on non existing parent directory', function () {
      expect(function () {
        fs.appendFileSync('/tmp/file', 'Hello, friend.');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/tmp/file\'');
    });

    it('should throw on not directory parent', function () {
      fs.files = {tmp: f(new Buffer('Hello, friend.'))};

      expect(function () {
        fs.appendFileSync('/tmp/file', 'Hello, friend.');
      }).to.throw(Error, 'ENOTDIR, not a directory \'/tmp/file\'');
    });

    it('should throw on directory path', function () {
      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      expect(function () {
        fs.appendFileSync('/tmp', 'Hello, friend.');
      }).to.throw(Error, 'EISDIR, illegal operation on a directory \'/tmp\'');
    });

    it('should throw on unknown encoding', function () {
      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

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

  describe('closeSync()', function () {

    it('should close the file handle', function () {
      var fd = 0;

      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      fs.handles[fd] = new Descriptor('/tmp/file', flags.RW);

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

    it('should return a readable stream', function (callback) {
      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      var stream = fs.createReadStream('/tmp/file');

      expect(stream.readable).to.equal(true);

      var content = '';

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

    it('should accept fd option', function (callback) {
      var fd = 12;

      fs.files = {tmp: d({'file': f(new Buffer('Hello, friend.'))})};

      fs.handles[fd] = new Descriptor('/tmp/file', flags.RW);

      fs.handles[fd].read = 7;

      var stream = fs.createReadStream('/tmp/file2', {fd: fd});

      expect(stream.readable).to.equal(true);

      var content = '';

      stream.on('readable', function () {
        var chunk = null;

        while ((chunk = stream.read()) !== null) {
          expect(chunk).to.be.an.instanceof(Buffer);

          content += chunk.toString();
        }
      });

      stream.on('error', callback);

      stream.on('end', function () {
        expect(content).to.equal('friend.');

        return callback();
      });
    });

    it('should accept flags option', function (callback) {
      fs.files = {tmp: d({'file': f(new Buffer('Hello, friend.'))})};

      var stream = fs.createReadStream('/tmp/file', {flags: 'a'});

      expect(stream.readable).to.equal(true);

      stream.on('readable', function () {
        return callback(new Error('Event `readable` emitted on non readable file'));
      });

      stream.on('error', function (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.equal('EBADF, read');

        return callback();
      });

      stream.on('end', function () {
        return callback(new Error('Event `end` emitted on non readable file'));
      });
    });

    it('should accept start option', function (callback) {
      fs.files = {tmp: d({'file': f(new Buffer('Hello, friend.'))})};

      var stream = fs.createReadStream('/tmp/file', {start: 2});

      expect(stream.readable).to.equal(true);

      var content = '';

      stream.on('readable', function () {
        var chunk = null;

        while ((chunk = stream.read()) !== null) {
          expect(chunk).to.be.an.instanceof(Buffer);

          content += chunk.toString();
        }
      });

      stream.on('error', callback);

      stream.on('end', function () {
        expect(content).to.equal('llo, friend.');

        return callback();
      });
    });

    it('should accept end option', function (callback) {
      fs.files = {tmp: d({'file': f(new Buffer('Hello, friend.'))})};

      var stream = fs.createReadStream('/tmp/file', {start: 2, end: 8});

      expect(stream.readable).to.equal(true);

      var content = '';

      stream.on('readable', function () {
        var chunk = null;

        while ((chunk = stream.read()) !== null) {
          expect(chunk).to.be.an.instanceof(Buffer);

          content += chunk.toString();
        }
      });

      stream.on('error', callback);

      stream.on('end', function () {
        expect(content).to.equal('llo, fr');

        return callback();
      });
    });

    it('should accept encoding option', function (callback) {
      var content = new Buffer('Hello, friend.');

      fs.files = {tmp: d({file: f(content)})};

      var stream = fs.createReadStream('/tmp/file', {encoding: 'base64'});

      expect(stream.readable).to.equal(true);

      var content = '';

      stream.on('readable', function () {
        var chunk = null;

        while ((chunk = stream.read()) !== null) {
          expect(chunk).to.be.a('string');

          content += chunk.toString();
        }
      });

      stream.on('error', callback);

      stream.on('end', function () {
        expect(content).to.equal(content.toString('base64'));

        return callback();
      });
    });

    it('should close the file descriptor with autoClose option', function (callback) {
      var fd = 12;

      fs.files = {tmp: d({'file': f(new Buffer('Hello, friend.'))})};

      fs.handles[fd] = new Descriptor('/tmp/file', flags.RW);

      fs.handles[fd].read = 7;

      var stream = fs.createReadStream('/tmp/file', {fd: fd});

      stream.on('error', callback);

      stream.on('end', function () {
        expect(fs.handles[fd].closed).to.equal(true);

        return callback();
      });

      stream.pipe(new PassThrough());
    });

    it('should not close the file descriptor without autoClose option', function (callback) {
      var fd = 12;

      fs.files = {tmp: d({'file': f(new Buffer('Hello, friend.'))})};

      fs.handles[fd] = new Descriptor('/tmp/file', flags.WO);

      fs.handles[fd].read = 7;

      var stream = fs.createReadStream('/tmp/file', {fd: fd, autoClose: false});

      stream.on('error', function (error) {
        expect(fs.handles[fd]).to.be.an('object');

        return callback();
      });

      stream.on('end', function () {
        return callback(new Error('Event `end` emitted on non readable file'));
      });

      stream.pipe(new PassThrough());
    });

    it('should emit open event', function (callback) {
      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      var opened = false;
      var stream = fs.createReadStream('/tmp/file', {autoClose: true});

      expect(stream.readable).to.equal(true);

      stream.on('open', function (fd) {
        expect(fd).to.be.a('number');
        expect(fs.handles[fd]).to.be.an('object');
        expect(fs.handles[fd].path).to.equal('/tmp/file');

        opened = true;

        return callback();
      });

      stream.on('end', function () {
        if (opened === false) {
          return callback(new Error('Event `end` emitted before `open`'));
        }
      });

      stream.pipe(new PassThrough());
    });

    it('should emit an error on non existing file', function (callback) {
      var stream = fs.createReadStream('/tmp/file');

      stream.on('readable', function () {
        return callback(new Error('Event `readable` emitted on non existing file'));
      });

      stream.on('error', function (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.equal('ENOENT, open \'/tmp/file\'');

        return callback();
      });

      stream.on('end', function () {
        return callback(new Error('Event `end` emitted on non existing file'));
      });
    });

    it('should emit an error on directory', function (callback) {
      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      var stream = fs.createReadStream('/tmp');

      stream.on('readable', function () {
        return callback(new Error('Event `readable` emitted on non existing file'));
      });

      stream.on('error', function (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.equal('EISDIR, read');

        return callback();
      });

      stream.on('end', function () {
        return callback(new Error('Event `end` emitted on non existing file'));
      });
    });

    it('should emit an error on close error', function (callback) {
      var fd = 12;

      var stream = fs.createReadStream('/tmp/file', {fd: fd, start: 8, end: 8});

      stream.on('error', function (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.equal('EBADF, bad file descriptor');
        expect(error.syscall).to.equal('close');

        return callback();
      });

      stream.on('end', function () {
        return callback(new Error('Event `end` emitted with close error'));
      });

      stream.pipe(new PassThrough());
    });

    it('should throw on non number start option', function () {
      expect(function () {
        fs.createReadStream('/tmp/file', {start: false});
      }).to.throw(TypeError, 'start must be a Number');
    });

    it('should throw on non number end option', function () {
      expect(function () {
        fs.createReadStream('/tmp/file', {start: 0, end: false});
      }).to.throw(TypeError, 'end must be a Number');
    });

    it('should throw on end option less then start option', function () {
      expect(function () {
        fs.createReadStream('/tmp/file', {start: 10, end: 5});
      }).to.throw(Error, 'start must be <= end');
    });

  });

  describe('createWriteStream()', function () {

    it('should return a writable stream', function (callback) {
      fs.files = {tmp: d({'file': f(new Buffer('Hello, friend.'))})};

      var stream = fs.createWriteStream('/tmp/file');

      expect(stream.writable).to.equal(true);

      stream.on('error', callback);

      stream.on('finish', function () {
        expect(fs.files.tmp.file.toString()).to.equal('Hello, world !');

        return callback();
      });

      stream.write('Hello, ');
      stream.end('world !');
    });

    it('should accept fd option', function (callback) {
      var fd = 12;

      fs.files = {tmp: d({'file': f(new Buffer('Hello, friend.'))})};

      fs.handles[fd] = new Descriptor('/tmp/file', flags.RW);

      var stream = fs.createWriteStream('/tmp/file2', {fd: fd});

      expect(stream.writable).to.equal(true);

      stream.on('error', callback);

      stream.on('finish', function () {
        expect(fs.files.tmp.file.toString()).to.equal('Hello, world !');
        expect(fs.files.tmp.file2).to.be.an('undefined');

        return callback();
      });

      stream.end('Hello, world !');
    });

    it('should accept flags option', function (callback) {
      fs.files = {tmp: d({'file': f(new Buffer('Hello, friend.'))})};

      var stream = fs.createWriteStream('/tmp/file', {flags: 'a'});

      expect(stream.writable).to.equal(true);

      stream.on('error', callback);

      stream.on('finish', function () {
        expect(fs.files.tmp.file.toString()).to.equal('Hello, friend. Hello, world !');

        return callback();
      });

      stream.end(' Hello, world !');
    });

    it('should accept start option', function (callback) {
      fs.files = {tmp: d({'file': f(new Buffer('Hello, friend.'))})};

      var stream = fs.createWriteStream('/tmp/file', {flags: 'r+', start: 5});

      expect(stream.writable).to.equal(true);

      stream.on('error', callback);

      stream.on('finish', function () {
        expect(fs.files.tmp.file.toString()).to.equal('Hello, world !');

        return callback();
      });

      stream.end(', world !');
    });

    it('should emit an error on open error', function (callback) {
      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      var stream = fs.createWriteStream('/tmp/file', {flags: 'wx'});

      stream.on('error', function (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.equal('EEXIST, open \'/tmp/file\'');

        return callback();
      });

      stream.on('finish', function () {
        return callback(new Error('Event `finish` emitted on open error'));
      });
    });

    it('should emit an error on directory', function (callback) {
      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      var stream = fs.createWriteStream('/tmp');

      stream.on('error', function (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.equal('EISDIR, open \'/tmp\'');

        return callback();
      });

      stream.on('finish', function () {
        return callback(new Error('Event `finish` emitted on directory'));
      });
    });

    it('should throw on non number start option', function () {
      expect(function () {
        fs.createWriteStream('/tmp/file', {start: false});
      }).to.throw(TypeError, 'start must be a Number');
    });

    it('should throw on negative start option', function () {
      expect(function () {
        fs.createWriteStream('/tmp/file', {start: -1});
      }).to.throw(Error, 'start must be >= zero');
    });

  });

  describe('existsSync()', function () {

    it('should return true for existing file', function () {
      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      expect(fs.existsSync('/tmp/file')).to.equal(true);
    });

    it('should return false for existing file', function () {
      expect(fs.existsSync('/tmp/file')).to.equal(false);
    });

  });

  describe('ftruncateSync()', function () {

    it('should truncate file', function () {
      var fd = 10;

      fs.files = {tmp: d({'file': f(new Buffer('Hello, friend.'))})};

      fs.handles[fd] = new Descriptor('/tmp/file', flags.RW);

      var result = fs.ftruncateSync(fd);

      expect(result).to.be.an('undefined');
      expect(fs.files.tmp.file).to.be.an.instanceof(Buffer);
      expect(fs.files.tmp.file.length).to.equal(0);
    });

    it('should truncate file to the specified length', function () {
      var content = new Buffer('Hello, friend.');
      var fd = 10;

      fs.files = {tmp: d({'file': f(new Buffer('Hello, friend.'))})};

      fs.handles[fd] = new Descriptor('/tmp/file', flags.RW);

      var result = fs.ftruncateSync(fd, 3);

      expect(result).to.be.an('undefined');
      expect(fs.files.tmp.file).to.be.an.instanceof(Buffer);
      expect(fs.files.tmp.file.length).to.equal(3);
      expect(fs.files.tmp.file.toString()).to.equal(content.slice(0, 3).toString());
    });

    it('should throw on non writing file descriptor', function () {
      var fd = 10;

      fs.files = {tmp: d({'file': f(new Buffer('Hello, friend.'))})};

      fs.handles[fd] = new Descriptor('/tmp/file', flags.RO);

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
      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      expect(function () {
        fs.ftruncateSync(0, true);
      }).to.throw(TypeError, 'Not an integer');
    });

  });

  describe('mkdirSync()', function () {

    it('should create a new directory', function () {
      fs.files = {tmp: d({})};

      var result = fs.mkdirSync('/tmp/dir');

      expect(result).to.be.an('undefined');

      expect(fs.files.tmp).to.contain.keys('dir');
      expect(fs.files.tmp.dir).to.deep.equal({});
    });

    it('should create a new directory on root', function () {
      fs.files = {tmp: d({})};

      var result = fs.mkdirSync('/dir');

      expect(result).to.be.an('undefined');

      expect(fs.files).to.contain.keys('dir');
      expect(fs.files.dir).to.deep.equal({});
    });

    it('should accept mode parameter as string', function () {
      fs.files = {tmp: d({})};

      var result = fs.mkdirSync('/tmp/dir', '0500');

      expect(result).to.be.an('undefined');

      expect(fs.files.tmp).to.contain.keys('dir');
      expect(fs.files.tmp.dir).to.deep.equal({});

      expect(fs.files.tmp.dir['@mode']).to.equal(parseInt('0500', 8));
    });

    it('should accept mode parameter as number', function () {
      fs.files = {tmp: d({})};

      var result = fs.mkdirSync('/tmp/dir', 438);

      expect(result).to.be.an('undefined');

      expect(fs.files.tmp).to.contain.keys('dir');
      expect(fs.files.tmp.dir).to.deep.equal({});

      expect(fs.files.tmp.dir['@mode']).to.equal(parseInt('0666', 8));
    });

    it('should set mode to 0777 by default', function () {
      fs.files = {tmp: d({})};

      var result = fs.mkdirSync('/tmp/dir');

      expect(result).to.be.an('undefined');

      expect(fs.files.tmp).to.contain.keys('dir');
      expect(fs.files.tmp.dir).to.deep.equal({});

      expect(fs.files.tmp.dir['@mode']).to.equal(parseInt('0777', 8));
    });

    it('should throw on existing path', function () {
      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      expect(function () {
        fs.mkdirSync('/tmp');
      }).to.throw(Error, 'EEXIST, file already exists \'/tmp\'');
    });

    it('should throw on non existing parent directory', function () {
      expect(function () {
        fs.mkdirSync('/tmp/file');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/tmp/file\'');
    });

    it('should throw on not directory parent', function () {
      fs.files = {tmp: f(new Buffer('Hello, friend.'))};

      expect(function () {
        fs.mkdirSync('/tmp/file');
      }).to.throw(Error, 'ENOTDIR, not a directory \'/tmp/file\'');
    });

    it('should throw on non string path', function () {
      expect(function () {
        fs.mkdirSync(true);
      }).to.throw(TypeError, 'Bad argument');
    });

  });

  describe('openSync()', function () {

    it('should return a file descriptor', function () {
      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      var fd = fs.openSync('/tmp/file', 'r');

      expect(fd).to.be.a('number');

      var key = fd.toString();

      expect(fs.handles).to.contain.keys(key);
      expect(fs.handles[key].path).to.equal('/tmp/file');
    });

    it('should throw on non unknown flags', function () {
      expect(function () {
        fs.openSync('/tmp/file', 'p');
      }).to.throw(Error, 'Unknown file open flag: p');
    });

    it('should throw on non existing file in read mode', function () {
      ['r', 'r+', 'rs', 'rs+'].forEach(function (flags) {
        expect(function () {
          fs.openSync('/tmp/file', flags);
        }).to.throw(Error, 'ENOENT, no such file or directory \'/tmp/file\'', 'with flags \'' + flags + '\'');
      });
    });

    it('should throw on existing file in exclusive mode', function () {
      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      ['wx', 'xw', 'wx+', 'xw+', 'ax', 'xa', 'ax+', 'xa+'].forEach(function (flags) {
        expect(function () {
          fs.openSync('/tmp/file', flags);
        }).to.throw(Error, 'EEXIST, file already exists \'/tmp/file\'', 'with flags \'' + flags + '\'');
      });
    });

    it('should create non existing file in create mode', function () {
      [
        'w',  'wx',  'xw',
        'w+', 'wx+', 'xw+',
        'a',  'ax',  'xa',
        'a+', 'ax+', 'xa+'
      ].forEach(function (flags) {
        var filename = 'file-' + flags + '';

        var fd = fs.openSync('/' + filename, flags);

        expect(fd).to.be.a('number');

        expect(fs.files).to.contain.keys(filename);
        expect(fs.files[filename]).to.be.an.instanceof(Buffer);
        expect(fs.files[filename].length).to.equal(0);
      });
    });

    it('should erase existing file in truncate mode', function () {
      ['w',  'w+'].forEach(function (flags) {
        var filename = 'file-' + flags + '';

        fs.files[filename] = f(new Buffer('Hello, friend.'));

        var fd = fs.openSync('/' + filename, flags);

        expect(fd).to.be.a('number');

        expect(fs.files[filename].length).to.equal(0);
      });
    });

    it('should not erase existing file in append mode', function () {
      ['a',  'a+'].forEach(function (flags) {
        var filename = 'file-' + flags + '';

        fs.files[filename] = f(new Buffer('Hello, friend.'));

        var fd = fs.openSync('/' + filename, flags);

        expect(fd).to.be.a('number');

        expect(fs.files[filename].toString()).to.equal('Hello, friend.');
      });
    });

  });

  describe('readSync()', function () {

    it('should read the file', function () {
      var fd = 0;

      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      fs.handles[fd] = new Descriptor('/tmp/file', flags.RW);

      var buffer = new Buffer(5);

      var bytesRead = fs.readSync(fd, buffer, 0, 5, 0);

      expect(bytesRead).to.equal(5);
      expect(buffer.toString()).to.equal('Hello');
    });

    it('should read the file from position', function () {
      var fd = 0;

      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      fs.handles[fd] = new Descriptor('/tmp/file', flags.RW);

      var buffer = new Buffer(5);

      var bytesRead = fs.readSync(fd, buffer, 0, 5, 5);

      expect(bytesRead).to.equal(5);
      expect(buffer.toString()).to.equal(', fri');
    });

    it('should read the file from current position', function () {
      var fd = 0;

      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      fs.handles[fd] = new Descriptor('/tmp/file', flags.RW);

      fs.handles[fd].read = 5;

      var buffer = new Buffer(5);

      var bytesRead = fs.readSync(fd, buffer, 0, 5, null);

      expect(bytesRead).to.equal(5);
      expect(fs.handles[fd].read).to.equal(10);
      expect(buffer.toString()).to.equal(', fri');
    });

    it('should fill the buffer from offset', function () {
      var fd = 0;

      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      fs.handles[fd] = new Descriptor('/tmp/file', flags.RW);

      var buffer = new Buffer('Hello, world!');

      var bytesRead = fs.readSync(fd, buffer, 7, 6, 7);

      expect(bytesRead).to.equal(6);
      expect(buffer.toString()).to.equal('Hello, friend');
    });

    it('should not read file beyond his length', function () {
      var fd = 0;

      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      fs.handles[fd] = new Descriptor('/tmp/file', flags.RW);

      fs.handles[fd].read = 14;

      var buffer = new Buffer('Hello, world!');

      var bytesRead = fs.readSync(fd, buffer, 0, 10, null);

      expect(bytesRead).to.equal(0);
      expect(buffer.toString()).to.equal('Hello, world!');
    });

    it('should fail on non existing fd', function () {
      expect(function () {
        fs.readSync(0, new Buffer(5), 0, 5, 0);
      }).to.throw(Error, 'EBADF, read');
    });

    it('should fail on closed fd', function () {
      var fd = 0;

      fs.handles[fd] = new Descriptor('/tmp/file', flags.RW);

      fs.handles[fd].close();

      expect(function () {
        fs.readSync(fd, new Buffer(5), 0, 5, 0);
      }).to.throw(Error, 'EBADF, read');
    });

    it('should fail on non reading fd', function () {
      var fd = 0;

      fs.handles[fd] = new Descriptor('/tmp/file', flags.WO);

      expect(function () {
        fs.readSync(fd, new Buffer(5), 0, 5, 0);
      }).to.throw(Error, 'EBADF, read');
    });

    it('should fail on directory', function () {
      var fd = 0;

      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      fs.handles[fd] = new Descriptor('/tmp', flags.RW);

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
        fs.readSync(0, new Buffer(10), 1000, 0, 0, function () {});
      }).to.throw(Error, 'Offset is out of bounds');
    });

    it('should throw on length beyond buffer', function () {
      expect(function () {
        fs.readSync(0, new Buffer(10), 0, 1000, 0, function () {});
      }).to.throw(Error, 'Length extends beyond buffer');
    });

  });

  describe('readdirSync()', function () {

    it('should list directory files', function () {
      fs.files = {
        tmp: d({
          'fileA': f(new Buffer('Hello, friend.')),
          'fileB': f(new Buffer('Hello, friend.')),
          'fileC': f(new Buffer('Hello, friend.'))
        })
      };

      var result = fs.readdirSync('/tmp');

      expect(result).to.be.an('array');
      expect(result).to.deep.equal([
        'fileA',
        'fileB',
        'fileC'
      ]);
    });

    it('should throw on non existing path', function () {
      expect(function () {
        fs.readdirSync('/tmp');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/tmp\'');
    });

    it('should throw on file', function () {
      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

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
      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      var content = fs.readFileSync('/tmp/file');

      expect(content).to.be.an.instanceof(Buffer);
      expect(content.toString()).to.equal('Hello, friend.');
    });

    it('should return an encoded string', function () {
      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      var content = fs.readFileSync('/tmp/file', {encoding: 'utf8'});

      expect(content).to.be.a('string');
      expect(content).to.equal('Hello, friend.');
    });

    it('should accept the encoding as options', function () {
      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      var content = fs.readFileSync('/tmp/file', 'utf8');

      expect(content).to.be.a('string');
      expect(content).to.equal('Hello, friend.');
    });

    it('should throw on non existing file', function () {
      expect(function () {
        fs.readFileSync('/tmp/file');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/tmp/file\'');
    });

    it('should throw on directory', function () {
      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      expect(function () {
        fs.readFileSync('/tmp');
      }).to.throw(Error, 'EISDIR, illegal operation on a directory');
    });

    it('should throw on unknown encoding', function () {
      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

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

  describe('renameSync()', function () {

    it('should rename files', function () {
      var content = new Buffer('Hello, friend.');

      fs.files = {tmp: d({old: f(content)})};

      var result = fs.renameSync('/tmp/old', '/tmp/file');

      expect(result).to.be.an('undefined');
      expect(fs.files.tmp).to.contain.keys('file');
      expect(fs.files.tmp.file).to.equal(content);
    });

    it('should rename files', function () {
      var content = new Buffer('Hello, friend.');

      fs.files = {tmp: d({old: f(content)})};

      var result = fs.renameSync('/tmp/old', '/var/old');

      expect(result).to.be.an('undefined');
      expect(fs.files.var).to.contain.keys('old');
      expect(fs.files.var.old).to.equal(content);
    });

    it('should throw on non existing path', function () {
      expect(function () {
        fs.renameSync('/tmp/old', '/tmp/new');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/tmp/old\'');
    });

  });

  describe('rmdirSync()', function () {

    it('should delete file', function () {
      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      var result = fs.rmdirSync('/tmp');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.deep.equal({});
    });

    it('should throw on non existing path', function () {
      expect(function () {
        fs.rmdirSync('/tmp');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/tmp\'');
    });

    it('should throw on file', function () {
      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      expect(function () {
        fs.rmdirSync('/tmp/file');
      }).to.throw(Error, 'ENOTDIR, not a directory \'/tmp/file\'');
    });

    it('should throw on non string path', function () {
      expect(function () {
        fs.rmdirSync(true);
      }).to.throw(TypeError, 'path must be a string');
    });

  });

  describe('truncateSync()', function () {

    it('should truncate file', function () {
      var content = new Buffer('Hello, friend.');

      fs.files = {tmp: d({file: f(content)})};

      var result = fs.truncateSync('/tmp/file');

      expect(result).to.be.an('undefined');
      expect(fs.files.tmp.file).to.be.an.instanceof(Buffer);
      expect(fs.files.tmp.file.length).to.equal(0);
    });

    it('should truncate file to the specified length', function () {
      var content = new Buffer('Hello, friend.');

      fs.files = {tmp: d({file: f(content)})};

      var result = fs.truncateSync('/tmp/file', 3);

      expect(result).to.be.an('undefined');
      expect(fs.files.tmp.file).to.be.an.instanceof(Buffer);
      expect(fs.files.tmp.file.length).to.equal(3);
      expect(fs.files.tmp.file.toString()).to.equal(content.slice(0, 3).toString());
    });

    it('should throw on non existing path', function () {
      expect(function () {
        fs.truncateSync('/tmp/file');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/tmp/file\'');
    });

    it('should throw on directory', function () {
      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

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
      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      expect(function () {
        fs.truncateSync('/tmp/file', true);
      }).to.throw(TypeError, 'Not an integer');
    });

  });

  describe('unlinkSync()', function () {

    it('should delete file', function () {
      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      var result = fs.unlinkSync('/tmp/file');

      expect(result).to.be.an('undefined');
      expect(fs.files.tmp).to.deep.equal({});
    });

    it('should throw on non existing path', function () {
      expect(function () {
        fs.unlinkSync('/tmp/file');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/tmp/file\'');
    });

    it('should throw on directory', function () {
      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      expect(function () {
        fs.unlinkSync('/tmp');
      }).to.throw(Error, 'EISDIR, illegal operation on a directory \'/tmp\'');
    });

    it('should throw on non string path', function () {
      expect(function () {
        fs.unlinkSync(true);
      }).to.throw(TypeError, 'path must be a string');
    });

  });

  describe('writeSync()', function () {

    it('should write in the file', function () {
      var fd = 0;

      fs.files = {tmp: d({})};

      fs.handles[fd] = new Descriptor('/tmp/file', flags.RW);

      var written = fs.writeSync(fd, new Buffer('Hello, friend'), 0, 5, 0);

      expect(written).to.equal(5);

      expect(fs.files.tmp.file).to.be.an.instanceof(Buffer);
      expect(fs.files.tmp.file.toString()).to.equal('Hello');
    });

    it('should write the file from position', function () {
      var fd = 0;

      fs.files = {tmp: d({'file': f(new Buffer('Hello, world'))})};

      fs.handles[fd] = new Descriptor('/tmp/file', flags.RW);

      var written = fs.writeSync(fd, new Buffer('Hello, friend'), 0, 5, 7);

      expect(written).to.equal(5);

      expect(fs.files.tmp.file).to.be.an.instanceof(Buffer);
      expect(fs.files.tmp.file.toString()).to.equal('Hello, Hello');
    });

    it('should always append data to the end in append mode', function () {
      var fd = 0;

      fs.files = {tmp: d({'file': f(new Buffer('Hello, world'))})};

      fs.handles[fd] = new Descriptor('/tmp/file', flags.RW | flags.APPEND);

      expect(fs.writeSync(fd, new Buffer('Hello'), 0, 5, 2)).to.equal(5);
      expect(fs.writeSync(fd, new Buffer('Hello'), 0, 5, 2)).to.equal(5);

      expect(fs.files.tmp.file).to.be.an.instanceof(Buffer);
      expect(fs.files.tmp.file.toString()).to.equal('Hello, worldHelloHello');
    });

    it('should write the file from current position', function () {
      var fd = 0;

      fs.files = {tmp: d({'file': f(new Buffer('Hello, world'))})};

      fs.handles[fd] = new Descriptor('/tmp/file', flags.RW);

      fs.handles[fd].write = 7;

      var written = fs.writeSync(fd, new Buffer('Hello, friend'), 0, 5, null);

      expect(written).to.equal(5);

      expect(fs.files.tmp.file).to.be.an.instanceof(Buffer);
      expect(fs.files.tmp.file.toString()).to.equal('Hello, Hello');

      expect(fs.handles[fd].write).to.equal(12);
    });

    it('should read the buffer from offset', function () {
      var fd = 0;

      fs.files = {tmp: d({})};

      fs.handles[fd] = new Descriptor('/tmp/file', flags.RW);

      var written = fs.writeSync(fd, new Buffer('Hello, friend'), 7, 6, null);

      expect(written).to.equal(6);

      expect(fs.files.tmp.file).to.be.an.instanceof(Buffer);
      expect(fs.files.tmp.file.toString()).to.equal('friend');
    });

    it('should fill unwritten parts with white spaces', function () {
      var fd = 0;

      fs.files = {tmp: d({'file': f(new Buffer('Hello, world'))})};

      fs.handles[fd] = new Descriptor('/tmp/file', flags.RW);

      var written = fs.writeSync(fd, new Buffer('OK'), 0, 2, 20);

      expect(written).to.equal(2);

      expect(fs.files.tmp.file).to.be.an.instanceof(Buffer);
      expect(fs.files.tmp.file.toString()).to.equal('Hello, world        OK');
    });

    it('should fail on non existing fd', function () {
      expect(function () {
        fs.writeSync(0, new Buffer('Hello, friend'), 0, 5, 0);
      }).to.throw(Error, 'EBADF, write');
    });

    it('should fail on closed fd', function () {
      var fd = 0;

      fs.handles[fd] = new Descriptor('/tmp/file', flags.RW);

      fs.handles[fd].close();

      expect(function () {
        fs.writeSync(fd, new Buffer('Hello, friend'), 0, 5, 0);
      }).to.throw(Error, 'EBADF, write');
    });

    it('should fail on non writing fd', function () {
      var fd = 0;

      fs.files = {tmp: d({})};

      fs.handles[fd] = new Descriptor('/tmp/file', flags.RO);

      expect(function () {
        fs.writeSync(fd, new Buffer('Hello, friend'), 0, 5, 0);
      }).to.throw(Error, 'EBADF, write');
    });

    it('should throw on bad fd type', function () {
      expect(function () {
        fs.writeSync(true);
      }).to.throw(TypeError, 'Bad arguments');
    });

    it('should throw on offset out of bounds', function () {
      expect(function () {
        fs.writeSync(0, new Buffer('Hello, friend'), 1000, 0, 0, function () {});
      }).to.throw(Error, 'Offset is out of bounds');
    });

    it('should throw on length beyond buffer', function () {
      expect(function () {
        fs.writeSync(0, new Buffer('Hello, friend'), 0, 1000, 0, function () {});
      }).to.throw(Error, 'off + len > buffer.length');
    });

  });

  describe('writeFileSync()', function () {

    it('should write buffer to file', function () {
      fs.files = {tmp: d({})};

      var result = fs.writeFileSync('/tmp/file', new Buffer('Hello, friend.'));

      expect(result).to.be.an('undefined');
      expect(fs.files.tmp).to.contain.keys('file');
      expect(fs.files.tmp.file).to.be.an.instanceof(Buffer);
      expect(fs.files.tmp.file.toString()).to.equal('Hello, friend.');
    });

    it('should write string to file', function () {
      fs.files = {tmp: d({})};

      var result = fs.writeFileSync('/tmp/file', 'Hello, friend.');

      expect(result).to.be.an('undefined');
      expect(fs.files.tmp).to.contain.keys('file');
      expect(fs.files.tmp.file).to.be.an.instanceof(Buffer);
      expect(fs.files.tmp.file.toString()).to.equal('Hello, friend.');
    });

    it('should write encoded string to file', function () {
      fs.files = {tmp: d({})};

      var result = fs.writeFileSync('/tmp/file', 'aàâäeéèâë', {encoding: 'ascii'});

      expect(result).to.be.an('undefined');
      expect(fs.files.tmp).to.contain.keys('file');
      expect(fs.files.tmp.file).to.be.an.instanceof(Buffer);
      expect(fs.files.tmp.file.toString()).to.equal(new Buffer('aàâäeéèâë', 'ascii').toString());
      expect(fs.files.tmp.file.toString()).to.not.equal(new Buffer('aàâäeéèâë', 'utf8').toString());
    });

    it('should accept the encoding as options', function () {
      fs.files = {tmp: d({})};

      var result = fs.writeFileSync('/tmp/file', 'aàâäeéèâë', 'ascii');

      expect(result).to.be.an('undefined');
      expect(fs.files.tmp).to.contain.keys('file');
      expect(fs.files.tmp.file).to.be.an.instanceof(Buffer);
      expect(fs.files.tmp.file.toString()).to.equal(new Buffer('aàâäeéèâë', 'ascii').toString());
      expect(fs.files.tmp.file.toString()).to.not.equal(new Buffer('aàâäeéèâë', 'utf8').toString());
    });

    it('should throw on non existing parent directory', function () {
      expect(function () {
        fs.writeFileSync('/tmp/file', 'Hello, friend.');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/tmp/file\'');
    });

    it('should throw on not directory parent', function () {
      fs.files = {tmp: f(new Buffer('Hello, friend.'))};

      expect(function () {
        fs.writeFileSync('/tmp/file', 'Hello, friend.');
      }).to.throw(Error, 'ENOTDIR, not a directory \'/tmp/file\'');
    });

    it('should throw on directory path', function () {
      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      expect(function () {
        fs.writeFileSync('/tmp', 'Hello, friend.');
      }).to.throw(Error, 'EISDIR, illegal operation on a directory \'/tmp\'');
    });

    it('should throw on unknown encoding', function () {
      fs.files = {tmp: d({file: f(new Buffer('Hello, friend.'))})};

      expect(function () {
        fs.writeFileSync('/tmp/file', 'Hello, friend.', 'utf5');
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

});
