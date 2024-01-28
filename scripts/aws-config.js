const AWS = require("aws-sdk")

AWS.config.update({
    accessKeyId: process.env.YOUR_ACCESS_KEY_ID,
  secretAccessKey: process.env.YOUR_SECRET_ACCESS_KEY,
  region: "us-east-2",
})


const s3 = new AWS.S3()

module.exports = s3












