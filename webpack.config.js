const webpackMerge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const template = require('html-webpack-template');

const modeConfig = (env) => {
  // eslint-disable-next-line
  const getConfig = require(`./build-utils/webpack.${env.mode}`);
  return getConfig();
};

module.exports = ({ mode }) => webpackMerge({
  mode,
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-proposal-class-properties'],
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [new HtmlWebpackPlugin({
    inject: false,
    template,
    title: 'RSS reader',
    appMountId: 'root',
    minify: {
      collapseWhitespace: true,
    },
  })],
}, modeConfig({ mode }));
