'use strict';

var chai   = require('chai');
var expect = chai.expect;

var AVFS = require('../lib/avfs');

var fs = new AVFS();

describe('avfs', function () {

  beforeEach('reset virtual file system', function () {
    fs.files   = {};
    fs.handles = {};
    fs.next    = 0;
  });

  describe('existsSync()', function () {

    it('should return true for existing file', function () {
      fs.files = {'tmp': {'file.txt': new Buffer('Hello, friend.')}};

      expect(fs.existsSync('/tmp/file.txt')).to.equal(true);
    });

    it('should return false for existing file', function () {
      expect(fs.existsSync('/tmp/file.txt')).to.equal(false);
    });

  });

  describe('openSync()', function () {

    it('should return a file descriptor', function () {
      fs.files = {'tmp': {'file.txt': new Buffer('Hello, friend.')}};

      var fd = fs.openSync('/tmp/file.txt', 'r');

      expect(fd).to.be.a('number');

      var key = fd.toString();

      expect(fs.handles).to.contain.keys(key);
      expect(fs.handles[key].path).to.equal('/tmp/file.txt');
    });

    it('should throw on non unknown flags', function () {
      expect(function () {
        fs.openSync('/tmp/file.txt', 'p');
      }).to.throw(Error, 'Unknown file open flag: p');
    });

    it('should throw on non existing file in read mode', function () {
      ['r', 'r+', 'rs', 'rs+'].forEach(function (flags) {
        expect(function () {
          fs.openSync('/tmp/file.txt', flags);
        }).to.throw(Error, 'Error: ENOENT, no such file or directory \'/tmp/file.txt\'', 'with flags \'' + flags + '\'');
      });
    });

    it('should throw on existing file in exclusive mode', function () {
      fs.files = {'tmp': {'file.txt': new Buffer('Hello, friend.')}};

      ['wx', 'xw', 'wx+', 'xw+', 'ax', 'xa', 'ax+', 'xa+'].forEach(function (flags) {
        expect(function () {
          fs.openSync('/tmp/file.txt', flags);
        }).to.throw(Error, 'Error: EEXIST, file already exists \'/tmp/file.txt\'', 'with flags \'' + flags + '\'');
      });
    });

    it('should create non existing file in create mode', function () {
      [
        'w',  'wx',  'xw',
        'w+', 'wx+', 'xw+',
        'a',  'ax',  'xa',
        'a+', 'ax+', 'xa+'
      ].forEach(function (flags) {
        var filename = 'file-' + flags + '.txt';

        var fd = fs.openSync('/' + filename, flags);

        expect(fd).to.be.a('number');

        expect(fs.files).to.contain.keys(filename);
        expect(fs.files[filename]).to.be.an.instanceof(Buffer);
        expect(fs.files[filename].length).to.equal(0);
      });
    });

    it('should erase existing file in truncate mode', function () {
      ['w',  'w+'].forEach(function (flags) {
        var filename = 'file-' + flags + '.txt';

        fs.files[filename] = new Buffer('Hello, friend.');

        var fd = fs.openSync('/' + filename, flags);

        expect(fd).to.be.a('number');

        expect(fs.files[filename].length).to.equal(0);
      });
    });

    it('should not erase existing file in append mode', function () {
      ['a',  'a+'].forEach(function (flags) {
        var filename = 'file-' + flags + '.txt';

        fs.files[filename] = new Buffer('Hello, friend.');

        var fd = fs.openSync('/' + filename, flags);

        expect(fd).to.be.a('number');

        expect(fs.files[filename].toString()).to.equal('Hello, friend.');
      });
    });

  });

  describe('renameSync()', function () {

    it('should rename files', function () {
      var content = new Buffer('Hello, friend.');

      fs.files = {'tmp': {'old.txt': content}};

      var result = fs.renameSync('/tmp/old.txt', '/tmp/new.txt');

      expect(result).to.be.an('undefined');
      expect(fs.files.tmp).to.contain.keys('new.txt');
      expect(fs.files.tmp['new.txt']).to.equal(content);
    });

    it('should rename files', function () {
      var content = new Buffer('Hello, friend.');

      fs.files = {'tmp': {'old.txt': content}};

      var result = fs.renameSync('/tmp/old.txt', '/var/old.txt');

      expect(result).to.be.an('undefined');
      expect(fs.files.var).to.contain.keys('old.txt');
      expect(fs.files.var['old.txt']).to.equal(content);
    });

    it('should throw on non existing path', function () {
      expect(function () {
        fs.renameSync('/tmp/old.txt', '/tmp/new.txt');
      }).to.throw(Error, 'Error: ENOENT, no such file or directory \'/tmp/old.txt\'');
    });

  });

  describe('truncateSync()', function () {

    it('should truncate file', function () {
      var content = new Buffer('Hello, friend.');

      fs.files = {'tmp': {'file.txt': content}};

      var result = fs.truncateSync('/tmp/file.txt');

      expect(result).to.be.an('undefined');
      expect(fs.files.tmp['file.txt']).to.be.an.instanceof(Buffer);
      expect(fs.files.tmp['file.txt'].length).to.equal(0);
    });

    it('should truncate file to the specified length', function () {
      var content = new Buffer('Hello, friend.');

      fs.files = {'tmp': {'file.txt': content}};

      var result = fs.truncateSync('/tmp/file.txt', 3);

      expect(result).to.be.an('undefined');
      expect(fs.files.tmp['file.txt']).to.be.an.instanceof(Buffer);
      expect(fs.files.tmp['file.txt'].length).to.equal(3);
      expect(fs.files.tmp['file.txt'].toString()).to.equal(content.slice(0, 3).toString());
    });

    it('should throw on non existing path', function () {
      expect(function () {
        fs.truncateSync('/tmp/file.txt');
      }).to.throw(Error, 'Error: ENOENT, no such file or directory \'/tmp/file.txt\'');
    });

    it('should throw on directory', function () {
      fs.files = {'tmp': {'file.txt': new Buffer('Hello, friend.')}};

      expect(function () {
        fs.truncateSync('/tmp');
      }).to.throw(Error, 'Error: EISDIR, illegal operation on a directory \'/tmp\'');
    });

    it('should throw on non string path', function () {
      expect(function () {
        fs.truncateSync(true);
      }).to.throw(TypeError, 'path must be a string');
    });

    it('should throw on non integer length', function () {
      fs.files = {'tmp': {'file.txt': new Buffer('Hello, friend.')}};

      expect(function () {
        fs.truncateSync('/tmp/file.txt', true);
      }).to.throw(TypeError, 'Not an integer');
    });

  });

});
