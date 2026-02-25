const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable Node.js externals completely to avoid Windows path issues
config.resolver = {
  ...config.resolver,
  platforms: ['web', 'native', 'ios', 'android'],
  alias: {
    '@': './src',
    '@/components': './src/components',
    '@/screens': './src/screens',
    '@/utils': './src/utils',
    '@/types': './src/types',
    '@/hooks': './src/hooks',
    '@/store': './src/store',
    '@/constants': './src/constants',
    '@/contexts': './src/contexts',
    '@/navigation': './src/navigation',
    '@/assets': './assets',
  },
};

// Completely disable server-side externals to prevent node:sea error
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Bypass externals handling for Windows compatibility
      if (req.url && req.url.includes('node:')) {
        res.statusCode = 404;
        res.end();
        return;
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;