'use strict';

var chai   = require('chai');
var expect = chai.expect;
var sinon  = require('sinon');

chai.use(require('sinon-chai'));

var noop = function () {
  return null;
};

module.exports = function (fs) {

  describe('watchFile()', function () {

    before('Stub base function', function () {
      sinon.stub(fs.base, 'watchFile');
    });

    it('should call the base function', function () {
      expect(fs.watchFile('/tmp/file', {}, noop)).to.be.an('undefined');

      expect(fs.base.watchFile).to.have.callCount(1);
      expect(fs.base.watchFile).to.have.been.calledWithExactly('/tmp/file', {}, noop);
    });

    after('Restore base function', function () {
      fs.base.watchFile.restore();
    });

  });

};
