// TODO: consolidate all css management here


class CSSStateManager {
  // Get a handle to all the HTML tags
  constructor() {
    this.body = document.getElementById('bodyTag');
    this.logo = document.getElementById('logo');
    this.pointLight = document.getElementById('point-light');
    this.imgContainer = document.getElementById('image-container');
  }

  swapClasses(element, remove, add) {
    element.classList.remove(remove);
    element.classList.add(add);
  }

  showHome() {
    this.imgContainer.hidden = true;
    this.pointLight.hidden = false;
    this.logo.hidden = false;
  }

  hideHome() {
    this.logo.hidden = true;
    this.pointLight.hidden = true;
    this.imgContainer.hidden = false;
  }

  zoomOutImg(element) {
    this.swapClasses(element, 'FULL_IMG_CLASS', 'FIT_IMG_CLASS');
  }

  zoomInImg(element) {
    this.swapClasses(element, 'FIT_IMG_CLASS', 'FULL_IMG_CLASS');
  }


}

// Export CSSStateManager class
module.exports = CSSStateManager;
