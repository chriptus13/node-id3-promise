const NodeID3 = require('node-id3')
const promisify = require('./util')

const { write, create, read, update, removeTags } = NodeID3.constructor.prototype
const functions = { write, create, read, update, removeTags }

Object.entries(functions)
    .forEach(([name, func]) => NodeID3.constructor.prototype[name] = promisify(func))

module.exports = NodeID3