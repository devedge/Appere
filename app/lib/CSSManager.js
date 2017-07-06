/**
 * This module handles applying/removing css styles from the app through a
 * programmatic interface. This is to reduce lag between different views,
 * instead of loading different pages.
 *
 * The only elements not manipulated here are the three image elements,
 * which are handled by ViewHandler.js
 *
 * Everything is set up as a function so the 'new' keyword doesn't need
 * to be called
 */

/**
 * Action events:
 *
 * To display setting/info:
 *  1. The background is dimmed.
 *  2. The foreground ('image-container') is blurred. Animated
 *  3. The 'stretch-img' property is applied, and also animated
 *  4. The content is displayed
 *
 * To display the 'home':
 *  1. The 'image-container' id is hidden
 *  2. The 'logo' id is unhidden
 *  3? Does the 'home-container' clas need to be hidden/unhidden?
 *
 * To start viewing images:
 *  1. The 'logo' id is hidden
 *  2. The 'image-container' element is unhidden
 *
 */

const bodyTag = document.getElementById('bodyTag');
const logoTag =  document.getElementById('logo');
const pointlightTag = document.getElementById('point-light');
const imagecontainerTag = document.getElementById('image-container');

// variables indicating css state
let APP_HOME;

/**
 * A function to facilitate swapping two diffent classes for an element
 * @method swapClasses
 * @param  {String}    removedClass The class to remove
 * @param  {String}    addedClass   The class to add
 * @return {none}
 */
function swapClasses(element, removedClass, addedClass) {
  element.classList.remove(removedClass);
  element.classList.add(addedClass);
}

function blurEnable() {
  swapClasses(bodyTag, 'background-light', 'background-dim');
  swapClasses(imagecontainerTag, 'fg-blur-out', 'fg-blur-in');
  // TODO also resize the image to fill the window
}

function blurDisable() {
  swapClasses(bodyTag, 'background-dim', 'background-light');
  swapClasses(imagecontainerTag, 'fg-blur-in', 'fg-blur-out');
  // TODO also resize the image to fill the window

  // Wait until the 'blur-out' animation is done, then remove the class
  setTimeout(() => {
    imagecontainerTag.classList.remove('fg-blur-out');
  }, 300);
}

function showHome() {
  blurDisable();
  imagecontainerTag.hidden = true;
  pointlightTag.hidden = false;
  logoTag.hidden = false;
}

function hideHome() {
  logoTag.hidden = true;
  pointlightTag.hidden = true;
  imagecontainerTag.hidden = false;
}





module.exports = {
  blurEnable,
  blurDisable
};
