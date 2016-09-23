
const FSmanager = require('./js/FSManager');

// List of keys to watch
const key_left = 37;
const key_right = 39;
const key_esc = 27;
const key_del = 46;

var mngr = new FSmanager();
mngr.genList('./images', 'example.jpg');



// Image directory info and lists
// var img_dir_list = [{}, {}, {}];

// Template for an image directory
// var img_dir = {
//     'abs_path': '',
//     'filename_array': []
// }

// var img_list = fs_manager.gen_img_list();


// HTML element that contains the image
var img = document.getElementById('image-container');

// var wraparound = false;




// Keylistener logic
document.addEventListener('keydown', function(event) {
    // console.log(event.keyCode);

    // Read the keycode property of the key pressed
    switch (event.keyCode) {
        case key_left: {
            event.preventDefault();

            // call the code to get the filename of the next image
            // console.log('Called left');
            img.src = mngr.getPrev(true);

            // 'images/1462845901532.gif';

            break;
        }
        case key_right: {
            event.preventDefault();

            // call the code to get the filename of the previous image
            // console.log('Called right');
            img.src = mngr.getNext(true);

            // 'images/example.jpg';

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
