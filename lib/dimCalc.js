
// Functions
// centerScreen() -> (x, y) [always keep the image in the center of the screen]
// imgScale() -> (x, y) [scale the image to fit withing the screen]
// stabilize() -> (x, y) [stabilize the image around whatever point the user moves it to]


var screenDimensions = {
    width: 0,
    height: 0,
    x_center: 0,
    y_center: 0
};

var bounds = {
    max_width: 0,   // 75% of the current window size
    max_height: 0,  // 75% of the current window size
    min_width: 550,   // x % of the current window size
    min_height: 550   // y % of the current window size
};


function setGlobals(screen) {
    screenDimensions.width = screen.width;
    screenDimensions.height = screen.height;
    screenDimensions.x_center = (screenDimensions.width / 2);
    screenDimensions.y_center = (screenDimensions.height / 2);
    
    bounds.max_width = screenDimensions.width * 0.75;
    bounds.max_height = screenDimensions.height * 0.75;
}


// image_d[0] = image width
// image_d[1] = image height

// screen_d[0] = screen width
// screen_d[1] = screen height
// screen_d[2] = screen 'x' center
// screen_d[3] = screen 'y' center

// bnds[0] = max_width
// bnds[1] = max_height
// bnds[2] = min_width
// bnds[3] = min_height
function cIOld(image_d, screen_d, bnds) {
    var new_width;
    var new_height;
    var scale_width;
    var scale_height;
    
    // If the width is greater than the max
    if (image_d[0] > bnds[0]) {

        // If the height is also greater than the max
        if (image_d[1] > bnds[1]) {

            // Ensure that the scaled side is still less than the bounds
            scale_width = Math.floor(image_d[0] / (image_d[1] / bnds[1]));
            scale_height = Math.floor(image_d[1] / (image_d[0] / bnds[0]));

            // The scaled width is larger than the max width bound
            if (scale_width > bnds[0]) {
                new_width = bnds[0];
                new_height = scale_height;

            } else if (scale_height > bnds[1]) {
                // The scaled height is larger than the max height bound
                new_width = scale_width;
                new_height = bnds[1];

            } else {
                // Neither are larger than their bounds, so pick the width as the
                // side to maximize
                new_width = bnds[0];
                new_height = scale_height;
            }
        } else {
            // Just the width is larger than the max
            new_width = bnds[0];
            new_height= Math.floor(image_d[1] / (image_d[0] / bnds[0]));
        }

    } else if (image_d[1] > bnds[1]) {
        // Since the first check failed, just the height is larger than the max
        new_height = bnds[1];
        new_width = Math.floor(image_d[0] / (image_d[1] / bnds[1]));

    } else {
        // Neither are larger than the max, so set them back to
        // their default values
        new_width = image_d[0];
        new_height = image_d[1];
    }

    // If any of the widths are smaller than the min, resize
    if (new_width < bnds[2]) {
        new_width = bnds[2];
    }

    // If any of the heights are smaller than the min, resize
    if (new_height < bnds[3]) {
        new_height = bnds[3];
    }
    
    return [
        new_width,
        new_height,
        Math.floor(screen_d[2] - (new_width / 2)),
        Math.floor(screen_d[3] - (new_height / 2))
    ];
}


function centerImage(imageDimensions) {
    var newDimensions = {
        x_center: 0,
        y_center: 0,
        width: 0,
        height: 0
    }
    
    var diffs = {
        x: bounds.max_width - imageDimensions.width,
        y: bounds.max_height - imageDimensions.height
    }
    
    // Check the upper limits of the image
    if (diffs.x > 0 && diffs.y > 0) {
        // If both dimensions are below the max limits, keep the original
        // dimensions
        newDimensions.width = imageDimensions.width;
        newDimensions.height = imageDimensions.height;
        
    } else if (diffs.x < 0 && diffs.y > 0) {
        // Only the x-coordinate is larger than the max
        // Set the x-coordinate to the max_width, and scale down the height
        newDimensions.width = bounds.max_width;
        newDimensions.height = imageDimensions.height * (newDimensions.width / imageDimensions.width);
        // newDimensions.height = imageDimensions.height * (bounds.max_width / imageDimensions.width);
        // newDimensions.height = imageDimensions.height / (imageDimensions.width / bounds.max_width);

        
    } else if (diffs.x > 0 && diffs.y < 0) {
        // Only the y-coordinate is larger than the max
        // Set the y-coordinate to the max_height, and scale down the width
        newDimensions.height = bounds.max_height;
        newDimensions.width = imageDimensions.width * (newDimensions.height / imageDimensions.height);
        // newDimensions.width = imageDimensions.width * (bounds.max_height / imageDimensions.height);
        // newDimensions.width = imageDimensions.width / (imageDimensions.height / bounds.max_height);
        
    } else if (diffs.x < 0 && diffs.y < 0) {
        // Both x- and y-coordinates are larger than the max
        
        if (diffs.x <= diffs.y) {
            // If the width is more negative than/equal to the height
            newDimensions.width = bounds.max_width;
            newDimensions.height = imageDimensions.height * (newDimensions.width / imageDimensions.width);
            
        } else if (diffs.y < diffs.x) {
            // If the height is more negative than the width
            newDimensions.height = bounds.max_height;
            newDimensions.width = imageDimensions.width * (newDimensions.height / imageDimensions.height);
        } else {
            // TODO: REMOVE
            console.log('SHOULD NEVER BE HERE');
        }
    }
    
    
    // Check the lower limits of the image
    if (newDimensions.width < bounds.min_width) {
        newDimensions.width = bounds.min_width
    }
    if (newDimensions.height < bounds.min_height) {
        newDimensions.height = bounds.min_height;
    }
    
    
    // Set the new screen center
    newDimensions.x_center = screenDimensions.x_center - (newDimensions.width / 2);
    newDimensions.y_center = screenDimensions.y_center - (newDimensions.height / 2);
    
    // Evenly round everything down, since Node throws errors on infinite
    // decimal values for screeen sizes
    newDimensions.x_center = Math.floor(newDimensions.x_center);
    newDimensions.y_center = Math.floor(newDimensions.y_center);
    newDimensions.width = Math.floor(newDimensions.width);
    newDimensions.height = Math.floor(newDimensions.height);

    return newDimensions;
}


// function stabilizeImage(image_d, screen_d, current_loc, bnds) {
//     
// }



module.exports = {
    setGlobals,
    centerImage
}
