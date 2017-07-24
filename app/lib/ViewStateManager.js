// TODO: this is the new ViewHandler


const {ipcRenderer} = require('electron');
const shared = require('electron').remote.getGlobal('shared'); // Global shared object
const path = require('path');

const CSSStateManager = require('./CSSStateManager.js');
const FilesystemManager = require('./FilesystemManager.js');
const ViewState = require('./viewStateTemplate.js');
const pEncode = require('./PercentEncode.js');

let css = new CSSStateManager();
let fsm = new FilesystemManager();
let vs = ViewState;


class ViewHandler {
  constructor() {
    // create a new cssStateManager?
    this.HOME = true;
    this.ZOOMEDIN = false;
    this.CURRENT_ZOOM = 0;

    css.showHome();
  }

  setCurrentImage(filepath) { // no callback
    try {
      if (fsm.isFileValid(filepath)) {
        this.HOME = false;

        // Reset the app's view
        this.resetState();

        // Set the new file's info
        vs.dirPath = path.dirname(filepath);
        vs.istate[vs.pointer.curr].filename = path.basename(filepath);
        vs.istate[vs.pointer.curr].dimensions = fsm.sizeOf(filepath);

        // Focus the window to the foreground, and resize it
        ipcRenderer.send('focus-window');
        resizeWindow(vs.pointer.curr, 'resize');

        // gif check, TODO: function for this? Incorporate 'set' also?
        if (vs.istate[vs.pointer.curr].filename.match(/\.gif$/)) {
          vs.istate[vs.pointer.curr].gifhandle = filepath;
        }
        // set image in viewer
        vs.istate[vs.pointer.curr].handle.src = filepath;

        css.hideHome(); // Hide the app home

        // init fsm
        fsm.init(filepath, (err) => {
          if (err) { throw err; } // Should avoid?

          // Set total number & index
          vs.dirNum = fms.getTotalNumber();
          vs.istate[vs.pointer.curr].index = fsm.getCurrentIndex();

          setTitle({
            filename: vs.istate[vs.pointer.curr].filename,
            fileindex: fsm.getCurrentIndex() + 1,
            totalfiles: vs.dirNum
          });
          // load next
          // load prev

        });
      } else {
        // quick error message, file isn't a supported image or doesn't exist
      }
    } catch (e) {
      // display generic error
    }
  }

  /** Show the next image in the viewer */
  showNext() { // If called, automatically reset zoom?
    if (fsm.isReady() && !this.HOME) {
      try {

        // Resize the window for the 'next' image
        resizeWindow(vs.pointer.next, 'resize');

        // Cycle the 'next' image in to replace the 'current' one
        cycleImage(vs.pointer.current, vs.pointer.next);

        // Update the pointer values so 'next' is now 'current'
        rotatePointersNext();

        // Preload the next image

      } catch (e) {
        // display generic error
      }
    }
  }

  /** Show the previous image in the viewer */
  showPrev() { // If called, automatically reset zoom?
    if (fsm.isReady() && !this.HOME) {
      try {

        resizeWindow(vs.pointer.prev, 'resize');

        cycleImage();

        rotatePointersNext();

        // load next one

      } catch (e) {
        // display generic error
      }
    }
  }

  /**
   * Zoom in. Only zoom in if the image is currently not zoomed out,
   * the application is not at the home, or the image is not already at
   * 100% size.
   * @method zoomIn
   */
  zoomIn() {
    if (!this.ZOOMEDIN && !this.HOME) {
      if (vs.title.percentdisplayed < 100) {
        this.ZOOMEDIN = true;

        // Save the current zoom level
        this.CURRENT_ZOOM = vs.title.percentdisplayed;

        // Resize the window
        resizeWindow(vs.pointer.curr, 'zoom-in');

        // Set the zoom amount to 100%
        setTitle({percentdisplayed: 100});

        // Zoom in the image
        css.zoomInImg(vs.istate[vs.pointer.curr].handle);
      } else {
        // image is already displayed at 100%
        // message about image already at 100%?
      }
    }
  }

  /**
   * Zoom out. Only zoom out if the image is currently not zoomed in,
   * and the application is not at the home.
   * @method zoomOut
   */
  zoomOut() {
    if (this.ZOOMEDIN && !this.HOME) {
      this.ZOOMEDIN = false;

      // Resize the window
      resizeWindow(vs.pointer.curr, 'zoom-out');

      // Reset the original percent in the title
      setTitle({percentdisplayed: this.CURRENT_ZOOM});

      // Fit the image to the display
      css.zoomOutImg(vs.istate[vs.pointer.curr].handle);
    }
  }

