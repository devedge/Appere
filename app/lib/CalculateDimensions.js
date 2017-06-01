/**
 * Desired actions:
 * Center the image:
 *    around the center of the screen
 *    around a user-defined point after they've moved the window
 * Simply resize the window without re-centering it
 * Maximise the window to fill the alotted screen space
 *
 *
 */

// Set the scale factor from global config
// let SCALE_FACTOR = global.shared.userConfig.get('SCALE_FACTOR');
// TODO still have to run 'updateScreen()'

// Set the window bounds
let bounds = {
  MAX_WIDTH: 0,
  MAX_HEIGHT: 0,
  MIN_WIDTH: global.shared.userConfig.get('MIN_WIDTH'),
  MIN_HEIGHT: global.shared.userConfig.get('MIN_HEIGHT')
};

// Initialize an object that represents the screen dimensions
let screenDimensions = {
  WIDTH: 0,
  HEIGHT: 0,
  X_CENTER: 0,
  Y_CENTER: 0
};


/**
 * Update the bounds that this module checks against
 * @method updateBounds
 * @param  {Object}     newBounds All the new bounds to update and the new
 *                                scale amount
 * @return {none}
 */
function updateBounds(newBounds) {
  // Update the scale modifier if a new one is set
  // if (newBounds.newScale) {
  //   SCALE_FACTOR = newBounds.newScale;
  //   global.shared.userConfig.set('SCALE_FACTOR', newBounds.newScale);
  // }

  // If any of the bounds are set, update them
  bounds.MAX_WIDTH =
    (newBounds.MAX_WIDTH) ? newBounds.MAX_WIDTH : bounds.MAX_WIDTH;
  bounds.MAX_HEIGHT =
    (newBounds.MAX_HEIGHT) ? newBounds.MAX_HEIGHT : bounds.MAX_HEIGHT;
  bounds.MIN_WIDTH =
    (newBounds.MIN_WIDTH) ? newBounds.MIN_WIDTH : bounds.MIN_WIDTH;
  bounds.MIN_HEIGHT =
    (newBounds.MIN_HEIGHT) ? newBounds.MIN_HEIGHT : bounds.MIN_HEIGHT;
}


/**
 * Update the current screen dimensions and the max bounds values
 * @method updateScreen
 * @param  {Object}     newScreen The new screen's width and height dimensions
 * @return {none}
 */
function updateScreen(newScreen) {
  screenDimensions.WIDTH = newScreen.width;
  screenDimensions.HEIGHT = newScreen.height;
  screenDimensions.X_CENTER = (newScreen.width / 2);
  screenDimensions.Y_CENTER = (newScreen.height / 2);
  bounds.MAX_WIDTH =
    screenDimensions.WIDTH * global.shared.userConfig.get('SCALE_FACTOR');
  bounds.MAX_HEIGHT =
    screenDimensions.HEIGHT * lobal.shared.userConfig.get('SCALE_FACTOR');
}


/**
 * Returns the centered object
 * @method getCentered
 * @param  {[type]}    imageDimensions    [description]
 * @param  {[type]}    currentCoordinates [description]
 * @return {[type]}                       [description]
 */
