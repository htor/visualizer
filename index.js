const version = '0.3 alpha'
const audio = {
    muted: false,
    fftSize: 2048
}
const graphics = {
    mode: 'tree',
    depth: 3,
    branchFactor: 8,
    branchAngle: 0,
    growFactor: 0.8,
    rotationSpeed: 5,
    zoom: {
        level: 40,
        speed: 7,
        increase: true,
        minlevel: 0,
        maxlevel: 2000
    },
    line: {
        curve: false,
        width: 1,
        difference: false,
        dashWidth: 0
    },
    barHeight: 2,
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

const random = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

const hexToRgb = (hex) => {
    let result = /^#?([a-f\d]{1,2})([a-f\d]{1,2})([a-f\d]{1,2})$/i.exec(hex)
    return [parseInt(result[1], 16), 
            parseInt(result[2], 16), 
            parseInt(result[3], 16)]
}

const loadAudioFile = (filename, callback) => {
    return fetch(`/${filename}`).then((response) => {
        return response.arrayBuffer()
            .then((arrayBuffer) => {
                callback({ arrayBuffer, file: { name: filename } })
            })
    })
}

const captureAudio = () => {
    return navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        return { stream: stream, filename: `microphone` }
    }).catch(err => {
        throw new Error(`permission denied to microphone`)
    })
}

const loadDraggedAudio = (event) => {
    event.stopPropagation()
    event.preventDefault()
    let file = event.dataTransfer.files[0]
    let reader = new FileReader()
    let filter = /^audio/i

    return new Promise((resolve, reject) => {
        if (!filter.test(file.type)) {
            return reject(new Error(`dragged file is not an audio file`))
        }
        reader.onload = (event) => {
            let arrayBuffer = event.target.result
            return audio.ctx.decodeAudioData(arrayBuffer)
                .then(decodedBuffer => {
                    resolve({ buffer: decodedBuffer, filename: file.name })
                })
        }
        graphics.info = [`loading: ${file.name}`]
        reader.readAsArrayBuffer(file)
    })
}

const analyseAudio = (audioInput) => {
    if (audio.source instanceof AudioScheduledSourceNode)
        audio.source.stop()
    if (audio.source && !audio.muted)
        audio.source.disconnect(audio.ctx.destination)
    audio.stopped = true

    if (audioInput.buffer) { // audio file
        audio.source = audio.ctx.createBufferSource()
        audio.source.buffer = audioInput.buffer
    } else if (audioInput.stream) { // microphone
        audio.source = audio.ctx.createMediaStreamSource(audioInput.stream)
    }
    audio.source.connect(audio.analyser)
    if (!audio.muted)
        audio.source.connect(audio.ctx.destination)
    audio.source.addEventListener('ended', () => {
        if (audio.stopped) {
            audio.stopped = false
        } else {
            graphics.info = graphics.defaultInfo
        }
    }) 
    if (audioInput.buffer)
        audio.source.start(0)
    audio.bufferLength = audio.analyser.frequencyBinCount
    audio.waveData = new Uint8Array(audio.bufferLength)
    audio.freqData = new Uint8Array(audio.bufferLength)
    graphics.showInfo = true
    graphics.info = [`playing: ${audioInput.filename}`]
}

const renderLabel = (label, x, y) => {
    if (graphics.showLabels) {
        graphics.ctx.fillStyle = graphics.foreground
        graphics.ctx.fillText(`${label} (${Math.floor(x)},${Math.floor(y)})`, x + 10, y + 10)
    }
}

