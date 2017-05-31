/**
 * app.js
 *
 * This module is automatically imported into the webpage view,
 * and handles the view logic
 */

'use-strict';

const {ipcRenderer} = require('electron');
const remote = require('electron').remote;

// Local module imports
const ViewHandler = require('./lib/ViewHandler.js');
const keyAction = require('./lib/KeypressHandler.js');

// Flag to handle repeat drag-and-drops
let DRAG_FLAG = false;

// Create new ViewHandler object
let view = new ViewHandler();

// Initialize the ViewHandler with elements from the page.
// The first three elements are updated as the user cycles through
// images
view.init(
  document.getElementById('image-element-1'),
  document.getElementById('image-element-2'),
  document.getElementById('image-element-3'),
  document.getElementById('image-container'),
  document.getElementById('logo')
);


// Immediately try to load the image from the command line args,
// if it is provided
setFromArgs();


// If an image is dragged onto the window, display it
document.ondrop = document.body.ondrop = (event) => {
  event.preventDefault();

  // To prevent duplicate calls during drag-and-drop, check DRAG_FLAG
  if (!DRAG_FLAG && event.dataTransfer.files[0]) {
      DRAG_FLAG = true;

      // Hook into the callback to reset the flag
      view.setCurrentImage(event.dataTransfer.files[0].path, () => {
        DRAG_FLAG = false; // Reset the DRAG_FLAG
      });
  }
};


// Key listener logic
document.addEventListener('keydown', (event) => {
  switch (keyAction.get(event, view.isZoomed())) {
    case 'next':
      view.showNext();
      break;

    case 'prev':
      view.showPrev();
      break;

    case 'zoom-in':
      view.zoomImage();
      break;

    case 'zoom-out':
      view.fitImage();
      break;

    case 'min':
      view.minimize();
      break;
  }
});


// If anything is dragged over the display window, prevent
// default behavior
document.ondragover = (event) => { event.preventDefault(); };


// This event gets emitted if a new instance of the app was
// opened. This triggers the function that sets the current
// image & directory from the selected image.
ipcRenderer.on('new-file', () => {
  setFromArgs();
});


/**
 * Sets the image in the display from the command line
 * arguments. Only the first file is used to set the image.
 * @method setFromArgs
 */
function setFromArgs() {
  // The first command is 'electron' and the second is the
  // main function, making the third one the (possible) file
  if (remote.getGlobal('shared').args.length >= 3) {
    view.setCurrentImage(remote.getGlobal('shared').args[2]);
  }
}
