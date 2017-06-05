'use strict';

var events = require('events');

var chai   = require('chai');
var expect = chai.expect;

var FSWatcher = require('lib/common/watchers/fs-watcher');

describe('common/fs-watcher', function () {

  it('should expose a constructor', function () {
    expect(FSWatcher).to.be.a('function');
    expect(new FSWatcher()).to.be.an.instanceOf(FSWatcher);
  });

  it('should be an EventEmitter', function () {
    expect(new FSWatcher()).to.be.an.instanceOf(events.EventEmitter);
  });

  describe('start()', function () {

    it('should do nothing', function () {
      var watcher = new FSWatcher();

      expect(watcher.start('/tmp/file', true)).to.be.an('undefined');
    });

  });

  describe('close()', function () {

    it('should do nothing', function () {
      var watcher = new FSWatcher();

      expect(watcher.close()).to.be.an('undefined');
    });

  });

});
