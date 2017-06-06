'use strict';

var fs = require('fs');

var chai   = require('chai');
var expect = chai.expect;

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

var AVFS = require('lib/avfs');

var avfs = new AVFS();

describe('methods', function () {

  it('should expose fs methods', function () {
    expect(getMethods(avfs)).to.deep.equal(getMethods(fs));
  });

});
