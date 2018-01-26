import { graphics, audio } from './data'

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

export { captureAudio, loadDraggedAudio, analyseAudio }
