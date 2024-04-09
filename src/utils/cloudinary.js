import {v2 as cloudinary } from "cloudinary";
import fs  from 'fs';
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key:process.env.CLOUDINARY_API_KEY  , 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

//organsing - we'll create a method and will sent the local path as a parameter, then upload and unlink it.

const uploadOnCloudinary = async (localFilePath ) => {
    try {
       if(!localFilePath) return null 
       //upload the file on cloudinary
       const response = await cloudinary.uploader.upload(localFilePath,{
        resource_type:"auto"
       })
       //file has been uploaded successfully
      //console.log("file is uploaded successfully", response.url);
      fs.unlinkSync(localFilePath) //delete the local file after uploading to cloudinary
       return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)//remove the locally saved temp file as the upload as been failed
        return null;
    }

}

export { uploadOnCloudinary };