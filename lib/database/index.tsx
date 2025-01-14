import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

const cached = (global as any).mongoose || { conn: null, promise: null };

export const connectToDatabase = async () => {
  if (cached.conn) return cached.conn;

  if (!MONGODB_URI) throw new Error("MONGODB_URI is missing");

  cached.promise =
    cached.promise ||
    mongoose.connect(MONGODB_URI, {
      dbName: "evently",
      bufferCommands: false,
    });

  cached.conn = await cached.promise;

  return cached.conn;
};

// we are caching our connection to the database here, so that each new server acrtions -> call to sb -> does not create a
// new connection to the database. This is a good practice, as it can save a lot of server resources, and thus prevent it from getting exhausted

// basically now with serverless acions, we don't have constantly running servers anymore, and connections to the database are only made when required,
// thus it's important to check for any existing connections before creating a new one. This is what we are doing here.
// if an existing connection is already present we can leverage that to make a db call.
