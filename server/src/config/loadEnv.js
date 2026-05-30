const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = (() => {
  const localPath = path.resolve(__dirname, '../../.env');
  const examplePath = path.resolve(__dirname, '../../.env.example');

  if (process.env.NODE_ENV === 'production') {
    return localPath;
  }

  return fs.existsSync(localPath) ? localPath : examplePath;
})();

dotenv.config({ path: envPath });

module.exports = { envPath };