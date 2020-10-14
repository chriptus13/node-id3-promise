const { encodeText, decodeText } = require('./util')
const { TFrames, TFramesV220 } = require('./TFrames')
const { SFrames, SFramesV220 } = require('./SFrames')
const { WFrames, WFramesV220 } = require('./WFrames')
const { not, isUndefined } = require('../util')

module.exports = {
    getTagsFromBuffer,
    removeTagsFromBuffer,
    createTagHeader,
    createBuffersFromTags,
    getTagsFromFrames,
    getFramesFromID3Body
}

function removeTagsFromBuffer(data) {
    const framePosition = getFramePosition(data)
    if (framePosition === -1) return data

    const hSize = Buffer.from([data[framePosition + 6], data[framePosition + 7], data[framePosition + 8], data[framePosition + 9]])

    //  Invalid tag size (msb not 0)
    if ((hSize[0] | hSize[1] | hSize[2] | hSize[3]) & 0x80) return false

    return data.slice(framePosition + decodeSize(hSize) + 10)
}

function getFrameSize(buffer, decode, ID3Version) {
    const decodeBytes = buffer.slice(ID3Version > 2 ? 4 : 3, ID3Version > 2 ? 8 : 6)
    return decode ? decodeSize(decodeBytes) : decodeBytes.readUIntBE(0, decodeBytes.length)
}

function getFramePosition(filebuffer) {
    const framePosition = filebuffer.indexOf('ID3')
    return framePosition === -1 || framePosition > 20 ? -1 : framePosition
}

function decodeSize(hSize) {
    return (hSize[0] << 21) + (hSize[1] << 14) + (hSize[2] << 7) + (hSize[3])
}

function getTagsFromBuffer(filebuffer) {
    const framePosition = getFramePosition(filebuffer)
    if (framePosition === -1) return {}

    const ID3Header = Buffer.from(filebuffer.toString('hex', framePosition, framePosition + 10), 'hex')
    const frameSize = decodeSize(ID3Header.slice(6, 10)) + 10
    const ID3Frame = Buffer.alloc(frameSize + 1)
    const ID3FrameBody = Buffer.alloc(frameSize - 10 + 1)
    filebuffer.copy(ID3Frame, 0, framePosition)
    filebuffer.copy(ID3FrameBody, 0, framePosition + 10)

    //ID3 version e.g. 3 if ID3v2.3.0
    const ID3Version = ID3Frame[3]
    const identifierSize = ID3Version === 2 ? 3 : 4
    const textframeHeaderSize = ID3Version === 2 ? 6 : 10

    const frames = getFramesFromID3Body(ID3FrameBody, ID3Version, identifierSize, textframeHeaderSize)
    return getTagsFromFrames(frames, ID3Version)
}

function getFramesFromID3Body(ID3FrameBody, ID3Version, identifierSize, textframeHeaderSize) {
    let currentPosition = 0
    const frames = []
    while(currentPosition < ID3FrameBody.length && ID3FrameBody[currentPosition] !== 0x00) {
        const frame = extractFrame(ID3FrameBody, ID3Version, identifierSize, textframeHeaderSize, currentPosition)
        frames.push(frame)
        
        //  Size of sub frame + its header
        currentPosition += frame.size + textframeHeaderSize
    }
    return frames
}

function extractFrame(ID3FrameBody, ID3Version, identifierSize, textframeHeaderSize, currentPosition) {
    const bodyFrameHeader = Buffer.alloc(textframeHeaderSize)
    ID3FrameBody.copy(bodyFrameHeader, 0, currentPosition)

    const decodeSize = ID3Version === 4
    const bodyFrameSize = getFrameSize(bodyFrameHeader, decodeSize, ID3Version)
    if (bodyFrameSize > ID3FrameBody.length - currentPosition) return

    const bodyFrameBuffer = Buffer.alloc(bodyFrameSize)
    ID3FrameBody.copy(bodyFrameBuffer, 0, currentPosition + textframeHeaderSize)

    return {
        name: bodyFrameHeader.toString('utf8', 0, identifierSize),
        body: bodyFrameBuffer,
        size: bodyFrameSize
    }
}

function getTagsFromFrames(frames, ID3Version) {
    const tags = frames.map(decodeFrame.bind(null, ID3Version))
        .filter(not(isUndefined))
        .filter(({ decoded }) => decoded !== undefined)
        .reduce((acc, { decoded, frameName, frameKey, multiple }) => {
            if (multiple) {
                if (!acc[frameKey]) acc[frameKey] = []
                if (!acc.raw[frameName]) acc.raw[frameName] = []
                acc.raw[frameName].push(decoded)
                acc[frameKey].push(decoded)
            } else {
                acc.raw[frameName] = decoded
                acc[frameKey] = decoded
            }
            return acc
        }, { raw: {} })

    return tags
}

