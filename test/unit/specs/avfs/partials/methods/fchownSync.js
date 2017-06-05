'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('lib/common/constants');

var Descriptor = require('lib/common/components/descriptor');

module.exports = function (fs, getElement) {

  describe('fchownSync()', function () {

    it('should change the owner and group', function () {
      var fd = 10;

      fs.handles[fd] = new Descriptor(getElement('/tmp/file'), '/tmp/file', constants.O_RDWR);

      var result = fs.fchownSync(fd, process.getuid(), process.getgroups()[0]);

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/file').with.owner(process.getuid(), process.getgroups()[0]);
    });

  });

};
