module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '^react-native-vision-camera$':
      '<rootDir>/__mocks__/react-native-vision-camera.js',
    '^react-native-blob-util$':
      '<rootDir>/__mocks__/react-native-blob-util.js',
    '^@react-native-community/geolocation$':
      '<rootDir>/__mocks__/@react-native-community-geolocation.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-community|@reduxjs/toolkit|redux|immer|reselect)/)',
  ],
};
