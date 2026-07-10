export default ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins || []),
    [
      'expo-build-properties',
      { android: { newArchEnabled: false }, ios: { newArchEnabled: false } }
    ]
  ],
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY",
      },
    },
  },
});
