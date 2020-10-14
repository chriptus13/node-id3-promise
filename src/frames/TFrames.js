/*
**  List of official text information frames
**  LibraryName: 'T***'
**  Value is the ID of the text frame specified in the link above, the object's keys are just for simplicity, you can also use the ID directly.
*/
const TFrames = {
    album: 'TALB',
    bpm: 'TBPM',
    composer: 'TCOM',
    genre: 'TCON',
    copyright: 'TCOP',
    date: 'TDAT',
    playlistDelay: 'TDLY',
    encodedBy: 'TENC',
    textWriter: 'TEXT',
    fileType: 'TFLT',
    time: 'TIME',
    contentGroup: 'TIT1',
    title: 'TIT2',
    subtitle: 'TIT3',
    initialKey: 'TKEY',
    language: 'TLAN',
    length: 'TLEN',
    mediaType: 'TMED',
    originalTitle: 'TOAL',
    originalFilename: 'TOFN',
    originalTextwriter: 'TOLY',
    originalArtist: 'TOPE',
    originalYear: 'TORY',
    fileOwner: 'TOWN',
    artist: 'TPE1',
    performerInfo: 'TPE2',
    conductor: 'TPE3',
    remixArtist: 'TPE4',
    partOfSet: 'TPOS',
    publisher: 'TPUB',
    trackNumber: 'TRCK',
    recordingDates: 'TRDA',
    internetRadioName: 'TRSN',
    internetRadioOwner: 'TRSO',
    size: 'TSIZ',
    ISRC: 'TSRC',
    encodingTechnology: 'TSSE',
    year: 'TYER'
}

const TFramesV220 = {
    album: 'TAL',
    bpm: 'TBP',
    composer: 'TCM',
    genre: 'TCO',
    copyright: 'TCR',
    date: 'TDA',
    playlistDelay: 'TDY',
    encodedBy: 'TEN',
    textWriter: 'TEXT',
    fileType: 'TFT',
    time: 'TIM',
    contentGroup: 'TT1',
    title: 'TT2',
    subtitle: 'TT3',
    initialKey: 'TKE',
    language: 'TLA',
    length: 'TLE',
    mediaType: 'TMT',
    originalTitle: 'TOT',
    originalFilename: 'TOF',
    originalTextwriter: 'TOL',
    originalArtist: 'TOA',
    originalYear: 'TOR',
    artist: 'TP1',
    performerInfo: 'TP2',
    conductor: 'TP3',
    remixArtist: 'TP4',
    partOfSet: 'TPA',
    publisher: 'TPB',
    trackNumber: 'TRK',
    recordingDates: 'TRD',
    size: 'TSI',
    ISRC: 'TRC',
    encodingTechnology: 'TSS',
    year: 'TYE'
}

module.exports = { TFrames, TFramesV220 }