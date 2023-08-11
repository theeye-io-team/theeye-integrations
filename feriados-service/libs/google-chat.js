const axios = require("axios")
const config = require('../config/config')

class GCHAT {
    constructor() {
        if(!config.api.gchat || 
            !config.api.gchat.token || 
            !config.api.gchat.key || 
            !config.api.gchat.space || 
            !config.api.gchat.baseUrl) {
            throw new Error('missing gchat config')
        }
        
        this.token = config.api.gchat.token
        this.key = config.api.gchat.key
        this.space = config.api.gchat.space
        this.url = config.api.gchat.baseUrl
            .replace('[token]', this.token)
            .replace('[key]', this.key)
            .replace('[space]', this.space)
    }

    sendMessage = async (message) => {
        if(config.api.gchat.enable) {
            await axios.post(this.url, {
                text: message
            })
        }
    }
}

exports.GCHAT = GCHAT