// TODO: consolidate all css management here

let FIT_IMG_CLASS = shared.userConfig.get('FIT_IMG_CLASS');
let FULL_IMG_CLASS = shared.userConfig.get('FULL_IMG_CLASS');

class CSSStateManager {
  // Get a handle to all the HTML tags
  constructor() {
    this.body = document.getElementById('bodyTag');
    this.logo = document.getElementById('logo');
    this.pointLight = document.getElementById('point-light');
    this.imgContainer = document.getElementById('image-container');
  }

  /** swap two css classes */
  swapClasses(element, remove, add) {
    element.classList.remove(remove);
    element.classList.add(add);
  }

  /** display application home */
  showHome() {
    this.imgContainer.hidden = true;
    this.pointLight.hidden = false;
    this.logo.hidden = false;
  }

  /** hide application home */
  hideHome() {
    this.logo.hidden = true;
    this.pointLight.hidden = true;
    this.imgContainer.hidden = false;
  }

  /** Apply a css class that zooms the current image */
  zoomOutImg(element) {
    this.swapClasses(element, FULL_IMG_CLASS, FIT_IMG_CLASS);
  }

  /** Apply a css class that zooms the current image */
  zoomInImg(element) {
    this.swapClasses(element, FIT_IMG_CLASS, FULL_IMG_CLASS);
  }

  /** reset a given 'image-element-x' */
  resetElement(element) {
    element.classList.remove(FULL_IMG_CLASS);
    element.classList.add(FIT_IMG_CLASS);
    element.src = '';
  }
}

// Export CSSStateManager class
module.exports = CSSStateManager;
