const FSmanager = require('./js/FSManager');
const pEncode = require('./js/PercentEncode');
const path = require('path');

// Instantiate a new filesystem manager
var mngr = new FSmanager();

// List of keys to watch
const key_left = 37;
const key_right = 39;
const key_esc = 27;
const key_del = 46;

// HTML element that contains the image
var img_element = document.getElementById('image-container');

// Disallows the next image to be requested before the directory scanner is done
// var ready = false;


// todo: check that a file exists using fs.existsSync
// todo: on every call, update the image list array
// Set the current image from a filepath
function setCurrentImage(filepath) {
    var dn = path.dirname(filepath);
    var bn = path.basename(filepath);

    try {
        if (mngr.checkFile(bn)) {
            img_element.src = path.join(dn, pEncode(bn));
            document.title = 'Appere — ' + bn;

            mngr.genList(dn, bn, (err) => {
                if (err) { console.log(err); }
            });
        }

    } catch (e) {
        // log error, but need to call an error function instead
        console.log('ERROR: ' + e);
    }
}


// Set the previous image in the image list
function setPreviousImage() {
    mngr.getPrev(true, (prev_ready, fp) => {

        // If the image list has been generated, then this function call is ready
        if (prev_ready) {
            document.title = 'Appere — ' + fp;
            img_element.src = path.join(mngr.getCurrentDir(), pEncode(fp));
            // if (img_element.classList.contains('scale-full')) {
                img_element.classList.add('scale-fit');
                img_element.classList.remove('scale-full');
            // }
        }
    });
}


// Set the next image in the image list
function setNextImage() {
    mngr.getNext(true, (next_ready, fp) => {

        // If the image list has been generated, then this function call is ready
        if (next_ready) {
            document.title = 'Appere — ' + fp;
            img_element.src = path.join(mngr.getCurrentDir(), pEncode(fp));
            // if (img_element.classList.contains('scale-full')) {
                img_element.classList.add('scale-fit');
                img_element.classList.remove('scale-full');
            // }
        }
    });
}

// function displayError() {
//
// }


// Keylistener logic
document.addEventListener('keydown', function(event) {
    console.log(event.keyCode);

    // Read the keycode property of the key pressed
    switch (event.keyCode) {
        case key_left: {
            event.preventDefault();

            console.log('Left');
            setPreviousImage();

            break;
        }
        case key_right: {
            event.preventDefault();

            console.log('Right');
            setNextImage();

            break;
        }
        case key_esc: {
            event.preventDefault();

            // minimize the window
            console.log('Called esc');

            break;
        }
        case key_del: {
            event.preventDefault();

            // call code to display confirmation popup to delete image
            console.log('Called del');

            break;
        }
        case 32: {
            event.preventDefault();

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
// disable default 'onDrop' event
// document.ondragover = document.ondrop = (event) => {
//     event.preventDefault();
//
//     if (!called) {
//         setCurrentImage(event.dataTransfer.files[0].path);
//
//         console.log('2: ' + event.dataTransfer.files[0].path);
//
//         called = true;
//     }
// }

// Prevent anything from happening when an item is only dragged over
document.ondragover = (event) => {
    event.preventDefault();
}

// Display the image in the viewer
// Handle onDrop event
document.ondrop = (event) => {
    event.preventDefault();
    setCurrentImage(event.dataTransfer.files[0].path);

    // (temporary) log the image path
    console.log('2: ' + event.dataTransfer.files[0].path);
}

// Handle body.onDrop event
document.body.ondrop = (event) => {
    event.preventDefault();
    setCurrentImage(event.dataTransfer.files[0].path);

    // (temporary) log the image path
    console.log('1: ' + event.dataTransfer.files[0].path);
}
