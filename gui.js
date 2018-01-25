import dat from 'dat.gui'
import Stats from 'stats.js'
import { graphics, audio } from './data'
import { captureAudio, loadDraggedAudio, analyseAudio } from './audio'

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
        } else if (event.deltaY > 0 && graphics.tree.zoom.level >= 5) {
            zoomDelta = -5
        }
        graphics.tree.zoom.level += zoomDelta 
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

const toggleControls = () => {
    let gui = new dat.GUI()
    gui.add(graphics, 'mode', ['tree', 'oscope', 'bars']).listen()
    let tree = gui.addFolder('tree')
    tree.add(graphics.tree, 'depth').min(2).max(10).step(1).listen()
    tree.add(graphics.tree, 'branchFactor').min(1).max(16).step(1).listen()
    tree.add(graphics.tree, 'branchAngle').min(0).max(360).step(1).listen()
    tree.add(graphics.tree, 'growFactor').min(0).max(5).step(0.01).listen()
    tree.add(graphics.tree, 'rotationSpeed').min(0).max(250).step(0.1).listen()
    let zoom = tree.addFolder('zoom')
    zoom.add(graphics.tree.zoom, 'level').min(graphics.tree.zoom.minlevel).max(graphics.tree.zoom.maxlevel).step(1).listen()
    zoom.add(graphics.tree.zoom, 'speed').min(0).max(250).step(1).listen()
    zoom.close()
    tree.close()
    let oscope = gui.addFolder('oscope')
    oscope.close()
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
    common.add(graphics, 'showFps').onChange((y) => {
        document.querySelector('#stats').style.display = y ? 'block': 'none'
    })
    common.add(graphics, 'fullscreen').listen().onChange(toggleFullscreen)
    common.open()
    gui.remember(graphics)
//    dat.GUI.toggleHide()

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
