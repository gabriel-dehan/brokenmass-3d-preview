module.exports = {
  entry: __dirname + '/src/index.js',
  output: {
    path: __dirname + '/dist',
    publicPath: '/dist/',
    filename: 'bundle.js',
    library: {
      name: 'Brokenmass3DPreview',
      export: 'default',
      type: 'umd',
    },
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: 'babel-loader',
    }],
  },
  devServer: {
    port: 8080,
    static: require('path').join(__dirname, 'example'),
    open: false,
    hot: true,
  },
};
