const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const JavaScriptObfuscator = require('webpack-obfuscator');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env = {}, argv) => {
  const isProduction = argv.mode === 'production';
  const shouldObfuscate = env.obfuscate === 'true';
  
  console.log(`🔧 Building in ${argv.mode} mode${shouldObfuscate ? ' with obfuscation' : ''}`);

  const config = {
    // Entry points - ana JS dosyaları
    entry: {
      'popup': './popup.js',
      'content': './content.js', 
      'background': './background.js',
      'theme-manager': './theme-manager.js'
    },
    
    // Output configuration
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true
    },

    // Development configuration
    mode: argv.mode,
    devtool: isProduction ? false : 'source-map', // Source maps sadece development'ta
    
    plugins: [
      // Static dosyaları kopyala
      new CopyPlugin({
        patterns: [
          { from: 'popup.html', to: 'popup.html' },
          { from: 'manifest.json', to: 'manifest.json' },
          { from: 'locale.js', to: 'locale.js' },
          { from: 'themes.css', to: 'themes.css' },
          { from: 'styles.css', to: 'styles.css' },
          { from: 'coffee-styles.css', to: 'coffee-styles.css' },
          { from: 'images', to: 'images', noErrorOnMissing: true },
          { from: 'README.md', to: 'README.md' }
        ],
      }),
    ],

    optimization: {
      minimize: isProduction,
      minimizer: isProduction ? [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: shouldObfuscate, // Console.log'ları sadece obfuscated build'de kaldır
              drop_debugger: true,
              pure_funcs: shouldObfuscate ? ['console.log', 'console.info', 'console.debug'] : []
            },
            mangle: {
              reserved: ['chrome', 'window', 'document', 'themeManager'] // Bu global'ları karıştırma
            },
            format: {
              comments: false
            }
          },
          extractComments: false
        })
      ] : []
    },

    // Resolve configuration
    resolve: {
      extensions: ['.js']
    },

    // Performance hints
    performance: {
      hints: false // Chrome extension için performance uyarılarını kapat
    }
  };

  // Obfuscation plugin'ini sadece gerektiğinde ekle
  if (shouldObfuscate) {
    console.log('🔐 Adding obfuscation...');
    config.plugins.push(
      new JavaScriptObfuscator({
        // String obfuscation
        rotateStringArray: true,
        stringArray: true,
        stringArrayEncoding: ['base64'],
        stringArrayIndexShift: true,
        stringArrayRotate: true,
        stringArrayShuffle: true,
        splitStrings: true,
        splitStringsChunkLength: 5,
        
        // Control flow obfuscation
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        
        // Variable name obfuscation
        identifierNamesGenerator: 'hexadecimal',
        renameGlobals: false,
        
        // Advanced protection
        selfDefending: true,
        compact: true,
        transformObjectKeys: true,
        unicodeEscapeSequence: false,
        
        // Performance optimization
        disableConsoleOutput: true,
        
        // Debugging protection
        debugProtection: false, // Chrome extension'da sorun çıkarabilir
        
      }, ['locale.js']) // locale.js'yi obfuscate etme (çeviri dosyası)
    );
  }

  return config;
}; 