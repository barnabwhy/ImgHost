const express = require('express');
const path = require('path');
const fs = require('fs');
const multer  = require('multer')

const app = express();
const port = 80;

const httpServer = require('http').createServer(app);

const { imgExists, getImg, getImgAuthor, getImgTimestamp, createImage, getImgKey } = require('./imgDb.js');
const { accountExists, getAccountCount } = require('./accounts.js')

const upload = multer({
    limits: {
        files: 1,
        fileSize: 1024 * 1024 * 50, // 50MB max file size
    },
    storage: multer.memoryStorage(), 
})

app.get('/', (req, res) => {
    res.sendFile(__dirname+'/index.html');
})
app.get('/api/report', async (req, res) => {
    res.send("Report function being constructed")
})
const fastFolderSizeSync = require('fast-folder-size/sync')
app.get('/api/stats', async (req, res) => {
    let json = {
        users: getAccountCount(),
        bytes: fastFolderSizeSync('./images'),
        count: fs.readdirSync('./images').length
    }
    res.json(json)
})
app.post('/api/upload', async (req, res) => {
    upload.single('image')(req, res, function (err) {
        if(!req.body || !accountExists(req.body["api_key"]))
            return res.sendStatus(401)

        if (err) {
            return res.sendStatus(500)
        }
        
        if(req.file == undefined || !req.file.mimetype.startsWith("image/")) {
            return res.sendStatus(400)
        }
        let filename = createImage(req);

        res.send(req.protocol+'://'+req.hostname+'/'+filename)
    })
})
app.delete('/api/delete/:filename', upload.none(), async (req, res) => {
    let imgName = req.params.filename;
    if(imgExists(imgName)) {
        if(!req.body || req.body["api_key"] != getImgKey(imgName))
            return res.sendStatus(401);
        
        let id = (imgName.split('.')[0] || '').toLowerCase();
        let ext = (imgName.split('.')[1] || '').toLowerCase();

        let imgPath = path.join(__dirname, 'images', id+'.'+ext)
        let jsonPath = path.join(__dirname, 'img_data', id+'_'+ext+'.json')
        fs.unlinkSync(imgPath)
        fs.unlinkSync(jsonPath)
        res.sendStatus(200)
    } else {
        res.sendStatus(404)
    }
})
app.delete('/api/nuke', upload.none(), async (req, res) => {
    if(!req.body || !accountExists(req.body["api_key"]))
        return res.sendStatus(401);
    
    let files = fs.readdirSync('./images');
    for (let file of files) {
        let id = file.split('.')[0];
        let ext = file.split('.')[1];

        let imgPath = path.join(__dirname, 'images', id+'.'+ext)
        let jsonPath = path.join(__dirname, 'img_data', id+'_'+ext+'.json')

        let imgJSON = require(jsonPath);
        if(imgJSON.key == req.body["api_key"]) {
            fs.unlinkSync(imgPath)
            fs.unlinkSync(jsonPath)
        }
    }
    res.sendStatus(200)
})

app.get('/*', async (req, res) => {
    let imgName = req.path.split('/')[1];
    if(imgExists(imgName)) {
        let author = getImgAuthor(imgName);
        let timestamp = getImgTimestamp(imgName);
        res.setHeader("Img-Author", author);
        res.setHeader("Img-Timestamp", timestamp);
        res.setHeader("Img-Report-URL", (req.protocol+'://'+req.hostname+'/api/report?id='+imgName) );
        return getImg(imgName).pipe(res);
    }
    res.send('No image found');
})

httpServer.listen(port, () => {
  console.log(`ShortImgHost listening on port ${port}`);
})