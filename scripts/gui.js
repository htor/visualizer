import dat from 'dat.gui'
import Stats from 'stats.js'
import { graphics, audio } from './data'
import { captureAudio, loadDraggedAudio, initAudio } from './audio'
import { random, randomColor, vendorPrefixed, vendorPrefix } from './utils'

document.exitFullscreen = 
    vendorPrefixed('exitFullscreen', document) ||
    vendorPrefixed('cancelFullScreen', document)
document.documentElement.requestFullscreen = 
    vendorPrefixed('requestFullscreen', document.documentElement) || 
    vendorPrefixed('requestFullScreen', document.documentElement)

const disableEvent = (event) => {
    event.stopPropagation()
    event.preventDefault()
}

const showError = (err) => {
    console.error(err)
    graphics.info = [`error: ${err.message.toLowerCase()}`]
}

const resizeGraphics = () => {
    graphics.cw = graphics.canvas.width = window.innerWidth
    graphics.ch = graphics.canvas.height = window.innerHeight
    graphics.x = graphics.cw / 2
    graphics.y = graphics.ch / 2
}

const initEvents = () => {
    window.addEventListener('resize', resizeGraphics)
    window.addEventListener('dragleave', disableEvent)
    window.addEventListener('dragenter', disableEvent)
    window.addEventListener('dragover', disableEvent)

    window.addEventListener('drop', (event) => {
        loadDraggedAudio(event)
            .then(initAudio)
            .catch(showError)    
    })
    window.addEventListener('keydown', (event) => {
        if (event.key === 'f') {
            toggleFullscreen()
        } else if (event.key === 'r') {
            captureAudio()
                .then(initAudio)
                .catch(showError)
        } else if (event.key === 'm') {
            audio.muted = !audio.muted
            toggleMute()
        } else if (event.key === 'q') {
            graphics.showFps = !graphics.showFps
            document.querySelector('#stats')
                .style.display = graphics.showFps ? 'block': 'none'
        } else if (event.key === 'i') {
            graphics.showInfo = !graphics.showInfo
        } else if (event.key === 'd') {
            graphics.showData = !graphics.showData
        } else if (event.key === 'c') {
            graphics.foreground = randomColor()
            graphics.background = randomColor()
        } else if (/^[0-9]$/.test(event.key)) {
            let index = Number(event.key)
            if (index === 0 || index > graphics.modes.length - 1) 
                return
            graphics.mode = graphics.modes[index]
        } else if (event.key === '?') {
            graphics.mode = graphics.modes[0]
        }
    })

    vendorPrefix('fullscreenchange').forEach(eventName => {
        window.addEventListener(eventName, (event) => {
            document.fullscreenElement =
                vendorPrefixed('fullscreenElement', document) ||
                vendorPrefixed('fullScreenElement', document)
            if (!document.fullscreenElement) {
                graphics.showFullscreen = false
            }
        })
    })
    
    window.addEventListener('wheel', event => {
        event.preventDefault()
        let zoomDelta = 0
        if (event.deltaY < 0) {
            zoomDelta = 5
        } else if (event.deltaY > 0 && graphics.tree.zoomLevel >= 5) {
            zoomDelta = -5
        }
        graphics.tree.zoomLevel += zoomDelta 
        graphics.spiral.zoomLevel += zoomDelta
    })
}

const toggleMute = () => {
    if (!audio.source) return
    if (audio.muted) {
        audio.source.disconnect(audio.ctx.destination)
    } else {
        audio.source.connect(audio.ctx.destination)
    }
}

const toggleFullscreen = () => {
    if (graphics.fullscreen) {
        document.exitFullscreen()
        graphics.fullscreen = false
    } else {
        document.documentElement.requestFullscreen()
        graphics.fullscreen = true
    }
}

const toggleControls = () => {
    let gui = new dat.GUI()
    gui.add(graphics, 'mode', graphics.modes).listen()
    let tree = gui.addFolder('tree')
    tree.add(graphics.tree, 'depth').min(2).max(10).step(1).listen()
    tree.add(graphics.tree, 'branchFactor').min(1).max(16).step(1).listen()
    tree.add(graphics.tree, 'branchAngle').min(0).max(360).step(1).listen()
    tree.add(graphics.tree, 'rotationSpeed')
        .min(0).max(250).step(0.1).listen()
    tree.add(graphics.tree, 'growFactor').min(0).max(5).step(0.01).listen()
    tree.add(graphics.tree, 'zoomLevel')
        .min(graphics.tree.zoomMin).max(graphics.tree.zoomMax)
        .step(1).listen()
    tree.add(graphics.tree, 'zoomSpeed').min(0).max(250).step(1).listen()
    tree.close()
    let bars = gui.addFolder('bars')
    bars.add(graphics.bars, 'height').min(1).max(10).step(0.1).listen()
    bars.add(graphics.bars, 'width').min(0).max(10).step(1).listen()
    bars.add(graphics.bars, 'gap').min(-1).max(10).step(1).listen()
    bars.close()
    let aud = gui.addFolder('audio')
    aud.add(audio, 'muted').listen().onChange(toggleMute)
    aud.add(audio, 'fftSize', [1024, 2048, 4096, 8192]).listen()
    aud.close()
    let common = gui.addFolder('common')
    common.addColor(graphics, 'foreground').listen()
    common.addColor(graphics, 'background').listen()
    common.add(graphics, 'composition', [
        'source-over', 
        'hard-light',
        'soft-light',
        'difference',
    ]).listen()
    common.add(graphics, 'lineWidth').min(0).max(20).step(0.01).listen()
    common.add(graphics, 'lineDWidth').min(0).max(20).step(0.1).listen()
    common.add(graphics, 'lineCurve').listen()
    common.add(graphics, 'lineDiff').listen()
    common.add(graphics, 'showLabels').listen()
    common.add(graphics, 'showInfo').listen()
    common.add(graphics, 'showData').listen()
    common.add(graphics, 'clearFrames').listen()
    common.add(graphics, 'fontsize').min(0).max(100).step(1)
    common.add(graphics, 'lineheight').min(0).max(2).step(0.1)
    common.add(graphics, 'fps').min(1).max(60).step(1)
    common.add(graphics, 'showFps').listen().onChange(() => {
        document.querySelector('#stats').style.display = 
            graphics.showFps ? 'block': 'none'
    })
    common.add(graphics, 'fullscreen').listen().onChange(toggleFullscreen)
    common.close()
    dat.GUI.toggleHide()

    let stats = new Stats()
    stats.dom.id = 'stats'
    stats.dom.style.display = graphics.showFps ? 'block' : 'none'
    document.body.appendChild(stats.dom)
    requestAnimationFrame(function loop() {
        stats.update()
        requestAnimationFrame(loop)
    })

}

export { 
    initEvents, 
    resizeGraphics, 
    toggleControls, 
    toggleMute, 
    toggleFullscreen
} 
