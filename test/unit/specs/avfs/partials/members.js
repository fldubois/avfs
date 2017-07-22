'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs, getElement, version) {

  describe('members', function () {

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

    if (['v0.10', 'v0.12'].indexOf(version) !== -1) {

      it('should expose SyncWriteStream', function () {
        expect(fs.SyncWriteStream).to.be.a('function');
        expect(new fs.SyncWriteStream('/file')).to.be.an.instanceof(fs.SyncWriteStream);
      });

    }

    if (version !== 'v0.10') {

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
