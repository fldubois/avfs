'use strict';

var chai   = require('chai');
var expect = chai.expect;

describe('avfs', function () {

  it('should throw unsupported version error', function () {
    expect(function () {
      require('lib/avfs');
    }).to.throw(Error, 'Unsupported node version: ' + process.version);
  });

});
