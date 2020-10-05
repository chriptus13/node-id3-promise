# node-id3-promise

node-id3-promise is a wrapper around [node-id3](https://www.npmjs.com/package/node-id3) package to provide promise style Javascript.

## Installation
```
npm install node-id3-promise
```

## Usage

```javascript
const NodeID3 = require('node-id3-promise')

/* Variables found in the following usage examples */

//  file can be a buffer or string with the path to a file
let file = './path/to/(mp3)file' || new Buffer("Some Buffer of a (mp3) file")
let filebuffer = new Buffer("Some Buffer of a (mp3) file")
let filepath = './path/to/(mp3)file'
```

### Creating/Writing tags

```javascript
//  Define the tags for your file using the ID (e.g. APIC) or the alias (see at bottom)
let tags = {
  title: "Tomorrow",
  artist: "Kevin Penkin",
  album: "TVアニメ「メイドインアビス」オリジナルサウンドトラック",
  APIC: "path-to-image",
  TRCK: "27"
}

//  Create a ID3-Frame buffer from passed tags
NodeID3.create(tags)
    .then(frame => { })
    .catch(err => { })

//  Write ID3-Frame into (.mp3) file
NodeID3.write(tags, file)
    .then(buffer => { }) //  Buffer is only returned if a buffer was passed as file
    .catch(err => { })

//  Update existing ID3-Frame with new/edited tags
NodeID3.update(tags, file)
    .then(buffer => { })  //  Buffer is only returned if a buffer was passed as file
    .catch(err => { })
```

### Reading ID3-Tags

```javascript
NodeID3.read(file)
    .then(tags => {
        /*
        tags: {
            title: "Tomorrow",
            artist: "Kevin Penkin",
            image: {
                mime: "jpeg",
                type: {
                    id: 3,
                    name: "front cover"
                },
                description: String,
                imageBuffer: Buffer
            },
            raw: {
                TIT2: "Tomorrow",
                TPE1: "Kevin Penkin",
                APIC: Object (See above)
            }
        } */
    })
    .catch(err => { })
```

### Removing ID3-Tags from file/buffer

```javascript
NodeID3.removeTags(filepath)
    .then(() => { })
    .catch(err => { })

let bufferWithoutID3Frame = NodeID3.removeTagsFromBuffer(filebuffer)  //  Returns Buffer
```

## Supported aliases
```
album:
bpm:
composer:
genre:
copyright:
date:
playlistDelay:
encodedBy:
textWriter:
fileType:
time:
contentGroup:
title:
subtitle:
initialKey:
language:
length:
mediaType:
originalTitle:
originalFilename:
originalTextwriter:
originalArtist:
originalYear:
fileOwner:
artist:
performerInfo:
conductor:
remixArtist:
partOfSet:
publisher:
trackNumber:
recordingDates:
internetRadioName:
internetRadioOwner:
size:
ISRC:
encodingTechnology:
year:
comment: {
  language: "eng",
  text: "mycomment"
}
unsynchronisedLyrics: {
  language: "eng",
  text: "lyrics"
}
userDefinedText: [{
  description: "txxx name",
  value: "TXXX value text"
}, {
  description: "txxx name 2",
  value: "TXXX value text 2"
}] // Care, update doesn't delete non-passed array items!
image: {
  mime: "png/jpeg"/undefined,
  type: {
    id: 3,
    name: "front cover
  }, // See https://en.wikipedia.org/wiki/ID3#ID3v2_embedded_image_extension
  description: "image description",
  imageBuffer: (file buffer)
},
popularimeter: {
  email: "mail@example.com",
  rating: 192,  // 1-255
  counter: 12
},
private: [{
  ownerIdentifier: "AbC",
  data: "asdoahwdiohawdaw"
}, {
  ownerIdentifier: "AbCSSS",
  data: Buffer.from([0x01, 0x02, 0x05])
}],
chapter: [{
  elementID: "Hey!", //THIS MUST BE UNIQUE!
  startTimeMs: 5000,
  endTimeMs: 8000,
  startOffsetBytes: 123, // OPTIONAL!
  endOffsetBytes: 456,   // OPTIONAL!
  tags: {                // OPTIONAL
    title: "abcdef",
    artist: "akshdas"
  }
}]
commercialUrl: ["commercialurl.com"], // array or single string
copyrightUrl: "example.com",
fileUrl: "example.com",
artistUrl: ["example.com"], // array or single string
audioSourceUrl: "example.com",
radioStationUrl: "example.com",
paymentUrl: "example.com",
publisherUrl: "example.com",
userDefinedUrl: [{
  description: "URL description"
  url: "https://example.com/"
}] // array or single object
```

### Supported raw IDs
You can also use the currently supported raw tags like TALB instead of album etc.
```
album:                "TALB"
bpm:                  "TBPM"
composer:             "TCOM"
genre:                "TCON"
copyright:            "TCOP"
date:                 "TDAT"
playlistDelay:        "TDLY"
encodedBy:            "TENC"
textWriter:           "TEXT"
fileType:             "TFLT"
time:                 "TIME"
contentGroup:         "TIT1"
title:                "TIT2"
subtitle:             "TIT3"
initialKey:           "TKEY"
language:             "TLAN"
length:               "TLEN"
mediaType:            "TMED"
originalTitle:        "TOAL"
originalFilename:     "TOFN"
originalTextwriter:   "TOLY"
originalArtist:       "TOPE"
originalYear:         "TORY"
fileOwner:            "TOWN"
artist:               "TPE1"
performerInfo:        "TPE2"
conductor:            "TPE3"
remixArtist:          "TPE4"
partOfSet:            "TPOS"
publisher:            "TPUB"
trackNumber:          "TRCK"
recordingDates:       "TRDA"
internetRadioName:    "TRSN"
internetRadioOwner:   "TRSO"
size:                 "TSIZ"
ISRC:                 "TSRC"
encodingTechnology:   "TSSE"
year:                 "TYER"
comment:              "COMM"
image:                "APIC"
unsynchronisedLyrics  "USLT"
userDefinedText       "TXXX"
popularimeter         "POPM"
private               "PRIV"
chapter               "CHAP"
commercialUrl         "WCOM"
copyrightUrl          "WCOP"
fileUrl               "WOAF"
artistUrl             "WOAR"
audioSourceUrl        "WOAS"
radioStationUrl       "WORS"
paymentUrl            "WPAY"
publisherUrl          "WPUB"
userDefinedUrl        "WXXX"
```

### TODOs

* Rewrite node-id3 code to use `fs-promise`.