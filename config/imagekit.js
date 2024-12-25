const ImageKit = require('imagekit');

const imageKit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_API_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_API_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

module.exports = imageKit;
