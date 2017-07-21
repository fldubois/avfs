'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('test/unit/fixtures/constants');

var elements = require('lib/common/elements')(constants);

var Stats = require('lib/common/components/stats');

var elems = {
  directory: elements.directory(parseInt('777', 8)),
  file:      elements.file(parseInt('777', 8), 'Hello'),
  symlink:   elements.symlink(parseInt('777', 8), '/')
};

describe('common/stats', function () {

  it('should expose a constructor', function () {
    expect(Stats).to.be.a('function');
    expect(new Stats(elems.file)).to.be.an.instanceOf(Stats);
  });

  it('should create stats from element', function () {
    Object.keys(elems).forEach(function (key) {
      var element = elems[key];

      var stats = new Stats(element);

      expect(stats).to.be.an.instanceOf(Stats);

      expect(stats.dev).to.equal(1);
      expect(stats.ino).to.equal(element.get('inode'));
      expect(stats.mode).to.equal(element.get('mode') + element.get('type'));
      expect(stats.nlink).to.equal(element.get('nlink'));
      expect(stats.uid).to.equal(element.get('uid'));
      expect(stats.gid).to.equal(element.get('gid'));
      expect(stats.rdev).to.equal(0);
      expect(stats.size).to.equal(0);
      expect(stats.blksize).to.equal(512);
      expect(stats.blocks).to.equal(0);
      expect(stats.atime).to.equal(element.get('atime'));
      expect(stats.mtime).to.equal(element.get('mtime'));
      expect(stats.ctime).to.equal(element.get('ctime'));
    });
  });

  describe('isDirectory()', function () {

    it('should return true on directory', function () {
      expect(new Stats(elems.directory).isDirectory()).to.equal(true);
    });

    it('should return false on other types', function () {
      expect(new Stats(elems.file).isDirectory()).to.equal(false);
      expect(new Stats(elems.symlink).isDirectory()).to.equal(false);
    });

  });

  describe('isFile()', function () {

    it('should return true on file', function () {
      expect(new Stats(elems.file).isFile()).to.equal(true);
    });

    it('should return false on other types', function () {
      expect(new Stats(elems.directory).isFile()).to.equal(false);
      expect(new Stats(elems.symlink).isFile()).to.equal(false);
    });

  });

  describe('isBlockDevice()', function () {

    it('should return false on all types', function () {
      expect(new Stats(elems.directory).isBlockDevice()).to.equal(false);
      expect(new Stats(elems.file).isBlockDevice()).to.equal(false);
      expect(new Stats(elems.symlink).isBlockDevice()).to.equal(false);
    });

  });

  describe('isCharacterDevice()', function () {

    it('should return false on all types', function () {
      expect(new Stats(elems.directory).isCharacterDevice()).to.equal(false);
      expect(new Stats(elems.file).isCharacterDevice()).to.equal(false);
      expect(new Stats(elems.symlink).isCharacterDevice()).to.equal(false);
    });

  });

  describe('isSymbolicLink()', function () {

    it('should return true on symlink', function () {
      expect(new Stats(elems.symlink).isSymbolicLink()).to.equal(true);
    });

    it('should return false on other types', function () {
      expect(new Stats(elems.directory).isSymbolicLink()).to.equal(false);
      expect(new Stats(elems.file).isSymbolicLink()).to.equal(false);
    });

  });

  describe('isFIFO()', function () {

    it('should return false on all types', function () {
      expect(new Stats(elems.directory).isFIFO()).to.equal(false);
      expect(new Stats(elems.file).isFIFO()).to.equal(false);
      expect(new Stats(elems.symlink).isFIFO()).to.equal(false);
    });

  });

  describe('isSocket()', function () {

    it('should return false on all types', function () {
      expect(new Stats(elems.directory).isSocket()).to.equal(false);
      expect(new Stats(elems.file).isSocket()).to.equal(false);
      expect(new Stats(elems.symlink).isSocket()).to.equal(false);
    });

  });

});
