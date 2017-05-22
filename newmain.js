
console.time('init');

// Import electron
const electron = require('electron');
// Extract modules from electron
const {app, ipcMain, BrowserWindow, screen} = electron;

// Other imports
const path = require('path');
const calcDim = require('./lib/CalculateDimensions.js');

// TODO: Determine if platform is on Windows and use a different icon

let win;


// A temporary global object that holds all user settings
let userSettings = {
  ENABLE_WIN_ANIMATION: true,
  INIT: {
    width: 1000,
    height: 700,
    BACKGROUND_COLOR: '#EFF0F1',
    ICON_PATH: 'icons/appere256x256.png',
    center: true,
    titleName: 'Appere',
    show: true,
    autoHideMenuBar: true,
    INDEX_PATH: '/index.html'
  }
};


// When Electron has finished initialization
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
    center: userSettings.INIT.center,
    title: userSettings.INIT.titleName,
    // show immediately, so the logo can fade in TODO
    show: userSettings.INIT.show,
    // don't show menu bar unless 'alt' is pressed
    autoHideMenuBar: userSettings.INIT.autoHideMenuBar
  });

  // Then, load the app's page
  win.loadURL(path.join('file://', __dirname, userSettings.INIT.INDEX_PATH));

  // When the app is ready, focus it
  win.on('ready-to-show', () => {
    win.focus();
    // win.show() TODO should a splash screen be added instead?
  });

  // Emitted when the window is closed
  win.on('closed', () => {
    // Dereference the window object so it gets garbage-collected
    win = null;
  });

  // If the window is moved, keep track of it to maintain
  // application position
  win.on('move', () => {
    console.log('Moved to ' + win.getBounds()); // or win.getPosition()
  });

  // TODO: check win.center()
  // TODO: check win.blurWebView()

  // Set up the screen size in the module that
  // calculates new window dimensions
  calcDim.updateScreen(screen.getPrimaryDisplay().workAreaSize);
}







// TEMPORARY ipc methods, to be moved into an external module
ipcMain.on('focus-window', (event) => {
    win.focus();
});

ipcMain.on('minimize-window', (event) => {
    win.minimize();

    // Wait for a quarter of a second before resetting the window
    setTimeout(() => {
        event.sender.send('minimize-done');
    }, 250);
});



ipcMain.on('resize-window', (event, type, dimensions, returnPercentCalc) => {
  // let keepCentered = true;
  // let keepResizing = false;

  let center = true;
  let resize = true;
  let animateWindow = false;


  // Don't try to resize if the window is maximized
  if (!win.isFullScreen()) {
    let newDimensions;

    switch (type) {
      case 'resize':
        newDimensions = calcDim.getCentered(dimensions);
        break;
      case 'fill':
        newDimensions = calcDim.getFilled(dimensions);
        break;
      default:

        if (returnPercentCalc) {
          event.sender.send(
            'percent-reduc',
            (
              100 * (newDimensions.width + newDimensions.height) /
              (dimensions.width + dimensions.height)
            ).toFixed(0)
          );
        }

        if (center) {
          win.setBounds(newDimensions, animateWindow);
        } else if (resize) {
          win.setSize(newDimensions.width, newDimensions.height, animateWindow);
        }
    }
  }
});


    // Generate the new window dimensions
    // let newDimensions = dimCalc.centerImage(dimensions);

    // If the renderer wants the scaled-down percentage, send it
    // if (returnPercentCalc) {
    //     event.sender.send('percent-reduc', (100 *
    //         (newDimensions.width + newDimensions.height) /
    //         (dimensions.width + dimensions.height)).toFixed(0));
    // }

    // If the user option is to keep the window centered, set the
    // new window bounds and a new x,y coordinate
    // if (keepCentered) {
    //     win.setBounds({
    //         x: newDimensions.x_center,
    //         y: newDimensions.y_center,
    //         width: newDimensions.width,
    //         height: newDimensions.height
    //     }, animateWindow);
    // } else if (keepResizing) {
        // The user does not want the window to remain centered, but
        // wants it to keep scaling to the image
      // win.setSize(newDimensions.width, newDimensions.height, animateWindow);
    // }

// ipcMain.on('fill-window', (event, dimensions) => {
//     let keepCentered = true;
//     let keepResizing = false;
//     let animateWindow = false;

    // Don't try to resize if the window is maximized
    // if (!win.isFullScreen()) {

        // Generate the new window dimensions
        // var newDimensions = dimCalc.maximizeDimensions(dimensions);

        // If the renderer wants the scaled-down percentage, send it
        // if (sendPercentCalc) {
        //     event.sender.send('percent-reduc', (100 *
        //         (newDimensions.width + newDimensions.height) /
        //         (dimensions.width + dimensions.height)).toFixed(0));
        // }
        // console.log(newDimensions.x_center);
        // console.log(newDimensions.y_center);
        // console.log(newDimensions.width);
        // console.log(newDimensions.height);

        // If the user option is to keep the window centered, set the
        // new window bounds and a new x,y coordinate
        // if (keepCentered) {
            // win.setBounds({
            //     x: newDimensions.x_center,
            //     y: newDimensions.y_center,
            //     width: newDimensions.width,
            //     height: newDimensions.height
            // }, animateWindow);
        //     win.setBounds(calcDim.getFilled(dimensions), animateWindow);
        // } else if (keepResizing) {
            // The user does not want the window to remain centered, but
            // wants it to keep scaling to the image
      // win.setSize(newDimensions.width, newDimensions.height, animateWindow);
        // }
    // }
// });