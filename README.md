# avfs

[![npm](https://img.shields.io/npm/v/avfs.svg?maxAge=3600)](https://www.npmjs.com/package/avfs)
[![Build Status](https://travis-ci.org/fldubois/avfs.svg?branch=master)](https://travis-ci.org/fldubois/avfs)
[![Coverage Status](https://coveralls.io/repos/github/fldubois/avfs/badge.svg?branch=master)](https://coveralls.io/github/fldubois/avfs?branch=master)
[![dependencies Status](https://david-dm.org/fldubois/avfs/status.svg)](https://david-dm.org/fldubois/avfs)
[![devDependencies Status](https://david-dm.org/fldubois/avfs/dev-status.svg)](https://david-dm.org/fldubois/avfs?type=dev)

> Another Virtual File System

### Description

The goal of this project is to reproduce the Node.js core fs API essentially for testing/mocking purpose.

It creates a virtual file system stored directly in memory.

### Supported Node.js versions

* v0.10
* v0.12
* v4
* v5

### Usage

```js
// The module exports an AVFS constructor

var AVFS = require('avfs');

// Instantiate a fs

var fs = new AVFS();

// Use it as the core fs module

fs.mkdirSync('/tmp');

fs.writeFileSync('/tmp/file', 'Hello, friend.');

var stats = fs.statSync('/tmp/file');

fs.open('/tmp/test.txt', 'r', function (error, fd) {
  var buffer = new Buffer(6);

  fs.read(fd, buffer, 0, 6, null, function (error, bytesRead, buffer) {
    if (bytesRead > 0) {
      console.log(buffer.toString());
    }
  });
});
```

### Caveats

* File types support

AVFS only support basic file types (_file_, _directory_ and _symlink_).

Other types (_socker_, _FIFO_, _block device_, _character device_) are not supported.

* Changes watching API

Watching functions (`watch`, `watchFile` and `unwatchFile`) are only placeholder.

They work as their core fs module couterparts but will not emit events.
