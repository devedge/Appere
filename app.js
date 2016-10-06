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

var img_elem_1 = document.getElementById('image-cont-1');
var img_elem_2 = document.getElementById('image-cont-2');
var img_elem_3 = document.getElementById('image-cont-3');

// var preloader = {
//     curr: {
//         element: img_elem_1,
//         name: '',
//         dir: ''
//     },
//     next: {
//         element: img_elem_2,
//         name: '',
//         dir: ''
//     },
//     prev: {
//         element: img_elem_3,
//         name: '',
//         dir: ''
//     }
// }

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

/*

Image preloading strategy:

load the first image into img_elem_1
once done (find out how?), load the next image into img_elem_2
then load previous image into img_elem_3

img_elem_1 = current    (load)
img_elem_2 = next       (load)
img_elem_3 = prev       (load)

on "Next", hide the img_elem_1, unhide img_elem_2, preload next into img_elem_3
img_elem_1 = prev       (hide)
img_elem_2 = current    (unhide)
img_elem_3 = next       (load)

on "Next"
img_elem_1 = prev       (hide)
img_elem_2 = next       (load)
img_elem_3 = current    (unhide)


img_elem_1
img_elem_2
img_elem_3



<-- prev -- curr -- next -->

*/
var temp;
var dirlength;

function showNext() {

    ipcRenderer.send('resize-window', sizeOf(path.join(preloader.dir, preloader.arr[preloader.next].name)));

    // preloader.arr[preloader.curr].element.classList.remove('scale-full');
    // preloader.arr[preloader.curr].element.classList.remove('scale-fit');
    // preloader.arr[preloader.next].element.classList.add('quick-transition');
    // preloader.arr[preloader.curr].element.classList.add('fade-out');

    // Hide the current element and show the next one
    preloader.arr[preloader.curr].element.hidden = true;
    preloader.arr[preloader.next].element.hidden = false;

    // preloader.arr[preloader.curr].element.classList.remove('quick-transition');

    // Update the pointer values
    temp = preloader.prev;
    preloader.prev = preloader.curr;
    preloader.curr = preloader.next;
    preloader.next = temp;

    // console.log('Next');
    // console.log('curr: ' + preloader.curr);
    // console.log('next: ' + preloader.next);
    // console.log('prev: ' + preloader.prev);
    // console.log(' ');


    // Change the filename in the title
    // document.title = 'Appere — ' + preloader.arr[preloader.curr].name;
    document.title = 'Appere — ' + preloader.arr[preloader.curr].name + ' — ' + (preloader.arr[preloader.curr].idx + 1) + '/' + dirlength;

    // Send an ipc message to scale the window to image size
    // ipcRenderer.send('resize-window', sizeOf(path.join(preloader.dir, preloader.arr[preloader.curr].name)));

    // Reset css class to fit the image within the window
    // preloader.arr[preloader.curr].element.classList.add('scale-fit');

    console.log('Next: ' + preloader.arr[preloader.curr].idx);

    // load the next image
    mngr.getNextFromIDX(true, preloader.arr[preloader.curr].idx, (ready, filename, new_index) => {
        if (ready) {
            console.log(' to: ' + new_index);
            // set the next object
            preloader.arr[preloader.next].name = filename;
            preloader.arr[preloader.next].idx = new_index;
            // preloader.arr[preloader.next].dir = mngr.getCurrentDir();

            // Set the image src, so the renderer can display it.
            // Use percent encoding, since the 'img' tag can't handle certain
            // special characters.
            preloader.arr[preloader.next].element.src = path.join(preloader.dir, pEncode(filename));
        }
    });
}



function showPrev() {
    // preloader.arr[preloader.curr].element.classList.remove('scale-full');
    // preloader.arr[preloader.curr].element.classList.remove('scale-fit');
    // preloader.arr[preloader.prev].element.classList.add('quick-transition');
    // preloader.arr[preloader.curr].element.classList.add('fade-out');

    ipcRenderer.send('resize-window', sizeOf(path.join(preloader.dir, preloader.arr[preloader.prev].name)));


    // Hide the current element and show the previous one
    preloader.arr[preloader.curr].element.hidden = true;
    preloader.arr[preloader.prev].element.hidden = false;

    // preloader.arr[preloader.curr].element.classList.remove('quick-transition');

    // Update the pointer values
    temp = preloader.next;
    preloader.next = preloader.curr;
    preloader.curr = preloader.prev;
    preloader.prev = temp;

    // console.log('Prev');
    // console.log('curr: ' + preloader.curr);
    // console.log('next: ' + preloader.next);
    // console.log('prev: ' + preloader.prev);
    // console.log(' ');

    // Change the filename in the title
    document.title = 'Appere — ' + preloader.arr[preloader.curr].name + ' — ' + (preloader.arr[preloader.curr].idx + 1) + '/' + dirlength;

    // Send an ipc message to scale the window to image size
    // ipcRenderer.send('resize-window', sizeOf(path.join(preloader.dir, preloader.arr[preloader.curr].name)));

    // Reset css class to fit the image within the window
    // preloader.arr[preloader.curr].element.classList.add('scale-fit');

    console.log('Prev: ' + preloader.arr[preloader.curr].idx);


    // load the previous image
    mngr.getPrevFromIDX(true, preloader.arr[preloader.curr].idx, (ready, filename, new_index) => {
        if (ready) {
            console.log(' to: ' + new_index);
            // set the next object
            preloader.arr[preloader.prev].name = filename;
            preloader.arr[preloader.prev].idx = new_index;
            // preloader.arr[preloader.prev].dir = mngr.getCurrentDir();

            // Set the image src, so the renderer can display it.
            // Use percent encoding, since the 'img' tag can't handle certain
            // special characters.
            preloader.arr[preloader.prev].element.src = path.join(preloader.dir, pEncode(filename));
        }
    });
}



