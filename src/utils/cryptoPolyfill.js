const getRandomByte = () => Math.floor(Math.random() * 256);

const getRandomValues = (typedArray) => {
  if (!typedArray || typeof typedArray.length !== 'number') {
    throw new TypeError('Expected an integer typed array.');
  }

  for (let index = 0; index < typedArray.length; index += 1) {
    typedArray[index] = getRandomByte();
  }

  return typedArray;
};

const globalScope = globalThis || global;
const cryptoObject = globalScope.crypto || {};

if (typeof cryptoObject.getRandomValues !== 'function') {
  cryptoObject.getRandomValues = getRandomValues;
  globalScope.crypto = cryptoObject;
}
