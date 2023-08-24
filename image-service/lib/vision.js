// use GOOGLE_APPLICATION_CREDENTIALS to load service account
const config = require('../config/config.json')
process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS || config.service_account.path

const Vision = require('@google-cloud/vision')
const vision = new Vision.ImageAnnotatorClient()

const main = module.exports = async (base64) => {

    console.log(`processing file`)

    const request = {
        image: { content: base64 },
        features: [{
            type: "DOCUMENT_TEXT_DETECTION",
            model: (process.env.GOOGLE_VISION_MODEL || null)
        }]
    }

    return await vision.annotateImage(request)
}

if (require.main === module) {
    const base64 = ''
    main(process.argv[2] || base64).then(console.log).catch(console.error)
}
