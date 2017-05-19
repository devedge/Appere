/**
 * The module that handles the image view. It uses a 'view' object to keep 
 * track of the application's current state.
 * @type {Object}
 */

'use-strict';

const {ipcRenderer} = require('electron');
const sizeOf = require('image-size');
const path = require('path');

// The view state object. This represents all the data
// required to display images in the application.
let vs = {
  dirPath: '', // The absolute path to the current directory
  pointer: {   // A rolling index of pointers to the list of images
    current: 0,
    next: 1,
    previous: 2
  },
  stateArray: [   // An object array that maintains state of the three images
    {
      element: null,  // A handle to the image element
      filename: '',   // The image's filename
      index: 0,       // The updatable pointer 
      dimensions: {}  // The dimensions {width, height} of the current image
    },
    {
      element: null,
      filename: '',
      index: 0,
      dimensions: {}
    },
    {
      element: null,
      filename: '',
      index: 0,
      dimensions: {}
    }
  ],
  title: {          // An object that maintains state of the window title
    element: null,  // The 'title' element
    filename: '',
    fileIndex: 0,
    totalFiles: 0,
    percentShrunk: ''
  }
}


/**
 * [view description]
 * @method view
 * @return {[type]} [description]
 */
function view() {}


/**
 * Initialize and set the handles to the img tags. This function can
 * (and will) also be used to set other additional variables.
 * @method
 * @param  {element} imgElement1 img tag 1
 * @param  {element} imgElement2 img tag 2
 * @param  {element} imgElement3 img tag 3
 * @return {none}
 */
view.prototype.init = function (imgElement1, imgElement2, imgElement3, title) {
  vs.stateArray[vs.pointer.current].element = imgElement1;
  vs.stateArray[vs.pointer.next].element = imgElement2;
  vs.stateArray[vs.pointer.previous].element = imgElement3;
  vs.title.element = title;
};


/**
 * Sets the current image in the viewer. Additionally, it also 
 * initializes the application in that image's current directory.
 * @method
 * @param  {string}   filepath The absolute filepath to the image
 * @param  {Function} callback A callback containing (err) if error
 * @return {none}
 */
view.prototype.setCurrentImage = function (filepath, callback) {
  try {
    if (true) { // TODO: write the file validation module
      
      // Reset the app's view
      resetView();
      
      // Determine the new directory & basename
      vs.dirPath = path.dirname(filepath);
      vs.stateArray[vs.pointer.current].filename = path.basename(filepath);
      
      // Focus the window to the foreground
      ipcRenderer.send('focus-window');
      
      // Set the size of the current image
      vs.stateArray[vs.pointer.current].dimensions = 
        sizeOf(path.join(
          vs.dirPath,
          vs.stateArray[vs.pointer.current].filename
        ));
      
      // Send these new dimensions to the resize function in the 
      // main process. This is done before setting the image to reduce
      // noticeable lag.
      ipcRenderer.send(
        'resize-window', 
        vs.stateArray[vs.pointer.current].dimensions
      );
      
      // Then, set the image in the view. pEncode ensures that the image
      // path is safely percent-encoded so the chromium engine can resolve it.
      vs.stateArray[vs.pointer.current].element.src = 
        path.join(
          vs.dirPath,
          pEncode(vs.stateArray[vs.pointer.current].filename);
        );
      
      // Finally, generate the list of valid images in the current directory.
      // Then, a user can iterate between the previous/next images
      
      
    } else {
      throw 'Invalid/corrupt file for \'' + filepath '\'';
    }
  } catch (e) {
    console.log('[ERROR] - setCurrentImage(): ' + e);
    callback(e);
  }
};


/**
 * Displays the next image in the viewer. Calls back with (err) if
 * there was an error
 * @method
 * @param  {Function} callback A callback containing (err) if error
 * @return {none}
 */
view.prototype.showNext = function (callback) {
  try {
    
  } catch (e) {
    console.log('[ERROR] - showNext(): ' + e);
    callback(e);
  }
};


/**
 * Displays the previous image in the viewer. Calls back with (err) if
 * there was an error
 * @method
 * @param  {Function} callback A callback containing (err) if error
 * @return {none}
 */
view.prototype.showPrev = function (callback) {
  try {
    
  } catch (e) {
    console.log('[ERROR] - showPrev(): ' + e);
    callback(e);
  }
};




view.prototype.zoomImage = function () {
  try {
    
  } catch (e) {
    console.log('[ERROR] - zoomImage(): ' + e);
    callback(e);
  }
};

view.prototype.fitImage = function () {
  try {
    
  } catch (e) {
    console.log('[ERROR] - fitImage(): ' + e);
    callback(e);
  }
};

view.prototype.isZoomed = function () {
  try {
    
  } catch (e) {
    console.log('[ERROR] - isZoomed(): ' + e);
    callback(e);
  }
};





//
// Private functions
// everything below is only used internally
//


/**
 * Reset the view by reinitializing the entire object
 * @method resetView
 */
function resetView() {
  // Create a new view state, but preserve the 'init' conditions
  newViewState = {
    dirPath: '',
    pointer: {
      current: 0,
      next: 1,
      previous: 2
    },
    stateArray: [
      {
        element: vs.stateArray[vs.pointer.current].element,
        filename: '',
        index: 0,
        dimensions: {}
      },
      {
        element: vs.stateArray[vs.pointer.next].element,
        filename: '',
        index: 0,
        dimensions: {}
      },
      {
        element: vs.stateArray[vs.pointer.previous].element,
        filename: '',
        index: 0,
        dimensions: {}
      }
    ],
    title: {
      element: vs.title.element,
      filename: '',
      fileIndex: 0,
      totalFiles: 0,
      percentShrunk: ''
    }
  }
  
  // TODO: Add some code to set the image elemets to display the app screen
  
  // Then, reassign the new object
  vs = newViewState;
}


/**
 * If any of the new fields have been updated, set the new title 
 * fields. Then, update the window title. The title format is:
 * 
 *           <filename> (z%) — <x>/<y> — Appere
 * 
 * @method setTitle
 * @param  {object} newFields The new title fields. They must exactly match up
 *                            to the ones defined in the 'vs' object (except 
 *                            for 'element')
 */
function setTitle(newFields) {
  vs.title.filename = 
    (newFields.filename) ? newFields.filename : vs.title.filename;
  vs.title.fileIndex = 
    (newFields.fileIndex) ? newFields.fileIndex : vs.title.fileIndex;
  vs.title.totalFiles = 
    (newFields.totalFiles) ? newFields.totalFiles : vs.title.totalFiles;
  vs.title.percentShrunk = 
    (newFields.percentShrunk) ? newFields.percentShrunk : vs.title.percentShrunk;
  
  // Create a new 'app title'
  let appTitle = '';
  
  // If there's a filename, use it
  if (vs.title.filename) {
    appTitle = vs.title.filename;
    
    // If the 'percentShrunk' variable is set, append it
    if (vs.title.percentShrunk) {
      appTitle += ' (' + vs.title.percentShrunk + '%)';
    }
    
    // If the file's index & total number of files is defined, append them
    if (vs.title.fileIndex && vs.title.totalFiles) {
      appTitle += ' — ' + vs.title.fileIndex + '/' + vs.title.totalFiles;
    }
    
    // Finally, append the application's name to the end
    appTitle += ' — Appere';
  } else {
    // Otherwise, simply use the application's name
    appTitle = 'Appere';
  }
  
  // Set the app's window new title
  vs.title.element = appTitle;
}



// Export the 'view' Class
module.exports = view;
