import { initEvents, resizeGraphics, toggleControls } from './gui'
import { version, graphics, audio } from './data'
import { captureAudio, initAudio, analyseAudio } from './audio'

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
        graphics.ctx.fillText(`${label} ` +
            `(${Math.floor(x)},${Math.floor(y)})`, x + 10, y + 10)
    }
}

const renderInfo = (info) => {
    if (!graphics.showInfo)
        return

    let lineno = 1
    let lineheight = graphics.fontsize * graphics.lineheight
    
    graphics.ctx.save()
    graphics.ctx.textBaseline = 'middle'
    graphics.ctx.fillStyle = graphics.foreground
    graphics.ctx.translate(24, 28)

    if (graphics.showData) {
        if (graphics.mode === 'tree')
            info = info.concat([
                `total branches: ${graphics.tree.totalbranches}`,
                `tree depth: ${graphics.tree.depth}`,
                `branch factor: ${graphics.tree.branchFactor}`,
                `branch angle: ${graphics.tree.branchAngle.toFixed(2)}`,
                `grow factor: ${graphics.tree.growFactor.toFixed(2)}`,
                `zoom level: ${graphics.tree.zoomLevel.toFixed(2)}`,
                `linewidth: ${graphics.lineWidth}`,
            ])
        if (graphics.mode === 'oscope')
            info = info.concat([
                `linewidth: ${graphics.lineWidth.toFixed(2)}`,
                `dashwidth: ${graphics.lineDWidth.toFixed(2)}`,
            ])
        if (graphics.mode === 'bars')
            info = info.concat([
                `bar width: ${graphics.bars.width.toFixed(2)}`,
                `bar height: ${graphics.bars.height.toFixed(2)}`,
            ])
        info = info.concat([
            `background: ${graphics.background}`,
            `foreground: ${graphics.foreground}`,
            `fps: ${graphics.fps}`,
        ])
    }

    if (audio.muted)
        info = info.slice(0,1)
            .concat([`audio: muted`])
            .concat(info.slice(1))

    info.forEach((line, lineno) => {
        graphics.ctx.fillText(line, 0, lineno * lineheight)
    })
    graphics.ctx.restore()
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
    for (let i = 0, x = 0; i < audio.freqData.length; i++) {
        barHeight = audio.freqData[i] * graphics.bars.height
        graphics.ctx.fillStyle = graphics.foreground
        graphics.ctx.fillRect(x, graphics.ch - barHeight, barWidth, barHeight)
        x += barWidth + graphics.bars.gap
    }
    graphics.ctx.restore()
}

const renderTree = (x1, y1, length, angle, depth) => {
    if(depth === 0 || !audio.waveData) return

    let x2 = x1 - length * Math.sin(angle * Math.PI / 180)
    let y2 = y1 - length * Math.cos(angle * Math.PI / 180)
    let x2middle = (x1 + x2) / 2
    let y2middle = (y1 + y2) / 2
    let freq = audio.midFreqs.map(f => f.amount)
        .reduce((f1, f2) => Math.max(f1, f2))
    // shaky
//    let waveSum = graphics.tree.growFactor * length + graphics.ch / 
//            (audio.waveData[random(0, audio.waveData.length - 1)] + 1)
    length = graphics.tree.growFactor * length + 0.2 * freq
    angle += graphics.tree.branchAngle
    depth -= 1

    graphics.ctx.save()
    graphics.tree.totalbranches++
    renderLabel(`${graphics.tree.totalbranches}`, x2, y2)
    graphics.ctx.beginPath()
    graphics.ctx.moveTo(x1, y1)
    if (graphics.lineDiff)
        graphics.ctx.lineWidth = depth * graphics.lineWidth
    if (graphics.lineCurve) {
        graphics.ctx.quadraticCurveTo(graphics.cw / 2, 
            graphics.ch / 2, x2middle, y2middle)
        graphics.ctx.moveTo(x2middle, y2middle)
        graphics.ctx.lineTo(x2, y2)
    } else {
        graphics.ctx.lineTo(x2, y2)
    }
    if (graphics.tree.totalbranches > 1)
        graphics.ctx.stroke()

    for (let i = 0; i < graphics.tree.branchFactor; i++) {
        renderTree(x2, y2, length, angle + graphics.angleEach * i, depth) 
    }
    graphics.ctx.restore()
}

const render = () => {
    analyseAudio()

    // common
    graphics.ctx.globalCompositeOperation = graphics.composition
    if (graphics.clearFrames) {
        graphics.ctx.fillStyle = graphics.background
        graphics.ctx.fillRect(0, 0, graphics.cw, graphics.ch)
    }
    graphics.ctx.font = `${graphics.fontsize}px sans-serif`
    graphics.ctx.lineWidth = graphics.lineWidth
    graphics.ctx.strokeStyle = `${graphics.foreground}`
    graphics.lineDWidthSpeed += 0.001

//    graphics.lineDWidth = Math.abs(
//        Math.sin(graphics.lineDWidthSpeed)
//    ) * 20 + 1
    graphics.ctx.setLineDash([graphics.lineDWidth])

    // zoom
    if(graphics.tree.zoomLevel <= graphics.tree.zoomMin)
        graphics.tree.zoomIncrease = true
    if(graphics.tree.zoomLevel >= 
        random(graphics.tree.zoomMax / 2, graphics.tree.zoomMax))
        graphics.tree.zoomIncrease = false
    let zoomDelta = graphics.tree.zoomIncrease ? 
        graphics.tree.zoomSpeed / 100 : -(graphics.tree.zoomSpeed / 100)
    graphics.tree.zoomLevel += zoomDelta

    // mode
    if (graphics.mode === 'tree') {
        graphics.tree.totalbranches = 0
        graphics.tree.branchAngle += graphics.tree.rotationSpeed / 100
        graphics.angleEach = 360 / graphics.tree.branchFactor
        graphics.tree.growSpeed += 0.001
        graphics.tree.growFactor = Math.abs(
            Math.sin(graphics.tree.growSpeed) * 1.5
        )
        renderTree(graphics.x, graphics.y + graphics.tree.zoomLevel, 
            graphics.tree.zoomLevel, 0, graphics.tree.depth)
    } else if (graphics.mode === 'oscope') {
        renderOscilloscope()
    } else if (graphics.mode === 'bars') {
        renderBars()
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
//    captureAudio().then(initAudio)
}

const renderLoop = () => {
    render()
    setTimeout(() => {
        requestAnimationFrame(renderLoop)
    }, 1000 / graphics.fps)
}

const timeLoop = () => {
    let startTime = new Date()
    setInterval(() => {
        let time = new Date()
        if ((time - startTime) / 1000 < 10) return
        if (time.getSeconds() === 42) {
            let bFactorDelta = 0
            if (graphics.tree.branchFactor >= 16) {
                graphics.tree.branchIncrease = false
            } else if (graphics.tree.branchFactor <= 2) {
                graphics.tree.branchIncrease = true
            }
            if (graphics.tree.branchIncrease && graphics.tree.depth < 5) {
                bFactorDelta = 1
            } else if (!graphics.tree.branchIncrease) {
                bFactorDelta = -1
            }
            graphics.tree.branchFactor += bFactorDelta
        }
        if (random(0, time.getSeconds()) === 42 ) {
            graphics.tree.depth += 
            graphics.tree.branchFactor < 10 ?
                1 : graphics.tree.depth <= 3 ? 0 : -1 
            graphics.tree.rotationSpeed += 2
        }
    }, 1000)
}

setup()
renderLoop()
timeLoop()
toggleControls()
