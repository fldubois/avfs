'use strict';

var chai   = require('chai');
var expect = chai.expect;

var AVFSError = require('lib/common/avfs-error');

describe('common/avfs-error', function () {

  it('should expose a constructor', function () {
    expect(AVFSError).to.be.a('function');
    expect(new AVFSError()).to.be.an.instanceOf(AVFSError);
  });

  it('should extends Error', function () {
    expect(new AVFSError()).to.be.an.instanceOf(Error);
  });

  it('should set code', function () {
    expect(new AVFSError('ENOENT')).to.have.property('code', 'ENOENT');
    expect(new AVFSError('EEXIST')).to.have.property('code', 'EEXIST');
  });

  it('should set additional data', function () {
    var error = new AVFSError('ENOENT', {
      a: 'a',
      b: 10,
      c: false
    });

    expect(error).to.have.property('a', 'a');
    expect(error).to.have.property('b', 10);
    expect(error).to.have.property('c', false);
  });

});
