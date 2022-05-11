const fs = require('fs');
const path = require('path');
var crypto = require("crypto");
const { getAccount } = require('./accounts');

function imgExists(imgName) {
    let id = (imgName.split('.')[0] || '');
    let ext = (imgName.split('.')[1] || '').toLowerCase();
    if(fs.existsSync(__dirname+'/images/'+id+'.'+ext) && fs.existsSync(__dirname+'/img_data/'+id+'_'+ext+'.json')) return true
    return false
}
function getImg(imgName) {
    let id = (imgName.split('.')[0] || '');
    let ext = (imgName.split('.')[1] || '').toLowerCase();
    if(imgExists(imgName))
        return fs.createReadStream('./images/'+id+'.'+ext);
    else
        return null
}
function getImgAuthor(imgName) {
    let id = (imgName.split('.')[0] || '');
    let ext = (imgName.split('.')[1] || '').toLowerCase();
    if(imgExists(imgName))
        return require('./img_data/'+id+'_'+ext+'.json').owner
    else
        return null
}
function getImgKey(imgName) {
    let id = (imgName.split('.')[0] || '');
    let ext = (imgName.split('.')[1] || '').toLowerCase();
    if(imgExists(imgName))
        return require('./img_data/'+id+'_'+ext+'.json').key
    else
        return null
}
function getImgTimestamp(imgName) {
    let id = (imgName.split('.')[0] || '');
    let ext = (imgName.split('.')[1] || '').toLowerCase();
    if(imgExists(imgName))
        return require('./img_data/'+id+'_'+ext+'.json').timestamp
    else
        return null
}
function createImage(req) {
    if(!fs.existsSync('./images/')) {
        fs.mkdirSync('./images/')
    }
    if(!fs.existsSync('./img_data/')) {
        fs.mkdirSync('./img_data/')
    }

    var id = crypto.randomBytes(6).toString('base64url');
    let ext = fileTypes[req.file.mimetype] || req.file.mimetype.split('/')[1]
    
    while(imgExists(id+'.'+ext)) {
        id = crypto.randomBytes(6).toString('base64url');
    }

    let imgPath = path.resolve(__dirname, 'images', id+'.'+ext)
    fs.writeFileSync(imgPath, req.file.buffer);

    let imgJSON = {
        owner: getAccount(req.body["api_key"]).name,
        key: req.body["api_key"],
        timestamp: new Date().toISOString()
    }
    let jsonPath = path.resolve(__dirname, 'img_data', id+'_'+ext+'.json')
    fs.writeFileSync(jsonPath, JSON.stringify(imgJSON));

    return id+'.'+ext;
}

const fileTypes = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'audio/wav': 'wav',
    'audio/mpeg': 'mp3'
}

module.exports = {
    imgExists,
    getImg,
    getImgAuthor,
    getImgKey,
    getImgTimestamp,
    createImage,
    fileTypes
}