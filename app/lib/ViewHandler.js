/**
 * The module that handles the image view. It uses a 'view' object to keep
 * track of the application's current state.
 *
 * This is currently only used by the 'app.js' module imported in the view
 *
 *
 */

'use-strict';

const {ipcRenderer} = require('electron');
// const sizeOf = require('image-size'); // breaks on certain valid images
const probe = require('probe-image-size'); // working replacement, but slower
const path = require('path');
const fs = require('fs');

// Local module imports
const pEncode = require('./PercentEncode.js');
const FilesystemManager = require('./FilesystemManager.js');
const validateFile = require('./ValidateFile.js');

// Global shared object
const shared = require('electron').remote.getGlobal('shared');

// Boolean that indicates whether or not the app is at the start page
let FIT_IMG_CLASS = shared.userConfig.get('FIT_IMG_CLASS');
let FULL_IMG_CLASS = shared.userConfig.get('FULL_IMG_CLASS');

// A flag to keep track of the home page for the zoom functions
let APP_HOME = true;

// Initialize a fsManager
let fsManager = new FilesystemManager();



// The view state object. This represents all the data
// required to display images in the application. This is a blank
// template that can be reused every time the application needs to reset
// its state.
let VIEWSTATE = {
  dirPath: '', // The absolute path to the current directory
  dirNum: 0,   // The number of items in the current directory
  pointer: {   // A rolling index of pointers to the list of images
    current: 0,
    next: 1,
    previous: 2
  },
  stateArray: [   // An object array that maintains state of the three images
    {
      handle: null,  // A handle to the image element
      gifHandle: null,// A temporary handle so gifs can be loaded from the start
      filename: '',   // The image's filename
      index: 0,       // The index into the image array
      dimensions: {}  // The dimensions {width, height} of the current image
    },
    {
      handle: null,
      gifHandle: null,
      filename: '',
      index: 0,
      dimensions: {}
    },
    {
      handle: null,
      gifHandle: null,
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
  },
  imgContainer: null,
  logoContainer: null
};

// The view state object used by the application
let vs = VIEWSTATE;


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
view.prototype.init = function (imgElement1, imgElement2, imgElement3,
  imgContainer, logoContainer) {
  vs.stateArray[vs.pointer.current].handle = imgElement1;
  vs.stateArray[vs.pointer.next].handle = imgElement2;
  vs.stateArray[vs.pointer.previous].handle = imgElement3;
  vs.imgContainer = imgContainer;
  vs.logoContainer = logoContainer;

  // Display the home background
  showHome();
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
    // Check that the file exists and is a valid image
    if (validateFile.isValid(filepath)) {

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
        'resize',
        vs.stateArray[vs.pointer.current].dimensions,
        shared.userConfig.get('RETURN_PERCENTAGE')
      );

      // If this is a 'gif', save the path in the 'gifHandle' attribute
      if (vs.stateArray[vs.pointer.current].filename.match(/\.gif$/)) {
        vs.stateArray[vs.pointer.current].gifHandle =
          path.join(
            vs.dirPath,
            pEncode(vs.stateArray[vs.pointer.current].filename)
          );
      }

      // Then, set the image in the view. pEncode ensures that the image
      // path is safely percent-encoded so the chromium engine can resolve it.
      vs.stateArray[vs.pointer.current].handle.src =
        path.join(
          vs.dirPath,
          pEncode(vs.stateArray[vs.pointer.current].filename)
        );

      // Hide the home page of the application
      hideHome();

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
          loadNext(shared.userConfig.get('WRAP'), fsManager.getCurrentIndex(),
            (err) => {
              if (err) { throw err; }
          });

          // Load the previous image
          loadPrev(shared.userConfig.get('WRAP'), fsManager.getCurrentIndex(),
            (err) => {
              if (err) { throw err; }
          });

          // Successful callback if the user wants to take action after
          // this function has finished
          if (callback) { callback(null); }
      });

    } else {
      throw 'Invalid/corrupt file: \'' + filepath + '\'';
    }
  } catch (e) {
    console.log('[ERROR] - setCurrentImage(): ' + e);
    if (callback) { callback(e); }
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
        ipcRenderer.send(
          'resize-window',
          'resize',
          vs.stateArray[vs.pointer.next].dimensions,
          shared.userConfig.get('RETURN_PERCENTAGE')
        );
      } catch (e) {
        throw 'IPC \'resize-window\' error: ' + e;
      }

      // If the previous image (still referred to as 'current') was
      // a gif, 'null' the 'src' attribute
      if (vs.stateArray[vs.pointer.current].gifHandle) {
        vs.stateArray[vs.pointer.current].handle.src = '';
      }

      // Hide the current element and show the next one
      vs.stateArray[vs.pointer.current].handle.hidden = true;
      vs.stateArray[vs.pointer.next].handle.hidden = false;

      // Set the new window title
      setTitle({
        filename: vs.stateArray[vs.pointer.next].filename,
        fileIndex: vs.stateArray[vs.pointer.next].index + 1,
        totalFiles: vs.dirNum
      });

      // If this image is a gif, it was temporarily loaded into a 'gifHandle'
      // attribute. Now, load it in the actual 'src' value so it starts
      // from the beginning
      if (vs.stateArray[vs.pointer.next].gifHandle) {
        vs.stateArray[vs.pointer.next].handle.src =
          vs.stateArray[vs.pointer.next].gifHandle;
      }

      // Update the pointer values
      // This is not reassignment, the pointers are being cycled
      let temp = vs.pointer.previous;
      vs.pointer.previous = vs.pointer.current;
      vs.pointer.current  = vs.pointer.next;
      vs.pointer.next     = temp;

      // Preload the next image.
      // This 'next' image is now the 'current' image
      loadNext(shared.userConfig.get('WRAP'),
        vs.stateArray[vs.pointer.current].index, (err) => {
          if (err) { throw err; }
      });
    }
  } catch (e) {
    console.log('[ERROR] - showNext(): ' + e);
    // TODO: Remove this callback and display an error in the view instead
    if (callback) { callback(e); }
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
        ipcRenderer.send(
          'resize-window',
          'resize',
          vs.stateArray[vs.pointer.previous].dimensions,
          shared.userConfig.get('RETURN_PERCENTAGE')
        );
      } catch (e) {
        throw 'IPC \'resize-window\' error: ' + e;
      }

      // If the previous image (still referred to as 'current') was
      // a gif, 'null' the 'src' attribute
      if (vs.stateArray[vs.pointer.current].gifHandle) {
        vs.stateArray[vs.pointer.current].handle.src = '';
      }

      // Hide the current element and show the previous one
      vs.stateArray[vs.pointer.current].handle.hidden = true;
      vs.stateArray[vs.pointer.previous].handle.hidden = false;

      // Set the new window title
      setTitle({
        filename: vs.stateArray[vs.pointer.previous].filename,
        fileIndex: vs.stateArray[vs.pointer.previous].index + 1,
        totalFiles: vs.dirNum
      });

      // If this image is a gif, it was temporarily loaded into a 'gifHandle'
      // attribute. Now, load it in the actual 'src' value so it starts
      // from the beginning
      if (vs.stateArray[vs.pointer.previous].gifHandle) {
        vs.stateArray[vs.pointer.previous].handle.src =
          vs.stateArray[vs.pointer.previous].gifHandle;
      }

      // Update the pointer values
      // This is not reassignment, the pointers are being cycled
      let temp = vs.pointer.next;
      vs.pointer.next     = vs.pointer.current;
      vs.pointer.current  = vs.pointer.previous;
      vs.pointer.previous = temp;

      // Preload the next image.
      // This 'previous' image is now the 'current' image
      loadPrev(shared.userConfig.get('WRAP'),
        vs.stateArray[vs.pointer.current].index, (err) => {
          if (err) { throw err; }
      });
    }
  } catch (e) {
    console.log('[ERROR] - showPrev(): ' + e);
    if (callback) { callback(e); }
  }
};

