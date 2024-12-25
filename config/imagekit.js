const ImageKit = require('imagekit');
const environment = process.env.NODE_ENV;

const imageKit = new ImageKit({
    publicKey: environment === 'production' ? process.env.PROD_IMAGEKIT_PUBLIC_API_KEY : process.env.DEV_IMAGEKIT_PUBLIC_API_KEY,
    privateKey: environment === 'production' ? process.env.PROD_IMAGEKIT_PRIVATE_API_KEY : process.env.DEV_IMAGEKIT_PRIVATE_API_KEY,
    urlEndpoint: environment === 'production' ? process.env.PROD_IMAGEKIT_URL_ENDPOINT : process.env.DEV_IMAGEKIT_URL_ENDPOINT,
});

module.exports = imageKit;
