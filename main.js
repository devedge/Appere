const electron = require('electron');
const {app, ipcMain, BrowserWindow} = electron;

// const {app, ipcMain, BrowserWindow} = require('electron')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

// Screen size used to scale window
var screen_width;
var screen_height;
var screen_h_center;
var screen_w_center;

var max_width;
var max_height;
var min_width = 400;
var min_height = 400;

// screen size
var screen_dim = [];

// update first two
var bounds = [0, 0, 400, 400];

var genValues;

// Handle creating and
// function createWindow() {
// }


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {

    // Get the screen size to properly scale the image window
    // This may be optional depending on user preferences, move to a function?
    const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize;
    screen_dim[0] = width;
    screen_dim[1] = height;
    // for optimization, generate all the other values after window generation?
    screen_dim[2] = Math.floor(screen_dim[0] / 2); // screen 'x' center
    screen_dim[3] = Math.floor(screen_dim[1] / 2); // screen 'y' center

    bounds[0] = Math.floor();
    bounds[1] = Math.floor();


    // screen_width = width;
    // screen_height = height;
    // max_width = Math.floor((screen_width / 3) * 2);
    // max_height = Math.floor((screen_height / 3) * 2);
    // screen_h_center = Math.floor(screen_height / 2);
    // screen_w_center = Math.floor(screen_width / 2);
    // console.log('Screen dimensions: ' + screen_width + ' x ' + screen_height);


    // Create the browser window
    win = new BrowserWindow({
        width: 900,
        height: 650,
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


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


// generate an array of every filename in the current folder
// return the array and the index of the current image
// refresh the array (maybe store the old one? find out if there's any new images?) once
//      a new folder path is picked

ipcMain.on('resize-window', (event, dimensions) => {
    // console.log(dimensions)  // prints "ping"
    // event.sender.send('asynchronous-reply', 'pong')

    // Resize window
    // var resized = getDimensions(dimensions.width, dimensions.height);
    // console.log('Actual : ' + dimensions.width + ' x ' + dimensions.height);
    // console.log('Resized: ' + resized[0] + ' x ' + resized[1]);

    // console.log(screen_w_center - (resized[0] / 2), screen_h_center - (resized[1] / 2))

    genValues = genD([dimensions.width, dimensions.height], screen_dim, bounds);

    // win.setSize(resized[0], resized[1], true);
    win.setBounds({
        x: genValues[2], // Math.floor(screen_w_center - (resized[0] / 2)),
        y: genValues[3], // Math.floor(screen_h_center - (resized[1] / 2)),
        width: genValues[0], // resized[0],
        height: genValues[1] // resized[1]
    }, true);
});

// win.setBounds({
//     x: 1920/2
//     y: 1080/2,
//     width: ,
//     height: ,
// }, true);


// find out the largest side
// if it's larger than 2/3 of the screen, scale it down to 2/3 of the screen size
// find out how much it was scaled down, and apply that to the other side
//
// if either of the sides is smaller than 600? px, then


// Generate the required dimensions for the new window size
function genD(image_d, screen_d, bnds) {
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


    // first, check min values, and return if valid

    // then check if the values fit between the bnds

    // then, generate new dimensions

    // If both dimensions are smaller than the min
    if (image_d[0] < bnds[2] && image_d[1] < bnds[3]) {
        // Return the minimum bnds, and the screen center
        return [bnds[2],
                bnds[3],
                Math.floor(screen_d[2] - (bnds[2] / 2)),
                Math.floor(screen_d[3] - (bnds[3] / 2))];
    } else {

    }



    // returns
    // new image width
    // new image height
    // screen x center (width)
    // screen y center (height)
}



function getDimensions(w, h) {
    var calc_w;
    var calc_h;
    var scale_factor;

    if (w > h) {
        // If the width is larger than the height and max_width, set it
        // to the max_width and scale the height accordingly
        if (w > max_width) {
            calc_w = max_width;
            scale_factor = w / max_width;
            calc_h = Math.floor(h / scale_factor);
        } else {

            // If the width is under the min_width, set both to minimum sizes
            if (w < min_width) {
                calc_w = min_width;
                calc_h = min_height;
            }
        }

    } else if (h > w) {
        // If the height is larger than the width and max_height, set it
        // to the max_height and scale the width accordingly
        if (h > max_height) {
            calc_h = max_height;
            scale_factor = h / max_height;
            calc_w = Math.floor(w / scale_factor);
        } else {

            // If the height is under the min_height, set both to minimum sizes
            if (h < min_height) {
                calc_w = min_width;
                calc_h = min_height;
            }
        }

    } else {
        // Pick one, and make sure it's not under the minimum dimensions
        // If the width is under the min_width, set both to minimum sizes
        if (w < min_width) {
            calc_w = min_width;
            calc_h = min_height;
        } else {
            calc_w = w;
            calc_h = h;
        }
    }

    if (!calc_w) {
        calc_w = w;
    }

    if (!calc_h) {
        calc_h = h;
    }

    return [calc_w, calc_h];
}
