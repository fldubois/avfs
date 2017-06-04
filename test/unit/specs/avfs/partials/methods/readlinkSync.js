'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('readlinkSync()', function () {

    it('should return the symlink target', function () {
      expect(fs.readlinkSync('/dir/link')).to.equal('/tmp/file');
    });

  });

};
