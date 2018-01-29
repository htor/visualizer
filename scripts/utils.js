const random = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

const randomColor = () => {
    return [0, 0, 0].map(c => random(0, 255)).concat(1.0)
}

const rgbaString = (rgba) => {
    return 'rgba(' +
        rgba.slice(0, 3)
        .map(Math.floor)
        .concat(rgba[3])
        .join() + ')'
}

const prefixed = (name, target) => {
    return ['', 'ms', 'moz', 'webkit'].map((p, i) =>
        p + (i > 0 ? name.charAt(0).toUpperCase() + name.slice(1) : name)
    ).map(pname => target[pname])
    .filter(prefixed => prefixed)[0]
}

export { random, randomColor, rgbaString, prefixed }

