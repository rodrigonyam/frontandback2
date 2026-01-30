const webpack = require('webpack');

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
    setupMiddlewares: (middlewares, devServer) => {
      // Suppress unload event warnings
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }
      
      // Override console.warn to filter out unload warnings
      const originalWarn = console.warn;
      console.warn = (...args) => {
        if (args.some(arg => 
          typeof arg === 'string' && 
          (arg.includes('unload') || arg.includes('beforeunload') || arg.includes('deprecated'))
        )) {
          return;
        }
        originalWarn.apply(console, args);
      };
      
      return middlewares;
    },
  },
};