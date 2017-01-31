'use strict';

var chai   = require('chai');
var expect = chai.expect;

var flags = require('../../lib/common/flags');

var Descriptor = require('../../lib/common/descriptor');

describe('common/descriptor', function () {

  it('should expose a constructor', function () {
    expect(Descriptor).to.be.a('function');
    expect(new Descriptor()).to.be.an.instanceOf(Descriptor);
  });

  it('should initialize read and write counters', function () {
    var descriptor = new Descriptor('path/to/file', flags.RO);

    expect(descriptor.path).to.equal('path/to/file');
    expect(descriptor.flags).to.equal(flags.RO);
    expect(descriptor.read).to.equal(0);
    expect(descriptor.write).to.equal(0);
  });

  describe('isReadable()', function () {

    it('should return true for readable flags', function () {
      expect(new Descriptor('', flags.RO).isReadable()).to.equal(true);
      expect(new Descriptor('', flags.RW).isReadable()).to.equal(true);
    });

    it('should return false for non readable flags', function () {
      expect(new Descriptor('', flags.WO).isReadable()).to.equal(false);
      expect(new Descriptor('', 0).isReadable()).to.equal(false);
      expect(new Descriptor('', false).isReadable()).to.equal(false);
      expect(new Descriptor('', null).isReadable()).to.equal(false);
    });

  });

  describe('isWritable()', function () {

    it('should return true for writable flags', function () {
      expect(new Descriptor('', flags.WO).isWritable()).to.equal(true);
      expect(new Descriptor('', flags.RW).isWritable()).to.equal(true);
    });

    it('should return false for non writable flags', function () {
      expect(new Descriptor('', flags.RO).isWritable()).to.equal(false);
      expect(new Descriptor('', 0).isWritable()).to.equal(false);
      expect(new Descriptor('', false).isWritable()).to.equal(false);
      expect(new Descriptor('', null).isWritable()).to.equal(false);
    });

  });

});
