const store = new Map();

module.exports = {
  getItem: jest.fn(async (key) => (store.has(key) ? store.get(key) : null)),
  removeItem: jest.fn(async (key) => {
    store.delete(key);
  }),
  setItem: jest.fn(async (key, value) => {
    store.set(key, value);
  }),
};
