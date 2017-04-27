'use strict';

var fs   = require('fs');
var path = require('path');

var chai   = require('chai');
var expect = chai.expect;

var version = require('lib/common/version');

var supported = fs.readdirSync(path.join(__dirname, '../../lib'));

if (supported.indexOf(version) === -1) {

  describe('avfs', function () {

    it('should throw unsupported version error', function () {
      expect(function () {
        require('lib/avfs');
      }).to.throw(Error, 'Unsupported node version: ' + process.version);
    });

  });

} else {
  var specs = fs.readdirSync(path.join(__dirname, 'specs/common')).map(function (filename) {
    return path.join(__dirname, 'specs/common', filename);
  });

  specs.unshift(path.join(__dirname, 'specs/avfs'));

  specs.forEach(require);
}
