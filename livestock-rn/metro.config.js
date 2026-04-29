const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  ...config.resolver.alias,
  "react-native-linear-gradient": "expo-linear-gradient",
};

module.exports = withNativeWind(config, { input: "./global.css" });
