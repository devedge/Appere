/**
 * The module that handles the image view. It uses a 'view' object to keep
 * track of the application's current state. All the exported methods are
 * wrapped in try-catch blocks so they can be generically handled in the
 * error message view.
 *
 * This is only required by app.js
 *
 * This exports the 'view' class, which contains the following methods:
 *    init()
 *    setCurrentImage()
 *    showNext()
 *    showPrev()
 *    deleteCurrent()
 *    zoomImage()
 *    fitImage()
 *    isZoomed()
 *    minimize()
 */

'use-strict';

const {ipcRenderer} = require('electron');
const realSizeOf = require('image-size'); // breaks on certain valid images
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
  dirNum: 0,   // The number of images in the current directory
  pointer: {   // A rolling index of pointers to the images in the stateArray
    current: 0,
    next: 1,
    previous: 2
  },
  stateArray: [   // An object array that maintains state of the three images
    {
      handle: null,   // A handle to the image element
      gifHandle: null,// A temporary handle so gifs can be loaded from the start
      filename: '',   // The image's filename
      index: 0,       // The index into the image array
      dimensions: {}, // The dimensions {width, height} of the current image
      err: null //{message: '', function: ''}
    },
    {
      handle: null,
      gifHandle: null,
      filename: '',
      index: 0,
      dimensions: {},
      err: null //{message: '', function: ''}
    },
    {
      handle: null,
      gifHandle: null,
      filename: '',
      index: 0,
      dimensions: {},
      err: null //{message: '', function: ''}
    }
  ],
  title: {          // An object that maintains state of the window title
    filename: '',   // These attributes are duplicated here so the title
    fileIndex: 0,   //    can be re-generated without re-querying the stateArray
    totalFiles: 0,
    percentShrunk: ''
  },
  imgContainer: null,  // The parent of the three image elements
  logoContainer: null  // The app home, containing the logo
};

// The view state object used by the application
let vs = VIEWSTATE;
let zoomed = false;
let currentRealZoom = 0;


/**
 * The 'view' class. This provides a handle to multiple methods
 * that control the application's view.
 * @method view
 * @return {none}
 */
function view() {
  zoomed = false;
  currentRealZoom = 0;
}


/**
 * Initialize and set the handles to the img tags. This function can
 * (and will) also be used to set other additional variables.
 * @method init
 * @param  {element} imgElement1 img tag 1
 * @param  {element} imgElement2 img tag 2
 * @param  {element} imgElement3 img tag 3
 * @param  {element} imgContainer The element containing all three img tags
 * @param  {element} logoContainer The element containing the logo
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
    let retMsg = validateFile.check(filepath);
    // If an error message is returned, call the error
    // function & return early to quit execution
    if (retMsg.err) {
      // call error function
      // retMsg.message
      return;
    }

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
    resizeIPC(vs.pointer.current);

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
    fsManager.init(vs.dirPath, vs.stateArray[vs.pointer.current].filename, (err) => {
        // Fatal error occured, and the viewer cannot continue
        if (err) { throw err; }

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
        loadNext(shared.userConfig.get('WRAP'), fsManager.getCurrentIndex());

        // Load the previous image
        loadPrev(shared.userConfig.get('WRAP'), fsManager.getCurrentIndex());

        // Successful callback if the user wants to take action after
        // this function has finished
        if (callback) { callback(null); }
    });

  } catch (e) {
    // error here
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
view.prototype.showNext = function () { //callback
  try {
    if (fsManager.isReady() && !APP_HOME) {

      // Resize the window
      resizeIPC(vs.pointer.next);

      // Cycle the 'next' image as the current one
      cycleImage(vs.pointer.current, vs.pointer.next);

      // Update the pointer values
      // This 'next' image is now the 'current' image
      rotatePointersNext();

      // Preload the next image.
      loadNext(shared.userConfig.get('WRAP'), vs.stateArray[vs.pointer.current].index);
    }
  } catch (e) {
    // If an error happens here, set the current image as an error
    // if (callback) { callback(e); }
  }
};


/**
 * Displays the previous image in the viewer. Calls back with (err) if
 * there was an error
 * @method showPrev
 * @param  {Function} callback A callback containing (err) if error
 * @return {none}
 */
view.prototype.showPrev = function () { //callback
  try {
    if (fsManager.isReady() && !APP_HOME) {

      // Resize the window
      resizeIPC(vs.pointer.previous);

      // Cycle the 'next' image as the current one
      cycleImage(vs.pointer.current, vs.pointer.previous);

      // Update the pointer values
      // This 'previous' image is now the 'current' image
      rotatePointersPrev();

      // Preload the next image.
      loadPrev(shared.userConfig.get('WRAP'), vs.stateArray[vs.pointer.current].index);
    }
  } catch (e) {
    // If an error happens here, set the current image as an error
    // logError('showPrev', 'fatal error caught', e);
    // if (callback) { callback(e); }
  }
};


