'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('test/unit/fixtures/constants');

var Descriptor = require('lib/common/components/descriptor')(constants);

describe('common/components/descriptor', function () {

  it('should expose a constructor', function () {
    expect(Descriptor).to.be.a('function');
    expect(new Descriptor()).to.be.an.instanceOf(Descriptor);
  });

  it('should initialize read and write counters', function () {
    var file = {test: true};

    var descriptor = new Descriptor(file, 'path/to/file', constants.O_RDONLY);

    expect(descriptor.file).to.equal(file);
    expect(descriptor.path).to.equal('path/to/file');
    expect(descriptor.flags).to.equal(constants.O_RDONLY);
    expect(descriptor.read).to.equal(0);
    expect(descriptor.write).to.equal(0);
  });

  describe('isReadable()', function () {

    it('should return true for readable flags', function () {
      expect(new Descriptor({}, '', constants.O_RDONLY).isReadable()).to.equal(true);
      expect(new Descriptor({}, '', constants.O_RDWR).isReadable()).to.equal(true);
    });

    it('should return false for non readable flags', function () {
      expect(new Descriptor({}, '', constants.O_WRONLY).isReadable()).to.equal(false);
      expect(new Descriptor({}, '', false).isReadable()).to.equal(false);
      expect(new Descriptor({}, '', null).isReadable()).to.equal(false);
    });

  });

  describe('isWritable()', function () {

    it('should return true for writable flags', function () {
      expect(new Descriptor({}, '', constants.O_WRONLY).isWritable()).to.equal(true);
      expect(new Descriptor({}, '', constants.O_RDWR).isWritable()).to.equal(true);
    });

    it('should return false for non writable flags', function () {
      expect(new Descriptor({}, '', constants.O_RDONLY).isWritable()).to.equal(false);
      expect(new Descriptor({}, '', 0).isWritable()).to.equal(false);
      expect(new Descriptor({}, '', false).isWritable()).to.equal(false);
      expect(new Descriptor({}, '', null).isWritable()).to.equal(false);
    });

  });

  describe('isClosed()', function () {

    it('should return true for closed descriptor', function () {
      var descriptor = new Descriptor({}, '', constants.O_RDWR);

      descriptor.closed = true;

      expect(descriptor.isClosed()).to.equal(true);
    });

    it('should return false for open descriptor', function () {
      expect(new Descriptor({}, '', constants.O_RDWR).isClosed()).to.equal(false);
    });

  });

  describe('close()', function () {

    it('should close the descriptor', function () {
      var descriptor = new Descriptor({}, '', constants.O_RDWR);

      expect(descriptor.closed).to.equal(false);

      descriptor.close();

      expect(descriptor.closed).to.equal(true);
    });

  });

});
