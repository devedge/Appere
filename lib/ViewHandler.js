/**
 * The module that handles the image view. It uses a 'view' object to keep 
 * track of the application's current state.
 *
 * This is currently only used by the 'app.js' module imported in the view
 *
 * TODO: Fade in the logo, then have helpful animations appear below it
 */

'use-strict';

// Module imports
const {ipcRenderer} = require('electron');
const sizeOf = require('image-size');
const path = require('path');

// Local module imports
const pEncode = require('./PercentEncode.js');
const FilesystemManager = require('./FilesystemManager.js');

// The filepath to the home screen background
const WELCOME_BACKGROUND = require('../util/ApphomePath.js');

// Boolean that indicates whether or not the app is at the start page
let APP_HOME = true; // TODO

// Initialize a fsManager
// TODO: Consider moving the fsManager to the main process
let fsManager = new FilesystemManager();

// TODO: scale-fit and scale-full global variables
// TODO: load some global variables for things like 'wrap'
let userSettings = {
  wrap: true,
  returnPercentCalc: true
};


// The view state object. This represents all the data
// required to display images in the application.
let vs = {
  dirPath: '', // The absolute path to the current directory
  dirNum: 0,   // The number of items in the current directory
  pointer: {   // A rolling index of pointers to the list of images
    current: 0,
    next: 1,
    previous: 2
  },
  stateArray: [   // An object array that maintains state of the three images
    {
      element: null,  // A handle to the image element
      filename: '',   // The image's filename
      index: 0,       // The index into the image array
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
    filename: '',
    fileIndex: 0,
    totalFiles: 0,
    percentShrunk: ''
  }
};


/**
 * The 'view' class. This provides a handle to multiple methods
 * that control the application's view.
 * @method view
 * @return {none}
 */
function view() {
  this.zoomed = false;
  this.currentRealZoom = 0;
}


/**
 * Initialize and set the handles to the img tags. This function can
 * (and will) also be used to set other additional variables.
 * @method init
 * @param  {element} imgElement1 img tag 1
 * @param  {element} imgElement2 img tag 2
 * @param  {element} imgElement3 img tag 3
 * @return {none}
 */
view.prototype.init = function (imgElement1, imgElement2, imgElement3) {
  vs.stateArray[vs.pointer.current].element = imgElement1;
  vs.stateArray[vs.pointer.next].element = imgElement2;
  vs.stateArray[vs.pointer.previous].element = imgElement3;
  
  // Display the home background
  vs.stateArray[vs.pointer.current].element.src = WELCOME_BACKGROUND;
  vs.stateArray[vs.pointer.current].element.hidden = false;
};


/**
 * Sets the current image in the viewer. Additionally, it also 
 * initializes the application in that image's current directory.
 * @method setCurrentImage
 * @param  {string}   filepath The absolute filepath to the image (including
 *                             filename)
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
        vs.stateArray[vs.pointer.current].dimensions,
        userSettings.returnPercentCalc
      );
      
      // Then, set the image in the view. pEncode ensures that the image
      // path is safely percent-encoded so the chromium engine can resolve it.
      vs.stateArray[vs.pointer.current].element.src = 
        path.join(
          vs.dirPath,
          pEncode(vs.stateArray[vs.pointer.current].filename)
        );
      
      // The application is no longer on its home page
      APP_HOME = false;
      
      // Finally, generate the list of valid images in the current directory.
      // Then, a user can iterate between the previous/next images
      fsManager.init(vs.dirPath, vs.stateArray[vs.pointer.current].filename,
        (err) => {
          if (err) {
            throw err;
          }
          
          // Set the total number of images in the current directory
          vs.dirNum = fsManager.getTotalNumber();
          
          // Set the current image's index in that array
          vs.stateArray[vs.pointer.current].index = 
              fsManager.getCurrentIndex();
          
          // Set the window title
          setTitle({
            filename: vs.stateArray[vs.pointer.current].filename,
            fileIndex: fsManager.getCurrentIndex() + 1,
            totalFiles: vs.dirNum
          });
          
          // Load the next image
          loadNext(userSettings.wrap, fsManager.getCurrentIndex(), (err) => {
            if (err) { throw err; }
          });
          
          // Load the previous image
          loadPrev(userSettings.wrap, fsManager.getCurrentIndex(), (err) => {
            if (err) { throw err; }
          });
          
          // Successful callback if the user wants to take action after 
          // this function has finished
          callback(null);
      });
      
    } else {
      throw 'Invalid/corrupt file: \'' + filepath + '\'';
    }
  } catch (e) {
    console.log('[ERROR] - setCurrentImage(): ' + e);
    callback(e);
  }
};


/**
 * Displays the next image in the viewer. Calls back with (err) if
 * there was an error
 * @method showNext
 * @param  {Function} callback A callback containing (err) if error
 * @return {none}
 */
view.prototype.showNext = function (callback) {
  try {
    if (fsManager.isReady() && !APP_HOME) {
      
      // Try getting the image size and resizing the window. If the image is
      // corrupted in some way, catch the error.
      try {
        // Send an ipc resize message first to resize the window to scale to 
        // the image. This should smooth image resizing
        ipcRenderer.send('resize-window', 
          vs.stateArray[vs.pointer.next].dimensions, 
          userSettings.returnPercentCalc
        );
      } catch (e) {
        throw 'IPC \'resize-window\' error: ' + e;
      }
      
      // Hide the current element and show the next one
      vs.stateArray[vs.pointer.current].element.hidden = true;
      vs.stateArray[vs.pointer.next].element.hidden = false;
      
      // TODO: if this 'next' image is a 'gif', reload it from the start
      
      // Set the new window title
      setTitle({
        filename: vs.stateArray[vs.pointer.next].filename,
        fileIndex: vs.stateArray[vs.pointer.next].index + 1,
        totalFiles: vs.dirNum
      });
      
      // Update the pointer values
      let temp = vs.pointer.previous;
      vs.pointer.previous = vs.pointer.current;
      vs.pointer.current  = vs.pointer.next;
      vs.pointer.next     = temp; // This is not reassignment, the pointers are
                                  // being cycled
      
      // Preload the next image.
      // This 'next' image is now the 'current' image
      loadNext(userSettings.wrap, vs.stateArray[vs.pointer.current].index, 
               (err) => {
        if (err) { throw err; }
      });
    }
  } catch (e) {
    console.log('[ERROR] - showNext(): ' + e);
    callback(e);
  }
};


/**
 * Displays the previous image in the viewer. Calls back with (err) if
 * there was an error
 * @method showPrev
 * @param  {Function} callback A callback containing (err) if error
 * @return {none}
 */
view.prototype.showPrev = function (callback) {
  try {
    if (fsManager.isReady() && !APP_HOME) {
      
      // Try getting the image size and resizing the window. If the image is
      // corrupted in some way, catch the error.
      try {
        // Send an ipc resize message first to resize the window to scale to 
        // the image. This should smooth image resizing
        ipcRenderer.send('resize-window', 
          vs.stateArray[vs.pointer.previous].dimensions, 
          userSettings.returnPercentCalc
        );
      } catch (e) {
        throw 'IPC \'resize-window\' error: ' + e;
      }
      
      // Hide the current element and show the previous one
      vs.stateArray[vs.pointer.current].element.hidden = true;
      vs.stateArray[vs.pointer.previous].element.hidden = false;
      
      // TODO: if this 'previous' image is a 'gif', reload it from the start
      
      // Set the new window title
      setTitle({
        filename: vs.stateArray[vs.pointer.previous].filename,
        fileIndex: vs.stateArray[vs.pointer.previous].index + 1,
        totalFiles: vs.dirNum
      });
      
      // Update the pointer values
      let temp = vs.pointer.next;
      vs.pointer.next     = vs.pointer.current;
      vs.pointer.current  = vs.pointer.previous;
      vs.pointer.previous = temp; // This is not reassignment, the pointers are
                                  // being cycled
      
      // Preload the next image.
      // This 'previous' image is now the 'current' image
      loadPrev(userSettings.wrap, vs.stateArray[vs.pointer.current].index, 
               (err) => {
        if (err) { throw err; }
      });
    }
  } catch (e) {
    console.log('[ERROR] - showPrev(): ' + e);
    callback(e);
  }
};


/**
 * A method that sets the current image to 100% size in the window,
 * and resizes the window to its maximum dimensions
 * @method zoomImage
 * @return {none}
 */
view.prototype.zoomImage = function () {
  try {
    // If the image is already at 100%, do not zoom
    // If the 'this.zoomed' variable is true, also do not proceed so that
    // the 'currentRealZoom' doesn't get mistakenly set to 100
    if ((vs.title.percentShrunk < 100 /*|| !this.zoomed*/) && !APP_HOME) {
      // Set the zoomed flag
      this.zoomed = true;
      
      // Save the actual calculated zoom of the image
      this.currentRealZoom = vs.title.percentShrunk;
      
      // Ensure that the zoomed-in image also fills the full
      // window spac
      ipcRenderer.send('fill-window', 
        vs.stateArray[vs.pointer.current].dimensions);
      
      // Set the title with the new zoom percentage
      setTitle({percentShrunk: 100});
      
      // Set the CSS class that zooms the image
      vs.stateArray[vs.pointer.current].element.classList.remove('scale-fit');
      vs.stateArray[vs.pointer.current].element.classList.add('scale-full');
    }
  } catch (e) {
    console.log('[ERROR] - zoomImage(): ' + e);
    callback(e);
  }
};


/**
 * A method that sets the CSS class to fit the image within the window
 * @method fitImage
 * @return {none}
 */
view.prototype.fitImage = function () {
  try {
    
    if ((/*vs.title.percentShrunk < 100 ||*/ this.zoomed) && !APP_HOME) {
      // Reset the zoomed flag
      this.zoomed = false;
      
      // Ensure that the zoomed-in image also fills the full
      // window space
      ipcRenderer.send('resize-window', 
        vs.stateArray[vs.pointer.current].dimensions);
      
      // Set the title with the new zoom percentage
      setTitle({percentShrunk: this.currentRealZoom});
      
      // Set the CSS class that zooms the image
      vs.stateArray[vs.pointer.current].element.classList.remove('scale-full');
      vs.stateArray[vs.pointer.current].element.classList.add('scale-fit');
    }
  } catch (e) {
    console.log('[ERROR] - fitImage(): ' + e);
    callback(e);
  }
};


/**
 * Returns whether or not the image is currently zoomed
 * @method isZoomed
 * @return {Boolean} True if zoomed, false otherwise
 */
view.prototype.isZoomed = function () {
  return this.zoomed;
};


/**
 * A method that sends a minimize-window message to the main process
 * @method minimize
 * @return {none}
 */
view.prototype.minimize = function () {
  ipcRenderer.send('minimize-window');
};


// ------------------------------------------ //
//              Private functions             //
//  Everything below is only used internally  //
// ------------------------------------------ //


/**
 * Load the next image into the hidden 'next' img tag.
 * @method loadNext
 * @param  {Boolean}  wrap     Wrap around to the start?
 * @param  {Integer}  index    The absolute index of the current image
 * @param  {Function} callback A callback of (err) only if there's an error
 * @return {none}
 */
function loadNext(wrap, index, callback) {
  // Try to load the next image
  try {
    // Preload the next image into the next hidden 'img' tag
    fsManager.getNextFromIDX(wrap, index, (ready, filename, newIndex) => {
      // If the 'init' function is ready, then proceed
      if (ready) {
        if (true) { // TODO: validate the file
          
          // Set the next object's name and index
          vs.stateArray[vs.pointer.next].filename = filename;
          vs.stateArray[vs.pointer.next].index = newIndex;
          
          // Get the dimensions of the 'next' image 
          vs.stateArray[vs.pointer.next].dimensions = 
            sizeOf(path.join(
              vs.dirPath,
              vs.stateArray[vs.pointer.next].filename
            ));
          
          // Set the next image in the next 'img' tag
          vs.stateArray[vs.pointer.next].element.src = 
            path.join(vs.dirPath, pEncode(filename));
        } else {
          throw 'Invalid/corrupt file: \'' + filename + '\'';
        }
      }
    });
  } catch (e) {
    console.log('[ERROR] - loadNext(): ' + e);
    callback(e);
  }
}


/**
 * Load the previous image into the hidden 'previous' img tag.
 * @method loadPrev
 * @param  {Boolean}  wrap     Wrap around to the end?
 * @param  {Integer}  index    The absolute index of the current image
 * @param  {Function} callback A callback of (err) only if there's an error
 * @return {none}
 */
function loadPrev(wrap, index, callback) {
  // Try to load the previous image
  try {
    // Preload the previous image into the previous hidden 'img' tag
    fsManager.getPrevFromIDX(wrap, index, (ready, filename, newIndex) => {
      // If the 'init' function is ready, then proceed
      if (ready) {
        if (true) { // TODO: validate the file
          
          // Set the previous object's name and index
          vs.stateArray[vs.pointer.previous].filename = filename;
          vs.stateArray[vs.pointer.previous].index = newIndex;
          
          // Get the dimensions of the 'previous' image 
          vs.stateArray[vs.pointer.previous].dimensions = 
            sizeOf(path.join(
              vs.dirPath,
              vs.stateArray[vs.pointer.previous].filename
            ));
          
          // Set the previous image in the previous 'img' tag
          vs.stateArray[vs.pointer.previous].element.src = 
            path.join(vs.dirPath, pEncode(filename));
        } else {
          throw 'Invalid/corrupt file: \'' + filename + '\'';
        }
      }
    });
  } catch (e) {
    console.log('[ERROR] - loadPrev(): ' + e);
    callback(e);
  }
}


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
      filename: '',
      fileIndex: 0,
      totalFiles: 0,
      percentShrunk: ''
    }
  };
  
  // Then, reassign the new object
  vs = newViewState;
  
  // console.log(vs);
  
  // TODO: Add some code to set the image elements to display the app screen
  
  // Reset the window size
  ipcRenderer.send('resize-window', {width: 1000, height: 700}, false);
  
  // Reset the FilesystemManager
  fsManager.resetManager();
  
  // Reset the title
  document.title = 'Appere';
  
  // Reset the 'hidden' property
  vs.stateArray[0].element.hidden = false;
  vs.stateArray[1].element.hidden = true;
  vs.stateArray[2].element.hidden = true;
  
  // Set all the 'src' images to null
  vs.stateArray[0].element.src = WELCOME_BACKGROUND;
  vs.stateArray[1].element.src = '';
  vs.stateArray[2].element.src = '';
  
  // Reset the zoom classes
  vs.stateArray[0].element.classList.add('scale-fit');
  vs.stateArray[1].element.classList.add('scale-fit');
  vs.stateArray[2].element.classList.add('scale-fit');
  
  vs.stateArray[0].element.classList.remove('scale-full');
  vs.stateArray[1].element.classList.remove('scale-full');
  vs.stateArray[2].element.classList.remove('scale-full');
  
  APP_HOME = true;
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
  document.title = appTitle;
}


/**
 * After the main process has finished calculating + resizing the 
 * window, it also emits and event with the newly scaled-down percentage
 * @type {EventEmitter}
 */
ipcRenderer.on('percent-reduc', (event, percentCalc) => {
  if (percentCalc > 100) {
    setTitle({percentShrunk: 100});
  } else {
    setTitle({percentShrunk: percentCalc});
  }
});


/**
 * Clear the view after the window has been minimized
 * to avoid jumpy animations
 * @type {EventEmitter}
 */
ipcRenderer.on('minimize-done', () => {
  resetView();
});


// Export the 'view' Class
module.exports = view;
