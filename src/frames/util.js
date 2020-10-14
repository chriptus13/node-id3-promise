const iconv = require('iconv-lite')

function encodeText(text, encoding) {
    return iconv.encode(text, encoding)
}

function decodeText(text, encoding, from, to) {
    return iconv.decode(text, encoding).substring(from, to).replace(/\0/g, '')
}

module.exports = { encodeText, decodeText }