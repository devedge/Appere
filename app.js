const {ipcRenderer} = require('electron');
const sizeOf = require('image-size');
const path = require('path');

// var Ps = require('perfect-scrollbar');
// var imgContainer = document.getElementById('image-display');
// Ps.initialize(imgContainer);

// Local Requires
const pEncode = require('./lib/PercentEncode');
const fsManager = require('./lib/fsManager');

// Instantiate a new filesystem manager
var mngr = new fsManager();

// List of keys to watch
const keys = {
    key_left: 37,
    key_up: 38,
    key_right: 39,
    key_down: 40,
    key_esc: 27,
    key_del: 46,
    key_space: 32
}

// Global variable that stores the number of items in the current directory
var dirlength;

// var bdy = document.getElementById('bdy');

// flags
var zoomed = false;
var drag_called = false;
var err_count = 0;
var err_max = 3;
var prevZoom = 0;


// Initialize the 'state' of the image viewer
var imageState = {
    curr: 0,
    next: 1,
    prev: 2,
    dir: '',
    arr: [{
            element: document.getElementById('image-cont-1'),
            name: '',
            idx: 0
        },
        {
            element: document.getElementById('image-cont-2'),
            name: '',
            idx: 0
        },
        {
            element: document.getElementById('image-cont-3'),
            name: '',
            idx: 0
        }
    ]
}


// Initialize the 'state' of the window title
var titleState = {
    fileName: '',
    fileIndex: '',
    totalFiles: '',
    percentShrunk: ''
}



// TODO: reset image state/title state function? DONE
// TODO: A 'move' feature?
// TODO: use the 'screen' event emitter from electron to check the current screen
// TODO: use filesystem watcher
// TODO: cut off the filename after 'x' amount of charaters so it can be
//      displayed cleanly in the title DONE? Already implemented by WM?
// TODO: if size is 100% don't zoom. nothing will move and it'll seem broken DONE
// TODO: application logic summary? This is getting somewhat intricate
// TODO: custom scrollbar?
// todo: option to remember the past location of the application, or
//       start from the center?
// TODO: check that a file exists using fs.existsSync? DONE
// TODO: check a filetype with its magic number if the extension is not supported DONE
// TODO: Optimization: After a successful mngr.checkFile(), store the result status in the array

/**
 * The Keylistener logic. Picks up & handles different key presses.
 */
document.addEventListener('keydown', function(event) {
    // console.log(event.keyCode);
    var key = event.keyCode;

    // First check if the shift key was hit
    if (event.shiftKey) {
        // If the image is not already at full scale or it is
        // not zoomed, continue
        if (titleState.percentShrunk < 100 || zoomed === true) {
            // send an ipc resize event to make viewing the image easier? option?
            // check if image will get bigger, and do nothing if not?
            if (key === keys.key_up) {
                event.preventDefault();
                // Zoom in flag
                zoomed = true;

                // Save the previous shrunk percentage, and set the
                // current shrunk amount to 100
                prevZoom = titleState.percentShrunk;
                setTitle({ percentShrunk: 100 });

                // Switch css classes to zoom in
                imageState.arr[imageState.curr].element.classList.remove('scale-fit');
                imageState.arr[imageState.curr].element.classList.add('scale-full');

            } else if (key === keys.key_down) {
                event.preventDefault();
                // Zoom out flag
                zoomed = false;

                // Reset the original zoom amount
                setTitle({ percentShrunk: prevZoom });

                // Switch css classes to 'fit' again
                imageState.arr[imageState.curr].element.classList.remove('scale-full');
                imageState.arr[imageState.curr].element.classList.add('scale-fit');
            }
        }
    } else {
        // Catch the left/up arrow press
        if (key === keys.key_left || key === keys.key_up) {
            if (!zoomed) {
                event.preventDefault();
                showPrev();
            }

        // Catch the right/down arrow press or space
        } else if (key === keys.key_right || key === keys.key_down || key === keys.key_space) {
            if (!zoomed) {
                event.preventDefault();
                showNext();
            }

        // On 'escape' minimize the window
        } else if (key === keys.key_esc) {
            event.preventDefault();
            ipcRenderer.send('minimize-window');
            clearViewer();

        // On delete, prompt to delete the file
        } else if (key === keys.key_del) {

        }
    }
});



