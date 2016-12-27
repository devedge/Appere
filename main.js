// Electron imports
const electron = require('electron');
const {app, ipcMain, BrowserWindow} = electron;

// Other imports
const Config = require('electron-config');
const dimCalc = require('./lib/dimCalc');

// Initializations
const config = new Config();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;


// Screen dimensions used to scale window
var screenDimensions = {
    width: 0,
    height: 0,
    x_center: 0,
    y_center: 0
};

// console.log('Args: ' + process.argv);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {

    // Retreive the current screen dimensions. This will be used to scale the
    // window proportionally to the image.
    const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize;
    screenDimensions.width = width;
    screenDimensions.height = height;

    // Create the browser window
    win = new BrowserWindow({
        width: 700,
        height: 700,
        backgroundColor: '#EFF0F1'
        // backgroundColor: '-webkit-linear-gradient(to bottom, #74e3ec, #c7ffe2)'
    });

    // hide the default menubar
    win.setAutoHideMenuBar(true);
    win.setMenuBarVisibility(false);

    // and load the index.html of the app
    win.loadURL('file://' + __dirname + '/index.html');

    // Open the DevTools
    // win.webContents.openDevTools()

    // Set screen values in the dimCalc library to automatically resize the
    // images & window
    dimCalc.setGlobals(screenDimensions);


    // Emit when the window is closed
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
    });
});


// Quit when all windows are closed
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }

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
    
    // Send back another IPC to the renderer to reset the viewer
    event.sender.send('clear-images');
});



/**
 * Handle a 'resize-window' event to ipcMain. Depending on user settings, this 
 * will proportionally resize the window to fit the image.
 * @type {object} dimensions An object containing the height & width of the image
 */
ipcMain.on('resize-window', (event, dimensions) => {
    // Generate the required dimensions
    // config.set('animate', false);
    
    // if center option
    var newDimensions = dimCalc.centerImage(dimensions);
    
    console.log('x: ' + newDimensions.x_center + ' y: ' + newDimensions.y_center + ' width: ' + newDimensions.width + ' height: ' + newDimensions.height);
    
    win.setBounds({
        x: newDimensions.x_center,
        y: newDimensions.y_center,
        width: newDimensions.width,
        height: newDimensions.height
    }, false);

    
    
    // if resize option

    
    // else, do nothing?
    
    // options: keep centered? fancy animate? center until moved?
});

