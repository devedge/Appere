/**
 * A module that determines an action to take based on the keys pressed
 *
 */
const keycode = require('keycode');


/**
 * Method to determine what action to take, based on the keys pressed.
 *
 * @method getAction
 * @param  {event}  event     The keydown event
 * @param  {Boolean} isZoomed True if the current image is zoomed
 * @return {String}           The action string
 */
function getAction(event, isZoomed) {
  let kc = keycode(event.keyCode);
  let shift = event.shiftKey;
  let action;

  if (shift) {
    switch (kc) {
      case 'up': // Shift-Up --> zoom in
        action = 'zoom-in';
        break;
      case 'down': // Shift-Down --> zoom out
        action = 'zoom-out';
        break;
    }

  } else {

    // Regular usage if no shift is pressed
    switch (kc) {
      case 'right': case 'down': case 'space': // Next image
        if (!isZoomed) { action = 'next'; }
        break;

      case 'left': case 'up': // Previous image
        if (!isZoomed) { action = 'prev'; }
        break;

      case 'esc': case 'm': // Minimize window
        action = 'min';
        break;

      case 'q': // Toggle the blur
        action = 'q';
        break;

      case 'w': // Toggle the blur
        action = 'w';
        break;
    }
  }

  if (action) {
    event.preventDefault();
    return action;
  }
}

module.exports = {
  getAction
};
