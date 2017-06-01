/**
 * Initial application configuration, which is loaded on a first-time
 * run or when the user resets their settings
 *
 */

module.exports = {
  BROWSER_WIN: {
    width: 1000,
    height: 700,
    minWidth: 500,
    minHeight: 400,
    backgroundColor: '#eff0f1',
    iconPath: 'img/icons/appere256.png',
    center: true,
    titleName: 'Appere',
    show: true,
    autoHideMenuBar: true,
    indexPath: 'index.html'
  },
  MIN_WIDTH: 500,
  MIN_HEIGHT: 500,
  ANIMATE_WIN: true, // macOS option
  CENTER_WIN: true,
  RESIZE_WIN: true,
  SCALE_FACTOR: 0.85,
  WRAP: true,
  RETURN_PERCENTAGE: true,
  FIT_IMG_CLASS: 'fit-img',
  FULL_IMG_CLASS: 'full-img',
  set: true
};