function getCentered(imageDimensions) {
  let newDimensions = {};
  let diffs = {
    x: bounds.MAX_WIDTH - imageDimensions.width,
    y: bounds.MAX_HEIGHT - imageDimensions.height
  };

  // Check the upper limits of the image
  if (diffs.x > 0 && diffs.y > 0) {
    // If both dimensions are below the max limits, keep the original
    // dimensions
    newDimensions.width = imageDimensions.width;
    newDimensions.height = imageDimensions.height;

  } else if (diffs.x < 0 && diffs.y > 0) {
    // Only the x-coordinate is larger than the max
    // Set the x-coordinate to the max_width, and scale down the height
    newDimensions.width = bounds.MAX_WIDTH;
    newDimensions.height = imageDimensions.height * (bounds.MAX_WIDTH /
        imageDimensions.width);

  } else if (diffs.x > 0 && diffs.y < 0) {
    newDimensions.height = bounds.MAX_HEIGHT;
    newDimensions.width = imageDimensions.width * (bounds.MAX_HEIGHT /
        imageDimensions.height);

  } else {
    // Both x- and y-coordinates are larger than the max

    // Scale down both sides. If one of them is still larger than the max,
    // pick that one as the new size. Otherwise, scale down the image
    // normally
    let scaledWidth = imageDimensions.width * (bounds.MAX_HEIGHT /
      imageDimensions.height);
    let scaledHeight = imageDimensions.height * (bounds.MAX_WIDTH /
      imageDimensions.width);

    if (scaledWidth > bounds.MAX_WIDTH) {
      newDimensions.width = bounds.MAX_WIDTH;
      newDimensions.height = scaledHeight;

    } else if (scaledHeight > bounds.MAX_HEIGHT) {
      newDimensions.height = bounds.MAX_HEIGHT;
      newDimensions.width = scaledWidth;

    } else {
      // Neither break the limits, so resize according to the more
      // negative value

      if (diffs.x <= diffs.y) {
        // If the width is more negative than/equal to the height
        newDimensions.width = bounds.MAX_WIDTH;
        newDimensions.height = scaledHeight;

      } else {
        // If the height is more negative than the width
        newDimensions.height = bounds.MAX_HEIGHT;
        newDimensions.width = scaledWidth;
      }
    }
  }

  // Check that the size doesn't go below the lower limits
  validateLowerBounds(newDimensions);

  // Determine the new center value
  generateCoordinates(newDimensions);

  // Round the values
  roundNewValues(newDimensions);

  // Return them as:
  // {
  //    x: the new x-center value
  //    y: the new y-center value
  //    width: the new window width
  //    height: the new window height
  // }
  return {
    x: newDimensions.x,
    y: newDimensions.y,
    width: newDimensions.width,
    height: newDimensions.height
  };
}




function getFilled(imageDimensions, currentCoordinates) {
  let newDimensions = imageDimensions;

  // Just ensure that image fits within the bounds
  validateLowerBounds(newDimensions);
  validateUpperBounds(newDimensions);

  // Generate the new coordinates
  generateCoordinates(newDimensions);

  // Round the values
  roundNewValues(newDimensions);

  // Return them as:
  // {
  //    x: the new x-center value
  //    y: the new y-center value
  //    width: the new window width
  //    height: the new window height
  // }
  return {
    x: newDimensions.x,
    y: newDimensions.y,
    width: newDimensions.width,
    height: newDimensions.height
  };
}



// generate new coordinates
function generateCoordinates(newDimensions) {
  newDimensions.x = screenDimensions.X_CENTER - (newDimensions.width / 2);
  newDimensions.y = screenDimensions.Y_CENTER - (newDimensions.height / 2);
}


/**
 * Check that the image 'width' and 'height' are larger
 * than the minimum bounds, and update the passed-in object
 * @method validateLowerBounds
 * @param  {Object} newDimensions An object containing both 'width' and
 *                                'height' values
 * @return {Object}               The same object passed in, but with possibly
 *                                updated 'width' and 'height' values
 */
function validateLowerBounds(newDimensions) {
  // Clean the width
  if (newDimensions.width <= bounds.MIN_WIDTH) {
    newDimensions.width = bounds.MIN_WIDTH;
  }

  // Clean the height
  if (newDimensions.height <= bounds.MIN_HEIGHT) {
    newDimensions.height = bounds.MIN_HEIGHT;
  }
}


/**
 * Check that the image 'width' and 'height' are smaller
 * than the maximum bounds, and update the passed-in object
 * @method validateUpperBounds
 * @param  {Object} newDimensions An object containing both 'width' and
 *                                'height' values
 * @return {Object}               The same object passed in, but with possibly
 *                                updated 'width' and 'height' values
 */
function validateUpperBounds(newDimensions) {
  // Clean the width
  if (newDimensions.width >= bounds.MAX_WIDTH) {
    newDimensions.width = bounds.MAX_WIDTH;
  }

  // Clean the height
  if (newDimensions.height >= bounds.MAX_HEIGHT) {
    newDimensions.height = bounds.MAX_HEIGHT;
  }
}


/**
 * Round the
 * @method roundNewValues
 * @param  {Object}       newDimensions The new image dimensions to round. It
 *                                      should look like:
 *                                      {
 *                                        x
 *                                        y
 *                                        width
 *                                        height
 *                                      }
 * @return {none}
 */
function roundNewValues(newDimensions) {
  newDimensions.width = Math.round(newDimensions.width);
  newDimensions.height = Math.round(newDimensions.height);
  newDimensions.x = Math.round(newDimensions.x);
  newDimensions.y = Math.round(newDimensions.y);
}


// Export module functions
module.exports = {
  updateBounds,
  updateScreen,
  getCentered,
  getFilled
};
