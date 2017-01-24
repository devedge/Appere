
// Functions
// centerScreen() -> (x, y) [always keep the image in the center of the screen]
// imgScale() -> (x, y) [scale the image to fit within the screen]
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
    min_width: 500,   // x % of the current window size
    min_height: 500   // y % of the current window size
};



/**
 * Set the global variables within this module
 * @param {object} screen An object containing both the screen width
 *                        and height
 */
function setGlobals(screen) {
    screenDimensions.width = screen.width;
    screenDimensions.height = screen.height;
    screenDimensions.x_center = (screenDimensions.width / 2);
    screenDimensions.y_center = (screenDimensions.height / 2);

    bounds.max_width = screenDimensions.width * 0.75;
    bounds.max_height = screenDimensions.height * 0.75;
}



/**
 * Center the current image in the screen, resizing it so it stays within
 * the window's bounds.
 * @param  {object} imageDimensions An object containing the image's width
 *                                  and height
 * @return {object} newDimensions The image's new width and height
 */
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

    } else if (diffs.x > 0 && diffs.y < 0) {
        // Only the y-coordinate is larger than the max
        // Set the y-coordinate to the max_height, and scale down the width
        newDimensions.height = bounds.max_height;
        newDimensions.width = imageDimensions.width * (newDimensions.height / imageDimensions.height);

    } else {
        // Both x- and y-coordinates are larger than the max

        // Scale down both sides. If one of them is still larger than the max,
        // pick that one as the new size. Otherwise, scale down the image
        // normally
        var scaled_width = imageDimensions.width * (bounds.max_height / imageDimensions.height);
        var scaled_height = imageDimensions.height * (bounds.max_width / imageDimensions.width);

        if (scaled_width > bounds.max_width) {
            newDimensions.width = bounds.max_width;
            newDimensions.height = scaled_height;

        } else if (scaled_height > bounds.max_height) {
            newDimensions.height = bounds.max_height;
            newDimensions.width = scaled_width;

        } else {
            // Neither break the limits, so resize according to the more
            // negative value

            if (diffs.x <= diffs.y) {
                // If the width is more negative than/equal to the height
                newDimensions.width = bounds.max_width;
                newDimensions.height = scaled_height;

            } else {
                // If the height is more negative than the width
                newDimensions.height = bounds.max_height;
                newDimensions.width = scaled_width
            }
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
    newDimensions.x_center = Math.round(newDimensions.x_center);
    newDimensions.y_center = Math.round(newDimensions.y_center);
    newDimensions.width = Math.round(newDimensions.width);
    newDimensions.height = Math.round(newDimensions.height);

    // console.log('W: ' + imageDimensions.width + ' H: ' + imageDimensions.height + '; New W: ' + newDimensions.width + ' New H: ' + newDimensions.height);

    return newDimensions;
}

// stabilize around the top left corner, or the center (probably the former)
// function stabilizeImage(image_d, screen_d, current_loc, bnds) {
//
// }



module.exports = {
    setGlobals,
    centerImage
}
