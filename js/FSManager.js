const fs = require('fs');
const path = require('path');
const frep = require('frep');

// The supported image filetypes
const supported_types = /^(\.jpg|\.jpeg|\.jpe|\.jfif|\.jif|\.gif|\.png|\.bmp|\.svg|\.ico)$/;

var replacements = [{
        pattern: '!',
        replacement: '%21'
    }, {
        pattern: '*',
        replacement: '%2A'
    }, {
        pattern: '\'',
        replacement: '%27'
    }, {
        pattern: '(',
        replacement: '%28'
    }, {
        pattern: ')',
        replacement: '%29'
    }, {
        pattern: ';',
        replacement: '%3B'
    }, {
        pattern: ':',
        replacement: '%3A'
    }, {
        pattern: '@',
        replacement: '%40'
    }, {
        pattern: '&',
        replacement: '%26'
    }, {
        pattern: '=',
        replacement: '%3D'
    }, {
        pattern: '+',
        replacement: '%2B'
    }, {
        pattern: '$',
        replacement: '%24'
    }, {
        pattern: ',',
        replacement: '%2C'
    }, {
        pattern: '/',
        replacement: '%2F'
    }, {
        pattern: '?',
        replacement: '%3F'
    }, {
        pattern: '#',
        replacement: '%23'
    }, {
        pattern: '[',
        replacement: '%5B'
    }, {
        pattern: ']',
        replacement: '%5D'
    }
];


// FileSystem manager constructor. Handles generating an array of every supported
// filetype in a folder, and functions to retrieve them.
function FSmanager() {
    this.folder = '';
    this.img_list = [];
    this.current_index = 0;
    this.extension = '';
}


// Generate an array list of filenames that can be called
// to set the next image
FSmanager.prototype.genList = function(filepath, current_filename, cb) {
    this.folder = filepath;

    fs.readdir(filepath, (err, items) => {
        // Sort the items, ignoring case
        items.sort(function (a, b) {
            return a.toLowerCase().localeCompare(b.toLowerCase());
        });

        // Extract all the supported file extensions and push them
        // on the 'img_list' array
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
        cb(err);
    });
}


// Return the current folder path
FSmanager.prototype.getCurrentDir = function() {
    return this.folder;
}


// Return the full path of the current file
FSmanager.prototype.getCurrent = function() {
    // return path.join(this.folder, frep.strWithArr(this.img_list[this.current_index], replacements));
    return frep.strWithArr(this.img_list[this.current_index], replacements);
}


// Get the next image filename in the list. If wraparound is true,
// then at the end of the array return the first image
FSmanager.prototype.getNext = function(wraparound = false) {
    if (this.current_index >= this.img_list.length - 1) {
        if (wraparound) {
            // Reset the current index to the start of the directory
            this.current_index = 0;
        }

        // Return the updated index if 'wraparound' is true, or the same
        // filname if it is false
        return frep.strWithArr(this.img_list[this.current_index], replacements);
    }

    // Increment the current file index
    this.current_index += 1;

    // Return the new file
    return frep.strWithArr(this.img_list[this.current_index], replacements);
}


// Get the previous image filename in the list. If wraparound is true, then
// if this has reached the beginning of the array, return the last image
FSmanager.prototype.getPrev = function(wraparound = false) {
    if (this.current_index <= 0) {
        if (wraparound) {
            // Reset the current file to the last item in the directory
            this.current_index = this.img_list.length - 1;
        }

        // Return the updated index if 'wraparound' is true, or the same
        // filname if it is false
        return frep.strWithArr(this.img_list[this.current_index], replacements);
    }

    // Decrement the current file index
    this.current_index -= 1;

    // Return the new file
    return frep.strWithArr(this.img_list[this.current_index], replacements);
}


// Export the class
module.exports = FSmanager;
