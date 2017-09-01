'use strict';
// Some utility functions for Gue

module.exports.maxLen = names => {
  if (names.length > 0 && Array.isArray(names)) {
    return names.reduce((a, b) => {
      return a.length > b.length ? a.length : b.length;
    });
  } else {
    return 0;
  }
};

module.exports.leftPad = (text, pad) => {
  if (text.length >= pad) {
    return text;
  } else {
    const padCount = pad - text.length;
    return ' '.repeat(padCount) + text;
  }
};

module.exports.toArray = value => {
  if (Array.isArray(value)) {
    return value;
  } else {
    return [value];
  }
};