// TODO deleteCurrent
/**
 * Trashes the current file currently being displayed. Then, it loads
 * the next one in the current directory. If there are none, it
 * redisplays the home screen.
 * @method deleteCurrent
 * @return {none}
 */
view.prototype.deleteCurrent = function () {
  // First, dim & blur image, and display confirmation page
  // If the user confirms with (yes), continue
  //  If fsManager.getTotalNumber() > 1
  //      Then, set the 'next' file as the current one, and load the next file
  //  Else, reset view and display home page
  // Notify the fsManager to trash the file
  if (!APP_HOME) {

    // Check that this isn't the last image in the folder
    if (fsManager.getTotalNumber() > 1) {
      // Take no action if the manager isn't ready
      if (fsManager.isReady()) {
        // resize the window
        resizeIPC(vs.pointer.next);

        // Cycle the new image in
        cycleImage(vs.pointer.current, vs.pointer.next);

        // Rotate the stateArray pointers for a 'delete'
        // This 'next' image is now the 'current' image
        rotatePointersDelete();

        // Preload the next image.
        loadNext(shared.userConfig.get('WRAP'), vs.stateArray[vs.pointer.current].index);
      }
    } else {
      // It is the last image, so reset the viewer
      resetView();
    }

    fsManager.trashFile();
  }



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
    if ((vs.title.percentShrunk < 100) && !APP_HOME) {
      // Set the zoomed flag
      zoomed = true;

      // Save the actual calculated zoom of the image
      currentRealZoom = vs.title.percentShrunk;

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
    logError('zoomImage', 'fatal error caught', e);
    // console.log('[ERROR] - zoomImage(): ' + e);
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
    // If the image is already zoomed (or not at app home), then proceed
    if (zoomed && !APP_HOME) {
      // Reset the zoomed flag
      zoomed = false;

      // Ensure that the zoomed-in image also fills the full
      // window space
      ipcRenderer.send(
        'resize-window',
        'resize',
        vs.stateArray[vs.pointer.current].dimensions,
        shared.userConfig.get('RETURN_PERCENTAGE')
      );

      // Set the title with the new zoom percentage
      setTitle({percentShrunk: currentRealZoom});

      // Set the CSS class that zooms the image
      vs.stateArray[vs.pointer.current].handle.classList
        .remove(FULL_IMG_CLASS);
      vs.stateArray[vs.pointer.current].handle.classList
        .add(FIT_IMG_CLASS);
    }
  } catch (e) {
    logError('fitImage', 'fatal error caught', e);
    // console.log('[ERROR] - fitImage(): ' + e);
    if (callback) { callback(e); }
  }
};


/**
 * Returns whether or not the image is currently zoomed
 * @method isZoomed
 * @return {Boolean} True if zoomed, false otherwise
 */
view.prototype.isZoomed = function () {
  return zoomed;
};


/**
 * A method that sends a minimize-window message to the main process
 * @method minimize
 * @return {none}
 */
view.prototype.minimize = function () {
  ipcRenderer.send('minimize-window');
};


// Export the 'view' Class
module.exports = view;


// ------------------------------------------ //
//              Private functions             //
//  Everything below is only used internally  //
// ------------------------------------------ //


/**
 * Run actions that reveal the new image and disable the old one
 * @method cycleImage
 * @param  {Integer}   oldPointer The appropriate pointer from vs.pointers
 * @param  {Integer}   newPointer The appropriate pointer from vs.pointers
 * @return {none}
 */
function cycleImage(oldPointer, newPointer) {

  // If the previous image created an error, hide the error now.
  // If it creates an error here, the callee will handle it
  if (vs.stateArray[oldPointer].err) {
    hideError();
  }

  // If an error
  if (vs.stateArray[newPointer].err) {
    showError(
      vs.stateArray[newPointer].err.message,
      vs.stateArray[newPointer].err.function
    );
    return; // quit early
  }


  // If the previous image (still referred to as 'current') was
  // a gif, 'null' the 'src' attribute
  if (vs.stateArray[oldPointer].gifHandle) {
    vs.stateArray[oldPointer].handle.src = '';
  }

  // Hide the old element and show the new one
  vs.stateArray[oldPointer].handle.hidden = true;
  vs.stateArray[newPointer].handle.hidden = false;

  // Set the new window title
  setTitle({
    filename: vs.stateArray[newPointer].filename,
    fileIndex: vs.stateArray[newPointer].index + 1,
    totalFiles: vs.dirNum
  });

  // If this image is a gif, it was temporarily loaded into a 'gifHandle'
  // attribute. Now, load it in the actual 'src' value so it starts
  // from the beginning
  if (vs.stateArray[newPointer].gifHandle) {
    vs.stateArray[newPointer].handle.src = vs.stateArray[newPointer].gifHandle;
  }
}


