/**
 * This module handles determining all the valid images in a 
 * folder that can be displayed, and returning the adjacent 
 * images to the current one.
 *
 * Currently, this module is only used by the ViewHandler module
 */

'use-strict';

// Module imports
const fs = require('fs');
const path = require('path');
const sort = require('alphanum-sort');

// The supported filetypes
const SUPPORTED_TYPES = require('../util/SupportedFiletypes.js');


/**
 * The instantiator for the fsManager class
 * @method fsManager
 * @return {none}
 */
function fsManager() {
  this.READY = false;
  this.IMAGE_LIST = [];
  this.CURRENT_DIR = '';
  this.CURRENT_INDEX = 0;
}


/**
 * The initialization method. The current directory and the current 
 * image filename is passed in, and this method finds all the other 
 * valid images in the current directory and the index of the current 
 * file
 * @method
 * @param  {String}   directory The current directory of the given file
 * @param  {String}   filename  The filename of the image file
 * @param  {Function} callback  A callback of (err) if an error happened, or
 *                              (null) on success. This is called after this
 *                              init function has finished.
 * @return {none}
 */
fsManager.prototype.init = function (directory, filename, callback) {
  
  // Don't re-run the generator on the same folder
  if (directory !== this.CURRENT_DIR) {
    
    // Reset class variables
    this.READY = false;
    this.IMAGE_LIST = [];
    this.CURRENT_DIR = directory;
    
    // Read the current directory and get a list of all the items in it
    fs.readdir(directory, (err, items) => {
      // Immediately callback with error if any
      if (err) {
        console.log('[ERROR] - fsManager.init(): ' + err);
        callback(err);
      }
      
      // Sort the items using the alphanum-sort package
      items = sort(items, {insensitive: true});
      
      // Iterate over every file in the directory and push the supported 
      // ones onto the image array
      items.forEach((fn, idx) => {
        
        // If the extension is supported, push it onto the array
        if (path.extname(fn).toLowerCase().match(SUPPORTED_TYPES)) {
          
          // If the filename is the same as the given one, then 
          // this is the index of the file into the image array
          if (fn === filename) {
            this.CURRENT_INDEX = this.IMAGE_LIST.length;
          }
          
          // Push the filename to the array
          this.IMAGE_LIST.push(fn);
        }
      });
      
      // Set the ready flag to true
      this.READY = true;
      
      // Callback successfully
      callback(null);
    });
    
  } else {
    // The user drag-and-dropped a different image from the same folder, 
    // so find it in the current array
    
    // While finding the image, prevent calls that require the 
    // image array
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
    
    // If the file was not found, callback with an error since
    // it's supposed to be in the image array
    if (!this.READY) {
      let err = 'Image \'' + filename + '\' not found in the current directory';
      console.log('[ERROR] - fsManager.init(): ' + err);
      callback(err);
    }
    
    // Callback successfully
    callback(null);
  }
};


/**
 * Returns the index of the current image 
 * @method getCurrentIndex
 * @return {Integer} The index of the current image
 */
fsManager.prototype.getCurrentIndex = function () {
  return this.CURRENT_INDEX;
};


/**
 * Returns the length of the image array
 * @method getTotalNumber
 * @return {Integer} The length of the image array
 */
fsManager.prototype.getTotalNumber = function () {
  return this.IMAGE_LIST.length;
};


/**
 * Get the next valid filename from the image array, starting
 * from the 'currentIndex' variable
 * @method getNextFromIDX
 * @param  {Boolean}   wrap         Should the images wrap around to the start?
 * @param  {Integer}   currentIndex The index of the current image
 * @param  {Function}  callback     A callback of (<generator ready>, <new 
 *                                  filename>, <new index>). If the init 
 *                                  function is not ready, this function will 
 *                                  callback with (false, null, 0)
 * @return {none}
 */
fsManager.prototype.getNextFromIDX = function (wrap, currentIndex, callback) {
  if (this.READY) {
    // If the current image is the last one
    if (currentIndex + 1 > this.IMAGE_LIST.length - 1) {
      if (wrap) {
        // Reset the current file to the first item in 
        // the directory
        currentIndex = 0;
        
        // Callback with the last image, wrapping around to the
        // start of the directory
        callback(true, this.IMAGE_LIST[currentIndex], currentIndex);
      } else {
        
        // Callback with 'false', letting the caller know not to take 
        // any action
        callback(false, null, 0);
      }
    } else {
      // Default behavior
      // Increment the current file index
      currentIndex = currentIndex + 1;
      
      // Callback with the next filename
      callback(true, this.IMAGE_LIST[currentIndex], currentIndex);
    }
  } else {
    // The image list hasn't been generated yet, so callback 
    // with no value
    callback(false, null, 0);
  }
};


/**
 * Get the previous valid filename from the image array, starting
 * from the 'currentIndex' variable
 * @method
 * @param  {Boolean}  wrap         Should the images wrap around to the end?
 * @param  {Integer}  currentIndex The index of the current image
 * @param  {Function} callback     A callback of (<generator ready>, <new 
 *                                  filename>, <new index>). If the init 
 *                                  function is not ready, this function will 
 *                                  callback with (false, null, 0)
 * @return {none}
 */
fsManager.prototype.getPrevFromIDX = function (wrap, currentIndex, callback) {
  if (this.READY) {
    // If the current image is the first one
    if (currentIndex - 1 < 0) {
      if (wrap) {
        // Reset the current file to the last item in 
        // the directory
        currentIndex = this.IMAGE_LIST.length - 1;
        
        // Callback with the last image, wrapping around to the
        // end of the directory
        callback(true, this.IMAGE_LIST[currentIndex], currentIndex);
      } else {
        
        // Callback with 'false', letting the caller know not to take 
        // any action
        callback(false, null, 0);
      }
    } else {
      // Default behavior
      // Decrement the current file index
      currentIndex = currentIndex - 1;
      
      // Callback with the previous filename
      callback(true, this.IMAGE_LIST[currentIndex], currentIndex);
    }
  } else {
    // The image list hasn't been generated yet, so callback 
    // with no value
    callback(false, null, 0);
  }
};


/**
 * Reset the variables in this class
 * @method resetManager
 * @return {none}
 */
fsManager.prototype.resetManager = function () {
  this.READY = false;
  this.IMAGE_LIST = [];
  this.CURRENT_DIR = '';
  this.CURRENT_INDEX = 0;
};


// Export the FilesystemManager class
module.exports = fsManager;
