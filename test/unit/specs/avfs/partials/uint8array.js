'use strict';

/* global Uint8Array */

var chai   = require('chai');
var expect = chai.expect;
var semver = require('semver');
var sinon  = require('sinon');

chai.use(require('sinon-chai'));

module.exports = function (fs) {

  if (semver.gte(process.version, '7.0.0')) {

    describe('Uint8Array API', function () {

      it('read() should accept buffer as Uint8Array', function (done) {
        sinon.stub(fs.base, 'read').callsFake(function (fd, buffer) {
          expect(buffer).to.be.an.instanceOf(Buffer);
          expect(buffer.length).to.equal(5);

          buffer.write('Hello');

          return 5;
        });

        fs.read(0, new Uint8Array(5), 0, 5, function (error, bytesRead, uint8) {
          expect(error).to.equal(null);
          expect(bytesRead).to.equal(5);

          expect(fs.base.read).to.have.callCount(1);

          expect(uint8).to.be.an.instanceOf(Uint8Array);
          expect(uint8).to.deep.equal(Uint8Array.from(Buffer.from('Hello')));

          fs.base.read.restore();

          return done();
        });
      });

      it('readSync() should accept buffer as Uint8Array', function () {
        sinon.stub(fs.base, 'read').callsFake(function (fd, buffer) {
          expect(buffer).to.be.an.instanceOf(Buffer);
          expect(buffer.length).to.equal(5);

          buffer.write('Hello');

          return 5;
        });

        var uint8 = new Uint8Array(5);

        var bytesRead = fs.readSync(0, uint8, 0, 5);

        expect(bytesRead).to.equal(5);

        expect(fs.base.read).to.have.callCount(1);

        expect(uint8).to.be.an.instanceOf(Uint8Array);
        expect(uint8).to.deep.equal(Uint8Array.from(Buffer.from('Hello')));

        fs.base.read.restore();
      });

      it('write() should accept buffer as Uint8Array', function (done) {
        sinon.stub(fs.base, 'write').callsFake(function (fd, buffer) {
          expect(buffer).to.be.an.instanceOf(Buffer);
          expect(buffer).to.deep.equal(Buffer.from('Hello'));

          return 5;
        });

        var input = Uint8Array.from(Buffer.from('Hello'));

        fs.write(0, input, 0, 5, function (error, written, uint8) {
          expect(error).to.equal(null);
          expect(written).to.equal(5);
          expect(input).to.equal(uint8);

          expect(fs.base.write).to.have.callCount(1);

          fs.base.write.restore();

          return done();
        });
      });

      it('writeFileSync() should accept buffer as Uint8Array', function () {
        sinon.stub(fs.base, 'writeFile');

        var buffer = Buffer.from('Hello');

        fs.writeFileSync('/file', Uint8Array.from(buffer));

        expect(fs.base.writeFile).to.have.callCount(1);

        var arg = fs.base.writeFile.getCall(0).args[1];

        expect(arg).to.be.an.instanceOf(Buffer);
        expect(arg).to.deep.equal(buffer);

        fs.base.writeFile.restore();
      });

      it('writeSync() should accept buffer as Uint8Array', function () {
        sinon.stub(fs.base, 'write').callsFake(function (fd, buffer) {
          expect(buffer).to.be.an.instanceOf(Buffer);
          expect(buffer).to.deep.equal(Buffer.from('Hello'));

          return 5;
        });

        var uint8 = Uint8Array.from(Buffer.from('Hello'));

        var written = fs.writeSync(0, uint8, 0, 5);

        expect(written).to.equal(5);

        expect(fs.base.write).to.have.callCount(1);

        fs.base.write.restore();
      });

    });

  }

};