/**
 * Load the next image into the hidden 'next' img tag.
 * @method loadNext
 * @param  {Boolean}  wrap     Wrap around to the start?
 * @param  {Integer}  index    The absolute index of the current image
 * @return {none}
 */
function loadNext(wrap, index) {
  // Try to load the next image
  // try {

  // Preload the next image into the next hidden 'img' tag
  fsManager.getNextFromIDX(wrap, index, (ready, filename, newIndex) => {
    // If the 'init' function is ready, then proceed
    if (ready) {

      // Validate the file
      let retMsg = validateFile.check(path.join(vs.dirPath, filename));
      if (retMsg.err) {
        // error flag gets set here, and checked in cycleImage
        vs.stateArray[vs.pointer.next].err = {
          message: retMsg.err,
          function: 'validateFile'
        };

        return; // return early
      } else {
        setNewImage(vs.pointer.next, filename, newIndex);
      }
      // Validate the file
      // if (validateFile.isValid(path.join(vs.dirPath, filename))) {


      // } else {
        // logError('validateFile', 'Invalid/corrupt file', filename);
        // throw 'Invalid/corrupt file: \'' + filename + '\'';
      // }
    }
  });

  // } catch (e) {
    // logError('loadNext', 'fatal error caught for ' + filename, e);
    // console.log('[ERROR] - loadNext() with \"' + filename + '\": ' + e);
    // throw e;
    // if (callback) { callback(e); }
  // }
}


/**
 * Load the previous image into the hidden 'previous' img tag.
 * @method loadPrev
 * @param  {Boolean}  wrap     Wrap around to the end?
 * @param  {Integer}  index    The absolute index of the current image
 * @return {none}
 */
function loadPrev(wrap, index) {
  // Try to load the previous image
  // try {
    // Preload the previous image into the previous hidden 'img' tag
  fsManager.getPrevFromIDX(wrap, index, (ready, filename, newIndex) => {
    // If the 'init' function is ready, then proceed
    if (ready) {
      // Validate the file
      let retMsg = validateFile.check(path.join(vs.dirPath, filename));
      if (retMsg.err) {
        // error flag gets set here, and checked in cycleImage
        vs.stateArray[vs.pointer.previous].err = {
          message: retMsg.err,
          function: 'validateFile'
        };

        return; // return early
      } else {
        setNewImage(vs.pointer.previous, filename, newIndex);
      }

      // if (validateFile.isValid(path.join(vs.dirPath, filename))) {


      // } else {
        // logError('validateFile', 'Invalid/corrupt file', filename);
        // throw 'Invalid/corrupt file: \'' + filename + '\'';
      // }
    }
  });
  // } catch (e) {
    // logError('loadPrev', 'fatal error caught for ' + filename, e);
    // console.log('[ERROR] - loadPrev() with \"' + filename + '\": ' + e);
    // throw e;
    // if (callback) { callback(e); }
  // }
}


/**
 * Handle setting the image in 'newPointer' from the filename and
 * index into the image array
 * @method setNewImage
 * @param  {Integer}    newPointer The state array pointer to the image to set
 * @param  {String}     filename   The file name
 * @param  {Integer}    newIndex   The index of the filename into the image array
 */
function setNewImage(newPointer, filename, newIndex) {
  // Set the new object's name and index
  vs.stateArray[newPointer].filename = filename;
  vs.stateArray[newPointer].index = newIndex;

  // Clear any error flags
  vs.stateArray[newPointer].err = null;

  // Get the dimensions of the 'new' image
  vs.stateArray[newPointer].dimensions =
    sizeOf(path.join(
      vs.dirPath,
      vs.stateArray[newPointer].filename
    ));

  // Set the new image in the new 'img' tag
  if (vs.stateArray[newPointer].filename.match(/\.gif$/)) {
    // If the image is a 'gif', don't actually load it
    // in the 'src' attribute. Instead, load it in a temporary
    // value so it can be loaded at the last minute
    vs.stateArray[newPointer].gifHandle =
      path.join(vs.dirPath, pEncode(filename));
  } else {
    // Otherwise, preload the new image
    // Also, 'nullify' the gifHandle since it isn't a gif
    vs.stateArray[newPointer].handle.src =
      path.join(vs.dirPath, pEncode(filename));
    vs.stateArray[newPointer].gifHandle = '';
  }
}


/**
 * The image-size package occasionally fails on valid files, so
 * fallback on the 'probe-image-size' module. However, it's noticeably
 * slower (~1ms) longer because it has to syncronously read the entire
 * file.
 * @method sizeOf
 * @param  {String} filepath Absolute filepath to the image
 * @return {Object}          { width:,height:,type:'',mime:'',wUnits:'', hUnits:''}
 */
