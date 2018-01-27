const version = '0.5.0-alpha'

const audio = {
//    muted: true,
    muted: false,
    fftSize: 8192
}

const graphics = {
    mode: 'tree',
    composition: 'source-over',
    tree: {
        depth: 3,
        branchFactor: 8,
        branchAngle: 0,
        growFactor: 1,
        growSpeed: 0,
        rotationSpeed: 5,
        zoomLevel: 100,
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
    lineCurve: false,
    lineWidth: 1,
    lineDiff: false,
    lineDWidth: 0,
    lineDWidthSpeed: 0,
    foreground: '#e1e1e1',
    background: '#575454',
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
        `visualizer v${version}`, 
        `drag an audio file here to start or`,
        `press r to capture audio from microphone`,
        `press m to mute audio`,
        `press h to toggle all options`,
        `press f to toggle fullscreen`,
        `zoom with mouse wheel or touchpad`,
        ``, 
    ]
}

window.graphics = graphics
window.audio = audio

export { version, graphics, audio }