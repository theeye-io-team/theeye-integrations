const path = require('path')
const Request = require('./req')
const FormData = require('form-data')
const Readable = require('stream').Readable

const BASE_URL = JSON.parse(process.env.THEEYE_API_URL)

class TheEyeFile {
  #props
  #customer
  #access_token

  constructor (props, customer, access_token) {
    this.#props = props
    if(customer) this.#customer = customer
    if(access_token) this.#access_token = access_token
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

  static async Upsert (props, customer, access_token) {
    const files = await TheEyeFile.GetByFilename(props.filename, customer, access_token)
    if (files.length === 0) {
      const file = new TheEyeFile(props, customer, access_token)
      await file.create()
      return file
    } else if (files.length === 1) {
      const updates = Object.assign({}, files[0], props)
      const file = new TheEyeFile(updates, customer, access_token)
      await file.update()
      return file
    }
    throw new Error('not unique')
  }

  static async FetchAll (customer, access_token) {
    const options = {
      url: `${BASE_URL}/${customer || TheEyeFile.customer}/file?access_token=${access_token || TheEyeFile.access_token}`,
      method: 'GET'
    }

    const res = await Request(options)
    return res.body
  }

  static async GetByFilename (filename, customer, access_token) {
    const options = {
      url: `${BASE_URL}/${customer || TheEyeFile.customer}/file?access_token=${access_token || TheEyeFile.access_token}&where\[filename\]=${filename}`,
      method: 'GET'
    }

    const res = await Request(options)
    return res.body
  }

  static async GetById (id, customer, access_token) {
    const options = {
      url: `${BASE_URL}/${customer || TheEyeFile.customer}/file/${id}?access_token=${access_token || TheEyeFile.access_token}`,
      method: 'GET'
    }

    const res = await Request(options)
    return new TheEyeFile(res.body)
  }

  static async Download (id, customer, access_token) {
    const options = {
      url: `${BASE_URL}/${customer || TheEyeFile.customer}/file/${id}/download?access_token=${access_token || TheEyeFile.access_token}`,
      method: 'GET'
    }

    const res = await Request(options)
    return res.body
  }

  static async Delete (id, customer, access_token) {
    const options = {
      url: `${BASE_URL}/${customer || TheEyeFile.customer}/file/${id}?access_token=${access_token || TheEyeFile.access_token}`,
      method: 'DELETE'
    }

    const res = await Request(options)
    return res.body
  }

  async create () {
    
    const options = {
      url: `${BASE_URL}/${this.#customer || TheEyeFile.customer}/file?access_token=${this.#access_token || TheEyeFile.access_token}`,
      method: 'POST',
      formData: this.prepareFormData()
    }

    const res = await Request(options)
    return res.body
  }

  async update () {
    const id = this.#props.id

    const options = {
      url: `${BASE_URL}/${this.#customer || TheEyeFile.customer}/file/${id}?access_token=${this.#access_token || TheEyeFile.access_token}`,
      method: 'PUT',
      formData: this.prepareFormData()
    }

    const res = await Request(options)
    return res.body
  }
}

if(!TheEyeFile.access_token) {
  TheEyeFile.access_token = process.env.THEEYE_ACCESS_TOKEN
}

if(!TheEyeFile.customer) {
  TheEyeFile.customer = JSON.parse(process.env.THEEYE_ORGANIZATION_NAME)
}

module.exports = TheEyeFile
