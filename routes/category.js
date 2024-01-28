const express = require('express')
const router = express.Router()
const { prisma } = require("../db");
const multer = require("multer")
const s3 = require('../scripts/aws-config')


const storage = multer.memoryStorage();
const upload = multer({ storage })

router.get('/list',async (req,res) => {
    //console.log('from backend category')
    const allcategory = await prisma.category.findMany()
    //console.log(allcategory)
    res.send(allcategory)
})

router.post('/add', upload.single("file") ,async (req,res) => {
    const { originalname, buffer } = req.file;
    const {categoryname, categorytype } = req.body

    const params = {
        Bucket: "imagemart-no1-bucket",
        Key: `images/${categorytype}`,
        Body: buffer,
        ContentType: req.file.mimetype,
    }

    try {
        // upload to s3 
        const response = await s3.upload(params).promise();
        

        // Save to PostgreSQL using  Prisma
        if(response.Location){
            const newCategory = await prisma.category.create({
                data: {
                    categoryname,
                    categorytype,
                    coverimage: response.Location,
                }
            })
            res.json({created: "ok"})
        }  else {
            res.json({ err: 'Something went wrong!' });
        }


        //res.send(data.Location) 
    } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
})

module.exports = router





