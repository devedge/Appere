
const fs = require('fs');
const path = require('path');



function gen_img_list(folder_path, current_file) {
    var extension;
    var img_list = [];
    var current_index;

    fs.readdir(folder_path, (err, items) => {
        // if (err) {
        //
        // }

        for (i=0; i<items.length; i++) {
            extension = path.extname(items[i]);

            // If we find the filename,
            if (items[i] === current_file) {
                current_index = i;
            }

            if (extension.match(/^(\.jpg|\.jpeg|\.jpe|\.jfif|\.jif|\.gif|\.png|\.bmp|\.svg|\.ico)$/)) {
                img_list.push(items[i]);
            }
        }
    });
}





// fs.readdir('/home/usr/Desktop/local/', (err, items) => {
//     var i;
//     var extension;
//     for (i=0; i<items.length; i++) {
//         extension = path.extname(items[i]);
//
//         if (items[i] === current) {
//             index = i;
//             prev = i - 1;
//             next = i + 1;
//         }
//
//         // regex match for all supported formats
//         if (extension.match(/^(\.jpg|\.jpeg|\.jpe|\.jfif|\.jif|\.gif|\.png|\.bmp|\.svg|\.ico)$/)) {
//             // console.log(items[i])
//         }
//     }
//     console.log('Number of items ' + i);
//     console.log('Index of image: ' + index);
//     console.log('Prev: ' + prev);
//     console.log('Next: ' + next);
// });
















// // handle extracting all filenames from a directory, isolating supported formats,
//
// // updating/managing filesystem related things, etc...
//
// // consider using 'collections.js' for datastructure types
// // const fs = require('fs')
// // const path = require('path')
//
// var f_list = []
//
// // Given a path, generate a list of all the image files
// function get_dir_list() {
//
// }
//
// // Get the path to the next image
// function get_next() {
//
// }
//
// // Get the path to the previous image
// function get_prev() {
//
// }
//
// // Get an image's width and height to determine how to resize the window
// function get_img_dimensions() {
//
// }
//
//
//
//
// // Function to delete a file (permanently, or into trash?)
// function delete_file() {
//
// }
