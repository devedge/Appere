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
var zoomed = false;

// todo: check that a file exists using fs.existsSync?
// todo: use filesystem watcher
// todo: check a filetype with its magic number if the extension is not supported
// todo: on every call, update the image list array
// todo: cut off the filename after 'x' amount of charaters so it can be
//      displayed cleanly in the title

// Set the current image from a filepath
function setCurrentImage(filepath) {
    var dn = path.dirname(filepath);
    var bn = path.basename(filepath);

    try {
        // Reset the 'zoomed' flag
        zoomed = false;

        // If the file is a valid filetype
        if (mngr.checkFile(bn)) {
            updateImage(true, dn, bn);

            mngr.genList(dn, bn, (err) => {
                if (err) { console.log(err); }
            });
        }
    } catch (e) {
        // log error, but need to call an error function instead
        console.log('ERROR: ' + e);
    }
}


// Function to update the image in the app.
function updateImage(ready, current_dir, fp) {
    // If the image list has been generated, then this function call is ready
    if (ready) {
        // Change the filename in the title
        document.title = 'Appere — ' + fp;

        // Set the image src, so the renderer can display it.
        // Use percent encoding, since the 'img' tag can't handle certain
        // special characters.
        img_element.src = path.join(current_dir, pEncode(fp));

        // Send an ipc message to scale the window to image size
        ipcRenderer.send('resize-window', sizeOf(path.join(current_dir, fp)));

        // Reset css class to fit the image within the window
        img_element.classList.add('scale-fit');
        img_element.classList.remove('scale-full');

    }
}


// function displayError() {
//
// }


// Keylistener logic
document.addEventListener('keydown', function(event) {
    // console.log(event.keyCode);

    // Read the keycode property of the key pressed
    switch (event.keyCode) {
        case key_left: {
            if (!zoomed) {
                event.preventDefault();

                mngr.getPrev(true, (prev_ready, fp) => {
                    updateImage(prev_ready, mngr.getCurrentDir(), fp);
                });
            }
            break;
        }
        case key_right: {
            if (!zoomed) {
                event.preventDefault();

                mngr.getNext(true, (next_ready, fp) => {
                    updateImage(next_ready, mngr.getCurrentDir(), fp);
                });
            }
            break;
        }
        case key_esc: {
            event.preventDefault();

            // minimize the window
            // console.log('Called esc');

            break;
        }
        case key_del: {
            event.preventDefault();

            // call code to display confirmation popup to delete image
            // console.log('Called del');

            break;
        }
        case key_space: {
            event.preventDefault();

            if (!zoomed) {
                zoomed = true;
            } else {
                zoomed = false;
            }

            img_element.classList.toggle('scale-fit');
            img_element.classList.toggle('scale-full');

            // img_element.className = img_element.className.replace('set-fit', 'set-full');

            break;
        }
        // default: {}
            // do nothing, ignore the key
    }
});



// Handle any images drag-and-dropped onto the display window
// Prevent anything from happening when an item is only dragged over
document.ondragover = (event) => {
    event.preventDefault();
}

// Display the image in the viewer
// Handle onDrop event
document.ondrop = (event) => {
    event.preventDefault();
    setCurrentImage(event.dataTransfer.files[0].path);
    ipcRenderer.send('focus-window');

    // (temporary) log the image path
    // console.log('2: ' + event.dataTransfer.files[0].path);
}

// Handle body.onDrop event
document.body.ondrop = (event) => {
    event.preventDefault();
    setCurrentImage(event.dataTransfer.files[0].path);
    ipcRenderer.send('focus-window');

    // (temporary) log the image path
    // console.log('1: ' + event.dataTransfer.files[0].path);
}