// Handle any images drag-and-dropped onto the display window
document.ondragover = (event) => {
    // Prevent anything from happening when an item is only dragged over
    event.preventDefault();
}

// Display the image in the viewer
document.ondrop = document.body.ondrop = (event) => {
    // Handle onDrop event
    event.preventDefault();

    // To prevent duplicate calls while dropping, check the 'drag_called' flag
    // Also check that the file dropped is not null
    if (!drag_called && event.dataTransfer.files[0]) {
        drag_called = true;
        setCurrentImage(event.dataTransfer.files[0].path);
        ipcRenderer.send('focus-window');
    }
}



/**
 * Show the NEXT image in the viewer, setting it as the current one.
 * Additionally, an IPC message is sent to resize the window.
 */
function showNext() {
    if (mngr.list_loaded) {

        // Try getting the image size and resizing the window. If the image is
        // corrupted in some way, catch the error.
        try {
            // Send an ipc resize message first to resize the window to scale to the
            // image. This smooths the image resizing.
            ipcRenderer.send('resize-window', sizeOf(path.join(imageState.dir,
                imageState.arr[imageState.next].name)), true);
        } catch(e) {
            console.log('IPC \'resize-window\' ERROR: ' + e);
        }

        // Hide the current element and show the next one
        imageState.arr[imageState.curr].element.hidden = true;
        imageState.arr[imageState.next].element.hidden = false;

        // If the current image is a gif, refresh it so it starts from the beginning
        if (imageState.arr[imageState.next].name.match(/\.gif$/)) {
            var temp = imageState.arr[imageState.next].element.src;
            imageState.arr[imageState.next].element.src = '';
            imageState.arr[imageState.next].element.src = temp;
            temp = '';
        }

        // Update the pointer values
        var temp = imageState.prev;
        imageState.prev = imageState.curr;
        imageState.curr = imageState.next;
        imageState.next = temp;

        // Change the filename in the title
        setTitle({
            fileName: imageState.arr[imageState.curr].name,
            fileIndex: imageState.arr[imageState.curr].idx + 1,
            totalFiles: dirlength
        });

        // Preload the next image into the next hidden 'img' element
        loadNext(true, imageState.arr[imageState.curr].idx);
    }
}



/**
 * Show the PREVIOUS image in the viewer, setting it as the current one.
 * Additionally, an IPC message is sent to resize the window.
 */
function showPrev() {
    if (mngr.list_loaded) {

        // Try getting the image size and resizing the window. If the image is
        // corrupted in some way, catch the error.
        try {
            // Send an ipc resize message first to resize the window to scale to the
            // image. This smooths the image resizing.
            ipcRenderer.send('resize-window', sizeOf(path.join(imageState.dir,
                imageState.arr[imageState.prev].name)), true);
        } catch(e) {
            console.log('IPC \'resize-window\' ERROR: ' + e);
        }

        // Hide the current element and show the previous one
        imageState.arr[imageState.curr].element.hidden = true;
        imageState.arr[imageState.prev].element.hidden = false;

        // If the current image is a 'gif', refresh it so it starts from the beginning
        if (imageState.arr[imageState.prev].name.match(/\.gif$/)) {
            var temp = imageState.arr[imageState.prev].element.src;
            imageState.arr[imageState.prev].element.src = '';
            imageState.arr[imageState.prev].element.src = temp;
            temp = '';
        }

        // Update the pointer values
        var temp = imageState.next;
        imageState.next = imageState.curr;
        imageState.curr = imageState.prev;
        imageState.prev = temp;

        // Change the filename in the title
        setTitle({
            fileName: imageState.arr[imageState.curr].name,
            fileIndex: imageState.arr[imageState.curr].idx + 1,
            totalFiles: dirlength
        });

        // Preload the previous image into the next hidden 'img' element
        loadPrev(true, imageState.arr[imageState.curr].idx);
    }
}



/**
 * Try to pre-load the NEXT image, and quietly handle errors.
 * If 'wrap' is true, the images will wraparound from the end back to
 * the beginning, and vice versa.
 * @param  {Boolean} wrap  True if the images should wraparound
 * @param  {Integer} index The index of the current image (from the imageState object)
 */