const renderInfo = (info) => {
    let lineno = 1
    let lineheight = graphics.fontsize * graphics.lineheight
    graphics.ctx.save()
    graphics.ctx.textBaseline = 'middle'
    graphics.ctx.fillStyle = graphics.foreground
    graphics.ctx.translate(24, 28)
    if (graphics.showData) {
        if (graphics.mode === 'tree')
            info = info.concat([
                `total branches: ${graphics.totalbranches}`,
                `tree depth: ${graphics.depth}`,
                `branch factor: ${graphics.branchFactor}`,
                `branch angle: ${graphics.branchAngle.toFixed(0)}`,
                `grow factor: ${graphics.growFactor}`,
                `zoom level: ${graphics.zoom.level.toFixed(0)}`,
                `linewidth: ${graphics.line.width}`,
            ])
        if (graphics.mode === 'oscope')
            info = info.concat([
                `linewidth: ${graphics.line.width}`,
            ])
        if (graphics.mode === 'bars')
            info = info.concat([
                `bar height: ${graphics.barHeight.toFixed(2)}`,
            ])
        info = info.concat([
            `background: ${graphics.background}`,
            `foreground: ${graphics.foreground}`,
            `fps: ${graphics.fps}`,
        ])
    }
    if (graphics.showInfo) {
        if (audio.muted)
            info = info.slice(0,1).concat([`audio: muted`]).concat(info.slice(1))
        info.forEach((line, lineno) => {
            graphics.ctx.fillText(line, 0, lineno * lineheight)
        })
    }
    graphics.ctx.restore()
}

/*
  x1: starting x value
  y1: starting y value
  length: length of branch
  angle: angle of branches
  treeAngle: angle of tree
  depth: recursion depth
*/
const renderTree = (x1, y1, length, angle, treeAngle, depth) => {
    if(depth === 0)
        return
    graphics.totalbranches++

    // update values 
    let x2 = x1 - length * Math.sin(treeAngle * Math.PI / 180)
    let y2 = y1 - length * Math.cos(treeAngle * Math.PI / 180)
    let x2middle = (x1 + x2) / 2
    let y2middle = (y1 + y2) / 2
    if (audio.waveData) {
        length = graphics.growFactor * length + graphics.ch / (audio.waveData[random(0, audio.waveData.length - 1)] + 1)
    } else {
        length = graphics.growFactor * length - graphics.ch / 100
    }

    renderLabel(`${graphics.totalbranches}`, x2, y2)

    // draw
    graphics.ctx.beginPath()
    graphics.ctx.moveTo(x1, y1)
    if (graphics.line.difference)
        graphics.ctx.lineWidth = depth * graphics.line.width
    if (graphics.line.curve) {
        graphics.ctx.quadraticCurveTo(graphics.cw / 2, graphics.ch / 2, x2middle, y2middle)
        graphics.ctx.moveTo(x2middle, y2middle)
        graphics.ctx.lineTo(x2, y2)
    } else {
        graphics.ctx.lineTo(x2, y2)
    }
    if (graphics.totalbranches > 1)
        graphics.ctx.stroke()
    graphics.ctx.closePath()

    // render all branches
    let a1 = graphics.branchFactor * graphics.angleEach
    for (let i = 0; i < graphics.branchFactor; i++, a1 += graphics.angleEach) {
        renderTree(x2, y2, length, angle, treeAngle + graphics.branchAngle + a1, depth - 1)
    }
}

const renderOscilloscope = () => {
    graphics.ctx.save()
    graphics.ctx.beginPath()
    let sliceWidth = graphics.cw / audio.waveData.length
    for (let i = 0, x = 0; i < audio.waveData.length; i++, x += sliceWidth) {
        let v = audio.waveData[i] / 128.0
        let y = v * graphics.ch / 2
        if(i === 0) {
            graphics.ctx.moveTo(x, y)
        } else {
            graphics.ctx.lineTo(x, y)
        }
    }
    graphics.ctx.lineTo(graphics.cw, graphics.ch / 2)
    graphics.ctx.stroke()
    graphics.ctx.restore()
}

const renderBars = () => {
    graphics.ctx.save()
    let barHeight
    let barWidth = graphics.cw / audio.freqData.length
    for (let i = 0, x = 0; i < audio.freqData.length; i++, x += barWidth + 1) {
        barHeight = audio.freqData[i] * graphics.barHeight
        graphics.ctx.fillStyle = graphics.foreground
        graphics.ctx.fillRect(x, graphics.ch - barHeight, barWidth, barHeight)
    }
    graphics.ctx.restore()
}

