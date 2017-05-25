'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs, getElement, version) {

  if (['v4', 'v5'].indexOf(version) !== -1) {

    describe('mkdtemp()', function () {

      it('should return a random name', function (done) {
        fs.mkdtemp('test-', function (errorA, nameA) {

          expect(errorA).to.be.a('null');
          expect(nameA).to.match(/^test-[A-Za-z0-9]{6}/);

          fs.mkdtemp('test-', function (errorB, nameB) {

            expect(errorB).to.be.a('null');
            expect(nameB).to.match(/^test-[A-Za-z0-9]{6}/);

            expect(nameA).to.not.equal(nameB);

            return done();
          });
        });
      });

      it('should throw on non function callback', function () {
        expect(function () {
          fs.mkdtemp('test-', false);
        }).to.throw(TypeError, '"callback" argument must be a function');
      });

    });

  }

};