function loadNext(wrap, index) {
    // Try to load the image. On an error, try loading the next image instead and
    // continue for three different times.
    try {
        // Preload the next image into the next hidden 'img' element
        mngr.getNextFromIDX(wrap, index, (ready, filename, new_index) => {

            // Once the image filename array is generated, 'ready' is true
            if (ready) {
                // Check the filetype by inspecting the file's headers
                if (mngr.checkFile(path.join(imageState.dir, filename))) {

                    // Set the next object's name and index
                    imageState.arr[imageState.next].name = filename;
                    imageState.arr[imageState.next].idx = new_index;

                    // Set the image 'src' so the renderer can display it in the background.
                    // Percent encode the filepath since the 'img' tag can't handle certain
                    // special characters.
                    imageState.arr[imageState.next].element.src =
                        path.join(imageState.dir, pEncode(filename));

                    // Reset the 'err_count' variable on successful load
                    err_count = 0;
                } else {
                    throw 'Invalid or broken filetype: ' + filename;
                }
            }
        });
    } catch (e) {
        // Increment the error attempt counter
        err_count ++;

        // Log the error
        console.log('loadNext() ERROR: ' + e + ' - Retry Count: ' + err_count + '/' + err_max);

        // If the attempt to load another image is below the limit, try again
        if (err_count <= err_max) {
            loadNext(wrap, (index + err_count));
        } else {
            err_count = 0;
            console.log('Abandoning retries');
        }
    }
}



/**
 * Try to pre-load the PREVIOUS image, and quietly handle errors.
 * If 'wrap' is true, the images will wraparound from the end back to
 * the beginning, and vice versa.
 * @param  {Boolean} wrap  True if the images should wraparound
 * @param  {Integer} index The index of the current image (from the imageState object)
 */
function loadPrev(wrap, index) {
    // Try to load the image. On an error, try loading the next image instead and
    // continue for three different times.
    try {
        // Preload the next image into the next hidden 'img' element
        mngr.getPrevFromIDX(wrap, index, (ready, filename, new_index) => {

            // Once the image filename array is generated, 'ready' is true
            if (ready) {
                // Check the filetype by inspecting the file's headers
                if (mngr.checkFile(path.join(imageState.dir, filename))) {

                    // Set the previous' object's name and index
                    imageState.arr[imageState.prev].name = filename;
                    imageState.arr[imageState.prev].idx = new_index;

                    // Set the image 'src' so the renderer can display it in the background.
                    // Percent encode the filepath since the 'img' tag can't handle certain
                    // special characters.
                    imageState.arr[imageState.prev].element.src =
                        path.join(imageState.dir, pEncode(filename));

                    // Reset the 'err_count' variable on successful load
                    err_count = 0;
                } else {
                    throw 'Invalid or broken filetype: ' + filename;
                }
            }
        });
    } catch (e) {
        // Increment the error attempt counter
        err_count ++;

        // Log the error
        console.log('loadPrev() ERROR: ' + e + ' - Retry Count: ' + err_count + '/' + err_max);

        // If the attempt to load another image is below the limit, try again
        if (err_count <= err_max) {
            loadPrev(wrap, (index - err_count));
        } else {
            err_count = 0;
            console.log('Abandoning retries');
        }
    }
}



/**
 * Sets the current image in the viewer from a filepath.
 * @param {String} filepath A full filepath to a valid image
 */
function setCurrentImage(filepath) {

    try {
        // Reset the 'zoomed' flag
        zoomed = false;

        // If the file is a valid filetype
        if (mngr.checkFile(filepath)) {
            var dirname = path.dirname(filepath);
            var filename = path.basename(filepath);

            // Reset the app's view
            resetView();

            // Set the current filename and current directory
            imageState.arr[imageState.curr].name = filename;
            imageState.dir = dirname;

            // Send an ipc message to scale the window to image size
            ipcRenderer.send('resize-window', sizeOf(path.join(imageState.dir, imageState.arr[imageState.curr].name)), true);

            // Load the image after the IPC message
            imageState.arr[imageState.curr].element.src = path.join(dirname, pEncode(filename));

            // Generate the list of files from the directory name
            mngr.genList(dirname, filename, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    // Set the number of items in the current directory
                    dirlength = mngr.img_list.length;

                    // Set the current image's index
                    imageState.arr[imageState.curr].idx = mngr.current_index;

                    // Set the title
                    setTitle({
                        fileName: imageState.arr[imageState.curr].name,
                        fileIndex: mngr.current_index + 1,
                        totalFiles: dirlength
                    });

                    // load the next image
                    loadNext(true, mngr.current_index);

                    // load the previous image
                    loadPrev(true, mngr.current_index);
                }

                // Reset the drag_called flag
                drag_called = false;
            });
        } else {
            throw 'Invalid filetype';
        }
    } catch (e) {
        // log error, but need to call an error function instead
        console.log('Loading ERROR: ' + e);

        // Reset the drag_called flag
        drag_called = false;
    }
}


