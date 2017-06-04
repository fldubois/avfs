'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('readdirSync()', function () {

    it('should list directory files', function () {
      var result = fs.readdirSync('/tmp');

      expect(result).to.be.an('array');
      expect(result).to.deep.equal([
        'ascii',
        'empty',
        'file'
      ]);
    });

  });

};
