'use strict';

var inode = 0;

module.exports = function (constants) {
  function element(type, mode, metas) {
    var now = new Date();

    var descriptors = {
      mode: {
        value:        mode,
        configurable: false,
        enumerable:   false,
        writable:     true
      },
      type: {
        value:        type,
        configurable: false,
        enumerable:   false,
        writable:     false
      },
      inode: {
        value:        inode++,
        configurable: false,
        enumerable:   false,
        writable:     false
      },
      uid: {
        value:        process.getuid(),
        configurable: false,
        enumerable:   false,
        writable:     true
      },
      gid: {
        value:        process.getgid(),
        configurable: false,
        enumerable:   false,
        writable:     true
      },
      nlink: {
        value:        1,
        configurable: false,
        enumerable:   false,
        writable:     true
      },
      atime: {
        value:        now,
        configurable: false,
        enumerable:   false,
        writable:     true
      },
      ctime: {
        value:        now,
        configurable: false,
        enumerable:   false,
        writable:     true
      },
      mtime: {
        value:        now,
        configurable: false,
        enumerable:   false,
        writable:     true
      },
      birthtime: {
        value:        now,
        configurable: false,
        enumerable:   false,
        writable:     true
      }
    };

    Object.keys(metas).forEach(function (meta) {
      descriptors[meta] = {
        value:        metas[meta],
        configurable: false,
        enumerable:   false,
        writable:     true
      };
    });

    var properties = Object.defineProperties({}, descriptors);

    return {
      get: function (name) {
        return properties[name];
      },
      set: function (name, value) {
        var time = new Date();

        if (name === 'content') {
          properties.mtime = time;
        }

        if (['content', 'mode', 'gid', 'uid', 'nlink'].indexOf(name) !== -1) {
          properties.ctime = time;
        }

        properties[name] = value;
      },
      isReadable: function () {
        var user  = (properties.uid === process.getuid() && (properties.mode & constants.S_IRUSR) > 0);
        var group = (process.getgroups().indexOf(properties.gid) !== -1 && (properties.mode & constants.S_IRGRP) > 0);
        var other = ((properties.mode & constants.S_IROTH) > 0);

        return (user || group || other);
      },
      isWritable: function () {
        var user  = (properties.uid === process.getuid() && (properties.mode & constants.S_IWUSR) > 0);
        var group = (process.getgroups().indexOf(properties.gid) !== -1 && (properties.mode & constants.S_IWGRP) > 0);
        var other = ((properties.mode & constants.S_IWOTH) > 0);

        return (user || group || other);
      },
      isExecutable: function () {
        var user  = (properties.uid === process.getuid() && (properties.mode & constants.S_IXUSR) > 0);
        var group = (process.getgroups().indexOf(properties.gid) !== -1 && (properties.mode & constants.S_IXGRP) > 0);
        var other = ((properties.mode & constants.S_IXOTH) > 0);

        return (user || group || other);
      }
    };
  }

  return {
    directory: function (mode, children) {
      return element(constants.S_IFDIR, mode, {
        content: children || {}
      });
    },
    file: function (mode, content) {
      return element(constants.S_IFREG, mode, {
        content: content || new Buffer(0)
      });
    },
    symlink: function (mode, target) {
      return element(constants.S_IFLNK, mode, {
        target: target
      });
    }
  };
};
