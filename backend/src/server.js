import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { Otp } from "./models/otp.model.js";
import app from "./app.js";

const start = async () => {
  await connectDB();
  await Otp.syncIndexes();

  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
};

start();
