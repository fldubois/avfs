'use strict';

var fs = require('fs');

var chai   = require('chai');
var expect = chai.expect;


var AVFS = require('lib/avfs');

var avfs = new AVFS();

describe('Stats', function () {

  before('create files', function () {
    avfs.mkdirSync('/tmp');

    fs.writeFileSync('/tmp/file', 'Hello, friend.');
    avfs.writeFileSync('/tmp/file', 'Hello, friend.');
  });

  it('should expose Stats properties', function () {
    var avfsStats = avfs.statSync('/tmp/file');
    var fsStats   = fs.statSync('/tmp/file');

    expect(avfsStats).to.include.all.keys(Object.keys(fsStats));
  });

  after('clean files', function () {
    fs.unlinkSync('/tmp/file');
  });

});