function sizeOf(filepath) {
  try {
    return realSizeOf(filepath);
  } catch (e) {
    return probe.sync(fs.readFileSync(filepath));
  }
}


/**
 * Do a normal rotation of the image array pointers, updating the
 * definitions of 'current', 'next', and 'previous'. This function
 * sets up the next image.
 * @method rotatePointers
 * @return {none}
 */
function rotatePointersNext() {
  // Update the pointer values
  // This is not reassignment, the pointers are being cycled
  let temp = vs.pointer.previous;
  vs.pointer.previous = vs.pointer.current;
  vs.pointer.current  = vs.pointer.next;
  vs.pointer.next     = temp;
}


/**
 * Do a normal rotation of the image array pointers, updating the
 * definitions of 'current', 'next', and 'previous'. This function
 * sets up the previous image
 * @method rotatePointers
 * @return {none}
 */
function rotatePointersPrev() {
  // Update the pointer values
  // This is not reassignment, the pointers are being cycled
  let temp = vs.pointer.next;
  vs.pointer.next     = vs.pointer.current;
  vs.pointer.current  = vs.pointer.previous;
  vs.pointer.previous = temp;
}


/**
 * Rotate the pointers after the current image has been deleted
 * @method rotatePointersDelete
 * @return {none}
 */
function rotatePointersDelete() {
  // The previous one is still the previous one
  // The next one is now the current one, and gets swapped with
  // the deleted image which will be set
  let temp = vs.pointer.current;
  vs.pointer.current = vs.pointer.next;
  vs.pointer.next = temp;
}



// ------------------------------------ //
//              IPC Methods             //
// ------------------------------------ //

/**
 * Updates the title with the new percentage, calculated by the
 * main process after resizing the window.
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
 * Clears the view after the window has been minimized
 * to avoid jumpy animations
 * @type {EventEmitter}
 */
ipcRenderer.on('minimize-done', () => { resetView(); });


/**
 * Send an IPC message to 'main.js' to resize the window
 * @method resizeIPC
 * @param  {Integer}  pointer The pointer from vs.pointers that indicates
 * @return {none}
 */
function resizeIPC(pointer) {
  // Try getting the image size and resizing the window. If the image is
  // corrupted in some way, catch the error.
  try {
    // Send an ipc resize message first to resize the window to scale to
    // the image. This should smooth image resizing
    ipcRenderer.send(
      'resize-window',
      'resize',
      vs.stateArray[pointer].dimensions,
      shared.userConfig.get('RETURN_PERCENTAGE')
    );
  } catch (e) {
    logError('resizeIPC', 'fatal error caught', e);
    throw 'IPC \'resize-window\' error: ' + e;
  }
}


// --------------------------------------------------- //
//              Cleanup and Window Methods             //
// --------------------------------------------------- //


/**
 * If any of the new fields have been updated, set the new title
 * fields. Then, update the window title. The title format is:
 *
 *           <filename> (z%) — <x>/<y> — Appere
 *
 * @method setTitle
 * @param  {object} newFields The new title fields. They must exactly match up
 *                            to the ones defined in the 'vs' object
 * @param  {Boolean} showAppname Should the application name be appended?
 */
function setTitle(newFields, showAppname = true) {
  // Initialize a new 'app title' string
  let appTitle = '';

  // Check if any new fields were specified
  vs.title.filename =
    (newFields.filename) ? newFields.filename : vs.title.filename;
  vs.title.fileIndex =
    (newFields.fileIndex) ? newFields.fileIndex : vs.title.fileIndex;
  vs.title.totalFiles =
    (newFields.totalFiles) ? newFields.totalFiles : vs.title.totalFiles;
  vs.title.percentShrunk =
   (newFields.percentShrunk) ? newFields.percentShrunk : vs.title.percentShrunk;

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

    // Finally, check if the application's name should be appended to the end
    if (showAppname) {
      appTitle += ' — Appere';
    }
  } else {
    // Otherwise, simply use the application's name
    appTitle = 'Appere';
  }

  // Set the app's window new title
  document.title = appTitle;
}


/**
 * Reset the view by reinitializing the entire object
 * @method resetView
 */
function resetView() {
  zoomed = false;
  currentRealZoom = 0;

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




// ------------------------------------------ //
//              CSS State Methods             //
// ------------------------------------------ //




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

// --> PLAY OF THE GAME
//  --> ERROR                                              Hex animation
//   --> AS <function name>
//                  <error message>
//                  ^      ^      ^
//                  |      |      |


function showError(errMessage, sourceFunction) {
  vs.imgContainer.hidden = true;
  // vs.errorContainer.hidden = false;

  // Then, set the values in the error container with the message

}


function hideError() {

}


function logError(functionName, errorMessage, specifics) {
  console.log('[ERROR] (' + functionName + '): ' +
    errorMessage + ' - ' +
    specifics);
}
