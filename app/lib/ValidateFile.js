/**
 * A module that validates a file, given its full filepath
 * TODO put this in FSManager
 */

'use-strict';

const readChunk = require('read-chunk');
const fileType = require('file-type');
const path = require('path');
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
 * @method check
 * @param  {String}  filepath The absolute filepath
 * @return {Object}           { err: true|false, message: "error message" }
 */
function check(filepath) {
  // If a fatal error occurs, default return 'false'
  try {
    if (fs.lstatSync(filepath).isFile()) { // is it a file?
      // read the filetype
      let FILETYPE_RESULT = fileType(readChunk.sync(filepath, 0, 262));

      // is the filetype supported?
      if (FILETYPE_RESULT && FILETYPE_RESULT.ext.match(SUPPORTED_TYPES)) {
        return {
          err: false,
          message: ''
        };
      }
    }

    // Default return an error. If this is reached, the file
    // isn't supported
    return {
      err: true,
      message: '\'' + path.basename(filepath) + '\'' + ' is not a supported filetype'
    };

  } catch (e) {
    // Catch unexpected errors, and also return them
    return {
      err: true,
      message: 'Fatal error for ' + path.basename(filepath) + ': ' + e
    };
  }
}


// Export the validator function
module.exports = {
  check: check
};
