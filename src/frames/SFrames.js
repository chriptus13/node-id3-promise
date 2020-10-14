const { encodeText, decodeText } = require('./util')
const APICTypes = require('./APICTypes')
const { createBuffersFromTags, getTagsFromFrames, getFramesFromID3Body } = require('./index')
const { not, isUndefined } = require('../util')

/*
**  List of non-text frames which follow their specific specification
**  name    => Frame ID
**  create  => function to create the frame
**  read    => function to read the frame
*/
const SFrames = {
    comment: {
        create: createCommentFrame,
        read: readCommentFrame,
        name: 'COMM'
    },
    image: {
        create: createPictureFrame,
        read: readPictureFrame,
        name: 'APIC'
    },
    unsynchronisedLyrics: {
        create: createUnsynchronisedLyricsFrame,
        read: readUnsynchronisedLyricsFrame,
        name: 'USLT'
    },
    userDefinedText: {
        create: createUserDefinedText,
        read: readUserDefinedText,
        name: 'TXXX',
        multiple: true
    },
    popularimeter: {
        create: createPopularimeterFrame,
        read: readPopularimeterFrame,
        name: 'POPM'
    },
    private: {
        create: createPrivateFrame,
        read: readPrivateFrame,
        name: 'PRIV',
        multiple: true
    },
    chapter: {
        create: createChapterFrame,
        read: readChapterFrame,
        name: 'CHAP',
        multiple: true
    },
    userDefinedUrl: {
        create: createUserDefinedUrl,
        read: readUserDefinedUrl,
        name: 'WXXX',
        multiple: true
    }
}

const SFramesV220 = {
    image: {
        create: createPictureFrame,
        read: readPictureFrame,
        name: 'PIC'
    }
}

module.exports = { SFrames, SFramesV220 }

function createPictureFrame(data) {
    if (!data || !Buffer.isBuffer(data)) return

    // Create frame header
    const header = Buffer.alloc(10, 0)
    header.write(SFrames.image.name, 0)

    const mime_type = data[0] == 0xff && data[1] == 0xd8 && data[2] == 0xff
        ? 'image/jpeg'
        : 'image/png'

    const content = Buffer.alloc(mime_type.length + 4, 0)
    content[mime_type.length + 2] = 0x03    //  Front cover
    content.write(mime_type, 1)

    const size = data.length + content.length

    header.writeUInt32BE(size, 4)
    return Buffer.concat([header, content, data])
}

function readPictureFrame(APICFrame, ID3Version) {
    const type = readPictureType(APICFrame, ID3Version)
    const { description, descEnd } = readPictureDescription(APICFrame, ID3Version)
    const mime = readPictureMimeType(APICFrame, ID3Version)
    const imageBuffer = descEnd ? APICFrame.slice(descEnd + 1) : APICFrame.slice(5)
    return { type, description, mime, imageBuffer }
}

function readPictureType(APICFrame, ID3Version) {
    const idOffset = ID3Version === 2 && APICTypes.length < APICFrame[4]
        ? 4 : APICFrame.indexOf(0x00, 1) + 1
    const nameOffset = ID3Version === 2 && APICTypes.length < APICFrame[4]
        ? APICFrame[4] : APICFrame[APICFrame.indexOf(0x00, 1) + 1]
    return {
        id: APICFrame[idOffset],
        name: APICTypes[nameOffset]
    }
}

function readPictureDescription(APICFrame, ID3Version) {
    const descOffset = ID3Version === 2 ? 5 : APICFrame.indexOf(0x00, 1) + 2
    if (APICFrame[0] === 0x00) {
        const description = decodeText(APICFrame.slice(descOffset, APICFrame.indexOf(0x00, descOffset)), 'ISO-8859-1')
        const descEnd = APICFrame.indexOf(0x00, descOffset)
        return { description, descEnd }
    }
    if (APICFrame[0] === 0x01) {
        const desc = APICFrame.slice(descOffset)
        const descFound = desc.indexOf('0000', 0, 'hex')
        if (descFound !== -1) {
            const descEnd = descOffset + descFound + 2
            const description = decodeText(desc.slice(0, descFound + 2), 'utf16')
            return { description, descEnd }
        }
    }
}

function readPictureMimeType(APICFrame, ID3Version) {
    const APICMimeType = ID3Version === 2
        ? APICFrame.toString('ascii').substring(1, 4)
        : APICFrame.toString('ascii').substring(1, APICFrame.indexOf(0x00, 1))

    if (APICMimeType == 'image/jpeg') return 'jpeg'
    if (APICMimeType == 'image/png') return 'png'
    return APICMimeType
}

function getEncodingByte(encoding) {
    return encoding === 0x00 || encoding === 'ISO-8859-1' ? 0x00 : 0x01
}

