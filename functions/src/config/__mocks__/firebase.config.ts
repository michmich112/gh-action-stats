const collection = jest.fn((collectionName) => ({
  add: jest.fn(async (data) => {
    console.debug(`firestore().collection(${collectionName}).add(${data}) called and mocked`);
  }),
}));


export const admin = {
  firestore: jest.fn(() => ({
    collection,
  })),
};

export const firestore = {
  collection,
};