// TODO delete
view.prototype.delete = function () {
  // on delete,
  // remove the filename from the fsManager array
  // send an ipc message to move the file to the trash
  // load the next image
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
      // window space
      ipcRenderer.send(
        'resize-window',
        'fill',
        vs.stateArray[vs.pointer.current].dimensions
      );

      // Set the title with the new zoom percentage
      setTitle({percentShrunk: 100});

      // Set the CSS class that zooms the image
      vs.stateArray[vs.pointer.current].handle.classList
        .remove(FIT_IMG_CLASS);
      vs.stateArray[vs.pointer.current].handle.classList
        .add(FULL_IMG_CLASS);
    }
  } catch (e) {
    console.log('[ERROR] - zoomImage(): ' + e);
    if (callback) { callback(e); }
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
      ipcRenderer.send(
        'resize-window',
        'resize',
        vs.stateArray[vs.pointer.current].dimensions,
        shared.userConfig.get('RETURN_PERCENTAGE')
      );

      // Set the title with the new zoom percentage
      setTitle({percentShrunk: this.currentRealZoom});

      // Set the CSS class that zooms the image
      vs.stateArray[vs.pointer.current].handle.classList
        .remove(FULL_IMG_CLASS);
      vs.stateArray[vs.pointer.current].handle.classList
        .add(FIT_IMG_CLASS);
    }
  } catch (e) {
    console.log('[ERROR] - fitImage(): ' + e);
    if (callback) { callback(e); }
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
        // Validate the file
        if (validateFile.isValid(path.join(vs.dirPath, filename))) {

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
          if (vs.stateArray[vs.pointer.next].filename.match(/\.gif$/)) {
            // If the image is a 'gif', don't actually load it
            // in the 'src' attribute. Instead, load it in a temporary
            // value so it can be loaded at the last minute
            vs.stateArray[vs.pointer.next].gifHandle =
              path.join(vs.dirPath, pEncode(filename));
          } else {
            // Otherwise, preload the next image
            // Also, 'nullify' the gifHandle since it isn't a gif
            vs.stateArray[vs.pointer.next].handle.src =
              path.join(vs.dirPath, pEncode(filename));
            vs.stateArray[vs.pointer.next].gifHandle = '';
          }
        } else {
          throw 'Invalid/corrupt file: \'' + filename + '\'';
        }
      }
    });
  } catch (e) {
    console.log('[ERROR] - loadNext(): ' + e);
    if (callback) { callback(e); }
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
        // Validate the file
        if (validateFile.isValid(path.join(vs.dirPath, filename))) {

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
          if (vs.stateArray[vs.pointer.previous].filename.match(/\.gif$/)) {
            // If the image is a 'gif', don't actually load it
            // in the 'src' attribute. Instead, load it in a temporary
            // value so it can be loaded at the last minute
            vs.stateArray[vs.pointer.previous].gifHandle =
              path.join(vs.dirPath, pEncode(filename));
          } else {
            // Otherwise, preload the previous image
            // Also, 'nullify' the gifHandle since it isn't a gif
            vs.stateArray[vs.pointer.previous].handle.src =
              path.join(vs.dirPath, pEncode(filename));
            vs.stateArray[vs.pointer.previous].gifHandle = '';
          }
        } else {
          throw 'Invalid/corrupt file: \'' + filename + '\'';
        }
      }
    });
  } catch (e) {
    console.log('[ERROR] - loadPrev(): ' + e);
    if (callback) { callback(e); }
  }
}


