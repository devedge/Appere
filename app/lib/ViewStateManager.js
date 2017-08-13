/**
 * ViewStateManager module
 * The class that manages the entire application view & state
 *
 */

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
    this.resetState();
  }

  /** Set the current image in the viewer, and initialize in its directory */
  setCurrentImage(filepath) {
    try {
      let res = fsm.isFileValid(filepath);
      if (res.status) {
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
        vs.istate[vs.pointer.curr].handle.src = pEncode(filepath);

        css.hideHome(); // Hide the app home
        this.HOME = false;

        // init FileSystemManager
        fsm.init(filepath, (err) => {
          if (err) { throw err; } // Should avoid?

          // Set total number & index
          vs.dirNum = fsm.getTotalNumber();
          vs.istate[vs.pointer.curr].index = fsm.getCurrentIndex();

          setTitle({
            filename: vs.istate[vs.pointer.curr].filename,
            fileindex: fsm.getCurrentIndex() + 1,
            totalfiles: vs.dirNum
          });

          // Preload the next images
          loadNext(shared.userConfig.get('WRAP'));
          loadPrev(shared.userConfig.get('WRAP'));
        });
      } else {
        // quick error message, file isn't a supported image or doesn't exist
        console.log(res.message);
      }
    } catch (e) {
      // display generic error
      console.log(e);
    }
  }

  /** Show the next image in the viewer */
  showNext() { // If called, automatically reset zoom? TODO
    if (fsm.isReady() && !this.HOME) {
      try {
        this.ZOOMEDIN = false;
        css.zoomOutImg(vs.istate[vs.pointer.curr].handle);

        // Resize the window for the 'next' image
        resizeWindow(vs.pointer.next, 'resize');

        // Cycle the 'next' image in to replace the 'current' one
        cycleImage(vs.pointer.curr, vs.pointer.next);

        // Update the pointer values so 'next' is now 'current'
        rotatePointersNext();

        // Preload the next image
        loadNext(shared.userConfig.get('WRAP'));
      } catch (e) {
        // display generic error
        console.log(e);
      }
    }
  }

  /** Show the previous image in the viewer */
  showPrev() { // If called, automatically reset zoom? TODO
    if (fsm.isReady() && !this.HOME) {
      try {
        this.ZOOMEDIN = false;
        css.zoomOutImg(vs.istate[vs.pointer.curr].handle);

        // Resize the window for the 'prev' image
        resizeWindow(vs.pointer.prev, 'resize');

        // Cycle the 'prev' image in to replace the 'current' one
        cycleImage(vs.pointer.curr, vs.pointer.prev);

        // Update the pointer values so 'prev' is now 'current'
        rotatePointersPrev();

        // Preload the previous image
        loadPrev(shared.userConfig.get('WRAP'));
      } catch (e) {
        // display generic error
        console.log(e);
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
   * Is the current image zoomed in?
   * @method isZoomed
   * @return {Boolean} True if zoomed in, false otherwise
   */
  isZoomed() {
    return this.ZOOMEDIN;
  }

  /** Sends an IPC message to minimize the window */
  minimize() {
    ipcRenderer.send('minimize-window');
    ipcRenderer.on('minimize-done', () => {
      // Clears the view after the window has been minimized
      // to avoid jumpy animations
      this.resetState();
    });
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

  /** reset the entire application state */
  resetState() {
    this.HOME = true;
    this.ZOOMEDIN = false;
    this.CURRENT_ZOOM = 0;
    vs = ViewState;
    document.title = 'Appere';

    ipcRenderer.send('resize-window', 'resize',
      {width: shared.userConfig.get('BROWSER_WIN.width'),
        height: shared.userConfig.get('BROWSER_WIN.height')},
      false
    );

    fsm.reset();
    initElements();
    css.showHome();
  }
}

// Export the class
module.exports = ViewHandler;


/**
 * Load the next image into the 'next' image element
 * @method loadNext
 * @param  {Boolean} wrap  Wrap around in the current directory
 */
function loadNext(wrap) {
  let res = fsm.getNext(wrap, vs.istate[vs.pointer.curr].index);
  if (res) {
    let validatemsg = fsm.isFileValid(path.join(vs.dirPath, res.filename));
    if (!validatemsg.status) {
      // vs.istate[vs.pointer.next].err = {
      //   message: validatemsg.message,
      //   function: 'fsm.isFileValid'
      // };
      console.log('loadNext file isn\'t valid');
    } else {
      setNewImage(vs.pointer.next, res.filename, res.newIndex);
    }
  }
}


/**
 * Load the next image into the 'next' image element
 * @method loadPrev
 * @param  {Boolean} wrap  Wrap around in the current directory
 */
function loadPrev(wrap) {
  let res = fsm.getPrev(wrap, vs.istate[vs.pointer.curr].index);
  if (res) {
    let validatemsg = fsm.isFileValid(path.join(vs.dirPath, res.filename));
    if (!validatemsg.status) {
      // vs.istate[vs.pointer.prev].err = {
      //   message: validatemsg.message,
      //   function: 'fsm.isFileValid'
      // };
      console.log('loadPrev file isn\'t valid');
    } else {
      setNewImage(vs.pointer.prev, res.filename, res.newIndex);
    }
  }
}


/**
 * Cycle the image at 'oldPointer' for the one at 'newPointer'
 * @method cycleImage
 * @param  {Int}      oldPointer The 'current' pointer
 * @param  {Int}      newPointer The 'new' image pointer
 */
function cycleImage(oldPointer, newPointer) {
  // If the previous image created an error, hide the error now
  // if (vs.istate[oldPointer].err) {
  //   hideError();
  // }

  // If the previous image (still referred to as 'current') was
  // a gif, 'null' the 'src' attribute
  if (vs.istate[oldPointer].gifhandle) {
    vs.istate[oldPointer].handle.src = '';
  }

  // Hide the previous element
  vs.istate[oldPointer].handle.hidden = true;

  // If an error occured while setting the new image,
  // show the error page instead and return early
  // if (vs.istate[newPointer].err) {
  //   showError(
  //     vs.istate[newPointer].err.message,
  //     vs.istate[newPointer].err.function
  //   );
  //   return; // quit early
  // }

  // Show the new element
  vs.istate[newPointer].handle.hidden = false;

  // Set the new window title
  setTitle({
    filename: vs.istate[newPointer].filename,
    fileindex: vs.istate[newPointer].index + 1,
    totalfiles: vs.dirNum
  });

  // If this image is a gif, it was temporarily loaded into a 'gifhandle'
  // attribute. Now, load it in the actual 'src' value so it starts
  // from the beginning
  if (vs.istate[newPointer].gifhandle) {
    vs.istate[newPointer].handle.src = vs.istate[newPointer].gifhandle;
  }
}


/**
 * Set the image at 'pointer' to the one specified by 'filename'
 * and 'newIndex'
 * @method setNewImage
 * @param  {Int}       pointer    The pointer to update
 * @param  {String}    filename   The filename of the new image
 * @param  {Int}       newIndex   The index of the new image
 */
function setNewImage(pointer, filename, newIndex) {
  // Set the new object's name and index
  vs.istate[pointer].filename = filename;
  vs.istate[pointer].index = newIndex;
  let fullpath = path.join(vs.dirPath, filename);

  // clear error flags?
  // vs.istate[pointer].err = null;

  // Get the dimensions of the new image
  vs.istate[pointer].dimensions = fsm.sizeOf(fullpath);

  // Set the new image in the the new 'img' tag
  if (filename.match(/\.gif$/)) {
    // If the image is a 'gif', don't actually load it
    // in the 'src' attribute. Instead, load it in a temporary
    // value so it can be loaded at the last minute
    vs.istate[pointer].gifhandle = pEncode(fullpath);
  } else {
    // Otherwise, preload the new image
    // Also, 'nullify' the gifhandle since it isn't a gif
    vs.istate[pointer].handle.src = pEncode(fullpath);
    vs.istate[pointer].gifhandle = '';
  }
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

  if (options.filename) { vs.title.filename = options.filename; }
  if (options.fileindex) { vs.title.fileindex = options.fileindex; }
  if (options.totalfiles) { vs.title.totalfiles = options.totalfiles; }
  if (options.percentdisplayed) { vs.title.percentdisplayed = options.percentdisplayed; }

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


/** Init grabbing the image elements */
function initElements() {
  vs.istate[vs.pointer.curr].handle = document.getElementById('image-element-1');
  vs.istate[vs.pointer.prev].handle = document.getElementById('image-element-2');
  vs.istate[vs.pointer.next].handle = document.getElementById('image-element-3');
  css.resetElement(vs.istate[vs.pointer.curr].handle);
  css.resetElement(vs.istate[vs.pointer.prev].handle);
  css.resetElement(vs.istate[vs.pointer.next].handle);
  vs.istate[vs.pointer.curr].handle.hidden = false;
  vs.istate[vs.pointer.prev].handle.hidden = true;
  vs.istate[vs.pointer.next].handle.hidden = true;
}


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


/**
 * Updates the title with the new percentage, calculated by the
 * main process after resizing the window.
 */
ipcRenderer.on('percent-reduc', (event, pcntcalc) => {
  if (pcntcalc > 100) {
    setTitle({percentdisplayed: 100});
  } else {
    setTitle({percentdisplayed: pcntcalc});
  }
});
