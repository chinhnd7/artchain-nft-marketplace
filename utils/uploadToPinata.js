const pinataSDK = require("@pinata/sdk")
const path = require("path")
const fs = require("fs")
require("dotenv").config()

const pinataApiKey = process.env.PINATA_API_KEY
const pinataApiSecret = process.env.PINATA_API_SECRET
const pinata = new pinataSDK(pinataApiKey, pinataApiSecret)

async function storeImages(imagesFilePath) {
    console.log("imagesFilePath", imagesFilePath)
    const fullImagesPath = path.resolve(imagesFilePath)
    console.log("imagesFilePath", imagesFilePath)

    // Filter the files in case the are a file that in not a .png
    const files = fs.readdirSync(fullImagesPath).filter((file) => file.includes(".png"))

    let responses = [] // list response
    console.log("Uploading to Pinata!")
    for (fileIndex in files) {
        console.log(`Working on ${fileIndex}...`)
        const readableStreamForFile = fs.createReadStream(`${fullImagesPath}/${files[fileIndex]}`)
        const options = {
            pinataMetadata: {
                name: files[fileIndex],
            },
        }
        try {
            await pinata
                .pinFileToIPFS(readableStreamForFile, options)
                .then((result) => {
                    responses.push(result)
                })
                .catch((err) => {
                    console.log(err)
                })
        } catch (error) {
            console.log(error)
        }
    }
    return{responses, files}
}

async function storeTokenUriMetadata(metadata) {
    const options = {
        pinataMetadata: {
            name: metadata.name,
        },
    }
    try {
        const response = await pinata.pinJSONToIPFS(metadata, options)
        return response
    } catch (error) {
        console.log(error)
    }
    return null
}

async function getFolderImages(imagesLocation) {
    return new Promise((resolve, reject) => {
        fs.readdir(imagesLocation, (err, files) => {
            if (err) {
                console.error('Error reading directory:', err)
                return;
            }  
            // Lọc ra các thư mục từ danh sách các tệp và thêm đường dẫn
            const folderPaths = files
            .filter(file => fs.statSync(path.join(imagesLocation, file)).isDirectory())
            .map(folder => path.join(imagesLocation, folder))
  
            resolve(folderPaths)
        })
    })
}

module.exports = {storeImages, storeTokenUriMetadata, getFolderImages}