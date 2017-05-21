/**
 * app.js
 *
 * This module is automatically imported into the webpage view,
 * and handles the view logic
 */

'use-strict';

// Local module imports
const ViewHandler = require('./lib/ViewHandler.js');
const keyAction = require('./lib/HandleKeypress.js');

// Flag to handle repeat drag-and-drops
let DRAG_FLAG = false;

// Create new ViewHandler object
let view = new ViewHandler();

// Initialize the ViewHandler with elements from the page.
// These three elements are updated as the user cycles through
// images
view.init(
  document.getElementById('image-cont-1'),
  document.getElementById('image-cont-2'),
  document.getElementById('image-cont-3')
);


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
document.addEventListener('keydown', function(event) {
  switch (keyAction.validate(event, event.keyCode, view.isZoomed())) {
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
      
    case 'esc':
      view.minimize();
      break;
  }
});


// If anything is dragged over the display window, prevent
// default behavior
document.ondragover = (event) => {event.preventDefault();};
