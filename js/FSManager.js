const fs = require('fs');
const path = require('path');
const frep = require('frep');

// The supported image filetypes
const supported_types = /^(\.jpg|\.jpeg|\.jpe|\.jfif|\.jif|\.gif|\.png|\.bmp|\.svg|\.ico)$/;

// Flag that indicates if the image list is loaded
var list_loaded = false;


// FileSystem manager constructor. Handles generating an array of every supported
// filetype in a folder, and functions to retrieve them.
function FSmanager() {
    this.folder = '';
    this.img_list = [];
    this.extension = '';
    this.current_index = 0;
}


// Generate an array list of filenames that can be called
// to set the next image
// todo: put a hard limit to the size of the number of files?
FSmanager.prototype.genList = function(filepath, current_filename, cb) {

    // Don't regenerate the image list for the same filepath
    if (filepath !== this.folder) {
        // Set the 'list_loaded' flag to false. This prevents the 'getPrev',
        // 'getNext', (etc) function from getting called before the image array
        // is generated.
        list_loaded = false;

        // Reset the image list to an empty array.
        // (to optimize, save the last two arrays?)
        this.img_list = [];
        // Set the current folder to this filepath
        this.folder = filepath;

        // Read the provided directory, and generate a list of all the items in it
        fs.readdir(filepath, (err, items) => {
            if (!err) {

                var num_diff;

                // Sort the items, ignoring case
                items.sort((a, b) => {

                    // Try to sort numerically
                    if (a.match(/^[0-9]+/) && b.match(/^[0-9]+/)) {
                        num_diff = a.match(/^[0-9]+/)[0] - b.match(/^[0-9]+/)[0];

                        // If the difference is 0 (numerical part is identical),
                        // return a unicode diff
                        if (num_diff === 0) {
                            return a.toLowerCase().localeCompare(b.toLowerCase());
                        } else {
                            return num_diff;
                        }
                    }  else {
                        // Return a unicode diff
                        return a.toLowerCase().localeCompare(b.toLowerCase());
                    }

                        // return a.match(/^[0-9]+/)[0] - b.match(/^[0-9]+/)[0];

                    // return a.toLowerCase().localeCompare(b.toLowerCase());

                    // else if (a.match(/^[0-9]+/) && !b.match(/^[0-9]+/)) {
                    //     return -1;
                    //
                    // } else if (!a.match(/^[0-9]+/) && b.match(/^[0-9]+/)) {
                    //     return 1;
                    //
                    // }
                });

                // Extract all the supported file extensions and push them
                // on the 'img_list' array
                items.forEach((filename, index) => {
                    if (path.extname(filename).toLowerCase().match(supported_types)) {
                        // If the filename matches the current filename, the array length
                        // is the index of the current file
                        if (filename === current_filename) {
                            this.current_index = this.img_list.length;
                            console.log('Index of current file: ' + this.current_index);
                        }
                        this.img_list.push(filename);
                    }
                });

                // The image list is finished, so set the 'list_loaded' flag to true
                list_loaded = true;

                console.log(this.img_list);
            } else {
                // If there is an error, callback with it
                cb(err);
            }
        });
    } else {
        // While finding the image in the array, prevent calls to the previous
        // or next item.
        list_loaded = false;

        // Update the current index of the file from the img_list
        this.img_list.forEach((string, index) => {
            if (string === current_filename) {
                this.current_index = index;
                // console.log('Index of current file: ' + this.current_index);
                list_loaded = true;
            }
        });

        // If the file was not found, there is a fatal error, since it is not
        // in the array provided.
        if (!list_loaded) {
            cb('ERROR: The file "' + current_filename +
            '" no longer exists in "' + filepath + '"');
        }

        console.log(this.img_list);
    }
}


// Return the current folder path
FSmanager.prototype.getCurrentDir = function() {
    return this.folder;
}


// Return the full path of the current file
FSmanager.prototype.getCurrent = function() {
    // return path.join(this.folder, frep.strWithArr(this.img_list[this.current_index], replacements));
    return this.img_list[this.current_index];
}


// Get the next image filename in the list. If wraparound is true,
// then at the end of the array return the first image
FSmanager.prototype.getNext = function(wraparound = false, cb) {
    if (list_loaded) {
        // If the current image is the last one
        if (this.current_index + 1 > this.img_list.length - 1) {
            if (wraparound) {
                // Reset the current file to the last item in the directory
                this.current_index = 0;

                // Callback with the last image, wrapping around to the end of
                // the directory
                cb(true, this.img_list[this.current_index]);
            } else {

                // Callback, informing that the next image isn't ready
                // (Maybe inform that at end of list)
                cb(false, null);
            }
        } else {
            // Default behavior
            // Increment the current file index
            this.current_index += 1;

            // Callback with the next filename
            cb(true, this.img_list[this.current_index]);
        }
    } else {
        // The image list hasn't been generated yet, so callback with no value
        cb(false, null);
    }
}


// Get the previous image filename in the list. If wraparound is true, then
// if this has reached the beginning of the array, return the last image
FSmanager.prototype.getPrev = function(wraparound = false, cb) {
    if (list_loaded) {
        // The current image is the first one
        if (this.current_index - 1 < 0) {
            if (wraparound) {
                // Reset the current file to the last item in the directory
                this.current_index = this.img_list.length - 1;

                // Callback with the last image, wrapping around to the end of
                // the directory
                cb(true, this.img_list[this.current_index]);
            } else {

                // Callback, informing that the next image isn't ready
                // (Maybe inform that at end of list)
                cb(false, null);
            }
        } else {
            // Default behavior
            // Decrement the current file index
            this.current_index -= 1;

            // Callback with the previous filename
            cb(true, this.img_list[this.current_index]);
        }
    } else {
        // The image list hasn't been generated yet, so callback with no value
        cb(false, null);
    }
}


// Checks that a filename is supported. This does not need the image list
// to be generated.
FSmanager.prototype.checkFile = function (filename) {
    if (path.extname(filename).toLowerCase().match(supported_types)) {
        return true;
    } else {
        return false;
    }
}


// Export the class
module.exports = FSmanager;
