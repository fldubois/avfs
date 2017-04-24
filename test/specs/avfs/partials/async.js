'use strict';

var chai   = require('chai');
var expect = chai.expect;
var sinon  = require('sinon');

var errors = require('lib/common/errors');

chai.use(require('sinon-chai'));

module.exports = function (fs) {

  describe('Asynchronous methods', function () {

    before(function () {
      sinon.stub(fs, 'openSync');
      sinon.stub(console, 'error');
    });

    beforeEach(function () {
      fs.openSync.reset();
    });

    it('should expose asynchronous methods', function () {
      for (var method in fs) {
        if (/Sync$/.test(method)) {
          expect(fs).to.respondTo(method.replace('Sync', ''));
        }
      }
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
        var error = errors.EBADF({syscall: 'read'});

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
        var error = errors.EBADF({syscall: 'write'});

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
        fs.writeSync.throws(errors.EBADF({syscall: 'write'}));

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

};
