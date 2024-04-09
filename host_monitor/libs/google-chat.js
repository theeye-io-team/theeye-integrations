const axios = require("axios")
const config = {
    "gchat": {
        "baseUrl": "https://chat.googleapis.com/v1/spaces/[space]/messages?key=[key]&token=[token]",
        "key": process.env.GCHAT_KEY,
        "token": process.env.GCHAT_TOKEN,
        "space": process.env.GCHAT_SPACE,
        "enable": process.env.GCHAT_ENABLE
    }
}

class GCHAT {
    constructor() {
        if(!config.gchat.token || !config.gchat.key || !config.gchat.space || !config.gchat.baseUrl) {
            throw new Error('missing gchat config')
        }
        
        this.token = config.gchat.token
        this.key = config.gchat.key
        this.space = config.gchat.space
        this.url = config.gchat.baseUrl
            .replace('[token]', this.token)
            .replace('[key]', this.key)
            .replace('[space]', this.space)
    }

    sendMessage = async (message) => {
        if(config.gchat.enable) {
            await axios.post(this.url, {
                text: message
            })
        }
    }
}

exports.GCHAT = GCHAT



