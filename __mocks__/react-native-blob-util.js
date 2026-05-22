const response = {
  base64: () => 'ZmFrZS1pbWFnZQ==',
  info: () => ({headers: {}, status: 200}),
  path: () => '/tmp/mock-file.pdf',
  text: async () => '{}',
};

const RNBlobUtil = {
  config: () => RNBlobUtil,
  fetch: jest.fn(async () => response),
  fs: {
    dirs: {
      DocumentDir: '/tmp',
      DownloadDir: '/tmp',
    },
    readFile: jest.fn(async () => 'ZmFrZS1pbWFnZQ=='),
  },
  ios: {
    openDocument: jest.fn(),
  },
  wrap: (path) => path,
};

module.exports = RNBlobUtil;
