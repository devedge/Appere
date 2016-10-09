const {ipcRenderer} = require('electron');
const FSmanager = require('./js/FSManager');
const pEncode = require('./js/PercentEncode');
const path = require('path');
const sizeOf = require('image-size');


// Instantiate a new filesystem manager
var mngr = new FSmanager();

// List of keys to watch
const key_left = 37;
const key_right = 39;
const key_esc = 27;
const key_del = 46;
const key_space = 32;

// HTML element that contains the image
var img_element = document.getElementById('image-container');

// flags
var zoomed = false;
var drag_called = false;

var err_count = 0;
var err_max = 3;

var img_elem_1 = document.getElementById('image-cont-1');
var img_elem_2 = document.getElementById('image-cont-2');
var img_elem_3 = document.getElementById('image-cont-3');

var preloader = {
    curr: 0,
    next: 1,
    prev: 2,
    dir: '',
    arr: [
        {
            element: img_elem_1,
            name: '',
            idx: 0
        },
        {
            element: img_elem_2,
            name: '',
            idx: 0
        },
        {
            element: img_elem_3,
            name: '',
            idx: 0
        }
    ]
}


var dirlength;



// Show the next image
function showNext() {

    // Try getting the image size and resizing the window. If the image is
    // corrupted in some way, catch the error.
    try {
        // Send an ipc resize message first to resize the window to scale to the
        // image. This smooths the image resizing.
        ipcRenderer.send('resize-window', sizeOf(path.join(preloader.dir, preloader.arr[preloader.next].name)));
    } catch(e) {
        console.log('IPC \'resize-window\' ERROR: ' + e);
    }

    // Hide the current element and show the next one
    preloader.arr[preloader.curr].element.hidden = true;
    preloader.arr[preloader.next].element.hidden = false;

    // Update the pointer values
    var temp = preloader.prev;
    preloader.prev = preloader.curr;
    preloader.curr = preloader.next;
    preloader.next = temp;

    // Change the filename in the title
    // document.title = 'Appere — ' + preloader.arr[preloader.curr].name;
    document.title = 'Appere — ' + preloader.arr[preloader.curr].name + ' — ' +
        (preloader.arr[preloader.curr].idx + 1) + '/' + dirlength;

    // Preload the next image into the next hidden 'img' element
    loadNext(true, preloader.arr[preloader.curr].idx);
}



// Show the previous image
function showPrev() {

    // Try getting the image size and resizing the window. If the image is
    // corrupted in some way, catch the error.
    try {
        // Send an ipc resize message first to resize the window to scale to the
        // image. This smooths the image resizing.
        ipcRenderer.send('resize-window', sizeOf(path.join(preloader.dir, preloader.arr[preloader.prev].name)));
    } catch(e) {
        console.log('IPC \'resize-window\' ERROR: ' + e);
    }


    // Hide the current element and show the previous one
    preloader.arr[preloader.curr].element.hidden = true;
    preloader.arr[preloader.prev].element.hidden = false;

    // Update the pointer values
    var temp = preloader.next;
    preloader.next = preloader.curr;
    preloader.curr = preloader.prev;
    preloader.prev = temp;

    // Change the filename in the title
    document.title = 'Appere — ' + preloader.arr[preloader.curr].name + ' — ' +
        (preloader.arr[preloader.curr].idx + 1) + '/' + dirlength;

    // Preload the previous image into the next hidden 'img' element
    loadPrev(true, preloader.arr[preloader.curr].idx);
}



