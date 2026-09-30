import mongoose from 'mongoose';

// Disable query buffering so operations fail fast when the DB is unavailable
// instead of hanging for 10 seconds and timing out with a 500 error
mongoose.set('bufferCommands', false);

let retryTimer = null;
let isConnecting = false;
let retryCount = 0;

const getDatabaseUri = () => {
  return process.env.MONGODB_URI || 'mongodb://localhost:27017/daily-writing';
};

const attemptConnect = async () => {
  if (isConnecting || mongoose.connection.readyState === 1) return;
  isConnecting = true;
  retryCount++;

  const uri = getDatabaseUri();
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    retryCount = 0;
    if (retryTimer) {
      clearInterval(retryTimer);
      retryTimer = null;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`⚠️ MongoDB connection attempt #${retryCount} failed: ${message}`);

    if (retryCount === 1) {
      console.error(
        '👉 If you are using MongoDB Atlas, verify that your current public IP address is added to the IP Access List under "Network Access" in your MongoDB Atlas dashboard (or add 0.0.0.0/0 for development).'
      );
      console.error(
        '   The server will keep retrying every 10 seconds in the background.'
      );
    }

    // Keep retrying periodically in the background so it reconnects automatically once the IP is added
    if (!retryTimer) {
      retryTimer = setInterval(() => {
        if (mongoose.connection.readyState !== 1) {
          attemptConnect();
        } else if (retryTimer) {
          clearInterval(retryTimer);
          retryTimer = null;
        }
      }, 10000);
    }
  } finally {
    isConnecting = false;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Attempting reconnection...');
  if (!retryTimer) {
    retryTimer = setInterval(() => {
      if (mongoose.connection.readyState !== 1) {
        attemptConnect();
      }
    }, 10000);
  }
});

const connectDB = async () => {
  await attemptConnect();
};

export default connectDB;
