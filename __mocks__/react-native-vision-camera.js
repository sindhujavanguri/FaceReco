const React = require('react');
const {View} = require('react-native');

module.exports = {
  Camera: props => React.createElement(View, props),
  useCameraDevice: () => ({id: 'front-camera', position: 'front'}),
  useCameraPermission: () => ({
    hasPermission: false,
    requestPermission: jest.fn(async () => true),
  }),
};
