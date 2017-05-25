'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs, getElement, version) {

  if (['v4', 'v5'].indexOf(version) !== -1) {

    describe('mkdtempSync()', function () {

      it('should return a random name', function () {
        var nameA = fs.mkdtempSync('test-');
        var nameB = fs.mkdtempSync('test-');

        expect(nameA).to.match(/^test-[A-Za-z0-9]{6}/);
        expect(nameB).to.match(/^test-[A-Za-z0-9]{6}/);

        expect(nameA).to.not.equal(nameB);
      });

    });

  }

};