function getEncodingName(encoding) {
    return getEncodingByte(encoding) === 0x00 ? 'ISO-8859-1' : 'utf16'
}

function getTerminationCount(encoding) {
    return encoding === 0x00 ? 1 : 2
}

function createTextEncoding(encoding) {
    return Buffer.alloc(1, getEncodingByte(encoding))
}

function createLanguage(language = 'eng') {
    return Buffer.from(language.length > 3 ? language.substring(0, 3) : language)
}

function createContentDescriptor(description, encoding) {
    const encName = getEncodingName(encoding)
    if (!description)
        return encodeText('\0', encName)

    const encDesc = encodeText(description, encName)
    return Buffer.concat([encDesc, Buffer.alloc(getTerminationCount(encoding), 0x00)])
}

function createText(text = '', encoding) {
    return encodeText(text, getEncodingName(encoding))
}

function createCommentFrame(comment = {}) {
    if (!comment.text) return

    // Create frame header
    const header = Buffer.alloc(10, 0)
    header.write(SFrames.comment.name, 0)

    const encodingBuffer = createTextEncoding(0x01)
    const languageBuffer = createLanguage(comment.language)
    const descriptorBuffer = createContentDescriptor(comment.shortText, 0x01)
    const textBuffer = createText(comment.text, 0x01)

    const size = encodingBuffer.length + languageBuffer.length + descriptorBuffer.length + textBuffer.length

    header.writeUInt32BE(size, 4)
    return Buffer.concat([header, encodingBuffer, languageBuffer, descriptorBuffer, textBuffer])
}

function readCommentFrame(frame) {
    if (!frame) return
    if (frame[0] == 0x00)
        return {
            language: decodeText(frame, 'ISO-8859-1', 1, 4),
            shortText: decodeText(frame, 'ISO-8859-1', 4, frame.indexOf(0x00, 1)),
            text: decodeText(frame, 'ISO-8859-1', frame.indexOf(0x00, 1) + 1)
        }

    if (frame[0] !== 0x01) return

    let descriptorEscape = 0
    while (
        frame[descriptorEscape] !== undefined && frame[descriptorEscape] !== 0x00
        || frame[descriptorEscape + 1] !== 0x00 || frame[descriptorEscape + 2] === 0x00
    ) ++descriptorEscape

    if (frame[descriptorEscape] === undefined) return

    const shortText = frame.slice(4, descriptorEscape)
    const text = frame.slice(descriptorEscape + 2)

    return {
        language: frame.toString().substring(1, 4),
        shortText: decodeText(shortText, 'utf16'),
        text: decodeText(text, 'utf16')
    }
}

function createUnsynchronisedLyricsFrame(unsynchronisedLyrics = {}) {
    if (typeof unsynchronisedLyrics === 'string')
        unsynchronisedLyrics = {
            text: unsynchronisedLyrics
        }
    if (!unsynchronisedLyrics.text) return

    // Create frame header
    const header = Buffer.alloc(10, 0)
    header.write(SFrames.unsynchronisedLyrics.name, 0)

    const encodingBuffer = createTextEncoding(0x01)
    const languageBuffer = createLanguage(unsynchronisedLyrics.language)
    const descriptorBuffer = createContentDescriptor(unsynchronisedLyrics.shortText, 0x01)
    const textBuffer = encodeText(unsynchronisedLyrics.text, 0x01)

    const size = encodingBuffer.length + languageBuffer.length + descriptorBuffer.length + textBuffer.length

    header.writeUInt32BE(size, 4)
    return Buffer.concat([header, encodingBuffer, languageBuffer, descriptorBuffer, textBuffer])
}

function readUnsynchronisedLyricsFrame(frame) {
    if (!frame) return

    if (frame[0] == 0x00)
        return {
            language: decodeText(frame, 'ISO-8859-1', 1, 4),
            shortText: decodeText(frame, 'ISO-8859-1', 4, frame.indexOf(0x00, 1)),
            text: decodeText(frame, 'ISO-8859-1', frame.indexOf(0x00, 1) + 1)
        }

    if (frame[0] !== 0x01) return
    let descriptorEscape = 0

    while (
        frame[descriptorEscape] !== undefined && frame[descriptorEscape] !== 0x00
        || frame[descriptorEscape + 1] !== 0x00 || frame[descriptorEscape + 2] === 0x00
    ) ++descriptorEscape

    if (frame[descriptorEscape] === undefined) return

    const shortText = frame.slice(4, descriptorEscape)
    const text = frame.slice(descriptorEscape + 2)

    return {
        language: frame.toString().substring(1, 4).replace(/\0/g, ''),
        shortText: decodeText(shortText, 'utf16'),
        text: decodeText(text, 'utf16')
    }
}

function createUserDefinedText(userDefinedText) {
    if (Array.isArray(userDefinedText))
        return Buffer.concat(
            userDefinedText
                .map(createUserDefinedText)
                .filter(not(isUndefined))
        )
    return createUserDefinedTextHelper(userDefinedText)
}

