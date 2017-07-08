// TODO: consolidate all css management here


class CSSStateManager {
  // Get a handle to all the HTML tags
  constructor() {
    this.body = document.getElementById('bodyTag');
    this.logo = document.getElementById('logo');
    this.pointLight = document.getElementById('point-light');
    this.imgContainer = document.getElementById('image-container');
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


}

// Export CSSStateManager class
module.exports = CSSStateManager;


function swapClasses(el, remove, add) {
  el.classList.remove(remove);
  el.classList.add(add);
}
