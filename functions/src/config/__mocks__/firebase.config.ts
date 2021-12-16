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

export const storage = {
  bucket: (name?: string) => ({
    file: (path: string) => ({
      save: async (file: string, options: any) => ({}),
      download: async (location?: string) => ["data"],
      exists: async (path: string) => [true],
    }),
  }),
};
