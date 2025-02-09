const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../backend/data/TargetInformation.json');
const symlinkPath = path.resolve(__dirname, '../data/TargetInformation.json');

fs.symlink(targetPath, symlinkPath, 'file', (err) => {
  if (err) {
    console.error('Error creating symlink:', err);
  } else {
    console.log('Symlink created successfully');
  }
});