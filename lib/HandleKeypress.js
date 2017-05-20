/**
 * [exports description]
 * @type {[type]}
 */

'use-strict';

// Valid keys to watch
const KEYS = require('../util/ValidKeys.js');


/**
 * A method that determines the proper action to take based on
 * application context. It returns a string that is conditionally 
 * checked by the caller.
 * @method keyAction
 * @param  {event}    event            The keydown event
 * @param  {Integer}  key              The integer key code
 * @param  {Boolean}  appHomeDisplayed True if the application home is 
 *                                     displayed, to disable zoom
 * @param  {Boolean}  isZoomed         True if the current image is zoomed
 * @return {String}                    The action string
 */
function keyAction(event, key, appHomeDisplayed, isZoomed) {
  if (event.shiftKey && !appHomeDisplayed) {
    
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