// todo: check that a file exists using fs.existsSync?
// todo: use filesystem watcher
// todo: check a filetype with its magic number if the extension is not supported
// todo: on every call, update the image list array
// todo: cut off the filename after 'x' amount of charaters so it can be
//      displayed cleanly in the title

// Set the current image from a filepath
function setCurrentImage(filepath) {
    var dirname = path.dirname(filepath);
    var filename = path.basename(filepath);

    try {
        // Reset the 'zoomed' flag
        zoomed = false;

        // If the file is a valid filetype
        if (mngr.checkFile(filename)) {
            preloader.curr = 0;
            preloader.prev = 1;
            preloader.next = 2;

            // updateImage(true, dirname, filename);
            preloader.arr[preloader.curr].name = filename;
            preloader.dir = dirname;

            // Send an ipc message to scale the window to image size
            ipcRenderer.send('resize-window', sizeOf(path.join(preloader.dir, preloader.arr[preloader.curr].name)));

            preloader.arr[preloader.curr].element.hidden = false;
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

                    console.log('Current index: ' + mngr.current_index);
                    dirlength = mngr.img_list.length;

                    document.title = 'Appere — ' + preloader.arr[preloader.curr].name + ' — ' + (mngr.current_index + 1) + '/' + dirlength;

                    // load the next image
                    mngr.getNextFromIDX(true, mngr.current_index, (ready, filename, new_index) => {
                        if (ready) {
                            console.log('Next index: ' + new_index);
                            // set the next object
                            preloader.arr[preloader.next].name = filename;
                            preloader.arr[preloader.next].idx = new_index;
                            // preloader.arr[preloader.next].dir = mngr.getCurrentDir();

                            // Set the image src, so the renderer can display it.
                            // Use percent encoding, since the 'img' tag can't handle certain
                            // special characters.
                            preloader.arr[preloader.next].element.src = path.join(preloader.dir, pEncode(filename));
                        }
                    });

                    // load the previous image
                    mngr.getPrevFromIDX(true, mngr.current_index, (ready, filename, new_index) => {
                        if (ready) {
                            console.log('Prev index: ' + new_index);
                            // set the next object
                            preloader.arr[preloader.prev].name = filename;
                            preloader.arr[preloader.prev].idx = new_index;
                            // preloader.arr[preloader.prev].dir = mngr.getCurrentDir();

                            // Set the image src, so the renderer can display it.
                            // Use percent encoding, since the 'img' tag can't handle certain
                            // special characters.
                            preloader.arr[preloader.prev].element.src = path.join(preloader.dir, pEncode(filename));
                        }
                    });
                }
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

                showPrev();
                // mngr.getPrev(true, (prev_ready, fp) => {
                //     updateImage(prev_ready, mngr.getCurrentDir(), fp);
                // });
            }
            break;
        }
        case key_right: {
            if (!zoomed) {
                event.preventDefault();

                showNext();
                // mngr.getNext(true, (next_ready, fp) => {
                //     updateImage(next_ready, mngr.getCurrentDir(), fp);
                // });
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

            // img_element.classList.toggle('scale-fit');
            // img_element.classList.toggle('scale-full');

            // img_element.className = img_element.className.replace('set-fit', 'set-full');

            break;
        }
        // default: {}
            // do nothing, ignore the key
    }
});



// Handle any images drag-and-dropped onto the display window
document.ondragover = (event) => {
    // Prevent anything from happening when an item is only dragged over
    event.preventDefault();
}

// Display the image in the viewer
document.ondrop = (event) => {
    // Handle onDrop event
    event.preventDefault();
    setCurrentImage(event.dataTransfer.files[0].path);
    ipcRenderer.send('focus-window');
}

document.body.ondrop = (event) => {
    // Handle body.onDrop event
    event.preventDefault();
    setCurrentImage(event.dataTransfer.files[0].path);
    ipcRenderer.send('focus-window');
}
