module.exports = function (api) {
  api.cache(true)
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "react-native-reanimated/plugin",
      [
        "module-resolver",
        {
          alias: {
            components: "./src/components",
            state: "./src/state",
            screens: "./src/screens",
            utils: "./src/utils",
            navigation: "./src/navigation",
            core: "./src/core",
            theme: "./src/theme",
          },
        },
      ],
    ],
  }
}
