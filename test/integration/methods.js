'use strict';

var fs   = require('fs');
var path = require('path');

var chai   = require('chai');
var expect = chai.expect;

var version = require('lib/common/version');

var supported = fs.readdirSync(path.join(__dirname, '../../lib'));

var ignored = [
  'lchmod',
  'lchmodSync',
  'lchown',
  'lchownSync'
];

var getMethods = function (target) {
  var methods = [];

  for (var property in target) {
    if (typeof target[property] === 'function' && ignored.indexOf(property) === -1) {
      methods.push(property);
    }
  }

  return methods.sort();
};

if (supported.indexOf(version) !== -1) {
  var AVFS = require('lib/avfs');

  var avfs = new AVFS();

  describe('methods', function () {

    it('should expose fs methods', function () {
      expect(getMethods(avfs)).to.deep.equal(getMethods(fs));
    });

  });
}
