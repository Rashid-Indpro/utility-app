module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./'],
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
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
        },
      ],
    ],
  };
};