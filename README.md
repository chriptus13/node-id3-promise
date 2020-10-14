# node-id3-promise

node-id3-promise is a ID3-Tag library for NodeJS. 
It uses promises and it's based on [node-id3](https://www.npmjs.com/package/node-id3) (callbacks style).

## Installation
```
npm install node-id3-promise
```

## Usage

### Write tags

```javascript
const NodeID3 = require('node-id3-promise')

// Path to the MP3 file
const filePath = '/path/to/(mp3)file'

//  Tags for your file using the ID (e.g. APIC) or the alias (see at bottom)
const tags = {
  title: 'Talking to Myself',
  artist: 'Linkin Park',
  album: 'One More Light',
  genre: 'Pop Rock',
  trackNumber: '3',
  year: '2017',
  image: '/path/to/(jpg)file'
}

NodeID3.write(tags, filePath)
  .then(() => {...})
  .catch(err => {...})
```

### Read tags

```javascript
const NodeID3 = require('node-id3-promise')

// Path to the MP3 file
const filePath = '/path/to/(mp3)file'

NodeID3.read(filePath)
    .then(tags => {...})
    .catch(err => {...})
```

### Remove tags

```javascript
const NodeID3 = require('node-id3-promise')

// Path to the MP3 file
const filePath = '/path/to/(mp3)file'

NodeID3.removeTags(filepath)
    .then(() => {...})
    .catch(err => {...})
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
unsynchronisedLyrics: "USLT"
userDefinedText:      "TXXX"
popularimeter:        "POPM"
private:              "PRIV"
chapter:              "CHAP"
commercialUrl:        "WCOM"
copyrightUrl:         "WCOP"
fileUrl:              "WOAF"
artistUrl:            "WOAR"
audioSourceUrl:       "WOAS"
radioStationUrl:      "WORS"
paymentUrl:           "WPAY"
publisherUrl:         "WPUB"
userDefinedUrl:       "WXXX"
```

### TODOs

* Make tests.