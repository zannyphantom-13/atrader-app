const { withNativeWind } = require("nativewind/metro");
const { getDefaultConfig } = require("expo/metro-config");
const { withSentryConfig } = require("@sentry/react-native/metro");

const config = getDefaultConfig(__dirname);

config.transformer.babelTransformerPath =
  require.resolve("react-native-svg-transformer");
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== "svg",
);
config.resolver.sourceExts = [...config.resolver.sourceExts, "svg"];

// Limit worker threads to prevent out-of-memory errors on heavy SVG assets
config.maxWorkers = 2;

config.transformer.minifierConfig = {
  compress: {
    drop_console: true, // Remove console.logs
  },
};

const finalConfig = withNativeWind(config, { input: "./app/global.css" });

module.exports = withSentryConfig(finalConfig);
