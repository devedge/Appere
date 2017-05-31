/**
 * Initial application configuration, which is loaded on a first-time
 * run or when the user resets their settings
 *
 */

module.exports = {
  BROWSER_WIN: {
    width: 1000,
    height: 700,
    backgroundColor: '#eff0f1',
    iconPath: 'img/icons/appere256.png',
    // center: true,
    titleName: 'Appere',
    show: true,
    autoHideMenuBar: true,
    indexPath: 'index.html'
  },
  ANIMATE_WIN: true, // macOS option
  CENTER_WIN: true,
  RESIZE_WIN: true,
  set: true
};
