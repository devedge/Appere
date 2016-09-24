
const FSmanager = require('./js/FSManager');


// const path = require('path');

// List of keys to watch
const key_left = 37;
const key_right = 39;
const key_esc = 27;
const key_del = 46;

var mngr = new FSmanager();
mngr.genList('', '', (err) => {

});



// Image directory info and lists
// var img_dir_list = [{}, {}, {}];

// Template for an image directory
// var img_dir = {
//     'abs_path': '',
//     'filename_array': []
// }

// var img_list = fs_manager.gen_img_list();


// HTML element that contains the image
var img_element = document.getElementById('image-container');

// var wraparound = false;

function setCurrentImage(filepath) {
    img_element.src = filepath;
}

function setPreviousImage() {
    img_element.src = mngr.getPrev(true);
}

function setNextImage() {
    img_element.src = mngr.getNext(true);
}



// Keylistener logic
document.addEventListener('keydown', function(event) {
    // console.log(event.keyCode);

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
        default: {}
            // do nothing, ignore the key
    }
});



document.ondragover = document.ondrop = (event) => {
    event.preventDefault();
}

document.body.ondrop = (event) => {
    console.log(event.dataTransfer.files[0].path);
    event.preventDefault();
}
