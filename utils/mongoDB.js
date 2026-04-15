// utils/mongodb.js

// MongoDB connection
const clientPromise = Promise.resolve({
  db: () => ({
    collection: () => ({
      insertOne: async (doc) => ({ insertedId: 'generated-id' }),
      find: () => ({
        sort: () => ({
          toArray: async () => [],
        }),
      }),
    }),
  }),
});

export default clientPromise;