function createUserDefinedTextHelper(userDefinedText) {
    if (!userDefinedText && !userDefinedText.description) return

    // Create frame header
    const header = Buffer.alloc(10, 0)
    header.write(SFrames.userDefinedText.name, 0)

    const encodingBuffer = createTextEncoding(0x01)
    const descriptorBuffer = createContentDescriptor(userDefinedText.description, 0x01)
    const valueBuffer = createText(udt.value, 0x01)

    const size = encodingBuffer.length + descriptorBuffer.length + valueBuffer.length

    header.writeUInt32BE(size, 4)
    return Buffer.concat([header, encodingBuffer, descriptorBuffer, valueBuffer])
}

function readUserDefinedText(frame) {
    if (!frame) return

    if (frame[0] == 0x00)
        return {
            description: decodeText(frame, 'ISO-8859-1', 1, frame.indexOf(0x00, 1)),
            value: decodeText(frame, 'ISO-8859-1', frame.indexOf(0x00, 1) + 1)
        }

    if (frame[0] !== 0x01) return

    let descriptorEscape = 0
    while (
        frame[descriptorEscape] !== undefined && frame[descriptorEscape] !== 0x00
        || frame[descriptorEscape + 1] !== 0x00 || frame[descriptorEscape + 2] === 0x00
    ) ++descriptorEscape

    if (frame[descriptorEscape] === undefined) return

    const description = frame.slice(1, descriptorEscape)
    const value = frame.slice(descriptorEscape + 2)

    return {
        description: decodeText(description, 'utf16'),
        value: decodeText(value, 'utf16')
    }
}

function createPopularimeterFrame(popularimeter) {
    if (!popularimeter || !popularimeter.email) return
    let { email, rating = 0, counter = 0 } = popularimeter
    rating = Math.trunc(rating)
    counter = Math.trunc(counter)
    if (isNaN(rating) || rating < 0 || rating > 255) rating = 0
    if (isNaN(counter) || counter < 0) counter = 0

    // Create frame header
    const header = Buffer.alloc(10, 0)
    header.write(SFrames.popularimeter.name, 0)

    const emailBuffer = createText(email, 0x00)
    const ratingBuffer = Buffer.alloc(1, 0)
    ratingBuffer.writeUInt32BE(rating, 0)
    const counterBuffer = Buffer.alloc(4, 0)
    counterBuffer.writeUInt32BE(counter, 0)

    const size = emailBuffer.length + ratingBuffer.length + counterBuffer.length

    header.writeUInt32BE(size, 4)
    return Buffer.concat([header, emailBuffer, ratingBuffer, counterBuffer])
}

function readPopularimeterFrame(frame) {
    if (!frame) return

    const endEmailIndex = frame.indexOf(0x00, 1)
    if (endEmailIndex <= -1) return

    const tags = {
        email: decodeText(frame.slice(0, endEmailIndex), 'ISO-8859-1')
    }
    const ratingIndex = endEmailIndex + 1
    if (ratingIndex < frame.length) {
        tags.rating = frame[ratingIndex]
        const counterIndex = ratingIndex + 1
        if (counterIndex < frame.length) {
            const value = frame.slice(counterIndex, frame.length)
            if (value.length >= 4)
                tags.counter = value.readUInt32BE(0)
        }
    }
    return tags
}

function createPrivateFrame(private) {
    if (Array.isArray(private)) return createPrivateFrameArr(private)
    if (!private || !private.ownerIdentifier || !private.data) return

    // Create frame header
    const header = Buffer.alloc(10, 0)
    header.write(SFrames.private.name, 0)

    const ownerIdentifier = createText(private.ownerIdentifier, 0x00)
    const data = typeof private.data === 'string' ? createText(private.data, 0x00) : private.data

    const size = ownerIdentifier.length + data.length

    header.writeUInt32BE(size, 4)
    return Buffer.concat([header, ownerIdentifier, data])
}

function createPrivateFrameArr(private) {
    return Buffer.concat(
        private
            .map(createPrivateFrame)
            .filter(not(isUndefined))
    )
}

function readPrivateFrame(frame) {
    if (!frame) return

    const endOfOwnerIdentification = frame.indexOf(0x00)
    if (endOfOwnerIdentification === -1) return

    const tags = {
        ownerIdentifier: decodeText(frame.slice(0, endOfOwnerIdentification), 'ISO-8859-1')
    }

    if (frame.length > endOfOwnerIdentification + 1)
        tags.data = frame.slice(endOfOwnerIdentification + 1)

    return tags
}

function createChapterFrame(chapter) {
    if (Array.isArray(chapter))
        return Buffer.concat(
            chapter
                .map(createChapterFrameHelper)
                .filter(not(isUndefined))
        )
    return createChapterFrameHelper(chapter)
}

