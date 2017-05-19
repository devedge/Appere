
'use-strict';

// const {ipcRenderer} = require('electron');

// Local module imports
const ViewHandler = require('./lib/ViewHandler.js');


// Create a new ViewHandler object
let view = new ViewHandler();



// Initialize the ViewHandler with elements from the page
view.init(
  document.getElementById('image-cont-1'),
  document.getElementById('image-cont-2'),
  document.getElementById('image-cont-3'),
  document.title
);