/**
 * Reset the view by reinitializing the entire object
 * @method resetView
 */
function resetView() {
  // Create a new view state, but preserve the 'init' conditions
  nvs = VIEWSTATE;

  // Set the three image elements
  nvs.stateArray[nvs.pointer.current].handle =
    vs.stateArray[vs.pointer.current].handle;
  nvs.stateArray[nvs.pointer.next].handle =
    vs.stateArray[vs.pointer.next].handle;
  nvs.stateArray[nvs.pointer.previous].handle =
    vs.stateArray[vs.pointer.previous].handle;

  // Set the general image and logo containers
  nvs.imgContainer = vs.imgContainer;
  nvs.logoContainer = vs.logoContainer;

  vs = null; // null it

  // Wipe the 'src' attributes
  nvs.stateArray[nvs.pointer.current].handle.src = '';
  nvs.stateArray[nvs.pointer.next].handle.src = '';
  nvs.stateArray[nvs.pointer.previous].handle.src = '';

  // Reset the 'hidden' attributes
  nvs.stateArray[nvs.pointer.current].handle.hidden = false;
  nvs.stateArray[nvs.pointer.next].handle.hidden = true;
  nvs.stateArray[nvs.pointer.previous].handle.hidden = true;

  // Reset the CSS alignment classes
  nvs.stateArray[nvs.pointer.current].handle.classList.add(FIT_IMG_CLASS);
  nvs.stateArray[nvs.pointer.current].handle.classList.remove(FULL_IMG_CLASS);

  nvs.stateArray[nvs.pointer.next].handle.classList.add(FIT_IMG_CLASS);
  nvs.stateArray[nvs.pointer.next].handle.classList.remove(FULL_IMG_CLASS);

  nvs.stateArray[nvs.pointer.previous].handle.classList.add(FIT_IMG_CLASS);
  nvs.stateArray[nvs.pointer.previous].handle.classList.remove(FULL_IMG_CLASS);

  // Reset the home state
  nvs.imgContainer.hidden = true;
  nvs.logoContainer.hidden = false;
  APP_HOME = true;

  // And set the new variable
  vs = nvs;

  // Reset the window size
  ipcRenderer.send(
    'resize-window',
    'resize',
    {
      width: shared.userConfig.get('BROWSER_WIN.width'),
      height: shared.userConfig.get('BROWSER_WIN.height')
    },
    false
  );

  // Reset the FilesystemManager
  fsManager.resetManager();

  // Reset the window title
  document.title = 'Appere';
}


