'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('lib/common/constants');
var elements  = require('lib/common/elements');
var storage   = require('lib/common/storage');

var AVFS        = require('lib/avfs');
var Descriptor  = require('lib/common/descriptor');
var WriteStream = require('lib/common/write-stream');

var fs = new AVFS();

var getElement = function (path) {
  var current = fs.files;

  storage.parse(path).forEach(function (element) {
    current = current.get('content')[element];
  });

  return current;
};

describe('common/write-stream', function () {

  beforeEach('reset virtual file system', function () {
    fs.files = elements.directory(parseInt('0755', 8), {
      empty: elements.file(parseInt('0666', 8), new Buffer(0)),
      file:  elements.file(parseInt('0666', 8), new Buffer('Hello, friend.'))
    });
  });

  it('should expose a constructor', function () {
    expect(WriteStream).to.be.a('function');
    expect(new WriteStream(fs, '/file')).to.be.an.instanceOf(WriteStream);
    expect(WriteStream(fs, '/file')).to.be.an.instanceOf(WriteStream);
  });

  it('should return a writable stream', function (callback) {
    var stream = new WriteStream(fs, '/file');

    expect(stream.writable).to.equal(true);

    stream.on('error', callback);

    stream.on('finish', function () {
      expect(fs.files).to.contain.an.avfs.file('/file').that.contain('Hello, world !');

      return callback();
    });

    stream.write('Hello, ');
    stream.end('world !');
  });

  it('should accept fd option', function (callback) {
    var fd = 12;

    fs.handles[fd] = new Descriptor(getElement('/file'), '/file', constants.O_RDWR);

    var stream = new WriteStream(fs, '/file2', {fd: fd});

    expect(stream.writable).to.equal(true);

    stream.on('error', callback);

    stream.on('finish', function () {
      expect(fs.files).to.contain.an.avfs.file('/file').that.contain('Hello, world !');
      expect(getElement('/file2')).to.be.an('undefined');

      return callback();
    });

    stream.end('Hello, world !');
  });

  it('should accept flags option', function (callback) {
    var stream = new WriteStream(fs, '/file', {flags: 'a'});

    expect(stream.writable).to.equal(true);

    stream.on('error', callback);

    stream.on('finish', function () {
      expect(fs.files).to.contain.an.avfs.file('/file').that.contain('Hello, friend. Hello, world !');

      return callback();
    });

    stream.end(' Hello, world !');
  });

  it('should accept mode option', function (callback) {
    var stream = new WriteStream(fs, '/new', {mode: '0700'});

    expect(stream.writable).to.equal(true);

    stream.on('error', callback);

    stream.on('finish', function () {
      try {
        expect(fs.files).to.contain.an.avfs.file('/new').with.mode('0700');
      } catch (error) {
        return callback(error);
      }

      return callback();
    });

    stream.end('Hello, world !');
  });

  it('should accept start option', function (callback) {
    var stream = new WriteStream(fs, '/file', {flags: 'r+', start: 5});

    expect(stream.writable).to.equal(true);

    stream.on('error', callback);

    stream.on('finish', function () {
      expect(fs.files).to.contain.an.avfs.file('/file').that.contain('Hello, world !');

      return callback();
    });

    stream.end(', world !');
  });

  it('should emit an error on open error', function (callback) {
    var stream = new WriteStream(fs, '/file', {flags: 'wx'});

    stream.on('error', function (error) {
      expect(error).to.be.an('error');
      expect(error.message).to.equal('EEXIST, open \'/file\'');

      return callback();
    });

    stream.on('finish', function () {
      return callback(new Error('Event `finish` emitted on open error'));
    });
  });

  it('should emit an error on directory', function (callback) {
    var stream = new WriteStream(fs, '/');

    stream.on('error', function (error) {
      expect(error).to.be.an('error');
      expect(error.message).to.equal('EISDIR, open \'/\'');

      return callback();
    });

    stream.on('finish', function () {
      return callback(new Error('Event `finish` emitted on directory'));
    });
  });

  it('should throw on non number start option', function () {
    expect(function () {
      return new WriteStream(fs, '/file', {start: false});
    }).to.throw(TypeError, 'start must be a Number');
  });

  it('should throw on negative start option', function () {
    expect(function () {
      return new WriteStream(fs, '/file', {start: -1});
    }).to.throw(Error, 'start must be >= zero');
  });

});
