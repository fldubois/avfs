'use strict';

var chai   = require('chai');
var expect = chai.expect;

var elements = require('../../lib/common/elements');
var types    = require('../../lib/common/types');

describe('common/elements', function () {

  it('should expose a directory factory', function () {
    var mode = 511;

    // Without children

    var directory = elements.directory(mode);

    expect(directory).to.deep.equal({});

    expect(directory['@mode']).to.equal(mode);
    expect(directory['@type']).to.equal(types.DIR);

    // With children

    var children = {
      test: true
    };

    directory = elements.directory(mode, children);

    expect(directory).to.deep.equal(children);

    expect(directory['@mode']).to.equal(mode);
    expect(directory['@type']).to.equal(types.DIR);
  });

  it('should expose a file factory', function () {
    var content = new Buffer('Hello, friend.');
    var mode    = 438;

    var file = elements.file(mode, content);

    expect(file).to.deep.equal({});

    expect(file['@content']).to.equal(content);
    expect(file['@mode']).to.equal(mode);
    expect(file['@type']).to.equal(types.FILE);
  });

});