/**
 * Function to toggle the 'hidden' attributes of the
 * 'imgContainer' and 'logoContainer' to show the app home
 * @method showHome
 * @return {none}
 */
function showHome() {
  vs.imgContainer.hidden = true;
  vs.logoContainer.hidden = false;
  APP_HOME = true;
}


/**
 * Function to toggle the 'hidden' attributes of the
 * 'imgContainer' and 'logoContainer' to show the image elements
 * @method hideHome
 * @return {none}
 */
function hideHome() {
  vs.logoContainer.hidden = true;
  vs.imgContainer.hidden = false;
  APP_HOME = false;
}


/**
 * If any of the new fields have been updated, set the new title
 * fields. Then, update the window title. The title format is:
 *
 *           <filename> (z%) — <x>/<y> — Appere
 *
 * @method setTitle
 * @param  {object} newFields The new title fields. They must exactly match up
 *                            to the ones defined in the 'vs' object
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

    // if (newFields.showAppname) {
    //   TODO this
    // }
  } else {
    // Otherwise, simply use the application's name
    appTitle = 'Appere';
  }

  // Set the app's window new title
  document.title = appTitle;
}


/**
 * Working replacement for sizeOf, but it's noticeably slower (~1ms longer)
 * @method sizeOf
 * @param  {String} filepath Absolute filepath to the image
 * @return {Object}          { width: 1000,
 *                             height: 300,
 *                             type: 'jpg',
 *                             mime: 'image/jpeg',
 *                             wUnits: 'px',
 *                             hUnits: 'px' }
 */
function sizeOf(filepath) {
  // let data = fs.createReadStream(filepath);
  // probe(data).then(result => {
  //   data.destroy();
  //   return result;
  // });
  return probe.sync(fs.readFileSync(filepath));
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