// Try to preload the next image and quietly handle any errors
function loadNext(wrap, index) {
    // Try to load the image. On an error, try loading the next image instead and
    // continue for three different times.
    try {
        // Preload the next image into the next hidden 'img' element
        mngr.getNextFromIDX(wrap, index, (ready, filename, new_index) => {

            // Once the image filename array is generated, 'ready' is true
            if (ready) {
                // Check the filetype by inspecting the file's headers
                if (mngr.checkFile(path.join(preloader.dir, filename))) {

                    // Set the next object's name and index
                    preloader.arr[preloader.next].name = filename;
                    preloader.arr[preloader.next].idx = new_index;

                    // Set the image 'src' so the renderer can display it in the background.
                    // Percent encode the filepath since the 'img' tag can't handle certain
                    // special characters.
                    preloader.arr[preloader.next].element.src = path.join(preloader.dir, pEncode(filename));

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
        console.log('loadNext() ERROR: ' + e + ' - loadNext() Retry Count: ' + err_count + '/' + err_max);

        // If the attempt to load another image is below the limit, try again
        if (err_count <= err_max) {
            loadNext(wrap, (index + err_count));
        } else {
            err_count = 0;
            console.log('Abandoning retries');
        }
    }
}



// Try to preload the previous image and quietly handle any errors
function loadPrev(wrap, index) {
    // Try to load the image. On an error, try loading the next image instead and
    // continue for three different times.
    try {
        // Preload the next image into the next hidden 'img' element
        mngr.getPrevFromIDX(wrap, index, (ready, filename, new_index) => {

            // Once the image filename array is generated, 'ready' is true
            if (ready) {
                // Check the filetype by inspecting the file's headers
                if (mngr.checkFile(path.join(preloader.dir, filename))) {

                    // Set the previous' object's name and index
                    preloader.arr[preloader.prev].name = filename;
                    preloader.arr[preloader.prev].idx = new_index;

                    // Set the image 'src' so the renderer can display it in the background.
                    // Percent encode the filepath since the 'img' tag can't handle certain
                    // special characters.
                    preloader.arr[preloader.prev].element.src = path.join(preloader.dir, pEncode(filename));

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
        console.log('loadPrev() ERROR: ' + e + ' - loadPrev() Retry Count: ' + err_count + '/' + err_max);

        // If the attempt to load another image is below the limit, try again
        if (err_count <= err_max) {
            loadPrev(wrap, (index - err_count));
        } else {
            err_count = 0;
            console.log('Abandoning retries');
        }
    }
}





// todo: check that a file exists using fs.existsSync?
// todo: use filesystem watcher
// todo: check a filetype with its magic number if the extension is not supported
// todo: cut off the filename after 'x' amount of charaters so it can be
//      displayed cleanly in the title
// if size is 100% don't zoom. nothing will move and it'll seem broken

// Set the current image from a filepath
function setCurrentImage(filepath) {
    var dirname = path.dirname(filepath);
    var filename = path.basename(filepath);

    try {
        // Reset the 'zoomed' flag
        zoomed = false;

        // If the file is a valid filetype
        if (mngr.checkFile(filepath)) {
            preloader.curr = 0;
            preloader.prev = 1;
            preloader.next = 2;

            // updateImage(true, dirname, filename);
            preloader.arr[preloader.curr].name = filename;
            preloader.dir = dirname;

            // Send an ipc message to scale the window to image size
            ipcRenderer.send('resize-window', sizeOf(path.join(preloader.dir, preloader.arr[preloader.curr].name)));

            preloader.arr[preloader.curr].element.hidden = false;
            preloader.arr[preloader.curr].element.classList.add('scale-fit');
            preloader.arr[preloader.curr].element.classList.remove('scale-full');

            preloader.arr[preloader.prev].element.hidden = true;
            preloader.arr[preloader.next].element.hidden = true;

            // load later
            preloader.arr[preloader.curr].element.src = path.join(dirname, pEncode(filename));

            // Change the filename in the title
            document.title = 'Appere — ' + preloader.arr[preloader.curr].name;

            preloader.arr[preloader.curr].element.classList.add('quick-transition');


            // Reset css class to fit the image within the window
            // preloader.arr[preloader.curr].element.classList.add('scale-fit');
            // preloader.arr[preloader.curr].element.classList.remove('scale-full');


            mngr.genList(dirname, filename, (err) => {
                if (err) {
                    console.log(err);
                } else {

                    // console.log('Current index: ' + mngr.current_index);
                    dirlength = mngr.img_list.length;

                    document.title = 'Appere — ' + preloader.arr[preloader.curr].name + ' — ' + (mngr.current_index + 1) + '/' + dirlength;

                    // load the next image
                    loadNext(true, mngr.current_index);

                    // load the previous image
                    loadPrev(true, mngr.current_index);
                }

                // Reset the drag_called flag
                drag_called = false;
            });
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


// Keylistener logic
document.addEventListener('keydown', function(event) {
    // console.log(event.keyCode);

    var key = event.keyCode;

    // Catch the left arrow press
    if (key === key_left) {

        if (!zoomed) {
            event.preventDefault();
            showPrev();
        }

    // Catch the right arrow press
    } else if (key === key_right) {

        if (!zoomed) {
            event.preventDefault();
            showNext();
        }

    // On 'escape' minimize the window
    } else if (key === key_esc) {
        event.preventDefault();

    // On delete, prompt to delete the file
    } else if (key === key_del) {

    // On space, zoom the image to actual size
    } else if (key === key_space) {
        event.preventDefault();

        if (!zoomed) {
            zoomed = true;
        } else {
            zoomed = false;
        }

        preloader.arr[preloader.curr].element.classList.toggle('scale-fit');
        preloader.arr[preloader.curr].element.classList.toggle('scale-full');
    }

    // Read the keycode property of the key pressed
    // switch (event.keyCode) {
    //     case key_left: {
    //         break;
    //     }
    //     case key_right: {
    //         break;
    //     }
    //     case key_esc: {
    //         event.preventDefault();
    //
    //         // minimize the window
    //         // console.log('Called esc');
    //
    //         break;
    //     }
    //     case key_del: {
    //
    //         // call code to display confirmation popup to delete image
    //         // console.log('Called del');
    //
    //         break;
    //     }
    //     case key_space: {
    //
    //         // img_element.classList.toggle('scale-fit');
    //         // img_element.classList.toggle('scale-full');
    //
    //         // img_element.className = img_element.className.replace('set-fit', 'set-full');
    //
    //         break;
    //     }
    //     // default: {}
            // do nothing, ignore the key
    // }
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
