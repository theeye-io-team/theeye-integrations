const path = require('path')
const Request = require('./req')
const FormData = require('form-data')
const Readable = require('stream').Readable

const BASE_URL = JSON.parse(process.env.THEEYE_API_URL)

class TheEyeFile {
  #props;

  constructor (props) {
    this.#props = props
  }

  set content (content) {
    if (typeof content !== 'string') {
      throw new Error('File content must be string')
    }
    this.#props.content = content
  }

  prepareFormData () {
    let { content, filename, mimetype, description, extension } = this.#props

    const file = new Readable()
    // CONTENT
    file.push(content)
    // EOF
    file.push(null)

    if (!extension) {
      extension = path.extname(path.basename(filename))
    }

    const formData = new FormData()
    formData.append('description', description)
    formData.append('extension', extension)
    formData.append('mimetype', mimetype)
    formData.append('file', file, { filename, mimetype })

    return formData
  }

  static async Upsert (props) {
    const files = await TheEyeFile.GetByFilename(props.filename)
    if (files.length === 0) {
      const file = new TheEyeFile(props)
      await file.create()
      return file
    } else if (files.length === 1) {
      const updates = Object.assign({}, files[0], props)
      const file = new TheEyeFile(updates)
      await file.update()
      return file
    }
    throw new Error('not unique')
  }

  static async FetchAll () {
    const options = {
      url: `${BASE_URL}/${TheEyeFile.customer}/file?access_token=${TheEyeFile.access_token}`,
      method: 'GET'
    }

    const res = await Request(options)
    return res.body
  }

  static async GetByFilename (filename) {
    const token = TheEyeFile.access_token
    const options = {
      url: `${BASE_URL}/${TheEyeFile.customer}/file?access_token=${TheEyeFile.access_token}&where\[filename\]=${filename}`,
      method: 'GET'
    }

    const res = await Request(options)
    return res.body
  }

  static async GetById (id) {
    const options = {
      url: `${BASE_URL}/${TheEyeFile.customer}/file/${id}?access_token=${TheEyeFile.access_token}`,
      method: 'GET'
    }

    const res = await Request(options)
    return new TheEyeFile(res.body)
  }

  static async Download (id) {
    const options = {
      url: `${BASE_URL}/${TheEyeFile.customer}/file/${id}/download?access_token=${TheEyeFile.access_token}`,
      method: 'GET'
    }

    const res = await Request(options)
    return res.body
  }

  static async Delete (id) {
    const options = {
      url: `${BASE_URL}/${TheEyeFile.customer}/file/${id}?access_token=${TheEyeFile.access_token}`,
      method: 'DELETE'
    }

    const res = await Request(options)
    return res.body
  }

  async create () {
    
    const options = {
      url: `${BASE_URL}/${TheEyeFile.customer}/file?access_token=${TheEyeFile.access_token}`,
      method: 'POST',
      formData: this.prepareFormData()
    }

    const res = await Request(options)
    return res.body
  }

  async update () {
    const id = this.#props.id

    const options = {
      url: `${BASE_URL}/${TheEyeFile.customer}/file/${id}?access_token=${TheEyeFile.access_token}`,
      method: 'PUT',
      formData: this.prepareFormData()
    }

    const res = await Request(options)
    return res.body
  }
}

module.exports = TheEyeFile
