import cloudinary from 'cloudinary';
import DataURIParser from 'datauri/parser';

export const uploadCloudinary = async (fileUri: DataURIParser) => {
  const mycloud = await cloudinary.v2.uploader.upload(
    fileUri.content as string
  );

  return mycloud;
};

export const generatePassword = () => {
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$!';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
};
