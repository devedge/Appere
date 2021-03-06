/**
 * FilesystemManager module
 * Class to handle all filesystem functions required by this app.
 *
 */

const path = require('path');
const fs = require('fs');

// For sorting image array
const sort = require('alphanum-sort');

// For trashing files
const trash = require('trash');

// isFileValid imports
const readChunk = require('read-chunk');
const fileType = require('file-type');
const SUPPORTED_TYPES = require('../util/SupportedFiletypes.js');

// sizeOf imports
const imageSize = require('image-size');
const probe = require('probe-image-size');


class FSManager {
  constructor() {
    this.READY = false;
    this.IMAGE_LIST = [];
    this.CURRENT_DIR = '';
    this.CURRENT_INDEX = 0;
  }

  /**
   * Initialization function for a new directory.
   * This function finds all the other valid image files in
   * the directory of the given image.
   * @method init
   * @param  {String}   directory The current directory of the given file
   * @param  {String}   filename  The filename of the current file
   * @param  {Function} callback  A callback, with (err) if error happened
   */
  init(filepath, callback) {
    let filename = path.basename(filepath);
    let directory = path.dirname(filepath);

    // Don't re-run on the same folder
    if (directory !== this.CURRENT_DIR) {
      // Reset globals
      this.READY = false;
      this.IMAGE_LIST = [];
      this.CURRENT_DIR = directory;

      // Read the passed-in directory
      fs.readdir(directory, (err, items) => {
        if (err) { callback(err); }

        // Sort all files alphanumerically
        items = sort(items, {insensitive: true});

        // For each file in the directory, push the supported ones
        items.forEach((fn, idx) => {
          if (path.extname(fn).toLowerCase().match(SUPPORTED_TYPES)) {

            // If true, this file is at the current index in IMAGE_LIST
            if (fn === filename) {
              this.CURRENT_INDEX = this.IMAGE_LIST.length;
            }
            // Push the file
            this.IMAGE_LIST.push(fn);
          }
        });

        // Set ready to 'true' and callback
        this.READY = true;
        callback(null);
      });
    } else {
      // The user drag-and-dropped a different image from the same folder,
      // so find it in the current array
      // While finding the image, prevent calls that require the image array
      this.READY = false;

      // Use '.some' so we can quit as soon as the file is
      // found in the index
      this.IMAGE_LIST.some((string, index) => {
        if (string === filename) {
          // Update the current index of the new file
          this.CURRENT_INDEX = index;
          this.READY = true;
          return true;
        }
      });

      // If the file is not found, callback with an error since it should
      // be in the image array
      if (!this.READY) {
        callback(filename + ' not found in current directory');
      } else {
        callback(null);
      }
    }
  }

  /** Returns index of current image */
  getCurrentIndex() {
    return this.CURRENT_INDEX;
  }

  /** Returns the total number of images */
  getTotalNumber() {
    return this.IMAGE_LIST.length;
  }

  /** Returns if the array is done being generated */
  isReady() {
    return this.READY;
  }


  /**
   * Gets the next image in the array, from 'currentIndex'
   * @method getNext
   * @param  {Boolean} wrap         True, if wrap around
   * @param  {Int}     currentIndex The current image index
   * @return {Object}               {filename, newIndex} if there is something
   *                                to return
   */
  getNext(wrap, currentIndex) {
    if (this.READY) {
      // if the new index will be greater than the array length
      if (currentIndex + 1 > this.IMAGE_LIST.length - 1) {
        if (wrap) {
          currentIndex = 0; // cycle back to the start
        } else {
          return;           // no wrap, so do nothing
        }
      } else {
        currentIndex += 1;  // otherwise, increment the index
      }

      let fullp = path.join(this.CURRENT_DIR, this.IMAGE_LIST[currentIndex]);
      if (!fs.existsSync(fullp)) {
        // if the file no longer exists, remove it from the array and
        // call getNext again
        this.IMAGE_LIST.splice(currentIndex, 1);
        this.getNext(wrap, currentIndex);
        console.log('did it ever get to no file found?');
      } else {
        // return the filename and the new index
        return {
          filename: this.IMAGE_LIST[currentIndex],
          newIndex: currentIndex
        };
      }
    }

    // console.log('Ready: ' + this.READY);
    // get the next image from the image list
    // if wrap, return a wrapped lookup
    // if the returned image doesn't exist, 'split' the array and
    // recursively call this function
    /*
    if (this.READY) {
      // If the current image is the last one
      if (currentIndex + 1 > this.IMAGE_LIST.length - 1) {
        if (wrap) {
          // Reset the current file to the first item in the directory
          currentIndex = 0;

          // Callback with the last image and wrap around to the start
          callback(true, this.IMAGE_LIST[currentIndex], currentIndex);
        } else {

          // Callback with 'false' so the caller doesn't take any action
          callback(false, null, 0);
        }
      } else {
        // Default behavior: increment the current file index
        currentIndex = currentIndex + 1;

        // Callback with the next filename
        callback(true, this.IMAGE_LIST[currentIndex], currentIndex);
      }

      // Callback
    } else {
      // The image list hasn't been generated yet, so callback with no value
      callback(false, null, 0);
    }*/
  }


