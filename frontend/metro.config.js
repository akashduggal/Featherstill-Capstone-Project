const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

console.log('Metro config loaded with custom asset extensions.');

// Add 'bin' to the list of asset extensions
config.resolver.assetExts.push('bin');

module.exports = config;