const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Ensure Metro NEVER resolves react-native to our web shim folder
// It should always use the real react-native from node_modules
config.resolver.blockList = [
  /src[\\/]react-native[\\/].*/,
];

module.exports = withNativeWind(config, { input: './index.css' });
