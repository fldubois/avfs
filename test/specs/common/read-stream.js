'use strict';

var stream = require('stream');

var chai   = require('chai');
var expect = chai.expect;
var sinon  = require('sinon');

var errors = require('lib/common/errors');

var PassThrough = stream.PassThrough;
var Readable    = stream.Readable;

var ReadStream = require('lib/common/read-stream');

chai.use(require('sinon-chai'));

var fs = {
  openSync:  sinon.stub(),
  readSync:  sinon.stub(),
  closeSync: sinon.stub()
};

describe('common/read-stream', function () {

  beforeEach(function () {
    var content = new Buffer('Hello, friend.');
    var read    = 0;

    fs.openSync.reset();
    fs.openSync.returns(1);

    fs.readSync.reset();
    fs.readSync.callsFake(function (fd, buffer, offset, length, position) {
      var pos = (position !== null) ? position : read;

      var bytesRead = Math.min(length, Math.max(content.length - pos, 0));

      if (bytesRead > 0) {
        content.copy(buffer, offset, pos, pos + bytesRead);
      }

      if (position === null) {
        read += bytesRead;
      }

      return bytesRead;
    });

    fs.closeSync.reset();
  });

  it('should expose a constructor', function () {
    expect(ReadStream).to.be.a('function');
    expect(new ReadStream(fs, '/file')).to.be.an.instanceOf(ReadStream);
    expect(ReadStream(fs, '/file')).to.be.an.instanceOf(ReadStream);
  });

  it('should return a readable stream', function (done) {
    var readable  = new ReadStream(fs, '/file');
    var content = '';

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('readable', function () {
      var chunk = null;

      while ((chunk = readable.read()) !== null) {
        expect(chunk).to.be.an.instanceof(Buffer);

        content += chunk.toString();
      }
    });

    readable.on('error', done);

    readable.on('end', function () {
      expect(content).to.equal('Hello, friend.');

      return done();
    });
  });

  it('should delay read before the descriptor is opened', function (done) {
    var readable = new ReadStream(fs, '/file');

    readable._read(1);

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('error', done);

    readable.on('end', function () {
      try {
        expect(fs.openSync).to.have.callCount(1);
        expect(fs.readSync.callCount).to.be.at.least(1, 'readSync should have been called at least one time');
        expect(fs.openSync).to.have.been.calledBefore(fs.readSync);

        return done();
      } catch (error) {
        return done(error);
      }
    });

    readable.pipe(new PassThrough());
  });

  it('should accept fd option', function (done) {
    var readable = new ReadStream(fs, '/file', {fd: 10});

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('error', done);

    readable.on('end', function () {
      expect(fs.openSync).to.have.callCount(0);
      expect(fs.readSync).to.have.always.been.calledWith(10);

      return done();
    });

    readable.pipe(new PassThrough());
  });

  it('should accept flags option', function (done) {
    var readable = new ReadStream(fs, '/file', {flags: 'a'});

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('error', done);

    readable.on('open', function (fd) {
      expect(fd).to.equal(1);

      expect(fs.openSync).to.have.callCount(1);
      expect(fs.openSync).to.have.been.calledWith('/file', 'a', 438);

      return done();
    });
  });

  it('should accept mode option', function (done) {
    var readable = new ReadStream(fs, '/file', {mode: '0777'});

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('error', done);

    readable.on('open', function (fd) {
      expect(fd).to.equal(1);

      expect(fs.openSync).to.have.callCount(1);
      expect(fs.openSync).to.have.been.calledWith('/file', 'r', '0777');

      return done();
    });
  });

  it('should accept start option', function (done) {
    var readable = new ReadStream(fs, '/file', {start: 12});

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('error', done);

    readable.on('end', function () {
      try {
        expect(fs.readSync.callCount).to.be.at.least(1, 'readSync should have been called at least one time');

        var firstCall = fs.readSync.firstCall;

        expect(firstCall).to.have.been.calledWith(1, sinon.match.instanceOf(Buffer), 0, sinon.match.number, 12);

        return done();
      } catch (error) {
        return done(error);
      }
    });

    readable.pipe(new PassThrough());
  });

  it('should accept end option', function (done) {
    var readable = new ReadStream(fs, '/file', {start: 0, end: 2});

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('error', done);

    readable.on('end', function () {
      try {
        expect(fs.readSync.callCount).to.be.at.least(1, 'readSync should have been called at least one time');

        var firstCall = fs.readSync.firstCall;

        expect(firstCall).to.have.been.calledWith(1, sinon.match.instanceOf(Buffer), 0, 3, 0);

        return done();
      } catch (error) {
        return done(error);
      }
    });

    readable.pipe(new PassThrough());
  });

  it('should accept highWaterMark option', function () {
    var readable = new ReadStream(fs, '/file', {highWaterMark: 5000});

    expect(readable).to.be.an.instanceOf(Readable);
    expect(readable._readableState.highWaterMark).to.equal(5000);
  });

  it('should accept callback on close', function (done) {
    var readable = new ReadStream(fs, '/file');

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('error', done);

    readable.close(done);
  });

  it('should close the descriptor on end', function (done) {
    var readable = new ReadStream(fs, '/file');

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('error', done);

    readable.on('close', function () {
      expect(fs.closeSync).to.have.callCount(1);

      return done();
    });

    readable.pipe(new PassThrough());
  });

  it('should not close the descriptor on end with autoClose option set to false', function (done) {
    this.slow(1000);

    var readable = new ReadStream(fs, '/file', {autoClose: false});
    var end      = sinon.spy();

    setTimeout(function () {
      expect(end).to.have.callCount(1);
      expect(fs.closeSync).to.have.callCount(0);

      return done();
    }, 250);

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('error', done);
    readable.on('end',   end);

    readable.pipe(new PassThrough());
  });

  it('should not close the descriptor on open error with autoClose option set to false', function (done) {
    this.slow(1000);

    fs.openSync.resetBehavior();
    fs.openSync.throws(new Error('Fake open error'));

    var readable = new ReadStream(fs, '/file', {autoClose: false});

    readable.on('error', function (error) {
      expect(error).to.be.an('error');
      expect(error.message).to.equal('Fake open error');

      setTimeout(function () {
        expect(fs.closeSync).to.have.callCount(0);

        return done();
      }, 250);
    });

    readable.on('end', function () {
      return done(new Error('Event `end` emitted with open error'));
    });
  });

  it('should not close the descriptor on read error with autoClose option set to false', function (done) {
    this.slow(1000);

    fs.readSync.resetBehavior();
    fs.readSync.throws(new Error('Fake read error'));

    var readable = new ReadStream(fs, '/file', {autoClose: false});

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('error', function (error) {
      expect(error).to.be.an.instanceOf(Error);
      expect(error.message).to.equal('Fake read error');

      setTimeout(function () {
        expect(fs.closeSync).to.have.callCount(0);

        return done();
      }, 250);
    });

    readable.on('end', function () {
      return done(new Error('Event `end` emitted with read error'));
    });

    readable.pipe(new PassThrough());
  });

  it('should reemit close event on each close call', function (done) {
    var readable = new ReadStream(fs, '/file');

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('error', done);

    readable.on('open', function () {
      readable.once('close', function () {
        readable.once('close', done);

        readable.close();
      });

      readable.close();
    });
  });

  it('should close the descriptor on destroy', function (done) {
    var readable = new ReadStream(fs, '/file');

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('error', done);

    readable.on('open', function (fd) {
      try {
        expect(fd).to.equal(1);

        readable.destroy();

        expect(readable.closed).to.equal(true);

        readable.destroy();

        return done();
      } catch (error) {
        return done(error);
      }
    });
  });

  it('should emit an error on open fs error', function (done) {
    fs.openSync.resetBehavior();
    fs.openSync.throws(new errors.EEXIST('open', '/file'));

    var readable = new ReadStream(fs, '/file', {flags: 'wx'});

    readable.on('error', function (error) {
      expect(error).to.be.an('error');
      expect(error.message).to.equal('EEXIST, open \'/file\'');

      return done();
    });

    readable.on('end', function () {
      return done(new Error('Event `end` emitted with open error'));
    });
  });

  it('should emit an error on open error', function (done) {
    fs.openSync.resetBehavior();
    fs.openSync.throws(new Error('Fake open error'));

    var readable = new ReadStream(fs, '/file');

    readable.on('error', function (error) {
      expect(error).to.be.an('error');
      expect(error.message).to.equal('Fake open error');

      return done();
    });

    readable.on('end', function () {
      return done(new Error('Event `end` emitted with open error'));
    });
  });

  it('should emit an error on read error', function (done) {
    fs.readSync.resetBehavior();
    fs.readSync.throws(new Error('Fake read error'));

    var readable = new ReadStream(fs, '/file');

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('error', function (error) {
      expect(error).to.be.an.instanceOf(Error);
      expect(error.message).to.equal('Fake read error');

      return done();
    });

    readable.on('open', function (fd) {
      expect(fd).to.equal(1);

      expect(fs.openSync).to.have.callCount(1);
      expect(fs.openSync).to.have.been.calledWith('/file', 'r', 438);
    });

    readable.on('end', function () {
      return done(new Error('Event `end` emitted with read error'));
    });

    readable.pipe(new PassThrough());
  });

  it('should emit an error on close error', function (done) {
    fs.closeSync.resetBehavior();
    fs.closeSync.throws(new Error('Fake close error'));

    var readable = new ReadStream(fs, '/file');

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('error', function (error) {
      expect(error).to.be.an.instanceOf(Error);
      expect(error.message).to.equal('Fake close error');

      return done();
    });

    readable.on('close', function () {
      return done(new Error('Event `close` emitted with close error'));
    });

    readable.pipe(new PassThrough());
  });

  it('should throw on non number start option', function () {
    expect(function () {
      return new ReadStream(fs, '/file', {start: false});
    }).to.throw(TypeError, 'start must be a Number');
  });

  it('should throw on non number end option', function () {
    expect(function () {
      return new ReadStream(fs, '/file', {start: 0, end: false});
    }).to.throw(TypeError, 'end must be a Number');
  });

  it('should throw on end option less then start option', function () {
    expect(function () {
      return new ReadStream(fs, '/file', {start: 10, end: 5});
    }).to.throw(Error, 'start must be <= end');
  });

});
