
console.time('init');

// Import electron
const electron = require('electron');

// Extract modules from electron
const {app, ipcMain, BrowserWindow} = electron;

// Other imports
const path = require('path');



let win;


// A temporary global object that holds all user settings
let userSettings = {
  ENABLE_WIN_ANIMATION: true,
  INIT_WIN: {
    WIDTH: 1000,
    HEIGHT: 700,
    BACKGROUND_COLOR: '#EFF0F1'
  }
};


// When Electron has finished initialization
app.on('ready', () => {
  // Create the new browser window
  win = new BrowserWindow({
    width: userSettings.INIT_WIN.WIDTH,
    height: userSettings.INIT_WIN.HEIGHT,
    backgroundColor: userSettings.INIT_WIN.BACKGROUND_COLOR,
  });
});