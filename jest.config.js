module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '^react-native-vision-camera$':
      '<rootDir>/__mocks__/react-native-vision-camera.js',
    '^react-native-blob-util$':
      '<rootDir>/__mocks__/react-native-blob-util.js',
    '^@regulaforensics/face-sdk$':
      '<rootDir>/__mocks__/@regulaforensics-face-sdk.js',
    '^@react-native-community/geolocation$':
      '<rootDir>/__mocks__/@react-native-community-geolocation.js',
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/__mocks__/@react-native-async-storage-async-storage.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-community|@reduxjs/toolkit|redux|immer|reselect)/)',
  ],
};
