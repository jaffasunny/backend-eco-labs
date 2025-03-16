import cloudinary from 'cloudinary';
import 'dotenv/config';
import connectDB from './db/index.js';
import { app } from './app.js';

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLIENT_NAME as string,
      api_key: process.env.CLOUDINARY_API_KEY as string,
      api_secret: process.env.CLOUDINARY_API_SECRET as string,
    });

    app.listen(PORT, () => {
      console.log(`Server is running at port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.log('MONGO db connection failed !!!', err);
    throw err;
  });
