const version = '0.4 alpha'

const audio = {
    muted: false,
    fftSize: 2048
}

const graphics = {
    mode: 'tree',
    tree: {
        depth: 3,
        branchFactor: 8,
        branchAngle: 0,
        growFactor: 0.8,
        rotationSpeed: 5,
        zoomLevel: 40,
        zoomSpeed: 7,
        zoomIncrease: true,
        zoomMin: 0,
        zoomMax: 2000
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
    totalbranches: 0,
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
    info: [],
    fullscreen: false,
    defaultInfo: [
        `visualizer v${version}`, 
        ``, 
        `drag an audio file here to start or`,
        `press r to capture audio from microphone`,
        `press m to mute audio`,
        `press h to toggle all options`,
        `press f to toggle fullscreen`,
        `zoom with mouse wheel or touchpad`,
        ``, 
    ]
}

export { version, graphics, audio }
