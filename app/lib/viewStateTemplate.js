module.exports = {
  dirPath: '', // The absolute path to the current directory
  dirNum: 0,   // The number of images in the current directory
  pointer: {   // A rolling index of pointers to the images in the stateArray
    curr: 0,
    next: 1,
    prev: 2
  },
  istate: [   // An object array that maintains state of the three images
    {
      handle: null,   // A handle to the image element
      gifhandle: null,// A temporary handle so gifs can be loaded from the start
      filename: '',   // The image's filename
      index: 0,       // The index into the image array
      dimensions: {}, // The dimensions {width, height} of the current image
      //err: null //{message: '', function: ''}
    },
    {
      handle: null,
      gifhandle: null,
      filename: '',
      index: 0,
      dimensions: {},
      //err: null //{message: '', function: ''}
    },
    {
      handle: null,
      gifhandle: null,
      filename: '',
      index: 0,
      dimensions: {},
      //err: null //{message: '', function: ''}
    }
  ],
  title: {          // An object that maintains state of the window title
    filename: '',   // These attributes are duplicated here so the title
    fileindex: 0,   //    can be re-generated without re-querying the stateArray
    totalfiles: 0,
    percentdisplayed: ''
  }//,
  // imgContainer: null,  // The parent of the three image elements
  // logoContainer: null  // The app home, containing the logo
};
