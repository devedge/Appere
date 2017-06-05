/**
 * A module that determines an action to take based on the keys pressed
 *
 */

'use-strict';

// Valid keys to watch
const KEYS = require('../util/ValidKeys.js');
const keycode = require('keycode');

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
  // The action to take/return. If this is set, then the default action
  // will be prevented and this value will be returned.
  let action = null;
  let kc = keycode(event.keyCode);

  // If the shift modifier was used
  if (event.shiftKey) {

    // Check the keypress actions that can be taken
    switch (kc) {
      case regexCheck(kc, KEYS.ZOOM_IN):
        action = 'zoom-in';
        break;
      case regexCheck(kc, KEYS.ZOOM_OUT):
        action = 'zoom-out';
        break;
    }
  } else {
    // If the 'shift' modifier wasn't used, check the keys pressed
    // to determine what action to take
    switch (kc) {
      case regexCheck(kc, KEYS.NEXT):
        if (!isZoomed) { action = 'next'; }
        break;
      case regexCheck(kc, KEYS.PREVIOUS):
        if (!isZoomed) { action = 'prev'; }
        break;
      case regexCheck(kc, KEYS.MINIMIZE):
        action = 'min';
        break;
    }
  }

  // If a valid action is available, return it
  if (action) {
    event.preventDefault();
    return action;
  }
}


/**
 * Quick function that determines if a string matched with a certain
 * regex exists.
 * @method regexCheck
 * @param  {String}   str   The string to compare
 * @param  {Regex}    regex The regex
 * @return {String}         The matched string, or 'undefined'
 */
function regexCheck(str, regex) {
  return (str.match(regex) || {})[0];
}


// Export the getKeyAction method as a subfunction called 'get()'
module.exports = {
  get: getKeyAction
};
