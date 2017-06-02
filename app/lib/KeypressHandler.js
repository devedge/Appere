/**
 * A module that determines an action to take based on the keys pressed
 *
 */

'use-strict';

// Valid keys to watch
const KEYS = require('../util/ValidKeys.js');

// TODO: switch-case statement
/**
 * A method that determines the proper action to take based on
 * application context. It returns a string that is conditionally
 * checked by the caller.
 * @method getKeyAction
 * @param  {event}      event    The keydown event
 * @param  {Boolean}    isZoomed True if the current image is zoomed
 * @return {String}              The action string
 */
function getKeyAction(event, isZoomed) {
  let key = event.keyCode;
  let action = null;

  // Check for zoom options
  if (event.shiftKey) {
    if (key === KEYS.ZOOM_IN) {
      action = 'zoom-in';
    } else if (key === KEYS.ZOOM_OUT) {
      action = 'zoom-out';
    }

  } else {
    // Check for other regular usage options

    // 'Left' or 'Up' goes to the previous image, if it's not zoomed
    if (key === KEYS.LEFT || key === KEYS.UP) {
      if (!isZoomed) {
        action = 'prev';
      }

    // 'Left', 'Down', or 'Space' goes to the next image if it isn't zoomed
    } else if (key === KEYS.RIGHT || key === KEYS.DOWN || key === KEYS.SPACE) {
      if (!isZoomed) {
        action = 'next';
      }

    // The 'ESC' key minimizes the window
    } else if (key === KEYS.ESC) {
      action = 'min';
    }
  }

  // If a valid action is available, return it
  if (action) {
    event.preventDefault();
    return action;
  }
}


// Export the getKeyAction method as a subfunction called 'get()'
module.exports = {
  get: getKeyAction
};
