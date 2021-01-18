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

  if (typeof fs.constants === 'object') {

    it('should expose constants object', function () {
      expect(avfs.constants).to.have.all.keys(fs.constants);

      Object.keys(fs.constants).forEach(function (name) {
        expect(avfs.constants[name], name + ' should have the correct value').to.equal(fs.constants[name]);
      });
    });

  }

});
