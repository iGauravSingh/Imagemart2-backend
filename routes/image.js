const express = require('express')
const router = express.Router()
const { prisma } = require("../db");
const multer = require("multer")
const s3 = require('../scripts/aws-config')


const storage = multer.memoryStorage();
const upload = multer({ storage })

router.get('/get/:id',async (req,res) => {
    const id = req.params.id
    //console.log('from backend image',id)
    try {
        const categoryId = parseInt(req.params.id);

        // Check if the category ID is valid
        if (isNaN(categoryId)) {
            return res.status(400).json({ error: 'Invalid category ID' });
        }

        // Find the category by ID
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
            include: {
                images: true, // Include the images related to this category
            },
        });

        // Check if the category exists
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

                // Return the images for the category
                res.json(category.images);
            } catch (error) {
                console.error('Error fetching images:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });
    


router.post('/add', upload.single("file") ,async (req,res) => {
    const { originalname, buffer } = req.file;
    const {imagename, category, size, id } = req.body

    const categoryId = parseInt(id)
    
   // console.log(imagename, category, size)
   if(!imagename || !category || !size || !categoryId) res.status(400).json({error: 'invalid data'})
    const params = {
        Bucket: "imagemart-no1-bucket",
        Key: `images/${imagename}`,
        Body: buffer,
        ContentType: req.file.mimetype,
    }

    try {
        // upload to s3 
        const response = await s3.upload(params).promise();
        

        // Save to PostgreSQL using  Prisma
        if(response.Location){
            const newImage = await prisma.image.create({
                data: {
                    imagename,
                    size,
                    licence: 'Free To Use',
                    link: response.Location,
                    price: 1,
                    category: {
                        connect: { id: categoryId}
                    }
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





