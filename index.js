const express = require('express')
const cors = require('cors')


const app = express()

app.use(express.json())
app.use(cors())

app.get("/", (req,res)=> {
    return res.send('Hello There!!')
})

app.use("/auth", require("./routes/auth"))
app.use('/category', require('./routes/category'))
app.use('/image', require('./routes/image'))
// app.use("", require("./routes/movies"))
// app.use("/auth", require("./routes/auth"))
// app.use("/sub", require("./routes/sub"))

app.listen(8080, ()=> {
    console.log('listening on port 8080')
})