  /**
   * Is this image zoomed in?
   * @method isZoomed
   * @return {Boolean} True if zoomed in, false otherwise
   */
  isZoomed() {
    return this.ZOOMEDIN;
  }

  /** Sends an IPC message to minimize the window */
  minimize() {
    ipcRenderer.send('minimize-window');
  }

  infoToggle(state) {
    // state on/off
  }

  deleteToggle(state) {
    // state on/off? or one-call?
  }

  settingsToggle(state) {
    // state = on/off
  }

  resetState() {
    this.HOME = true;
    this.ZOOMEDIN = false;
    this.CURRENT_ZOOM = 0;
  }
}

// Export the class
module.exports = ViewHandler;


function loadNext(wrap, index) {
  fsm.getNext(wrap, index, (ready, filename, newIndex) => {

  });
}



function setNewImage(newPointer, filename, newIndex) {
  // Set the new object's name and index
  vs.istate[newPointer].filename = filename;
  vs.istate[newPointer].index = newIndex;

  // clear error flags?

  // Get the dimensions of the new image
  vs.istate[newPointer].dimensions = fms.sizeOf();
}



/**
 * Function wrapper around the 'resize-window' ipc message
 * @method resizeWindow
 * @param  {Object}     pntr    Pointer to the dimensions in the istate array
 * @param  {String}     action  Currently 'resize', 'zoom-in', or 'zoom-out'
 */
function resizeWindow(pntr, action) {
  // Get the dimenstions from the pointer
  let dimensions = vs.istate[pntr].dimensions;

  // Determine what to do based on the action passed in
  switch (action) {
    case 'zoom-in':
      // Tell 'main' to resize for zooming in
      ipcRenderer.send('resize-window', 'fill', dimensions, false);
      break;

    case 'zoom-out':
      // Tell 'main' to resize for zooming out
      ipcRenderer.send('resize-window', 'resize', dimensions, false);
      break;

    case 'resize':
      // Tell 'main' to resize the window to the image,
      // or according to user preferences
      ipcRenderer.send('resize-window', action, dimensions,
        shared.userConfig.get('RETURN_PERCENTAGE') // remove?
      );
      break;
  }
}


/**
 * Set the window title, and use any new values passed in the
 * 'options' object
 * @method setTitle
 * @param  {Object} options [description]
 */
function setTitle(options) {
  let newTitle = '';

  updateDiff(vs.title.filename, options.filename);
  updateDiff(vs.title.fileindex, options.fileindex);
  updateDiff(vs.title.totalfiles, options.totalfiles);
  updateDiff(vs.title.percentdisplayed, options.percentdisplayed);

  if (vs.title.filename) {
    newTitle = vs.title.filename;
    if (vs.title.percentdisplayed) {
      newTitle += ' (' + vs.title.percentdisplayed + '%)';
    }
    if (vs.title.fileindex && vs.title.totalfiles) {
      newTitle += ' — ' + vs.title.fileindex + '/' + vs.title.totalfiles;
    }
    newTitle += ' — Appere';
  } else {
    newTitle = 'Appere';
  }

  document.title = newTitle;
}


// Use a ternerary operation to update a value only if
// 'n' exists
function updateDiff(c, n) { c = n ? n : c; }


/**
 * Do a normal rotation of the image array pointers, updating the
 * definitions of 'curr', 'next', and 'prev'. This function
 * sets up the next image.
 * @method rotatePointers
 * @return {none}
 */
function rotatePointersNext() {
  // Update the pointer values
  // This is not reassignment, the pointers are being cycled
  let temp = vs.pointer.prev;
  vs.pointer.prev = vs.pointer.curr;
  vs.pointer.curr = vs.pointer.next;
  vs.pointer.next = temp;
}


/**
 * Do a normal rotation of the image array pointers, updating the
 * definitions of 'curr', 'next', and 'prev'. This function
 * sets up the prev image
 * @method rotatePointers
 * @return {none}
 */
function rotatePointersPrev() {
  // Update the pointer values
  // This is not reassignment, the pointers are being cycled
  let temp = vs.pointer.next;
  vs.pointer.next = vs.pointer.curr;
  vs.pointer.curr = vs.pointer.prev;
  vs.pointer.prev = temp;
}