// function displayError() {
//
// }


/**
 * Clear the current viewer, the image list array, and reset the title
 * and window size
 */
function clearViewer() {
    document.title = 'Appere';
    titleState = {
        fileName: '',
        fileIndex: '',
        totalFiles: '',
        percentShrunk: ''
    }

    resetView();

    ipcRenderer.send('resize-window', {width: 1000, height: 700}, false);

    mngr.resetManager();
}



/**
 * Resets the view, 'imageState' and all the elements in the html
 */
function resetView() {
    imageState.curr = 0;
    imageState.prev = 1;
    imageState.next = 2;
    imageState.dir = '';
    imageState.arr[0].element.src = '';
    imageState.arr[0].element.classList.add('scale-fit');
    imageState.arr[0].element.classList.remove('scale-full');
    imageState.arr[0].name = '';
    imageState.arr[0].idx = 0;

    imageState.arr[1].element.src = '';
    imageState.arr[1].element.classList.add('scale-fit');
    imageState.arr[1].element.classList.remove('scale-full');
    imageState.arr[1].name = '';
    imageState.arr[1].idx = 0;

    imageState.arr[2].element.src = '';
    imageState.arr[2].element.classList.add('scale-fit');
    imageState.arr[2].element.classList.remove('scale-full');
    imageState.arr[2].name = '';
    imageState.arr[2].idx = 0;

    imageState.arr[0].element.hidden = false;
    imageState.arr[1].element.hidden = true;
    imageState.arr[2].element.hidden = true;
}



// Title management
/**
 * Sets any new fields in the titleState object, and calls
 * genTitle() to regenerate an updated title.
 * This function is designed to update new fields in the title that might
 * come late due to asynchronous calculations, such as the 'percent shrunk'
 * amount.
 * @param  {object} newFields The new fields to set in titleState. This
 *                            must have all the same fields as titleState.
 */
function setTitle(newFields) {

    // If any of these fields are not blank, update them
    if (newFields.fileName) {
        titleState.fileName = newFields.fileName;
    }

    if (newFields.percentShrunk) {
        titleState.percentShrunk = newFields.percentShrunk;
    }

    if (newFields.fileIndex) {
        titleState.fileIndex = newFields.fileIndex;
    }

    if (newFields.totalFiles) {
        titleState.totalFiles = newFields.totalFiles;
    }

    genTitle();
}


/**
 * Generates the application title from the titleState object
 */
function genTitle() {
    // format:
    // <filename> (z%) — <x>/<y> — Appere

    var appTitle = '';

    // If there's a filename, add all relevant info. Otherwise, only display
    // the application name
    if (titleState.fileName) {
        appTitle = titleState.fileName;

        if (titleState.percentShrunk) {
            appTitle += ' (' + titleState.percentShrunk + '%)';
        }

        if (titleState.fileIndex && titleState.totalFiles) {
            appTitle += ' — ' + titleState.fileIndex + '/' + titleState.totalFiles;
        }

        appTitle += ' — Appere';
    } else {
        appTitle = 'Appere';
    }

    // Set the new title string
    document.title = appTitle;
}


/**
 * Handle the IPC message that sends the scaled zoom percentage reduction
 * @type {int} percentCalc The integer percentage that the returned image is set
 */
ipcRenderer.on('percent-reduc', (event, percentCalc) => {
    if (percentCalc > 100) {
        setTitle({ percentShrunk: 100 });
    } else {
        setTitle({ percentShrunk: percentCalc });
    }
});
