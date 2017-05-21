/**
 * [electron description]
 *
 *
 * TODO
 * check if the user repositioned the window. if so, center around that new point
 * continuously check if there is a second monitor attached
 * fix the icons
 * ability to delete files
 * Listen for win.on('move') event to determine new position
 */

console.time('init');

// Electron imports
const electron = require('electron');
const {app, ipcMain, BrowserWindow} = electron;

// Other imports
// const Config = require('electron-config');
// const dimCalc = require('./lib/dimCalc'); LAZY LOADED
const path = require('path');
let dimCalc;

// Set a global shared object so the renderer can read the 
// cli arguments
global.sharedObject = { argv: process.argv };

// Initializations
// const config = new Config();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
function createWindow() {

    // Retreive the current screen dimensions. This will be used to scale the
    // window proportionally to the image.
    const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize;

    // Create the browser window
    win = new BrowserWindow({
        width: 1000,
        height: 700,
        backgroundColor: '#EFF0F1',
        icon: path.join(__dirname,'icons/appere256x256.png'),
        show: false
    });

    // hide the default menubar
    win.setAutoHideMenuBar(true);
    win.setMenuBarVisibility(false); // TODO: There's a better call for new()

    // and load the index.html of the app
    win.loadURL(path.join('file://', __dirname,'/index.html'));

    // Open the DevTools
    // win.webContents.openDevTools()
    // console.log(app.getPath('userData'));

    // Show the window once it has loaded, to prevent seeing the
    // browser's white flash
    win.on('ready-to-show', () => {
        win.show();
        win.focus();
    });

    // Emit when the window is closed
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
    });
    
    console.timeEnd('init');
    
    
    // Window creation is done, so lazy-load the other imports and 
    // initialize anything that depends on them
    dimCalc = require('./lib/dimCalc');
    
    // Set screen values in the dimCalc library to automatically resize the
    // images & window
    dimCalc.setGlobals({width, height});
}


app.on('ready', createWindow);


// Quit when all windows are closed
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }

    // win.minimize();

    // instead of this, add code to remove the loaded image, the
    // image array, and to minimize the app to the toolbar
});


app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
});



//--------------------------------------------------------------

// In the main process, check whether the app is starting
// because the user dragged files onto the app icon
// process.argv.forEach(onOpen)

// Open handlers should be added on the first tick.
// These fire if the app is already running and the user
// drags files or URLs onto the dock icon, or if they set
// the app as a handler for a file type and then open a file
// app.on('open-file', onOpen)
// app.on('open-url', onOpen)

// Separately, in the renderer process, you can use the HTML5
// drag-drop API to create a drop target and handle files 
// dropped directly onto the window.

//--------------------------------------------------------------





// ------------------------------------- //
// ---- End of 'app' event watchers ---- //
// ------------------------------------- //



// app.on('open-file', (event, path) => {
//
// });



/**
 * On a drag-and-drop event, focus the window
 */
ipcMain.on('focus-window', (event) => {
    win.focus();
});



/**
 * Minimize the window if an Escape Key/Close Window action happens
 * @type {event} event The event
 */
ipcMain.on('minimize-window', (event) => {
    win.minimize();

    // Wait for a quarter of a second before resetting the window
    setTimeout(() => {
        event.sender.send('minimize-done');
    }, 250);
});



/**
 * Handle a 'resize-window' event to ipcMain. Depending on user settings, this
 * will proportionally resize the window to fit the image.
 * @type {object} dimensions An object containing the height & width of the image
 */
ipcMain.on('resize-window', (event, dimensions, sendPercentCalc) => {
    let keepCentered = true;
    let keepResizing = false;
    let animateWindow = false;

    // Don't try to resize if the window is maximized
    if (!win.isFullScreen()) {
        
        // Generate the new window dimensions
        let newDimensions = dimCalc.centerImage(dimensions);

        // If the renderer wants the scaled-down percentage, send it
        if (sendPercentCalc) {
            event.sender.send('percent-reduc', (100 *
                (newDimensions.width + newDimensions.height) /
                (dimensions.width + dimensions.height)).toFixed(0));
        }

        // If the user option is to keep the window centered, set the
        // new window bounds and a new x,y coordinate
        if (keepCentered) {
            win.setBounds({
                x: newDimensions.x_center,
                y: newDimensions.y_center,
                width: newDimensions.width,
                height: newDimensions.height
            }, animateWindow);
        } else if (keepResizing) {
            // The user does not want the window to remain centered, but
            // wants it to keep scaling to the image
            win.setSize(newDimensions.width, newDimensions.height, animateWindow);
        }
    }
});




ipcMain.on('fill-window', (event, dimensions) => {
    let keepCentered = true;
    let keepResizing = false;
    let animateWindow = false;
    
    // Don't try to resize if the window is maximized
    if (!win.isFullScreen()) {
        
        // Generate the new window dimensions
        var newDimensions = dimCalc.maximizeDimensions(dimensions);
        
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
        if (keepCentered) {
            win.setBounds({
                x: newDimensions.x_center,
                y: newDimensions.y_center,
                width: newDimensions.width,
                height: newDimensions.height
            }, animateWindow);
        } else if (keepResizing) {
            // The user does not want the window to remain centered, but
            // wants it to keep scaling to the image
            win.setSize(newDimensions.width, newDimensions.height, animateWindow);
        }
    }
});





// ipcMain.on('args-ready', (event) => {
//     if (cliArgs[2]) {
//         event.sender.send(cliArgs[2]);
//     }
// });
