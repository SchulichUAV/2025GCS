const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
  resolve: {
    fallback: {
      path: require.resolve("path-browserify"),
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      util: require.resolve("util/"),
      zlib: require.resolve("browserify-zlib"),
      stream: require.resolve("stream-browserify"),
      url: require.resolve("url/")
    }
  },
  plugins: [
    new Dotenv({
      path: path.resolve(__dirname, '.env'),
    }),
  ],
};