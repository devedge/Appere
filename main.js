console.time('init');

// Import electron
const electron = require('electron');
// Extract modules from electron
const {app, ipcMain, BrowserWindow} = electron;

// Other imports
const path = require('path');

let calcDim = null;
let win = null;

// Set command line arguments into a global object
global.shared = { args: process.argv };

// A temporary global object that holds all user settings
let userSettings = {
  ENABLE_WIN_ANIMATION: true,
  INIT: {
    width: 1000,
    height: 700,
    BACKGROUND_COLOR: '#EFF0F1',
    ICON_PATH: 'img/icons/appere256.png',
    center: true,
    titleName: 'Appere',
    show: true,
    autoHideMenuBar: true,
    INDEX_PATH: 'index.html'
  },
  keepCentered: true,
  keepResizing: false,
  animateWindow: false
};

// TODO: Determine if platform is on Windows and use a different icon
// TODO:
//    hide the image container until images show up
//    display the home page css, and hide that on program start
// TODO: include attributions, including the font type



// Determine if the app should quit
let shouldQuit = app.makeSingleInstance((commandLine, workingDir) => {
  // Since the user tried to make another instance, focus & restore
  // it and handle the new commands
  if (win) {
    // Restore if it's minimized
    if (win.isMinimized()) {
      win.restore();
    }

    // Focus the window
    win.focus();

    // Set the new command line arguments, if any. Then, notify
    // the renderer with an event
    global.shared.args = commandLine;
    win.webContents.send('new-file');
  }
});

// If this instance is a second one, quit itself
if (shouldQuit) {
  app.quit();
  return;
}


// When Electron has finished initialization, create
// a new window
app.on('ready', createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// On macOS it's common to re-create a window in the app when the
// dock icon is clicked and there are no other windows open.
app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});


/**
 * Create a new application window when Electron is ready
 * @method createWindow
 * @return {none}
 */
function createWindow() {
  // Create the new browser window
  win = new BrowserWindow({
    width: userSettings.INIT.width,
    height: userSettings.INIT.height,
    backgroundColor: userSettings.INIT.BACKGROUND_COLOR,
    icon: path.join(__dirname, userSettings.INIT.ICON_PATH),
    // center: userSettings.INIT.center,
    title: userSettings.INIT.titleName,
    show: userSettings.INIT.show,
    autoHideMenuBar: userSettings.INIT.autoHideMenuBar
  });

  // Then, load the app's page
  win.loadURL(path.join('file://', __dirname, userSettings.INIT.INDEX_PATH));

  // When the app is ready, focus it
  win.on('ready-to-show', () => {
    console.log('Window is ready');
    // win.focus();
    // win.show() TODO should a splash screen be added instead?
    // TODO: send an IPC back to trigger css animation?
  });

  // Emitted when the window is closed
  win.on('closed', () => {
    // Dereference the window object so it gets garbage-collected
    win = null;
  });

  // If the window is moved, keep track of it to maintain
  // application position
  win.on('move', () => {
    // console.log('Moved to ' + win.getPosition()); // or win.getPosition()
    // maybe constantly set a variable here, which can be passed into the
    // resize function
  });

  console.timeEnd('init');

  // TODO: check win.center()
  // TODO: check win.blurWebView()

  // Lazy-load the window dimension calculator
  calcDim = require('./lib/CalculateDimensions.js');

  // Set up the screen size in the module that calculates new
  // window dimensions
  calcDim.updateScreen(electron.screen.getPrimaryDisplay().workAreaSize);
}



// ------------------------------------- //
//          IPC handler methods          //
// ------------------------------------- //

// Re-focus the window
ipcMain.on('focus-window', (event) => {
    win.focus();
});


// On a minimize event, minimize the window, then wait for a quarter
// of a second before resetting the window dimensions. This prevents
// jumpy animations while the window minimizes
ipcMain.on('minimize-window', (event) => {
    win.minimize();

    // Wait for a quarter of a second before resetting the window
    setTimeout(() => {
        event.sender.send('minimize-done');
    }, 250);
});


// Resize the window while the image gets set in the renderer
ipcMain.on('resize-window', (event, type, dimensions, returnPercentCalc) => {
  // Don't try to resize if the window is maximized
  if (!win.isFullScreen()) {
    let newDimensions;

    // Check the options passed in, and set the new dimensions
    switch (type) {
      case 'resize':
        newDimensions = calcDim.getCentered(dimensions);
        break;
      case 'fill':
        newDimensions = calcDim.getFilled(dimensions);
        break;
    }

    // If these new dimensions were set
    if (newDimensions) {
      // If the caller needs the 'percentage shrunk' variable, calculate
      // it and return it
      if (returnPercentCalc) {
        event.sender.send(
          'percent-reduc',
          (
            100 * (newDimensions.width + newDimensions.height) /
            (dimensions.width + dimensions.height)
          ).toFixed(0)
        );
      }

      // If the user wants the window to remain in the center of the screen
      if (userSettings.keepCentered) {
        win.setBounds(
          newDimensions, userSettings.animateWindow
        );

      // If the user just wants the window to resize to fit the image
      } else if (userSettings.keepResizing) {
        win.setSize(
          newDimensions.width, newDimensions.height, userSettings.animateWindow
        );
      }
    }

  }
});
