'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('test/unit/fixtures/constants');

var elements = require('lib/common/elements')(constants);

describe('common/elements', function () {

  it('should expose a directory factory', function () {
    var mode = '0777';

    // Without children

    var directory = elements.directory(parseInt(mode, 8));

    expect(directory).to.be.an.avfs.directory.with.mode(mode).and.is.clear();

    // With children

    var children = {
      test: true
    };

    directory = elements.directory(parseInt(mode, 8), children);

    expect(directory).to.be.an.avfs.directory.with.mode(mode);
    expect(directory.get('content')).to.deep.equal(children);
  });

  it('should expose a file factory', function () {
    var content = new Buffer('Hello, friend.');
    var mode    = '0666';

    var file = elements.file(parseInt(mode, 8), content);

    expect(file).to.be.an.avfs.file.that.contain(content).with.mode(mode);
  });

  it('should expose a symlink factory', function () {
    var target = '/path/to/target';
    var mode   = '0777';

    var link = elements.symlink(parseInt(mode, 8), target);

    expect(link).to.be.an.avfs.symlink.with.mode(mode).that.target(target);
  });

  it('should set an inode number', function () {
    var fileA = elements.file(parseInt('0666', 8), 'Hello, friend.');
    var fileB = elements.file(parseInt('0666', 8), 'Hello, friend.');

    expect(fileA.get('inode')).to.be.a('number').above(0);
    expect(fileB.get('inode')).to.be.a('number').above(0);

    expect(fileB.get('inode')).to.equal(fileA.get('inode') + 1);
  });

  it('should set element owner and group', function () {
    var file = elements.file(parseInt('0666', 8), 'Hello, friend.');

    expect(file.get('uid')).to.equal(process.getuid());
    expect(file.get('gid')).to.equal(process.getgid());
  });

  it('should update ctime', function (done) {
    var file = elements.file(parseInt('0666', 8), 'Hello, friend.');

    var before = null;
    var after  = null;

    setTimeout(function () {
      before = file.get('mtime');

      file.set('atime', new Date());

      after = file.get('mtime');

      expect(before.getTime()).to.equal(after.getTime());

      var values = [
        {name: 'content', value: 'Hello, world !'},
        {name: 'mode',    value: parseInt('0777', 8)},
        {name: 'gid',     value: 1000},
        {name: 'uid',     value: 1000},
        {name: 'nlink',   value: 5}
      ];

      var interval = setInterval(function () {
        var property = values.pop();

        if (typeof property !== 'undefined') {
          clearInterval(interval);

          return done();
        }

        before = file.get('ctime');

        file.set(property.name, property.value);

        after = file.get('ctime');

        expect(before.getTime()).to.be.below(after.getTime());
      }, 50);
    }, 50);
  });

  it('should update mtime', function (done) {
    var file = elements.file(parseInt('0666', 8), 'Hello, friend.');

    var before = file.get('mtime');

    setTimeout(function () {
      file.set('content', 'Hello, world !');

      var after = file.get('mtime');

      expect(before.getTime()).to.be.below(after.getTime());

      done();
    }, 50);
  });

  describe('element', function () {

    var file = elements.file(parseInt('0770', 8));

    file.set('uid', 0);
    file.set('gid', 0);

    describe('isReadable()', function () {

      it('should return true if the user has read permission', function () {
        expect(elements.file(parseInt('0400', 8)).isReadable()).to.equal(true);
        expect(elements.file(parseInt('0060', 8)).isReadable()).to.equal(true);
        expect(elements.file(parseInt('0007', 8)).isReadable()).to.equal(true);
      });

      it('should return false if the user has not read permission', function () {
        expect(elements.file(parseInt('0100', 8)).isReadable()).to.equal(false);
        expect(elements.file(parseInt('0020', 8)).isReadable()).to.equal(false);
        expect(elements.file(parseInt('0003', 8)).isReadable()).to.equal(false);
        expect(file.isReadable()).to.equal(false);
      });

    });

    describe('isWritable()', function () {

      it('should return true if the user has write permission', function () {
        expect(elements.file(parseInt('0200', 8)).isWritable()).to.equal(true);
        expect(elements.file(parseInt('0060', 8)).isWritable()).to.equal(true);
        expect(elements.file(parseInt('0007', 8)).isWritable()).to.equal(true);
      });

      it('should return false if the user has not write permission', function () {
        expect(elements.file(parseInt('0100', 8)).isWritable()).to.equal(false);
        expect(elements.file(parseInt('0040', 8)).isWritable()).to.equal(false);
        expect(elements.file(parseInt('0005', 8)).isWritable()).to.equal(false);
        expect(file.isWritable()).to.equal(false);
      });

    });

    describe('isExecutable()', function () {

      it('should return true if the user has execute permission', function () {
        expect(elements.file(parseInt('0100', 8)).isExecutable()).to.equal(true);
        expect(elements.file(parseInt('0030', 8)).isExecutable()).to.equal(true);
        expect(elements.file(parseInt('0007', 8)).isExecutable()).to.equal(true);
      });

      it('should return false if the user has not execute permission', function () {
        expect(elements.file(parseInt('0200', 8)).isExecutable()).to.equal(false);
        expect(elements.file(parseInt('0040', 8)).isExecutable()).to.equal(false);
        expect(elements.file(parseInt('0006', 8)).isExecutable()).to.equal(false);
        expect(file.isExecutable()).to.equal(false);
      });

    });

  });

});
