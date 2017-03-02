'use strict';

var chai   = require('chai');
var expect = chai.expect;

var elements = require('lib/common/elements');
var types    = require('lib/common/types');

describe('common/elements', function () {

  it('should expose a directory factory', function () {
    var mode = '0777';

    // Without children

    var directory = elements.directory(parseInt(mode, 8));

    expect(directory).to.be.an.avfs.directory.with.mode(mode).and.is.clear();

    // With children

    var children = {
      test: true
    };

    directory = elements.directory(parseInt(mode, 8), children);

    expect(directory).to.be.an.avfs.directory.with.mode(mode);
    expect(directory).to.deep.equal(children);
  });

  it('should expose a file factory', function () {
    var content = new Buffer('Hello, friend.');
    var mode    = '0666';

    var file = elements.file(parseInt(mode, 8), content);

    expect(file).to.be.an.avfs.file.that.contain(content).with.mode(mode);
  });

  it('should expose a symlink factory', function () {
    var target = '/path/to/target';
    var mode   = '0777';

    var link = elements.symlink(parseInt(mode, 8), target);

    expect(link).to.be.an.avfs.symlink.with.mode(mode).that.target(target);
  });

});
