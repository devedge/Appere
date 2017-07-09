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
        resizeWindow(vs.istate[vs.pointer.curr].dimensions, 'resize');

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
        // quick error message, file isn't a supported image
      }
    } catch (e) {
      // display generic error
    }
  }

  /** Show the next image in the viewer */
  showNext() { // If called, automatically reset zoom?
    if (fsm.isReady() && !this.HOME) {
      try {

      } catch (e) {
        // display generic error
      }
    }
  }

  /** Show the previous image in the viewer */
  showPrev() { // If called, automatically reset zoom?
    if (fsm.isReady() && !this.HOME) {
      try {
        resizeWindow();

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
        resizeWindow(vs.istate[vs.pointer.curr].dimensions, 'zoom-in');

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
      resizeWindow(vs.istate[vs.pointer.curr].dimensions, 'zoom-out');

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






/**
 * Function wrapper around the 'resize-window' ipc message
 * @method resizeWindow
 * @param  {Object}     dimensions Object containing 'width' and 'height'
 * @param  {String}     action     Currently 'resize', 'zoom-in', or 'zoom-out'
 */
function resizeWindow(dimensions, action) {
  switch (action) {
    case 'zoom-in':
      ipcRenderer.send('resize-window', 'fill', dimensions, false);
      break;

    case 'zoom-out':
      ipcRenderer.send('resize-window', 'resize', dimensions, false);
      break;

    case 'resize':
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
