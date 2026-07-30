import { v2 as cloudinary } from 'cloudinary';

import fs from 'fs';    //file read write remove operations. fs= file system



// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});



// Uploads Image file to Cloudinary
const uploadImageToCloudinary = async (LocalFilePath) => {
  try {
    //check if file is locally available
    if (!LocalFilePath) return null;

    //uploasd to cloudinary
    const response = await cloudinary.uploader.upload(LocalFilePath, {
      folder: "ecommerce/product-variants-images",   //folder create if no exist in cloudinary
      resource_type: "auto",  //jpeg, png, pdf, doc, mp4
      chunk_size: 6 * 1024 * 1024 //6MB
    })



    //console.log("File uploaded to Cloudinary successfully", response.url);
    fs.unlinkSync(LocalFilePath);  //remove file from local storage
    return response;

  } catch (error) {
    fs.unlinkSync(LocalFilePath);  //remove file from local storage if error occurs during upload
    console.error("Error uploading file to Cloudinary", error);
    return null;

  }
}


/**
 * Delete an image from Cloudinary using its public ID or full URL
 * @param {string} publicIdOrUrl - Cloudinary public_id or image URL
 * @returns {Promise<object>}
 */

const deleteImageFromCloudinary = async (publicIdOrUrl) => {
  try {
    if (!publicIdOrUrl) return null;

    let publicId = publicIdOrUrl;

    if (publicIdOrUrl.startsWith("http")) {
      const url = new URL(publicIdOrUrl);

      // pathname:
      // /demo/image/upload/v1753988200/ecommerce/product-variants/5/qxw7h8j9.png

      const uploadIndex = url.pathname.indexOf("/upload/");

      publicId = url.pathname.substring(uploadIndex + 8);

      // remove version
      publicId = publicId.replace(/^v\d+\//, "");

      // remove extension
      publicId = publicId.replace(/\.[^.]+$/, "");
    }

    console.log("Deleting:", publicId);

    const result = await cloudinary.uploader.destroy(publicId);

    console.log(result);

    return result;

  } catch (error) {
    console.error(error);
    return null;
  }
};


// Uploads mp4 file to Cloudinary
const uploadVideoToCloudinary = async (LocalFilePath) => {
  try {
    //check if file is locally available
    if (!LocalFilePath) return null;

    //uploasd to cloudinary
    const response = await cloudinary.uploader.upload(LocalFilePath, {
      folder: "ecommerce/product-videos",   //folder create if no exist in cloudinary
      resource_type: "auto",  //jpeg, png, pdf, doc, mp4
      chunk_size: 6 * 1024 * 1024 //6MB
    })



    //console.log("File uploaded to Cloudinary successfully", response.url);
    fs.unlinkSync(LocalFilePath);  //remove file from local storage
    return response;

  } catch (error) {
    fs.unlinkSync(LocalFilePath);  //remove file from local storage if error occurs during upload
    console.error("Error uploading file to Cloudinary", error);
    return null;

  }
}


/**
 * Delete an image from Cloudinary using its public ID or full URL
 * @param {string} publicIdOrUrl - Cloudinary public_id or image URL
 * @returns {Promise<object>}
 */

const deleteVideoFromCloudinary = async (publicIdOrUrl) => {
  try {
    if (!publicIdOrUrl) return null;

    let publicId = publicIdOrUrl;

    if (publicIdOrUrl.startsWith("http")) {
      const url = new URL(publicIdOrUrl);

      // pathname:
      // /demo/image/upload/v1753988200/ecommerce/product-variants/5/qxw7h8j9.png

      const uploadIndex = url.pathname.indexOf("/upload/");

      publicId = url.pathname.substring(uploadIndex + 8);

      // remove version
      publicId = publicId.replace(/^v\d+\//, "");

      // remove extension
      publicId = publicId.replace(/\.[^.]+$/, "");
    }

    console.log("Deleting:", publicId);

    const result = await cloudinary.uploader.destroy(publicId);

    console.log(result);

    return result;

  } catch (error) {
    console.error(error);
    return null;
  }
};

export {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
  uploadVideoToCloudinary,
  deleteVideoFromCloudinary
};


