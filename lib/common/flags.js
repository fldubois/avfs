'use strict';

var constants = require('./constants');

module.exports.parse = function (flag) {
  if (typeof flag !== 'string') {
    return flag;
  }

  switch (flag) {
    case 'r':   // fall through
    case 'rs':  return constants.O_RDONLY;

    case 'r+':  // fall through
    case 'rs+': return constants.O_RDWR;

    case 'w':  return constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC;
    case 'wx': // fall through
    case 'xw': return constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC  | constants.O_EXCL;

    case 'w+':  return constants.O_RDWR  | constants.O_CREAT | constants.O_TRUNC;
    case 'wx+': // fall through
    case 'xw+': return constants.O_RDWR  | constants.O_CREAT | constants.O_TRUNC  | constants.O_EXCL;

    case 'a':  return constants.O_WRONLY | constants.O_CREAT | constants.O_APPEND;
    case 'ax': // fall through
    case 'xa': return constants.O_WRONLY | constants.O_CREAT | constants.O_APPEND | constants.O_EXCL;

    case 'a+':  return constants.O_RDWR  | constants.O_CREAT | constants.O_APPEND;
    case 'ax+': // fall through
    case 'xa+': return constants.O_RDWR  | constants.O_CREAT | constants.O_APPEND | constants.O_EXCL;

    default: throw new Error('Unknown file open flag: ' + flag);
  }
};
