import { initEvents, resizeGraphics, toggleControls } from './gui'
import { version, graphics, audio } from './data'

const random = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

const hexToRgb = (hex) => {
    let result = /^#?([a-f\d]{1,2})([a-f\d]{1,2})([a-f\d]{1,2})$/i.exec(hex)
    return [parseInt(result[1], 16), 
            parseInt(result[2], 16), 
            parseInt(result[3], 16)]
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
                `tree depth: ${graphics.tree.depth}`,
                `branch factor: ${graphics.tree.branchFactor}`,
                `branch angle: ${graphics.tree.branchAngle.toFixed(0)}`,
                `grow factor: ${graphics.tree.growFactor}`,
                `zoom level: ${graphics.tree.zoomLevel.toFixed(0)}`,
                `linewidth: ${graphics.lineWidth}`,
            ])
        if (graphics.mode === 'oscope')
            info = info.concat([
                `linewidth: ${graphics.lineWidth.toFixed(2)}`,
                `dashwidth: ${graphics.lineDWidth.toFixed(2)}`,
            ])
        if (graphics.mode === 'bars')
            info = info.concat([
                `bar height: ${graphics.bars.height.toFixed(2)}`,
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
        length = graphics.tree.growFactor * length + graphics.ch / (audio.waveData[random(0, audio.waveData.length - 1)] + 1)
    } else {
        length = graphics.tree.growFactor * length - graphics.ch / 100
    }

    renderLabel(`${graphics.totalbranches}`, x2, y2)

    // draw
    graphics.ctx.beginPath()
    graphics.ctx.moveTo(x1, y1)
    if (graphics.lineDiff)
        graphics.ctx.lineWidth = depth * graphics.lineWidth
    if (graphics.lineCurve) {
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
    let a1 = graphics.tree.branchFactor * graphics.angleEach
    for (let i = 0; i < graphics.tree.branchFactor; i++, a1 += graphics.angleEach) {
        renderTree(x2, y2, length, angle, treeAngle + graphics.tree.branchAngle + a1, depth - 1)
    }
}

const renderOscilloscope = () => {
    if (!audio.waveData) return
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
    if (!audio.freqData) return
    graphics.ctx.save()
    let barHeight
    let barWidth = graphics.cw / audio.freqData.length + graphics.bars.width
    for (let i = 0, x = 0; i < audio.freqData.length; i++, x += barWidth + graphics.bars.gap) {
        barHeight = audio.freqData[i] * graphics.bars.height
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
    graphics.ctx.lineWidth = graphics.lineWidth
    graphics.ctx.strokeStyle = `${graphics.foreground}`
    graphics.ctx.setLineDash([graphics.lineDWidth])
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
    if(graphics.tree.zoomLevel <= graphics.tree.zoomMin)
        graphics.tree.zoomIncrease = true
    if(graphics.tree.zoomLevel >= random(graphics.tree.zoomMax / 2, graphics.tree.zoomMax))
        graphics.tree.zoomIncrease = false
    let zoomDelta = graphics.tree.zoomIncrease ? 
        graphics.tree.zoomSpeed / 100 : -(graphics.tree.zoomSpeed / 100)
    graphics.tree.zoomLevel += zoomDelta

    if (graphics.mode === 'tree') {
        graphics.totalbranches = 0
        graphics.tree.branchAngle += graphics.tree.rotationSpeed / 100
        graphics.angleEach = 360 / graphics.tree.branchFactor
        renderTree(graphics.x, graphics.y + graphics.tree.zoomLevel, graphics.tree.zoomLevel, 
            +graphics.tree.branchAngle.toFixed(2), 0, graphics.tree.depth, 0)
    } else if (graphics.mode === 'oscope') {
        renderOscilloscope()
    } else if (graphics.mode === 'bars') {
        renderBars()
    } else if (graphics.mode === 'dots') {
    }

    renderInfo(graphics.info)
}

const setup = () => {
    audio.ctx = new AudioContext()
    audio.analyser = audio.ctx.createAnalyser()
    graphics.canvas = document.querySelector('canvas')
    graphics.ctx = graphics.canvas.getContext('2d', { alpha: false })
    graphics.info = graphics.defaultInfo
    resizeGraphics()
    initEvents()
}

const loop = () => {
    render()
    setTimeout(() => {
        requestAnimationFrame(loop)
    }, 1000 / graphics.fps)
}

// TODO support all browsers webkit, moz, ie
const prefix = (name) => {
    //if (name in window) return name
}

setup()
loop()
toggleControls()
