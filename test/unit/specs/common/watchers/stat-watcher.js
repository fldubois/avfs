'use strict';

var events = require('events');

var chai   = require('chai');
var expect = chai.expect;

var StatWatcher = require('lib/common/watchers/stat-watcher');

describe('common/watchers/stat-watcher', function () {

  it('should expose a constructor', function () {
    expect(StatWatcher).to.be.a('function');
    expect(new StatWatcher()).to.be.an.instanceOf(StatWatcher);
  });

  it('should be an EventEmitter', function () {
    expect(new StatWatcher()).to.be.an.instanceOf(events.EventEmitter);
  });

  describe('start()', function () {

    it('should do nothing', function () {
      var watcher = new StatWatcher();

      expect(watcher.start('/tmp/file', true, 1000)).to.be.an('undefined');
    });

  });

  describe('stop()', function () {

    it('should do nothing', function () {
      var watcher = new StatWatcher();

      expect(watcher.stop()).to.be.an('undefined');
    });

  });

});