const render = () => {
    // styles, colors, fonts
    if (graphics.clearFrames) {
        graphics.ctx.fillStyle = graphics.background
        graphics.ctx.fillRect(0, 0, graphics.cw, graphics.ch)
    }
    graphics.ctx.lineWidth = graphics.line.width
    graphics.ctx.strokeStyle = `${graphics.foreground}`
    graphics.ctx.setLineDash([graphics.line.dashWidth])
    graphics.ctx.font = `${graphics.fontsize}px sans-serif`


    // audio
    audio.analyser.fftSize = audio.fftSize
    if (audio.waveData) {
        audio.analyser.getByteTimeDomainData(audio.waveData)
        audio.analyser.getByteFrequencyData(audio.freqData)
    }

    // time variables?
    //var d = new Date();
    //this.seconds = d.getSeconds();
    //this.milliseconds = d.getMilliseconds();
    //this.angle += this.speed*(this.seconds+1+(this.milliseconds/1000));

    // zoom
    if(graphics.zoom.level <= graphics.zoom.minlevel)
        graphics.zoom.increase = true
    if(graphics.zoom.level >= random(graphics.zoom.maxlevel / 2, graphics.zoom.maxlevel))
        graphics.zoom.increase = false
    let zoomDelta = graphics.zoom.increase ? 
        graphics.zoom.speed / 100 : -(graphics.zoom.speed / 100)
    graphics.zoom.level += zoomDelta

    if (graphics.mode === 'tree') {
        graphics.totalbranches = 0
        graphics.branchAngle += graphics.rotationSpeed / 100
        graphics.angleEach = 360 / graphics.branchFactor
        renderTree(graphics.x, graphics.y + graphics.zoom.level, graphics.zoom.level, 
            +graphics.branchAngle.toFixed(2), 0, graphics.depth, 0)
    } else if (graphics.mode === 'oscope') {
        renderOscilloscope()
    } else if (graphics.mode === 'bars') {
        renderBars()
    } else if (graphics.mode === 'dots') {
    }

    renderInfo(graphics.info)
}

const loop = () => {
    render()
    setTimeout(() => {
        requestAnimationFrame(loop)
    }, 1000 / graphics.fps)
}

const resizeGraphics = () => {
    graphics.cw = graphics.canvas.width = window.innerWidth
    graphics.ch = graphics.canvas.height = window.innerHeight
    graphics.x = graphics.cw / 2
    graphics.y = graphics.ch / 2
}

const toggleFullscreen = () => {
    if (!document.webkitFullscreenElement) {
        document.documentElement.webkitRequestFullscreen()
        graphics.fullscreen = true
    } else {
        if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen()
            graphics.fullscreen = false
        }
    }
}

const disableEvent = (event) => {
    event.stopPropagation()
    event.preventDefault()
}

const showError = (err) => {
    console.error(err)
    graphics.info = [`error: ${err.message.toLowerCase()}`]
}

const toggleMute = () => {
    if (!audio.source) return
    if (audio.muted) {
        audio.source.disconnect(audio.ctx.destination)
    } else {
        audio.source.connect(audio.ctx.destination)
    }
}

