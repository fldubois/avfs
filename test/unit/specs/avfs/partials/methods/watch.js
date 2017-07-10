'use strict';

var chai   = require('chai');
var expect = chai.expect;
var sinon  = require('sinon');

chai.use(require('sinon-chai'));

var noop = function () {
  return null;
};

module.exports = function (fs) {

  describe('watch()', function () {

    before('Stub base function', function () {
      sinon.stub(fs.base, 'watch');
    });

    it('should call the base function', function () {
      expect(fs.watch('/tmp/file', {}, noop)).to.be.an('undefined');

      expect(fs.base.watch).to.have.callCount(1);
      expect(fs.base.watch).to.have.been.calledWithExactly('/tmp/file', {}, noop);
    });

    after('Restore base function', function () {
      fs.base.watch.restore();
    });

  });

};
