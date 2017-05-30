/**
 * A module that determines an action to take based on the keys pressed
 *
 *
 * TODO
 * 'm' --> minimize
 * 'shift c' --> center
 * add code to determine current monitor
 * validator module
 * animations as pictures slide
 * a blur effect for the settings
 */

'use-strict';

// Valid keys to watch
const KEYS = require('../util/ValidKeys.js');

// TODO: just use up arrow instead of shift combo

/**
 * A method that determines the proper action to take based on
 * application context. It returns a string that is conditionally
 * checked by the caller.
 * @method keyAction
 * @param  {event}    event            The keydown event
 * @param  {Integer}  key              The integer key code
 * @param  {Boolean}  isZoomed         True if the current image is zoomed
 * @return {String}                    The action string
 */
function keyAction(event, key, isZoomed) {
  if (event.shiftKey) {
    if (key === KEYS.UP) {
      event.preventDefault();
      return 'zoom-in';

    } else if (key === KEYS.DOWN) {
      event.preventDefault();
      return 'zoom-out';
    }
  } else {
    if (key === KEYS.LEFT || key === KEYS.UP) {
      if (!isZoomed) {
        event.preventDefault();
        return 'prev';
      }

    } else if (key === KEYS.RIGHT || key === KEYS.DOWN || key === KEYS.SPACE) {
      if (!isZoomed) {
        event.preventDefault();
        return 'next';
      }

    } else if (key === KEYS.ESC) {
      event.preventDefault();
      return 'esc';
    }
  }
}


// Export the keyAction method
module.exports = {
  validate: keyAction
};