const setup = () => {
    audio.ctx = new AudioContext()
    audio.analyser = audio.ctx.createAnalyser()
    graphics.canvas = document.querySelector('canvas')
    graphics.ctx = graphics.canvas.getContext('2d', { alpha: false })
    graphics.info = graphics.defaultInfo
    resizeGraphics()

    window.addEventListener('resize', resizeGraphics)
    window.addEventListener('dragleave', disableEvent)
    window.addEventListener('dragenter', disableEvent)
    window.addEventListener('dragover', disableEvent)

    window.addEventListener('drop', (event) => {
        loadDraggedAudio(event)
            .then(analyseAudio)
            .catch(showError)    
    })
    window.addEventListener('keydown', (event) => {
        if (event.keyCode === 70) {
            toggleFullscreen()
        } else if (event.keyCode === 82) {
            captureAudio()
                .then(analyseAudio)
                .catch(showError)
        } else if (event.keyCode === 77) {
            audio.muted = !audio.muted
            toggleMute()
        }
    })

    window.addEventListener('webkitfullscreenchange', (event) => {
        if (!document.webkitFullscreenElement) {
            graphics.showFullscreen = false
        }
    })
    
    window.addEventListener('wheel', event => {
        event.preventDefault()
        let zoomDelta = 0
        if (event.deltaY < 0) {
            zoomDelta = 5
        } else if (event.deltaY > 0 && graphics.zoom.level >= 5) {
            zoomDelta = -5
        }
        graphics.zoom.level += zoomDelta 
    })
}

// TODO support all browsers webkit, moz, ie
const prefix = (name) => {
    //if (name in window) return name
}

const controls = () => {
    let gui = new dat.GUI()
//    gui.add(graphics, 'x').min(0).max(graphics.cw).step(1).listen()
//    gui.add(graphics, 'y').min(0).max(graphics.ch).step(1).listen()
    gui.add(graphics, 'mode', ['tree', 'oscope', 'bars']).listen()
    gui.add(graphics, 'depth').min(2).max(10).step(1).listen()
    gui.add(graphics, 'branchFactor').min(1).max(16).step(1).listen()
    gui.add(graphics, 'branchAngle').min(0).max(360).step(1).listen()
    gui.add(graphics, 'growFactor').min(0).max(5).step(0.01).listen()
    gui.add(graphics, 'rotationSpeed').min(0).max(250).step(0.1).listen()
    let zoom = gui.addFolder('zoom')
    zoom.add(graphics.zoom, 'level').min(graphics.zoom.minlevel).max(graphics.zoom.maxlevel).step(1).listen()
    zoom.add(graphics.zoom, 'speed').min(0).max(250).step(1).listen()
    zoom.close()
    let lines = gui.addFolder('line')
    lines.add(graphics.line, 'curve').listen()
    lines.add(graphics.line, 'difference').listen()
    lines.add(graphics.line, 'width').min(0).max(20).step(0.01).listen()
    lines.add(graphics.line, 'dashWidth').min(0).max(20).step(0.1).listen()
    lines.close()
    gui.add(graphics, 'barHeight').min(1).max(10).step(0.1).listen()
    gui.add(graphics, 'showLabels').listen()
    gui.add(graphics, 'showInfo').listen()
    gui.add(graphics, 'showData').listen()
    gui.add(graphics, 'clearFrames').listen()
    let aud = gui.addFolder('audio')
    aud.add(audio, 'muted').listen().onChange(toggleMute)
    aud.add(audio, 'fftSize', [1024, 2048, 4096, 8192]).listen()
    aud.close()
    gui.addColor(graphics, 'foreground').listen()
    gui.addColor(graphics, 'background').listen()
    gui.add(graphics, 'fontsize').min(0).max(100).step(1)
    gui.add(graphics, 'lineheight').min(0).max(2).step(0.1)
    gui.add(graphics, 'fps').min(1).max(60).step(1)
    gui.add(graphics, 'showFps').onChange((y) => {
        document.querySelector('#stats').style.display = y ? 'block': 'none'
    })
    gui.add(graphics, 'fullscreen').listen().onChange(toggleFullscreen)
    gui.remember(graphics)
//    dat.GUI.toggleHide()

    var script = document.createElement('script')
    script.onload = function() {
        var stats = new Stats()
        stats.dom.id = 'stats'
        stats.dom.style.display = graphics.showFps ? 'block' : 'none'
        document.body.appendChild(stats.dom)
        requestAnimationFrame(function loop() {
            stats.update()
            requestAnimationFrame(loop)
        })
    }
    script.src = 'stats.min.js'
    document.head.appendChild(script)
}

setup()
loop()
controls()


