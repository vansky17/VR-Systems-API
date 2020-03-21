var aws = require('aws-sdk');
require('dotenv').config(); 
// Configure aws 
const fs = require('fs');
aws.config.update({
  region: 'us-east-2', 
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME 
});

const S3_BUCKET = process.env.S3_BUCKET_NAME;

exports.sign_s3 = (req,res) => {
  const s3 = new aws.S3();  
  const fileName = req.body.fileName;
  const fileType = req.body.fileType;
// Sending to the S3 api
  const s3Params = {
    Bucket: S3_BUCKET,
    Key: fileName + '.' + fileType,
    Expires: 50,
    ContentType: fileType,
    ACL: 'public-read'
  };
// Make a request to the S3 API to get a signed URL which can be used to upload our file
s3.getSignedUrl('putObject', s3Params, (err, data) => {
    if(err){
      res.json({success: false, error: err})
    }
    // Sending back data, the url of the signedRequest and a URL where to access the content after its saved.
    const returnData = {
      signedRequest: data,
      url: `https://${S3_BUCKET}.s3.us-east-2.amazonaws.com/${fileName}.${fileType}`
    };
    res.json({success:true, data:{returnData}});
  });
}