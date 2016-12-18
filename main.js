const electron = require('electron');
const {app, ipcMain, BrowserWindow} = electron;

// const {app, ipcMain, BrowserWindow} = require('electron')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

// Screen dimensions used to scale window
var screen_dim = [];

// Set the window bounds variables
var bounds = [0, 0, 550, 550];

// Instantiate the genValues variable
var genValues;

// console.log('Args: ' + process.argv);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {

    // Get the screen size to properly scale the image window
    // This may be optional depending on user preferences, move to a function?
    const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize;
    screen_dim[0] = width;
    screen_dim[1] = height;

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


    // Generate the rest of the values after window load to speed loading
    // times
    screen_dim[2] = Math.floor(screen_dim[0] / 2); // screen 'x' center
    screen_dim[3] = Math.floor(screen_dim[1] / 2); // screen 'y' center

    // Set maximum screen dimensions to 3/4 of the screen size
    bounds[0] = Math.floor((screen_dim[0] / 4) * 3);
    bounds[1] = Math.floor((screen_dim[1] / 4) * 3);


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


// On a drag-and-drop event, focus on the window
ipcMain.on('focus-window', (event) => {
    win.focus();
});


// Minimize the window
ipcMain.on('minimize-window', () => {
    win.minimize();
    
    // Add logic to clear images and directory list
});


// Window resizing Inter-Process Communication channel
// This handles scaling the window to the image
ipcMain.on('resize-window', (event, dimensions) => {
    // Generate the required dimensions
    genValues = genD([dimensions.width, dimensions.height], screen_dim, bounds);

    // Resize window and center it in screen
    win.setBounds({
        x: genValues[2],
        y: genValues[3],
        width: genValues[0],
        height: genValues[1]
    }, true);
    
    // options: keep centered? fancy animate? center until moved?
});



// todo: clean up console.log() outputs
// todo: move this massive function to a module

// Generate the required dimensions for the new window size
// Uses the image size, screen dimensions, and bounds
// Resizes the longest side, if needed, and scales the other
function genD(image_d, screen_d, bnds) {
    var new_width;
    var new_height;
    var scale_width;
    var scale_height;

    // image_d[0] = image width
    // image_d[1] = image height

    // screen_d[0] = screen width
    // screen_d[1] = screen height
    // screen_d[2] = screen 'x' center
    // screen_d[3] = screen 'y' center

    // bnds[0] = max_width
    // bnds[1] = max_height
    // bnds[2] = min_width
    // bnds[3] = min_height


    // If the width is greater than the max
    if (image_d[0] > bnds[0]) {

        // If the height is also greater than the max
        if (image_d[1] > bnds[1]) {

            // Ensure that the scaled side is still less than the bounds
            scale_width = Math.floor(image_d[0] / (image_d[1] / bnds[1]));
            scale_height = Math.floor(image_d[1] / (image_d[0] / bnds[0]));

            // The scaled width is larger than the max width bound
            if (scale_width > bnds[0]) {
                new_width = bnds[0];
                new_height = scale_height;

            } else if (scale_height > bnds[1]) {
                // The scaled height is larger than the max height bound
                new_width = scale_width;
                new_height = bnds[1];

            } else {
                // Neither are larger than their bounds, so pick the width as the
                // side to maximize
                new_width = bnds[0];
                new_height = scale_height;
            }
        } else {
            // Just the width is larger than the max
            new_width = bnds[0];
            new_height= Math.floor(image_d[1] / (image_d[0] / bnds[0]));
        }

    } else if (image_d[1] > bnds[1]) {
        // Since the first check failed, just the height is larger than the max
        new_height = bnds[1];
        new_width = Math.floor(image_d[0] / (image_d[1] / bnds[1]));

    } else {
        // Neither are larger than the max, so set them back to
        // their default values
        new_width = image_d[0];
        new_height = image_d[1];
    }

    // If any of the widths are smaller than the min, resize
    if (new_width < bnds[2]) {
        new_width = bnds[2];
    }

    // If any of the heights are smaller than the min, resize
    if (new_height < bnds[3]) {
        new_height = bnds[3];
    }

    // Return the calculated values
    // new image width
    // new image height
    // screen x center (width)
    // screen y center (height)
    return [
        new_width,
        new_height,
        Math.floor(screen_d[2] - (new_width / 2)),
        Math.floor(screen_d[3] - (new_height / 2))
    ];
}
