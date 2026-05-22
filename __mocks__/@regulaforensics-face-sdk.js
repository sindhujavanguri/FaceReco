const ImageType = {
  PRINTED: 0,
  RFID: 1,
  LIVE: 2,
  DOCUMENT_WITH_LIVE: 3,
  EXTERNAL: 4,
  GHOST_PORTRAIT: 5,
  BARCODE: 6,
};

class MatchFacesImage {
  constructor(image, imageType, params = {}) {
    this.image = image;
    this.imageType = imageType;
    this.detectAll = params.detectAll || false;
  }
}

class MatchFacesRequest {
  constructor(images) {
    this.images = images;
  }
}

const FaceSDK = {
  instance: {
    initialize: jest.fn(async () => [true, null]),
    matchFaces: jest.fn(async () => ({
      error: null,
      results: [{similarity: 0.99}],
    })),
    splitComparedFaces: jest.fn(async (results, threshold) => ({
      matchedFaces: (results || []).filter(
        (result) => Number(result.similarity || 0) >= threshold,
      ),
    })),
  },
};

module.exports = {
  FaceSDK,
  ImageType,
  MatchFacesImage,
  MatchFacesRequest,
};
