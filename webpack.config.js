const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = ({ mode }) => ({
  mode,
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
        exclude: /node_modules/,
      },
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
    new HtmlWebpackPlugin({
      template: 'template.html',
      title: 'RSSPreview',
      minify: {
        collapseWhitespace: true,
      },
    }),
    new MiniCssExtractPlugin(),
    new OptimizeCssAssetsPlugin(),
  ].concat(mode === 'production' ? new CleanWebpackPlugin() : []),
  devtool: 'eval-source-map',
});