function decodeFrame(ID3Version, frame) {
    const frameName = frame.name
    if (frameName[0] === 'T' && frameName !== 'TXXX') {    // Text frame
        const versionFrames = ID3Version == 2 ? TFramesV220 : TFrames
        const entry = Object.entries(versionFrames).find(([_, value]) => value === frameName)
        if (entry)
            return {
                decoded: decodeText(
                    frame.body.slice(1),
                    frame.body[0] === 0x01  // encoding byte
                        ? 'utf16'
                        : 'ISO-8859-1'
                ),
                frameKey: entry[0],
                frameName
            }
    } else if (frameName[0] === 'W' && frameName !== 'WXXX') {    // Url frame
        const versionFrames = ID3Version == 2 ? WFramesV220 : WFrames
        const entry = Object.entries(versionFrames).find(([_, value]) => value.name === frameName)
        if (entry) {
            const [frameKey, value] = entry
            //  URL fields contain no encoding byte and are always ISO-8859-1 as per spec
            return {
                decoded: decode(frame.body, 'ISO-8859-1'),
                frameKey,
                frameName,
                multiple: value.multiple
            }
        }
    } else {    // Other frame
        const versionFrames = ID3Version == 2 ? SFramesV220 : SFrames
        const entry = Object.entries(versionFrames).find(([_, value]) => value.name === frameName)
        if (entry) {
            const [frameKey, value] = entry
            return {
                decoded: value.read(frame.body, ID3Version),
                frameKey,
                frameName,
                multiple: value.multiple
            }
        }
    }
}

/*
**  Create header for ID3-Frame v2.3.0
*/
function createTagHeader(size) {
    const header = Buffer.alloc(10, 0)
    header.write('ID3', 0)              //File identifier
    header.writeUInt16BE(0x0300, 3)     //Version 2.3.0  --  03 00
    header.writeUInt16BE(0x0000, 5)     //Flags 00

    const encSize = encodeSize(size)

    header.writeUInt8(encSize[0], 6)
    header.writeUInt8(encSize[1], 7)
    header.writeUInt8(encSize[2], 8)
    header.writeUInt8(encSize[3], 9)

    return header
}

function encodeSize(size) {
    const byte_3 = size & 0x7F
    const byte_2 = (size >> 7) & 0x7F
    const byte_1 = (size >> 14) & 0x7F
    const byte_0 = (size >> 21) & 0x7F
    return [byte_0, byte_1, byte_2, byte_3]
}

function createBuffersFromTags(tags) {
    return Object.entries(tags)
        .map(([tagName, value]) => ({ tagName, value }))
        .map(createFrame)
        .filter(Buffer.isBuffer)
}

function createFrame(tag) {
    const { tagName, value } = tag
    if (TFrames[tagName] || Object.values(TFrames).indexOf(tagName) !== -1) {
        const tagKey = TFrames[tagName] || tagName
        return createTextFrame(tagKey, value)
    } else if (WFrames[tagName] || Object.values(WFrames).map(x => x.name).indexOf(tagName) !== -1) {
        const tagKey = WFrames[tagName] ? WFrames[tagName].name : tagName
        const multiple = WFrames[Object.keys(WFrames)[Object.values(WFrames).map(x => x.name).indexOf(tagKey)]].multiple
        const valueArr = multiple && Array.isArray(value) ? value : [value]

        return Buffer.concat([...new Set(valueArr)].map(createUrlFrame.bind(null, tagKey)))
    } else if (SFrames[tagName]) {  //  Check if Alias of special frame
        return SFrames[tagName].create(value)
    } else if (Object.values(SFrames).map(x => x.name).indexOf(tagName) !== -1) {  //  Check if ID of special frame
        //  get create function from special frames where tag ID is found at SFrame[index].name
        const create = SFrames[Object.keys(SFrames)[Object.values(SFrames).map(x => x.name).indexOf(tagName)]].create
        return create(value)
    }
}

function createTextFrame(tagKey, data) {
    if (!tagKey || !data) return

    const encoded = encodeText(data, 'utf16')

    const header = Buffer.alloc(10, 0)
    header.write(tagKey, 0)                     //  ID of the specified frame
    header.writeUInt32BE(encoded.length + 1, 4) //  Size of frame (string length + encoding byte)
    const encBuffer = Buffer.alloc(1, 1)        //  Encoding (now using UTF-16 encoded w/ BOM)

    const contentBuffer = Buffer.from(encoded, 'binary')    //  Text -> Binary encoding for UTF-16 w/ BOM
    return Buffer.concat([header, encBuffer, contentBuffer])
}

function createUrlFrame(tagKey, data) {
    if (!tagKey || !data) return

    const encoded = encodeText(data, 'ISO-8859-1')

    const header = Buffer.alloc(10, 0)
    header.write(tagKey, 0)                     //  ID of the specified frame
    header.writeUInt32BE(encoded.length + 1, 4) //  Size of frame (string length + encoding byte)
    const encBuffer = Buffer.alloc(1, 0)        //  Encoding (URLs are always ISO-8859-1)

    const contentBuffer = Buffer.from(encoded, 'binary')    //  Text -> Binary encoding for ISO-8859-1
    return Buffer.concat([header, encBuffer, contentBuffer])
}