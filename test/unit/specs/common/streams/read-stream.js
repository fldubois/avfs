'use strict';

var stream = require('stream');

var chai   = require('chai');
var expect = chai.expect;
var sinon  = require('sinon');

var constants = require('test/unit/fixtures/constants');

var errors = require('lib/common/errors');

var PassThrough = stream.PassThrough;
var Readable    = stream.Readable;

var factory = require('lib/common/streams/read-stream');

var fs = {
  open:  sinon.stub(),
  read:  sinon.stub(),
  close: sinon.stub()
};

var ReadStream = factory(fs);

chai.use(require('sinon-chai'));

describe('common/streams/read-stream', function () {

  beforeEach(function () {
    var content = new Buffer('Hello, friend.');
    var read    = 0;

    fs.open.reset();
    fs.read.reset();
    fs.close.reset();

    fs.open.yieldsAsync(null, 1);

    fs.read.callsFake(function (fd, buffer, offset, length, position, callback) {
      var pos = (position !== null) ? position : read;

      var bytesRead = Math.min(length, Math.max(content.length - pos, 0));

      if (bytesRead > 0) {
        content.copy(buffer, offset, pos, pos + bytesRead);
      }

      if (position === null) {
        read += bytesRead;
      }

      return callback(null, bytesRead, buffer);
    });

    fs.close.callsFake(function (fd, callback) {
      return callback();
    });
  });

  it('should expose a factory', function () {
    expect(factory).to.be.a('function');
  });

  it('should return a ReadStream constructor', function () {
    expect(ReadStream).to.be.a('function');
    expect(new ReadStream('/file')).to.be.an.instanceOf(ReadStream);
    expect(ReadStream('/file')).to.be.an.instanceOf(ReadStream);
  });

  it('should return a readable stream', function (done) {
    var readable  = new ReadStream('/file');
    var content = '';

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('data', function (chunk) {
      content += chunk.toString();
    });

    readable.on('error', done);

    readable.on('end', function () {
      expect(content).to.equal('Hello, friend.');

      return done();
    });
  });

  it('should delay read before the descriptor is opened', function (done) {
    var readable = new ReadStream('/file');

    readable._read(1);

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('error', done);

    readable.on('end', function () {
      try {
        expect(fs.open).to.have.callCount(1);
        expect(fs.read.callCount).to.be.at.least(1, 'read should have been called at least one time');
        expect(fs.open).to.have.been.calledBefore(fs.read);

        return done();
      } catch (error) {
        return done(error);
      }
    });

    readable.pipe(new PassThrough());
  });

  it('should accept fd option', function (done) {
    var readable = new ReadStream('/file', {fd: 10});

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('error', done);

    readable.on('end', function () {
      expect(fs.open).to.have.callCount(0);
      expect(fs.read).to.have.always.been.calledWith(10);

      return done();
    });

    readable.pipe(new PassThrough());
  });

  it('should accept flags option', function (done) {
    var readable = new ReadStream('/file', {flags: 'a'});

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('error', done);

    readable.on('open', function (fd) {
      expect(fd).to.equal(1);

      expect(fs.open).to.have.callCount(1);
      expect(fs.open).to.have.been.calledWith('/file', 'a', 438);

      return done();
    });
  });

  it('should accept mode option', function (done) {
    var readable = new ReadStream('/file', {mode: '0777'});

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('error', done);

    readable.on('open', function (fd) {
      expect(fd).to.equal(1);

      expect(fs.open).to.have.callCount(1);
      expect(fs.open).to.have.been.calledWith('/file', 'r', '0777');

      return done();
    });
  });

  it('should accept start option', function (done) {
    var readable = new ReadStream('/file', {start: 12});

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('error', done);

    readable.on('end', function () {
      try {
        expect(fs.read.callCount).to.be.at.least(1, 'read should have been called at least one time');

        var firstCall = fs.read.firstCall;

        expect(firstCall).to.have.been.calledWith(1, sinon.match.instanceOf(Buffer), 0, sinon.match.number, 12);

        return done();
      } catch (error) {
        return done(error);
      }
    });

    readable.pipe(new PassThrough());
  });

  it('should accept end option', function (done) {
    var readable = new ReadStream('/file', {start: 0, end: 2});

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('error', done);

    readable.on('end', function () {
      try {
        expect(fs.read.callCount).to.be.at.least(1, 'read should have been called at least one time');

        var firstCall = fs.read.firstCall;

        expect(firstCall).to.have.been.calledWith(1, sinon.match.instanceOf(Buffer), 0, 3, 0);

        return done();
      } catch (error) {
        return done(error);
      }
    });

    readable.pipe(new PassThrough());
  });

  it('should accept highWaterMark option', function () {
    var readable = new ReadStream('/file', {highWaterMark: 5000});

    expect(readable).to.be.an.instanceOf(Readable);
    expect(readable._readableState.highWaterMark).to.equal(5000);
  });

  it('should accept callback on close', function (done) {
    var readable = new ReadStream('/file');

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('error', done);

    readable.close(done);
  });

  it('should close the descriptor on end', function (done) {
    var readable = new ReadStream('/file');

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('error', done);

    readable.on('close', function () {
      expect(fs.close).to.have.callCount(1);

      return done();
    });

    readable.pipe(new PassThrough());
  });

  it('should not close the descriptor on end with autoClose option set to false', function (done) {
    this.slow(1000);

    var readable = new ReadStream('/file', {autoClose: false});
    var end      = sinon.spy();

    setTimeout(function () {
      expect(end).to.have.callCount(1);
      expect(fs.close).to.have.callCount(0);

      return done();
    }, 250);

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('error', done);
    readable.on('end',   end);

    readable.pipe(new PassThrough());
  });

  it('should not close the descriptor on open error with autoClose option set to false', function (done) {
    this.slow(1000);

    fs.open.resetBehavior();
    fs.open.yieldsAsync(new Error('Fake open error'), null);

    var readable = new ReadStream('/file', {autoClose: false});

    readable.on('error', function (error) {
      expect(error).to.be.an('error');
      expect(error.message).to.equal('Fake open error');

      setTimeout(function () {
        expect(fs.close).to.have.callCount(0);

        return done();
      }, 250);
    });

    readable.on('end', function () {
      return done(new Error('Event `end` emitted with open error'));
    });
  });

  it('should not close the descriptor on read error with autoClose option set to false', function (done) {
    this.slow(1000);

    fs.read.resetBehavior();
    fs.read.yieldsAsync(new Error('Fake read error'), 0, null);

    var readable = new ReadStream('/file', {autoClose: false});

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('error', function (error) {
      expect(error).to.be.an.instanceOf(Error);
      expect(error.message).to.equal('Fake read error');

      setTimeout(function () {
        expect(fs.close).to.have.callCount(0);

        return done();
      }, 250);
    });

    readable.on('end', function () {
      return done(new Error('Event `end` emitted with read error'));
    });

    readable.pipe(new PassThrough());
  });

  it('should reemit close event on each close call', function (done) {
    var readable = new ReadStream('/file');

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
    var readable = new ReadStream('/file');

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('error', done);

    readable.on('open', function (fd) {
      expect(fd).to.equal(1);

      readable.destroy();

      expect(readable.closed).to.equal(true);

      readable.destroy();

      return done();
    });
  });

  it('should emit an error on open fs error', function (done) {
    fs.open.resetBehavior();

    fs.open.yieldsAsync(new errors.createError('EEXIST, file already exists \'/file\'', {
      errno:   constants.EEXIST,
      code:    'EEXIST',
      path:    '/file',
      syscall: 'open'
    }), null);

    var readable = new ReadStream('/file', {flags: 'wx'});

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
    fs.open.resetBehavior();
    fs.open.yieldsAsync(new Error('Fake open error'), null);

    var readable = new ReadStream('/file');

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
    fs.read.resetBehavior();
    fs.read.yieldsAsync(new Error('Fake read error'), 0, null);

    var readable = new ReadStream('/file');

    expect(readable).to.be.an.instanceOf(Readable);

    readable.on('error', function (error) {
      expect(error).to.be.an.instanceOf(Error);
      expect(error.message).to.equal('Fake read error');

      return done();
    });

    readable.on('open', function (fd) {
      expect(fd).to.equal(1);

      expect(fs.open).to.have.callCount(1);
      expect(fs.open).to.have.been.calledWith('/file', 'r', 438);
    });

    readable.on('end', function () {
      return done(new Error('Event `end` emitted with read error'));
    });

    readable.pipe(new PassThrough());
  });

  it('should emit an error on close error', function (done) {
    fs.close.resetBehavior();
    fs.close.yieldsAsync(new Error('Fake close error'));

    var readable = new ReadStream('/file');

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
      return new ReadStream('/file', {start: false});
    }).to.throw(TypeError, 'start must be a Number');
  });

  it('should throw on non number end option', function () {
    expect(function () {
      return new ReadStream('/file', {start: 0, end: false});
    }).to.throw(TypeError, 'end must be a Number');
  });

  it('should throw on end option less then start option', function () {
    expect(function () {
      return new ReadStream('/file', {start: 10, end: 5});
    }).to.throw(Error, 'start must be <= end');
  });

});
