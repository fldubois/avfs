'use strict';

var stream = require('stream');

var chai   = require('chai');
var expect = chai.expect;
var sinon  = require('sinon');

var errors = require('lib/common/errors');

var Stream = stream.Stream;

var SyncWriteStream = require('lib/common/sync-write-stream');

chai.use(require('sinon-chai'));

var fs = {
  writeSync: sinon.stub(),
  closeSync: sinon.stub()
};

describe('common/sync-write-stream', function () {

  beforeEach(function () {
    fs.writeSync.reset();
    fs.closeSync.reset();
  });

  it('should expose a constructor', function () {
    expect(SyncWriteStream).to.be.a('function');
    expect(new SyncWriteStream(fs, 10)).to.be.an.instanceOf(Stream);
    expect(SyncWriteStream(fs, 10)).to.be.an.instanceOf(Stream);
  });

  it('should return a writable stream', function (done) {
    var writable = new SyncWriteStream(fs, 10);

    expect(writable).to.be.an.instanceOf(Stream);

    writable.on('close', function () {
      try {
        expect(fs.writeSync).to.have.callCount(2);
        expect(fs.writeSync.getCall(0)).to.have.been.calledWith(10, sinon.match.instanceOf(Buffer), 0, 7);
        expect(fs.writeSync.getCall(1)).to.have.been.calledWith(10, sinon.match.instanceOf(Buffer), 0, 7);

        return done();
      } catch (error) {
        return done(error);
      }
    });

    writable.write(new Buffer('Hello, '));
    writable.end(new Buffer('world !'));
  });

  it('should accept autoClose option', function () {
    var writable = new SyncWriteStream(fs, 10, {autoClose: false});

    expect(writable).to.be.an.instanceOf(Stream);

    expect(writable.fd).to.equal(10);

    writable.destroy();

    expect(fs.closeSync).to.have.callCount(0);

    expect(writable.fd).to.equal(null);
  });

  it('should close the descriptor on destroy', function () {
    var writable = new SyncWriteStream(fs, 10);

    expect(writable).to.be.an.instanceOf(Stream);

    expect(writable.fd).to.equal(10);

    writable.end();

    expect(fs.closeSync).to.have.callCount(1);
    expect(fs.closeSync.getCall(0)).to.have.been.calledWith(10);

    expect(writable.fd).to.equal(null);

    writable.destroy();

    expect(fs.closeSync).to.have.callCount(1);
  });

  describe('write()', function () {

    var writable = null;

    beforeEach(function () {
      writable = new SyncWriteStream(fs, 10);

      expect(writable).to.be.an.instanceOf(Stream);
    });

    it('should accept data as string', function () {
      writable.write('Hello, friend.');

      expect(fs.writeSync).to.have.callCount(1);
      expect(fs.writeSync.getCall(0)).to.have.been.calledWith(10, sinon.match.instanceOf(Buffer), 0, 14);
    });

    it('should accept data as buffer', function () {
      writable.write(new Buffer('Hello, friend.'));

      expect(fs.writeSync).to.have.callCount(1);
      expect(fs.writeSync.getCall(0)).to.have.been.calledWith(10, sinon.match.instanceOf(Buffer), 0, 14);
    });

    it('should accept encoding parameter', function () {
      writable.write('éèâà', 'ascii');

      expect(fs.writeSync).to.have.callCount(1);
      expect(fs.writeSync.getCall(0)).to.have.been.calledWith(10, sinon.match.instanceOf(Buffer), 0, 4);

      var buffer = fs.writeSync.getCall(0).args[1];

      expect(buffer.length).to.equal(Buffer.byteLength('éèâà', 'ascii'));
      expect(buffer.length).to.not.equal(Buffer.byteLength('éèâà', 'utf8'));
    });

    it('should accept callback parameter', function (done) {
      writable.write('Hello, friend.', function () {
        expect(fs.writeSync).to.have.callCount(1);
        expect(fs.writeSync.getCall(0)).to.have.been.calledWith(10, sinon.match.instanceOf(Buffer), 0, 14);

        return done();
      });
    });

    it('should accept encoding and callback parameter', function (done) {
      writable.write('éèâà', 'ascii', function () {
        expect(fs.writeSync).to.have.callCount(1);
        expect(fs.writeSync.getCall(0)).to.have.been.calledWith(10, sinon.match.instanceOf(Buffer), 0, 4);

        var buffer = fs.writeSync.getCall(0).args[1];

        expect(buffer.length).to.equal(Buffer.byteLength('éèâà', 'ascii'));
        expect(buffer.length).to.not.equal(Buffer.byteLength('éèâà', 'utf8'));

        return done();
      });
    });

    it('should throw on bad parameter type', function () {
      expect(function () {
        writable.write('Hello, friend.', {});
      }).to.throw(Error, 'bad arg');
    });

    it('should throw on unknown encoding', function () {
      expect(function () {
        writable.write('Hello, friend.', 'utf5');
      }).to.throw(Error, 'Unknown encoding: utf5');
    });

  });

});
