'use strict';

var fs = require('fs');

var chai   = require('chai');
var expect = chai.expect;

var AVFS = require('lib/avfs');

var avfs = new AVFS();

var getConstants = function (target) {
  var constants = [];

  for (var property in target) {
    if (/^[A-Z_]+$/.test(property)) {
      constants.push(property);
    }
  }

  return constants.sort();
};

describe('Constants', function () {
  var constants = {};

  before('get constants names', function () {
    constants.avfs = getConstants(avfs);
    constants.fs   = getConstants(fs);
  });

  it('should expose fs constants', function () {
    expect(constants.avfs).to.deep.equal(constants.fs);

    constants.fs.forEach(function (name) {
      expect(constants.avfs[name]).to.equal(constants.fs[name]);
    });
  });

});