function createChapterFrameHelper(chapter) {
    if (!chapter || !chapter.elementID || !chapter.startTimeMs || !chapter.endTimeMs) return

    // Create frame header
    const header = Buffer.alloc(10, 0)
    header.write(SFrames.chapter.name, 0)

    const elementIDBuffer = createText(chapter.elementID, 0x00)
    const startTimeBuffer = Buffer.alloc(4)
    startTimeBuffer.writeUInt32BE(chapter.startTimeMs, 0)
    const endTimeBuffer = Buffer.alloc(4)
    endTimeBuffer.writeUInt32BE(chapter.endTimeMs, 0)
    const startOffsetBytesBuffer = Buffer.alloc(4, 0xFF)
    if (chapter.startOffsetBytes)
        startOffsetBytesBuffer.writeUInt32BE(chapter.startOffsetBytes, 0)
    const endOffsetBytesBuffer = Buffer.alloc(4, 0xFF)
    if (chapter.endOffsetBytes)
        endOffsetBytesBuffer.writeUInt32BE(chapter.endOffsetBytes, 0)

    const frames = chapter.tags ? createBuffersFromTags(chapter.tags) : undefined
    const framesBuffer = frames ? Buffer.concat(frames) : Buffer.alloc(0)

    const size = elementIDBuffer.length + 16 + framesBuffer.length

    header.writeUInt32BE(size, 4)
    return Buffer.concat([
        header, elementIDBuffer, startTimeBuffer, endTimeBuffer,
        startOffsetBytesBuffer, endOffsetBytesBuffer, framesBuffer
    ])
}

function readChapterFrame(frame) {
    if (!frame) return

    const endOfElementIDString = frame.indexOf(0x00)
    if (endOfElementIDString === -1 || frame.length - endOfElementIDString - 1 < 16)
        return

    const tags = {
        elementID: decodeText(frame.slice(0, endOfElementIDString), 'ISO-8859-1'),
        startTimeMs: frame.readUInt32BE(endOfElementIDString + 1),
        endTimeMs: frame.readUInt32BE(endOfElementIDString + 5)
    }
    const aux = Buffer.alloc(4, 0xff).readUInt32BE(0)
    if (frame.readUInt32BE(endOfElementIDString + 9) !== aux)
        tags.startOffsetBytes = frame.readUInt32BE(endOfElementIDString + 9)
    if (frame.readUInt32BE(endOfElementIDString + 13) !== aux)
        tags.endOffsetBytes = frame.readUInt32BE(endOfElementIDString + 13)

    if (frame.length - endOfElementIDString - 17 > 0) {
        const framesBuffer = frame.slice(endOfElementIDString + 17)
        tags.tags = getTagsFromFrames(getFramesFromID3Body(framesBuffer, 3, 4, 10), 3)
    }

    return tags
}

function createUserDefinedUrl(userDefinedUrl) {
    if (Array.isArray(userDefinedUrl))
        return Buffer.concat(
            userDefinedUrl
                .map(createUserDefinedUrlHelper)
                .filter(not(isUndefined))
        )
    return createUserDefinedUrlHelper(userDefinedUrl)
}

function createUserDefinedUrlHelper(userDefinedUrl) {
    if (!userDefinedUrl && !userDefinedUrl.description) return

    // Create frame header
    const header = Buffer.alloc(10, 0)
    header.write(SFrames.userDefinedUrl.name, 0)

    const encodingBuffer = createTextEncoding(0x01)
    const descriptorBuffer = createContentDescriptor(udu.description, 0x01)
    const urlBuffer = createText(udu.url, 0x00)

    const size = encodingBuffer.length + descriptorBuffer.length + urlBuffer.length

    header.writeUInt32BE(size, 4)
    return Buffer.concat([header, encodingBuffer, descriptorBuffer, urlBuffer])
}

function readUserDefinedUrl(frame) {
    if (!frame) return
    if (frame[0] == 0x00)
        return {
            description: decodeText(frame, 'ISO-8859-1', 1, frame.indexOf(0x00, 1)),
            url: decodeText(frame, 'ISO-8859-1', frame.indexOf(0x00, 1) + 1)
        }
    if (frame[0] == 0x01) {
        let descriptorEscape = 0

        while (
            frame[descriptorEscape] !== undefined && frame[descriptorEscape] !== 0x00
            || frame[descriptorEscape + 1] !== 0x00 || frame[descriptorEscape + 2] === 0x00
        ) descriptorEscape++

        if (frame[descriptorEscape] === undefined) return {}

        const description = frame.slice(1, descriptorEscape)
        const value = frame.slice(descriptorEscape + 2)
        return {
            description: decodeText(description, 'utf16'),
            url: decodeText(value, 'ISO-8859-1')
        }
    }
}