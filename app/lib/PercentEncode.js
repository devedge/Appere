const frep = require('frep');

var replacements = [{
    pattern: '!',
    replacement: '%21'
  }, {
    pattern: '*',
    replacement: '%2A'
  }, {
    pattern: '\'',
    replacement: '%27'
  }, {
    pattern: '(',
    replacement: '%28'
  }, {
    pattern: ')',
    replacement: '%29'
  }, {
    pattern: ';',
    replacement: '%3B'
  }, {
    pattern: ':',
    replacement: '%3A'
  }, {
    pattern: '@',
    replacement: '%40'
  }, {
    pattern: '&',
    replacement: '%26'
  }, {
    pattern: '=',
    replacement: '%3D'
  }, {
    pattern: '+',
    replacement: '%2B'
  }, {
    pattern: '$',
    replacement: '%24'
  }, {
    pattern: ',',
    replacement: '%2C'
  }, {
    pattern: '?',
    replacement: '%3F'
  }, {
    pattern: '#',
    replacement: '%23'
  }, {
    pattern: '[',
    replacement: '%5B'
  }, {
    pattern: ']',
    replacement: '%5D'
  }, {
    pattern: ' ',
    replacement: '%20'
  }
];

// {
//   pattern: '/',
//   replacement: '%2F'
// },


// Return a percent encoded version of the string
function pEncode(string) {
  return frep.strWithArr(string, replacements);
}


// Export the pEncode function
module.exports = pEncode;
