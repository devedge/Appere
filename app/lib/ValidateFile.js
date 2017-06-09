/**
 * A module that validates a file, given its full filepath
 *
 */

'use-strict';

const readChunk = require('read-chunk');
const fileType = require('file-type');
const fs = require('fs');

// The supported filetypes
const SUPPORTED_TYPES = require('../util/SupportedFiletypes.js');


/**
 * Use several techniques to ensure that a given file is valid.
 * First, 'fs' is used to check that the file is actually a file and not
 * some other type (eg. a directory).
 * Second, 'fileType' is used to check the magic numbers to get the
 * file type.
 * Third, the filetype is checked to be non-null, and then validated
 * against the supported filetypes
 *
 * @method isValid
 * @param  {String}  filepath The absolute filepath
 * @return {Boolean}          'true' if it's valid, and 'false' otherwise
 */
function isValid(filepath) {
  // If a fatal error occurs, default return 'false'
  try {
    // Ensure that the this path is actually a file
    if (fs.lstatSync(filepath).isFile()) {
      // Try to determine the file type
      let FILETYPE_RESULT = fileType(readChunk.sync(filepath, 0, 262));

      // If the filetype resolution was successful and it's a
      // supported filetype, then return 'true'
      if (FILETYPE_RESULT && FILETYPE_RESULT.ext.match(SUPPORTED_TYPES)) {
        return true;
      }
    }

    // Default return 'false', if none of the conditions are satisfied
    return false;

  } catch (e) {
    // Return false, and log the error to the console
    console.log('[ERROR] - isValid(): ' + e);
    return false;
  }
}

// callback(err, isFatal)
// if NOT fatal, then don't display huge error message
function realIsValid(filepath, callback) {
  // Ensure that the this path is actually a file
  if (fs.lstatSync(filepath).isFile()) {
    // Try to determine the file type
    let FILETYPE_RESULT = fileType(readChunk.sync(filepath, 0, 262));

    // If the filetype resolution was successful and it's a
    // supported filetype, then return 'true'
    if (FILETYPE_RESULT) {
      if (FILETYPE_RESULT.ext.match(SUPPORTED_TYPES)) {
        callback();
      } else {
        callback('\'' + filepath + '\' is not a supported filetype', false);
      }
    } else {
      callback('Could not read filetype for \'' + filepath + '\'', true);
    }

  } else {
    callback('\'' + filepath + '\' is not a file', true);
  }
}

// validateFile.isValid(path.join(vs.dirPath, filename), (err, isFatal) => {
//
// });

// Export the validator function
module.exports = {
  isValid: isValid
};
