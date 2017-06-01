/**
 * The main module that starts the electron application. This loads the
 * home page, which in turn starts the renderer process: app.js
 *
 */

// TODO: Determine if platform is on Windows and use a different icon
// TODONE:
//    hide the image container until images show up
//    display the home page css, and hide that on program start
// TODO: include attributions, including the font type
// TODO: Fade in the logo, then have helpful animations appear below it
// TODO: 'Info' page, displaying image information (animate blur transition)
// TODO: Settings page (animate blur transition)
//        Three display options (row of buttons)
//        blur background (enabled only for no resize)
//        enable window animations
//        enable image transition animations
//        wrap images
//        window scale factor (value between 0.x and 1)
//        ? center window on start ?
//        Re-center key: (enabled for everything)
//        Minimize:
//          Clear on minimize (enabled)
//          Minimize with close button (CTRL+Q quits app) (disabled)
//          Minimize key: ESC, m
//
// TODO: Delete page (animate blur transition)
//        Move to trash?
//        Yes(selected) No
// TODO: Blurred-background view (will also animate resize)
// TODONE: global user settings
// TODONE: Reload gifs
// TODO: 'm' --> minimize
// TODO: 'shift c' --> center
// TODO: add code to determine current monitor
// TODO: animations as pictures slide
// TODO: a blur effect for the settings
// TODO: option to set close button --> minimize & quit only on 'CTRL Q'
// TODO: check win.center()
// TODO: check win.blurWebView()
// TODO: Automatic updater
// TODO: if error, clear current values and set error flag in the state array
// TODO: maybe a uniform 'image state populate' function

console.time('init');


const path = require('path');
const electron = require('electron'); // Import electron
const {app, ipcMain, BrowserWindow} = electron; // Extract modules from electron
const bwInit = require('./util/InitialConfig.js');

// User settings configuration
const Config = require('electron-config');
const config = new Config();

// Global module variables
let calcDim = null;
let winPos = { x: 0, y: 0};
let win = null;

// Try to load user configuration by checking for a configuration
// value, and if it doesn't exist, initialize it
if (!config.store.set) { //!
  config.store = bwInit;
}

// Set the command line arguments & user config into a global object
global.shared = {
  args: process.argv,
  userConfig: config
};

// Determine if this is a second instance of the app,
// which should quit
let shouldQuit = app.makeSingleInstance((commandLine, workingDir) => {
  // Since the user tried to make another instance, focus & restore
  // it and handle the new commands
  if (win) {
    // Restore if it's minimized
    if (win.isMinimized()) { win.restore(); }

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

// TODO: figure this out
app.on('open-url', (event, url) => {
  event.preventDefault();
  console.log('url: ' + url);
});
app.on('open-file', (event, path) => {
  event.preventDefault();
  console.log('path: ' + path);
});


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
    width: config.get('BROWSER_WIN.width'),
    height: config.get('BROWSER_WIN.height'),
    minWidth: config.get('BROWSER_WIN.minWidth'),
    minHeight: config.get('BROWSER_WIN.minHeight'),
    backgroundColor: config.get('BROWSER_WIN.backgroundColor'),
    icon: path.join(__dirname, config.get('BROWSER_WIN.iconPath')),
    center: config.get('BROWSER_WIN.center'),
    title: config.get('BROWSER_WIN.titleName'),
    show: config.get('BROWSER_WIN.show'),
    autoHideMenuBar: config.get('BROWSER_WIN.autoHideMenuBar')
  });

  // Then, load the app's page
  win.loadURL(path.join(
    'file://',
    __dirname,
    config.get('BROWSER_WIN.indexPath')
  ));

  // Emitted just before the window will be closed. This is watched so
  // the window size can be saved
  win.on('close', () => {
    let windowSize = win.getSize();

    // If the user want to remember the window size, save it for
    // the next start up
    if (config.get('POSITION_STYLE') === 'RESIZE_REMEMBER') {
      config.set('BROWSER_WIN.width', windowSize[0]);
      config.set('BROWSER_WIN.height', windowSize[1]);

    } else if (bwInit.BROWSER_WIN.width !== windowSize[0] ||
               bwInit.BROWSER_WIN.height !== windowSize[1]) {
      // Reset the original width and height, in case the user
      // changed view modes
      config.set('BROWSER_WIN.width', bwInit.BROWSER_WIN.width);
      config.set('BROWSER_WIN.height', bwInit.BROWSER_WIN.height);
    }
  });

  // Emitted when the window is closed
  win.on('closed', () => {
    // Dereference the window object so it gets garbage-collected
    win = null;
  });

  // Lazy-load the window dimension calculator
  calcDim = require('./lib/CalculateDimensions.js');
  // Set up the screen size in the module that calculates new
  // window dimensions
  calcDim.updateScreen(electron.screen.getPrimaryDisplay().workAreaSize);
}



// ------------------------------------- //
//          IPC handler methods          //
// ------------------------------------- //


// Find out when the app has fully loaded
ipcMain.on('app-loaded', () => {console.timeEnd('init');});


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
ipcMain.on('resize-window', (event, resizeType, dimensions, returnPercentage) => {
  // Don't try to resize if the window is maximized
  if (!win.isFullScreen()) {
    let newDimensions = null;

    // Check the options passed in, and set the new dimensions
    switch (resizeType) {
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
      if (returnPercentage) {
        event.sender.send(
          'percent-reduc',
          (
            100 * (newDimensions.width + newDimensions.height) /
            (dimensions.width + dimensions.height)
          ).toFixed(0)
        );
      }

      // Determine the window/position styles
      switch (config.get('POSITION_STYLE')) {
        // Keep the image centered in the current screen TODO and
        // within a percentage of the screen size
        case 'CENTER_KEEP':
          win.setBounds(
            newDimensions,
            config.get('ANIMATE_WIN')
          );
          break;

        // Only resize the window to fit the image dimensions according
        // to the set SCALE_FACTOR
        case 'RESIZE_FOLLOW':
          win.setSize(
            newDimensions.width,
            newDimensions.height,
            config.get('ANIMATE_WIN')
          );
          break;

        // Simply cycle through the images without making any changes
        // to the window or its position
        case 'RESIZE_REMEMBER':
          break;
      }
    }
  }
});
