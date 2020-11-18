module.exports = {
    configureWebpack: {
      devtool: process.env.NODE_ENV != 'production' ? 'eval-source-map' : '',
    }
  }