  /**
   * Gets the previous image in the array, from 'currentIndex'
   * @method getPrev
   * @param  {Boolean} wrap         True, if wrap around
   * @param  {Int}     currentIndex The current image index
   * @return {Object}               {filename, newIndex} if there is something
   *                                to return
   */
  getPrev(wrap, currentIndex) {
    if (this.READY) {
      // if the current image is the first one
      if (currentIndex - 1 < 0) {
        if (wrap) {
          currentIndex = this.IMAGE_LIST.length - 1;
        } else {
          return;          // no wrap, so do nothing
        }
      } else {
        currentIndex -= 1; // otherwise, decrement the index
      }

      let fullp = path.join(this.CURRENT_DIR, this.IMAGE_LIST[currentIndex]);
      if (!fs.existsSync(fullp)) {
        // if the file no longer exists, remove it from the array and
        // call getNext again on the previous one
        this.IMAGE_LIST.splice(currentIndex, 1);
        this.getNext(wrap, currentIndex - 1);
        console.log('did it ever get to no file found?');
      } else {
        // return the filename and the new index
        return {
          filename: this.IMAGE_LIST[currentIndex],
          newIndex: currentIndex
        };
      }
    }

    /*
    if (this.READY) {
      // If the current image is the first one
      if (currentIndex - 1 < 0) {
        if (wrap) {
          // Reset the current file to the last item in the directory
          currentIndex = this.IMAGE_LIST.length - 1;

          // Callback with the last image and wrap around to the end
          callback(true, this.IMAGE_LIST[currentIndex], currentIndex);
        } else {

          // Callback with 'false' so the caller doesn't take any action
          callback(false, null, 0);
        }
      } else {
        // Default behavior: decrement the current file index
        currentIndex = currentIndex - 1;

        // Callback with the previous filename
        callback(true, this.IMAGE_LIST[currentIndex], currentIndex);
      }
    } else {
      // The image list hasn't been generated yet, so callback with no value
      callback(false, null, 0);
    }*/
  }


  /**
   * Trashes the file at the 'currentIndex' provided.
   * This function removes it from the image list and uses the 'trash'
   * module to move it to the system's trash.
   * @method trashFile
   * @param  {Int}      currentIndex Index of the file to trash
   * @param  {Function} callback     Callback when done. More functionality may be added
   */
  trashFile(currentIndex, callback) {
    // Remove the file from the IMAGE_LIST
    this.IMAGE_LIST.splice(currentIndex, 1);
    // NOTE: is the CURRENT_INDEX still the same?
    // NOTE: it's still the responsibility of the caller to select the
    //       next image

    // Use the trash module
    trash(path.join(this.CURRENT_DIR, this.IMAGE_LIST[currentIndex])).then(() => {
      callback();
    });
  }


  /**
   * The absolute filepath to check. This function checks if the
   * file exists, if it's a file, and if the extension is valid.
   * @method isFileValid
   * @param  {String}    inputFP Absolute filepath
   * @return {Boolean}           True if valid, false otherwise
   */
  isFileValid(inputFP) {
    // if the image no longer exists, just return the next one & update array
    // if there is an error, return the error
    // TODO implement this in getNext/Prev

    let errmsg = '';

    // does the file exist?
    if (fs.existsSync(inputFP)) {
      if (fs.lstatSync(inputFP).isFile()) { // is this a file?
        // read the filetype
        let FILETYPE_RESULT = fileType(readChunk.sync(inputFP, 0, 262));

        // is the value non-null and supported?
        if (FILETYPE_RESULT && FILETYPE_RESULT.ext.match(SUPPORTED_TYPES)) {
          return {status: true, message: errmsg};
        } else {
          errmsg = 'File "' + inputFP + '" isn\'t a supported filetype';
        }
      } else {
        errmsg = '"' + inputFP + '" isn\'t a file';
      }
    } else {
      errmsg = 'File "' + inputFP + '" doesn\'t exist';
    }

    return {
      status: false,
      message: errmsg
    };
  }

  /**
   * Return the size of an image.
   * The 'image-size' module occasionally fails, so fallback on
   * the 'probe-image-size' module, which is slower due to
   * synchronous file reads.
   * @method sizeOf
   * @param  {String} filepath Absolute filepath to the image
   * @return {Object} { width:Int,height:Int,type:'',mime:'',wUnits:'', hUnits:''}
   */
  sizeOf(inputFP) {
    try {
      return imageSize(inputFP);
    } catch (e) {
      return probe.sync(fs.readFileSync(inputFP));
    }
  }

  /** Resets the global variables */
  reset() {
    this.READY = false;
    this.IMAGE_LIST = [];
    this.CURRENT_DIR = '';
    this.CURRENT_INDEX = 0;
  }
}

// Export the FilesystemManager class
module.exports = FSManager;
