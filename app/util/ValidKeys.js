module.exports = {
  // ZOOM_IN: 38, // the up arrow. this needs to be paired with the shift key
  // ZOOM_OUT: 40, // down arrow, also needs shift key
  // LEFT: 37,
  // UP: 38,
  // RIGHT: 39,
  // DOWN: 40,
  // ESC: 27,
  // SPACE: 32
  NEXT: /(right|down|space)/,
  PREVIOUS: /(left|up)/,
  ZOOM_IN: /up/,
  ZOOM_OUT: /down/,
  MINIMIZE: /esc/
};
