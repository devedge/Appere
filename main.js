const {app, BrowserWindow} = require('electron')


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win


function createWindow() {

    // Create the browser window
    win = new BrowserWindow({
        width: 900,
        height: 650,
        backgroundColor: '#EFF0F1'
        // backgroundColor: '-webkit-linear-gradient(to bottom, #74e3ec, #c7ffe2)'
    });

    // hide the default menubar
    // win.setMenu(null)

    // and load the index.html of the app
    win.loadURL('file://' + __dirname + '/index.html')
    // win.loadURL('http://www.faultinweb.com/2015/01/frosted-glass-blur-effect-using-css.html')

    // Open the DevTools
    // win.webContents.openDevTools()

    // Emit when the window is closed
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    })
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)


// Quit when all windows are closed
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }


    // instead of this, add code to remove the loaded image, the
    // image array, and to minimize the app to the toolbar
})


app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
})


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


// generate an array of every filename in the current folder
// return the array and the index of the current image
// refresh the array (maybe store the old one? find out if there's any new images?) once
//      a new folder path is picked
