'use strict';

var chai   = require('chai');
var expect = chai.expect;

var elements = require('lib/common/elements');

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
    expect(directory.get('content')).to.deep.equal(children);
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

  it('should set an inode number', function () {
    var fileA = elements.file(parseInt('0666', 8), 'Hello, friend.');
    var fileB = elements.file(parseInt('0666', 8), 'Hello, friend.');

    expect(fileA.get('inode')).to.be.a('number').above(0);
    expect(fileB.get('inode')).to.be.a('number').above(0);

    expect(fileB.get('inode')).to.equal(fileA.get('inode') + 1);
  });

  it('should set element owner and group', function () {
    var file = elements.file(parseInt('0666', 8), 'Hello, friend.');

    expect(file.get('uid')).to.equal(process.getuid());
    expect(file.get('gid')).to.equal(process.getgid());
  });

  it('should update ctime', function (done) {
    var file = elements.file(parseInt('0666', 8), 'Hello, friend.');

    var before = null;
    var after  = null;

    setTimeout(function () {
      before = file.get('mtime');

      file.set('atime', new Date());

      after = file.get('mtime');

      expect(before.getTime()).to.equal(after.getTime());

      var values = [
        {name: 'content', value: 'Hello, world !'},
        {name: 'mode',    value: parseInt('0777', 8)},
        {name: 'gid',     value: 1000},
        {name: 'uid',     value: 1000},
        {name: 'nlink',   value: 5}
      ];

      var interval = setInterval(function () {
        var property = values.pop();

        if (typeof property !== 'undefined') {
          clearInterval(interval);

          return done();
        }

        before = file.get('ctime');

        file.set(property.name, property.value);

        after = file.get('ctime');

        expect(before.getTime()).to.be.below(after.getTime());
      }, 50);
    }, 50);
  });

  it('should update mtime', function (done) {
    var file = elements.file(parseInt('0666', 8), 'Hello, friend.');

    var before = file.get('mtime');

    setTimeout(function () {
      file.set('content', 'Hello, world !');

      var after = file.get('mtime');

      expect(before.getTime()).to.be.below(after.getTime());

      done();
    }, 50);
  });

});
