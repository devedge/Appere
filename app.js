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

mngr.genList('', '', (err) => {
    if (err) {
        console.log(err);
    }
    setCurrentImage();
});



// Image directory info and lists
// var img_dir_list = [{}, {}, {}];

// Template for an image directory
// var img_dir = {
//     'abs_path': '',
//     'filename_array': []
// }

// var img_list = fs_manager.gen_img_list();

// var wraparound = false;

// HTML element that contains the image
var img_element = document.getElementById('image-container');



// todo: check that a file exists using fs.existsSync
// Set the current image from a filepath
function setCurrentImage(filepath) {
    try {
        img_element.src = path.join(path.dirname(filepath), pEncode(path.basename(filepath)));
    } catch (e) {
        // log error, but need to call an error function instead
        console.log('ERROR: ' + e);
    }
}

function setPreviousImage() {
    img_element.src = path.join(mngr.getCurrentDir() + mngr.getPrev(true));
}

function setNextImage() {
    img_element.src = path.join(mngr.getCurrentDir() + mngr.getNext(true));
}



// Keylistener logic
document.addEventListener('keydown', function(event) {

    // Read the keycode property of the key pressed
    switch (event.keyCode) {
        case key_left: {
            event.preventDefault();
            setPreviousImage();
            break;
        }
        case key_right: {
            event.preventDefault();
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
        // default: {}
            // do nothing, ignore the key
    }
});


// Handle any images drag-and-dropped onto the display window
// disable default 'onDrop' event
document.ondragover = document.ondrop = (event) => {
    event.preventDefault();
}

// display the image into the viewer
document.body.ondrop = (event) => {
    event.preventDefault();
    setCurrentImage(event.dataTransfer.files[0].path);

    // (temporary) log the image path
    console.log(event.dataTransfer.files[0].path);
}
