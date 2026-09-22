import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }

  // The initial connect is the only one that gets a process.exit. After that the
  // driver reconnects on its own, and killing a live server over a transient
  // network blip would turn a few failed requests into an outage — but the
  // events still need somewhere to go, or a database that has been unreachable
  // for an hour looks exactly like one that is fine.
  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️  MongoDB disconnected — the driver will keep retrying");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("✅ MongoDB reconnected");
  });
};

export default connectDB;
