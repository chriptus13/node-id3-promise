/*
**  List of URL frames.
**  name           => Frame ID
**  multiple       => Whether multiple of this frame can exist
**  hasDescription => Whether this frame may include a description
*/
const WFrames = {
    commercialUrl: {
        name: 'WCOM',
        multiple: true
    },
    copyrightUrl: {
        name: 'WCOP'
    },
    fileUrl: {
        name: 'WOAF'
    },
    artistUrl: {
        name: 'WOAR',
        multiple: true
    },
    audioSourceUrl: {
        name: 'WOAS'
    },
    radioStationUrl: {
        name: 'WORS'
    },
    paymentUrl: {
        name: 'WPAY'
    },
    publisherUrl: {
        name: 'WPUB'
    }
}

/*
   4.3.1 WAF Official audio file webpage
   4.3.1 WAR Official artist/performer webpage
   4.3.1 WAS Official audio source webpage
   4.3.1 WCM Commercial information
   4.3.1 WCP Copyright/Legal information
   4.3.1 WPB Publishers official webpage
   4.3.2 WXX User defined URL link frame
*/
const WFramesV220 = {
    commercialUrl: {
        name: 'WCM',
        multiple: true
    },
    copyrightUrl: {
        name: 'WCP'
    },
    fileUrl: {
        name: 'WAF'
    },
    artistUrl: {
        name: 'WAR',
        multiple: true
    },
    audioSourceUrl: {
        name: 'WAS'
    },
    publisherUrl: {
        name: 'WPB'
    },
    userDefinedUrl: {
        name: 'WXX',
        multiple: true,
        hasDescription: true
    }
}

module.exports = { WFrames, WFramesV220 }