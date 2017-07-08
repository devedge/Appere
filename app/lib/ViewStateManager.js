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

  setCurrentImage(filepath, callback) {
    try {
      if (fsm.isFileValid(filepath)) {
        this.HOME = false;

      } else {
        // quick error message
      }
    } catch (e) {
      // display generic error
    }
  }

  /** Show the next image in the viewer */
  showNext() {
    if (fsm.isReady() && !this.HOME) {
      try {

      } catch (e) {
        // display generic error
      }
    }
  }

  /** Show the previous image in the viewer */
  showPrev() {
    if (fsm.isReady() && !this.HOME) {
      try {

      } catch (e) {
        // display generic error
      }
    }
  }

  /**
   * Zoom in. Only zoom in if the image is currently not zoomed out,
   * the application is not at the home, or the image is already at
   * 100% size.
   * @method zoomIn
   */
  zoomIn() {
    if (!this.ZOOMEDIN && !this.HOME) {
      if (true) {
        this.ZOOMEDIN = true;

      } else {
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
    // can also call this.resetState()
  }

  infoToggle(state) {
    // state on/off
  }

  deleteToggle(state) {

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
