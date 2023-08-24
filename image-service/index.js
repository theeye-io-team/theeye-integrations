const vision = require('./lib/vision')

const main = module.exports = async (base64, {regexp}) => {
    const [annotation]= await vision(base64)

    const result = {
        annotation,
        fullText: annotation.fullTextAnnotation.text
    }

    if(regexp) {
        const fullText = result.annotation.fullTextAnnotation.text
        
        const pattern = regexp.pattern || ''
        const options = regexp.options || ''

        result.valid = new RegExp(pattern, options).test(fullText)
    }

    return result
}

if(require.main === module) {
    const base64 = ''
    
    const opt = {
        regexp: {
            pattern: '^\d{6}$',
            options: 'gi'
        }
    }

    main(base64, opt).then(console.log).catch(console.error)
}