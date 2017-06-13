'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('rmdirSync()', function () {

    it('should delete directory', function () {
      var result = fs.rmdirSync('/tmp');

      expect(result).to.be.an('undefined');
      expect(fs.storage.files).to.not.contain.keys('tmp');
    });

  });

};
