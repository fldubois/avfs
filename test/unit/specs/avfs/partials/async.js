'use strict';

var chai   = require('chai');
var expect = chai.expect;
var sinon  = require('sinon');

var errors = require('lib/common/errors');

chai.use(require('sinon-chai'));

module.exports = function (fs) {

  describe('Asynchronous methods', function () {

    before(function () {
      sinon.stub(console, 'error');
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

      it('should work with alternate signature', function (done) {
        fs.writeSync.returns(5);

        fs.write(fd, 'Hello, world', 0, 'utf8', function (error, written, string) {
          expect(error).to.equal(null);

          expect(fs.writeSync).to.have.callCount(1);
          expect(fs.writeSync).to.have.been.calledWithExactly(fd, 'Hello, world', 0, 'utf8', void 0);

          expect(written).to.equal(5);
          expect(string).to.equal('Hello, world');

          return done();
        });
      });

      it('should work with alternate signature without encoding', function (done) {
        fs.writeSync.returns(5);

        fs.write(fd, 'Hello, world', 0, function (error, written, string) {
          expect(error).to.equal(null);

          expect(fs.writeSync).to.have.callCount(1);
          expect(fs.writeSync).to.have.been.calledWithExactly(fd, 'Hello, world', 0, void 0, void 0);

          expect(written).to.equal(5);
          expect(string).to.equal('Hello, world');

          return done();
        });
      });

      it('should work with alternate signature without position and encoding', function (done) {
        fs.writeSync.returns(5);

        fs.write(fd, 'Hello, world', function (error, written, string) {
          expect(error).to.equal(null);

          expect(fs.writeSync).to.have.callCount(1);
          expect(fs.writeSync).to.have.been.calledWithExactly(fd, 'Hello, world', void 0, void 0, void 0);

          expect(written).to.equal(5);
          expect(string).to.equal('Hello, world');

          return done();
        });
      });

      it('should work with alternate signature without position, encoding and callback', function (done) {
        fs.writeSync.returns(5);

        fs.write(fd, 'Hello, world');

        setImmediate(function () {
          expect(fs.writeSync).to.have.callCount(1);
          expect(fs.writeSync).to.have.been.calledWithExactly(fd, 'Hello, world', void 0, void 0, void 0);

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

      it('should log fs error without callback', function (done) {
        var error = errors.EBADF('write');

        fs.writeSync.throws(error);

        fs.write(fd, inBuffer, offset, length, position);

        setImmediate(function () {
          expect(console.error).to.have.been.calledWithExactly('fs: missing callback ' + error.message);

          return done();
        });
      });

      after(function () {
        fs.writeSync.restore();
      });

    });

    after(function () {
      console.error.restore();
    });

  });

};
