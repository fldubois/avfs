'use strict';

var chai   = require('chai');
var expect = chai.expect;
var sinon  = require('sinon');

chai.use(require('sinon-chai'));

var noop = function () {
  return null;
};

module.exports = function (fs) {

  describe('unwatchFile()', function () {

    before('Stub base function', function () {
      sinon.stub(fs.base, 'unwatchFile');
    });

    it('should call the base function', function () {
      expect(fs.unwatchFile('/tmp/file', noop)).to.be.an('undefined');

      expect(fs.base.unwatchFile).to.have.callCount(1);
      expect(fs.base.unwatchFile).to.have.been.calledWithExactly('/tmp/file', noop);
    });

    after('Restore base function', function () {
      fs.base.unwatchFile.restore();
    });

  });

};
