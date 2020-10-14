const fs = require('fs').promises
const {
    getTagsFromBuffer,
    removeTagsFromBuffer,
    createTagHeader,
    createBuffersFromTags,
} = require('./frames')

module.exports = {
    read,
    write,
    removeTags,
}

// Read
function read(filePath) {
    return fs.readFile(filePath)
        .then(getTagsFromBuffer)
}

// Write
async function write(tags, filePath) {
    const completeTag = await createTags(tags)
    const fileOldTags = await fs.readFile(filePath)
    const file = await removeTagsFromBuffer(fileOldTags)
    const fileTags = Buffer.concat([completeTag, file])
    await fs.writeFile(filePath, fileTags, 'binary')
}

// Remove
async function removeTags(filePath) {
    const fileTags = await fs.readFile(filePath)
    const file = await removeTagsFromBuffer(fileTags)
    await fs.writeFile(filePath, file, 'binary')
}

const imgTags = ['image', 'APIC', 'PIC']

async function createTags(tags) {
    // workaround in case the image tag is a path for the image instead of an image Buffer
    const toReplace = await Promise.all(
        imgTags
            .map(key => [key, tags[key]])
            .filter(([_, value]) => value !== undefined && !Buffer.isBuffer(value))
            .map(([key, imgPath]) => Promise.all([key, fs.readFile(imgPath, 'binary')]))
    )
    toReplace.forEach(([key, imgData]) => tags[key] = Buffer.from(imgData, 'binary'))

    // ID3 body frames
    const buffers = createBuffersFromTags(tags)

    //  Calculate frame size of ID3 body to insert into header
    const totalSize = buffers.map(buffer => buffer.length).reduce((acc, curr) => acc + curr, 0)

    //  Header for the ID3-Frame
    const header = createTagHeader(totalSize)

    return Buffer.concat([header, ...buffers])
}