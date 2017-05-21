// NOT USED RIGHT NOW, chokidar is unstable
var chokidar = require('chokidar');

var folderpath = '';

var watcher = chokidar.watch(folderpath, {
    ignoreInitial: true,    // ignore current files and only listen for changes
    followSymlinks: false,  // do not navigate to new locations
    depth: 0,               // only monitor current directory
    awaitWriteFinish: true  // only notify when a new file is completely written to disk
});

// list the currently watched paths
// console.log(watcher.getWatched());

watcher
  .on('add', path => console.log(`File ${path} has been added`))
  // .on('change', path => console.log(`File ${path} has been changed`))
  .on('unlink', path => console.log(`File ${path} has been removed`));
