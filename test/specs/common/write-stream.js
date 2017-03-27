'use strict';

var chai   = require('chai');
var expect = chai.expect;
var sinon  = require('sinon');

var errors = require('lib/common/errors');

var WriteStream = require('lib/common/write-stream');

chai.use(require('sinon-chai'));

var fs = {
  openSync:  sinon.stub(),
  writeSync: sinon.stub(),
  closeSync: sinon.stub()
};

describe('common/write-stream', function () {

  beforeEach(function () {
    fs.openSync.reset();
    fs.writeSync.reset();
    fs.closeSync.reset();

    fs.openSync.returns(1);
    fs.writeSync.returnsArg(3);
  });

  it('should expose a constructor', function () {
    expect(WriteStream).to.be.a('function');
    expect(new WriteStream(fs, '/file')).to.be.an.instanceOf(WriteStream);
    expect(WriteStream(fs, '/file')).to.be.an.instanceOf(WriteStream);
  });

  it('should return a writable stream', function (done) {
    var stream = new WriteStream(fs, '/file');

    expect(stream).to.be.an.instanceOf(WriteStream);

    stream.on('error', done);

    stream.on('finish', function () {
      try {
        expect(fs.openSync).to.have.callCount(1);
        expect(fs.openSync).to.have.been.calledWith('/file', 'w', null);

        expect(fs.writeSync).to.have.callCount(2);
        expect(fs.writeSync.getCall(0)).to.have.been.calledWith(1, sinon.match.instanceOf(Buffer), 0, 7, null);
        expect(fs.writeSync.getCall(1)).to.have.been.calledWith(1, sinon.match.instanceOf(Buffer), 0, 7, null);

        return done();
      } catch (error) {
        return done(error);
      }
    });

    stream.write('Hello, ');
    stream.end('world !');
  });

  it('should accept fd option', function (done) {
    var stream = new WriteStream(fs, '/file', {fd: 10});

    expect(stream).to.be.an.instanceOf(WriteStream);

    stream.on('error', done);

    stream.on('finish', function () {
      try {
        expect(fs.openSync).to.have.callCount(0);

        expect(fs.writeSync).to.have.callCount(1);
        expect(fs.writeSync.getCall(0)).to.have.been.calledWith(10);

        return done();
      } catch (error) {
        return done(error);
      }
    });

    stream.end('Hello');
  });

  it('should accept flags option', function (done) {
    var stream = new WriteStream(fs, '/file', {flags: 'a'});

    expect(stream).to.be.an.instanceOf(WriteStream);

    stream.on('error', done);

    stream.on('open', function (fd) {
      try {
        expect(fd).to.equal(1);

        expect(fs.openSync).to.have.callCount(1);
        expect(fs.openSync).to.have.been.calledWith('/file', 'a', null);

        return done();
      } catch (error) {
        return done(error);
      }
    });
  });

  it('should accept mode option', function (done) {
    var stream = new WriteStream(fs, '/file', {mode: '0700'});

    expect(stream).to.be.an.instanceOf(WriteStream);

    stream.on('error', done);

    stream.on('open', function (fd) {
      try {
        expect(fd).to.equal(1);

        expect(fs.openSync).to.have.callCount(1);
        expect(fs.openSync).to.have.been.calledWith('/file', 'w', '0700');

        return done();
      } catch (error) {
        return done(error);
      }
    });
  });

  it('should accept start option', function (done) {
    var stream = new WriteStream(fs, '/file', {flags: 'r+', start: 12});

    expect(stream).to.be.an.instanceOf(WriteStream);

    stream.on('error', done);

    stream.on('open', function (fd) {
      expect(fd).to.equal(1);

      expect(fs.openSync).to.have.callCount(1);
      expect(fs.openSync).to.have.been.calledWith('/file', 'r+', null);
    });

    stream.on('finish', function () {
      expect(fs.writeSync).to.have.callCount(1);
      expect(fs.writeSync.getCall(0)).to.have.been.calledWith(1, sinon.match.instanceOf(Buffer), 0, 5, 12);

      return done();
    });

    stream.end('Hello');
  });

  it('should accept callback on close', function (done) {
    var stream = new WriteStream(fs, '/file');

    expect(stream).to.be.an.instanceOf(WriteStream);

    stream.on('error', done);

    stream.close(done);
  });

  it('should reemit close event on each close call', function (done) {
    var stream = new WriteStream(fs, '/file');

    expect(stream).to.be.an.instanceOf(WriteStream);

    stream.on('error', done);

    stream.on('open', function () {
      stream.once('close', function () {
        stream.once('close', done);

        stream.close();
      });

      stream.close();
    });
  });

  it('should close the descriptor on destroy', function (done) {
    var stream = new WriteStream(fs, '/file');

    expect(stream).to.be.an.instanceOf(WriteStream);

    stream.on('error', done);

    stream.on('open', function (fd) {
      try {
        expect(fd).to.equal(1);

        stream.destroy();

        expect(stream.closed).to.equal(true);

        stream.destroy();

        return done();
      } catch (error) {
        return done(error);
      }
    });
  });

  it('should emit an error on open fs error', function (done) {
    fs.openSync.resetBehavior();
    fs.openSync.throws(new errors.EEXIST('open', '/file'));

    var stream = new WriteStream(fs, '/file', {flags: 'wx'});

    stream.on('error', function (error) {
      expect(error).to.be.an('error');
      expect(error.message).to.equal('EEXIST, open \'/file\'');

      return done();
    });

    stream.on('finish', function () {
      return done(new Error('Event `finish` emitted with open error'));
    });
  });

  it('should emit an error on open error', function (done) {
    fs.openSync.resetBehavior();
    fs.openSync.throws(new Error('Fake open error'));

    var stream = new WriteStream(fs, '/file', {flags: 'wx'});

    stream.on('error', function (error) {
      expect(error).to.be.an('error');
      expect(error.message).to.equal('Fake open error');

      return done();
    });

    stream.on('finish', function () {
      return done(new Error('Event `finish` emitted with open error'));
    });
  });

  it('should emit an error on non Buffer data', function () {
    var stream = new WriteStream(fs, '/file', {flags: 'wx'});

    expect(function () {
      stream._write(false);
    }).to.throws(Error, 'Invalid data');
  });

  it('should emit an error on write error', function (done) {
    fs.writeSync.resetBehavior();
    fs.writeSync.throws(new Error('Fake write error'));

    var stream = new WriteStream(fs, '/file');

    expect(stream).to.be.an.instanceOf(WriteStream);

    stream.on('error', function (error) {
      expect(error).to.be.an.instanceOf(Error);
      expect(error.message).to.equal('Fake write error');

      return done();
    });

    stream.on('open', function (fd) {
      expect(fd).to.equal(1);

      expect(fs.openSync).to.have.callCount(1);
      expect(fs.openSync).to.have.been.calledWith('/file', 'w', null);
    });

    stream.on('finish', function () {
      return done(new Error('Event `finish` emitted with write error'));
    });

    stream.end('Hello');
  });

  it('should emit an error on close error', function (done) {
    fs.closeSync.resetBehavior();
    fs.closeSync.throws(new Error('Fake close error'));

    var stream = new WriteStream(fs, '/file');

    expect(stream).to.be.an.instanceOf(WriteStream);

    stream.on('error', function (error) {
      expect(error).to.be.an.instanceOf(Error);
      expect(error.message).to.equal('Fake close error');

      return done();
    });

    stream.on('close', function () {
      return done(new Error('Event `close` emitted with close error'));
    });

    stream.end('Hello');
  });

  // it('should emit an error on directory', function (done) {
  //   var stream = new WriteStream(fs, '/');

  //   stream.on('error', function (error) {
  //     expect(error).to.be.an('error');
  //     expect(error.message).to.equal('EISDIR, open \'/\'');

  //     return done();
  //   });

  //   stream.on('finish', function () {
  //     return done(new Error('Event `finish` emitted with directory'));
  //   });
  // });

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
