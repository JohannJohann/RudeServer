const path = require('path');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")


module.exports = {
  entry: './src/server.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new NodePolyfillPlugin()
    ],
  target: "node"
};