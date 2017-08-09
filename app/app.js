/**
 * app.js
 *
 * This module is automatically imported into the webpage view,
 * and handles the view logic
 */

'use-strict';

const {ipcRenderer} = require('electron');
const shared = require('electron').remote.getGlobal('shared');

// Local module imports
const ViewHandler = require('./lib/ViewStateManager.js');
const keyAction = require('./lib/KeypressHandler.js');

// Create new ViewHandler object
let view = new ViewHandler();

// Immediately try to load the image from the command line args,
// if it is provided
setFromArgs();


// Key listener logic
document.addEventListener('keydown', (event) => {
  switch (keyAction.getAction(event, view.isZoomed())) {
    case 'next':
      view.showNext();
      break;

    case 'prev':
      view.showPrev();
      break;

    case 'zoom-in':
      view.zoomIn();
      break;

    case 'zoom-out':
      view.zoomOut();
      break;

    case 'min':
      // TODO (defined in main.js) only minimize, or also clear
      view.minimize();
      shared.args = []; // Reset cli args
      break;

    case 'q':
      // cssManager.blurEnable();
      break;

    case 'w':
      // cssManager.blurDisable();
      break;
  }
});


// If an image is dragged onto the window, display it
document.ondrop = (event) => {
  event.preventDefault();

  if (event.dataTransfer.files[0]) {
    view.setCurrentImage(event.dataTransfer.files[0].path);
  }
};

// If anything is dragged over the display window, prevent
// default behavior
document.ondragover = (event) => { event.preventDefault(); };


// Handle drag-out events from:
// https://electron.atom.io/docs/all/#dragging-files-out-of-the-window
// document.ondragstart = (event) => {
//   event.preventDefault();
//   ipcRenderer.send('ondragstart', )
// }


/**
 * Sets the image in the display from the command line
 * arguments. Only the first file is used to set the image.
 * @method setFromArgs
 */
function setFromArgs() {
  // The first command is 'electron' and the second is the
  // main function, making the third one the (possible) file
  if (shared.args.length >= 3) {
    view.setCurrentImage(shared.args[2]);
  }
}


// This event gets emitted if a new instance of the app was
// opened. This triggers the function that sets the current
// image & directory from the selected image.
ipcRenderer.on('new-file', () => {
  setFromArgs();
});

// Renderer IPC to let Main know that the app has fully loaded
ipcRenderer.send('app-loaded');
