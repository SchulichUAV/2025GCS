const fs = require('fs');
const path = require('path');

const targetPath = path.relative(
  path.dirname(path.resolve(__dirname, '../src/data/TargetInformation.json')),
  path.resolve(__dirname, '../../backend/data/TargetInformation.json')
);
const symlinkPath = path.resolve(__dirname, '../src/data/TargetInformation.json');

// Check if the symlink file already exists
fs.lstat(symlinkPath, (err, stats) => {
  if (err && err.code !== 'ENOENT') {
    console.error('Error checking symlink:', err);
    return;
  }

  if (stats && stats.isSymbolicLink()) {
    // Remove the existing symlink
    fs.unlink(symlinkPath, (err) => {
      if (err) {
        console.error('Error removing existing symlink:', err);
        return;
      }
      createSymlink();
    });
  } else {
    createSymlink();
  }
});

function createSymlink() {
  fs.symlink(targetPath, symlinkPath, 'file', (err) => {
    if (err) {
      console.error('Error creating symlink:', err);
    } else {
      console.log('Symlink created successfully:', targetPath);
    }
  });
}