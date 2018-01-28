const version = '0.6.0-alpha'

const audio = {
    muted: false,
    fftSize: 8192,
    waveData: [],
    freqData: [],
    highFreqs: [],
    midFreqs: [],
    lowFreqs: []
}

const graphics = {
    mode: 'tree',
    modes: ['help', 'tree', 'oscope', 'bars', 'spiral'],
    composition: 'source-over',
    tree: {
        depth: 3,
        branchFactor: 6,
        branchAngle: 0,
        branchIncrease: true,
        growFactor: 1,
        growSpeed: 0,
        rotationSpeed: 20,
        rotationIncrease: false,
        zoomLevel: 300,
        zoomSpeed: 0,
        zoomIncrease: true,
        zoomMin: 0,
        zoomMax: 2000,
        totalbranches: 0
    },
    bars: {
        height: 2,
        width: 1,
        gap: 2
    },
    spiral: {
        angle: 0,
        zoomLevel: 565
    },
    lineCurve: false,
    lineWidth: 1,
    lineDiff: false,
    lineDWidth: 0,
    lineDWidthSpeed: 0,
    lineCap: 'butt',
    foreground: [0, 0, 0, 1.0],
    background: [255, 255, 255, 1.0],
    showLabels: false,
    showFps: false,
    showInfo: true,
    showData: false,
    clearFrames: true,
    fps: 60,
    fontsize: 12,
    lineheight: 1.2,
    fullscreen: false,
    info: [],
    defaultInfo: [
        `drag an audio file here to start or`,
        `press r to capture audio from microphone`,
        `press ? for help`,
    ],
    helpText: [
        `scroll: zoom in tree mode`,
        `r: capture audio from mic`,
        `m: mute audio`,
        `f: toggle fullscreen`,
        `i: toggle info text`,
        `d: toggle data text`,
        `c: randomize colors`,
        `h: toggle all options`,
        `1: tree mode`, 
        `2: oscope mode`, 
        `3: bars mode`, 
        `4: spiral mode`,
        `?: show help`, 
    ]
}

window.graphics = graphics
window.audio = audio

export { version, graphics, audio }
