const fs = require('fs');
const path = require('path');
// var SortedArray = require("collections/sorted-array");

const supported_types = /^(\.jpg|\.jpeg|\.jpe|\.jfif|\.jif|\.gif|\.png|\.bmp|\.svg|\.ico)$/;


class FSmanager {
    constructor() {
        this.folder = '';
        this.img_list = [];
        this.current_index = 0;
        this.extension = '';
    }


    // Generate an array list of filenames that can be
    // called to set the next image
    genList(filepath, current_filename, cb) {
        this.folder = filepath;

        fs.readdir(filepath, (err, items) => {
            // Sort the items, ignoring case
            items.sort(function (a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });

            // Extract all the supported file extensions
            // If the extensions match, push them on the array
            items.forEach((filename, index) => {
                if (path.extname(filename).match(supported_types)) {
                    // If the filename matches the current filename, the array length
                    // is the index of the current file
                    if (filename === current_filename) {
                        this.current_index = this.img_list.length;
                    }
                    this.img_list.push(filename);
                }
            });

            // Callback.
            cb();
        });
    }


    // Get the next image filename in the list. If wraparound is true,
    // then
    getNext() {
        if (this.current_index + 1 > this.img_list.length + 1) {

        }
        return this.img_list[this.current_index + 1];
    }


    // 
    getPrev() {
        return path.join(this.folder, this.img_list[this.current_index - 1]);
    }
}














            // console.log('Size: ' + this.img_list.length);
            // console.log('Index: ' + this.current_index);
            // console.log('File given: Cpgq3qhWgAEcFRa.jpg');
            // console.log('Actual    : ' + this.img_list[this.current_index]);


// // Constructor function
// function FSmanager() {
//     this.extension;
//     this.img_list = [];
//     this.current_index;
// }
//
//
// // Generate the array list from the current image's filepath
// FSmanager.prototype.genList = function (filepath, current_filename) {
//
//     fs.readdir(filepath, (err, items) => {
//
//         // Sort the items, ignoring case
//         items.sort(function (a, b) {
//             return a.toLowerCase().localeCompare(b.toLowerCase());
//         });
//
//         // Extract all the supported file extensions
//         items.forEach((filename, index) => {
//             // If the extensions match, push them on the array
//             if (path.extname(filename).match(/^(\.jpg|\.jpeg|\.jpe|\.jfif|\.jif|\.gif|\.png|\.bmp|\.svg|\.ico)$/)) {
//                 // If the filename matches the current filename, the array length
//                 // is the index of the current file
//                 if (filename === current_filename) {
//                     this.current_index = this.img_list.length;
//                 }
//
//                 this.img_list.push(filename);
//             }
//         });
//
//         console.log('Size: ' + this.img_list.length);
//         console.log('Index: ' + this.current_index);
//         console.log('File given: Cpgq3qhWgAEcFRa.jpg');
//         console.log('Actual    : ' + this.img_list[this.current_index]);
//     });
// }
//
//
// // Get the filepath of the previous image
// FSmanager.prototype.getPrev = function () {
//
// }
//
//
// // Get the filepath of the next image
// FSmanager.prototype.getNext = function () {
//
// }


// export default FSmanager;



var mngr = new FSmanager();

mngr.genList('/home/usr/Desktop', 'Cpgq3qhWgAEcFRa.jpg');



// module.exports = FSmanager;


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
