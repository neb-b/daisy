// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
    stream: require.resolve('react-native-stream'),
    'create-hash': require.resolve('react-native-hash'),
}

module.exports = config;
