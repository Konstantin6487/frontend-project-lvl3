/* eslint-disable import/no-extraneous-dependencies */
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = () => ({
  module: {
    rules: [
      {
        test: /\.(scss)$/,
        use: [{
          loader: MiniCssExtractPlugin.loader,
        }, {
          loader: 'css-loader',
        }, {
          loader: 'postcss-loader',
          options: {
            plugins() {
              return [
                // eslint-disable-next-line global-require
                require('precss'), require('autoprefixer'),
              ];
            },
          },
        }, {
          loader: 'sass-loader',
        }],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new OptimizeCssAssetsPlugin(),
    new CleanWebpackPlugin(),
  ],
});
