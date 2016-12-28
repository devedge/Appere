const fs = require('fs');
const path = require('path');
const frep = require('frep');
const readChunk = require('read-chunk');
const fileType = require('file-type');
var buffer;

// The supported image filetypes
const supported_types = /^([\.]*jpg|[\.]*jpeg|[\.]*jpe|[\.]*jfif|[\.]*jif|[\.]*gif|[\.]*png|[\.]*bmp|[\.]*svg|[\.]*ico)$/;

// Flag that indicates if the image list is loaded
// var list_loaded = false;


// FileSystem manager constructor. Handles generating an array of every supported
// filetype in a folder, and functions to retrieve them.
function fsManager() {
    this.folder = '';
    this.img_list = [];
    this.extension = '';
    this.current_index = 0;
    this.list_loaded = false;
}


// Generate an array list of filenames that can be called
// to set the next image
// todo: put a hard limit to the size of the number of files?
fsManager.prototype.genList = function(filepath, current_filename, cb) {

    // console.log('genList called');

    // Don't regenerate the image list for the same filepath
    if (filepath !== this.folder) {
        // Set the 'list_loaded' flag to false. This prevents the 'getPrev',
        // 'getNext', (etc) function from getting called before the image array
        // is generated.
        this.list_loaded = false;

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

                    // Try to sort numerically by the numbers at the start of the filename
                    if (a.match(/^[0-9]+/) && b.match(/^[0-9]+/)) {
                        num_diff = a.match(/^[0-9]+/)[0] - b.match(/^[0-9]+/)[0];

                        // If the difference is 0 (numerical part is identical),
                        // return a unicode diff
                        if (num_diff === 0) {
                            return a.toLowerCase().localeCompare(b.toLowerCase());
                        } else {
                            return num_diff;
                        }

                    // Sort numerically by the numbers at the end of the filename
                    } else if (a.match(/ [0-9]+\..*$/) && b.match(/ [0-9]+\..*$/)) {
                        num_diff = a.match(/[0-9]+\..*$/)[0].match(/[0-9]*/)[0] - b.match(/[0-9]+\..*$/)[0].match(/[0-9]*/)[0];

                        // If the difference is 0 (numerical part is identical),
                        // return a unicode diff
                        if (num_diff === 0) {
                            return a.toLowerCase().localeCompare(b.toLowerCase());
                        } else {
                            return num_diff;
                        }

                    } else {
                        // Return a unicode diff
                        return a.toLowerCase().localeCompare(b.toLowerCase());
                    }
                });

                // Extract all the supported file extensions and push them
                // on the 'img_list' array
                items.forEach((filename, index) => {

                    // add everything with a proper file extension right now. When
                    // the image will be loaded, then check if it's valid.

                    // isSupported(path.join(filepath, filename))
                    if (path.extname(filename).toLowerCase().match(supported_types)) {
                        // If the filename matches the current filename, the array length
                        // is the index of the current file
                        if (filename === current_filename) {
                            this.current_index = this.img_list.length;
                            // console.log('Index of current file: ' + this.current_index);
                        }
                        this.img_list.push(filename);
                    }
                });

                // The image list is finished, so set the 'list_loaded' flag to true
                this.list_loaded = true;

                // console.log(this.img_list);
                cb();
            } else {
                // If there is an error, callback with it
                cb(err);
            }
        });
    } else {
        // While finding the image in the array, prevent calls to the previous
        // or next item.
        this.list_loaded = false;

        // Update the current index of the file from the img_list
        this.img_list.forEach((string, index) => {
            if (string === current_filename) {
                this.current_index = index;
                // console.log('Index of current file: ' + this.current_index);
                this.list_loaded = true;
                console.log('it was found anyway');
            }
        });

        // If the file was not found, there is a fatal error, since it is not
        // in the array provided.
        if (!this.list_loaded) {
            cb('ERROR: The file "' + current_filename +
            '" no longer exists in "' + filepath + '"');
        } else {
            // Callback successfully
            cb();
        }

        // console.log(this.img_list);
    }
}


// Return the current folder path
fsManager.prototype.getCurrentDir = function() {
    return this.folder;
}


// Return the full path of the current file
fsManager.prototype.getCurrent = function() {
    // return path.join(this.folder, frep.strWithArr(this.img_list[this.current_index], replacements));
    return this.img_list[this.current_index];
}


// Get the next image filename in the list. If wraparound is true,
// then at the end of the array return the first image
fsManager.prototype.getNext = function(wraparound, cb) {
    if (this.list_loaded) {
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
            this.current_index = this.current_index + 1;

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
fsManager.prototype.getPrev = function(wraparound, cb) {
    if (this.list_loaded) {
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
            this.current_index = this.current_index - 1;

            // Callback with the previous filename
            cb(true, this.img_list[this.current_index]);
        }
    } else {
        // The image list hasn't been generated yet, so callback with no value
        cb(false, null);
    }
}


// Works exactly like getNext(), except a custom 'current index' can be set
fsManager.prototype.getNextFromIDX = function(wraparound, custom_idx, cb) {
    if (this.list_loaded) {
        // If the current image is the last one
        if (custom_idx + 1 > this.img_list.length - 1) {
            if (wraparound) {
                // Reset the current file to the last item in the directory
                custom_idx = 0;

                // Callback with the last image, wrapping around to the end of
                // the directory
                cb(true, this.img_list[custom_idx], custom_idx);
            } else {

                // Callback, informing that the next image isn't ready
                // (Maybe inform that at end of list)
                cb(false, null, 0);
            }
        } else {
            // Default behavior
            // Increment the current file index
            custom_idx = custom_idx + 1;

            // Callback with the next filename
            cb(true, this.img_list[custom_idx], custom_idx);
        }
    } else {
        // The image list hasn't been generated yet, so callback with no value
        cb(false, null, 0);
    }
}


// Works exactly like getPrev(), except a custom 'current index' can be set
fsManager.prototype.getPrevFromIDX = function(wraparound, custom_idx, cb) {
    if (this.list_loaded) {
        // The current image is the first one
        if (custom_idx - 1 < 0) {
            if (wraparound) {
                // Reset the current file to the last item in the directory
                custom_idx = this.img_list.length - 1;

                // Callback with the last image, wrapping around to the end of
                // the directory
                cb(true, this.img_list[custom_idx], custom_idx);
            } else {

                // Callback, informing that the next image isn't ready
                // (Maybe inform that at end of list)
                cb(false, null, 0);
            }
        } else {
            // Default behavior
            // Decrement the current file index
            custom_idx = custom_idx - 1;

            // Callback with the previous filename
            cb(true, this.img_list[custom_idx], custom_idx);
        }
    } else {
        // The image list hasn't been generated yet, so callback with no value
        cb(false, null, 0);
    }
}


// Checks that a filename is supported. This does not need the image list
// to be generated.
fsManager.prototype.checkFile = function (filepath) {
    return isSupported(filepath);
}


function isSupported(filepath) {
    if (fs.lstatSync(filepath).isFile()) {
        
        var file_type_result = fileType(readChunk.sync(filepath, 0, 262));
        
        console.log(file_type_result);
        
        
        if (file_type_result) {
            
            console.log('Filetype: ' + file_type_result.ext);
            
            if (file_type_result.ext.match(supported_types)) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    } else {
        return false;
    }
}


fsManager.prototype.resetManager = function() {
    this.folder = '';
    this.img_list = [];
    this.extension = '';
    this.current_index = 0;
    this.list_loaded = false;
}


// Export the class
module.exports = fsManager;
