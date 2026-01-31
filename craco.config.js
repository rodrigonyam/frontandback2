module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Suppress specific webpack warnings
      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings || []),
        /deprecated/i,
        /unload/i
      ];
      return webpackConfig;
    },
  },
  devServer: {
    // Proxy API requests to the backend server
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }
      return middlewares;
    },
  },
};