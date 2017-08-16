'use strict';

var chai   = require('chai');
var expect = chai.expect;
var semver = require('semver');
var sinon  = require('sinon');

var constants = require('test/unit/fixtures/constants');
var parsers   = require('lib/common/parsers')(constants);

module.exports = function (fs) {

  describe('members', function () {

    if (semver.gte(process.version, '6.0.0')) {

      it('should expose constants', function () {
        expect(fs.constants).to.be.an('object');
      });

    }

    it('should expose Stats', function () {
      expect(fs.Stats).to.be.a('function');
    });

    it('should expose ReadStream', function () {
      expect(fs.ReadStream).to.be.a('function');
      expect(new fs.ReadStream('/file')).to.be.an.instanceof(fs.ReadStream);
    });

    it('should expose WriteStream', function () {
      expect(fs.WriteStream).to.be.a('function');
      expect(new fs.WriteStream('/file')).to.be.an.instanceof(fs.WriteStream);
    });

    if (semver.lt(process.version, '4.0.0')) {

      it('should expose SyncWriteStream', function () {
        expect(fs.SyncWriteStream).to.be.a('function');
        expect(new fs.SyncWriteStream('/file')).to.be.an.instanceof(fs.SyncWriteStream);
      });

    } else {

      it('should expose SyncWriteStream (non enumerable)', function () {
        expect(fs.SyncWriteStream).to.be.a('function');
        expect(new fs.SyncWriteStream('/file')).to.be.an.instanceof(fs.SyncWriteStream);
        expect(fs).to.not.have.key('SyncWriteStream');
      });

    }

    if (semver.gte(process.version, '8.0.0')) {

      it('should deprecate SyncWriteStream', function (done) {
        sinon.stub(process, 'emitWarning');

        var SyncWriteStream = fs.SyncWriteStream;

        fs.SyncWriteStream = true;

        process.nextTick(function () {
          expect(process.emitWarning.callCount).to.be.above(0);

          fs.SyncWriteStream = SyncWriteStream;

          process.emitWarning.restore();

          return done();
        });
      });

    }

    if (semver.lt(process.version, '7.0.0')) {

      it('should expose _stringToFlags', function () {
        expect(fs._stringToFlags).to.be.a('function');

        ['r', 'r+', 'w', 'w+', 'ax'].forEach(function (flags) {
          expect(fs._stringToFlags(flags)).to.equal(parsers.flags(flags));
        });
      });

    }

    if (semver.gte(process.version, '0.12.0')) {

      it('should expose access flags', function () {
        expect(fs).to.contain.keys([
          'F_OK',
          'R_OK',
          'W_OK',
          'X_OK'
        ]);
      });

    }

  });

};
