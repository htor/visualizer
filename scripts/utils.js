const random = (min, max) =>
    Math.floor(Math.random() * (max - min + 1) + min)

const randomColor = () =>
    [0, 0, 0].map(c => random(0, 255)).concat(1.0)

const rgbaString = (rgba) => {
    return 'rgba(' +
        rgba.slice(0, 3)
        .map(Math.floor)
        .concat(rgba[3])
        .join() + ')'
}

const vendorPrefixed = (prop, target) => {
    return ['', 'ms', 'moz', 'webkit'].map((p, i) =>
        p + (i > 0 ? prop.charAt(0).toUpperCase() + prop.slice(1) : prop)
    ).map(prefixedProp => target[prefixedProp])
    .filter(prefixed => prefixed)[0]
}

const vendorPrefix = (str) =>
    ['', 'ms', 'moz', 'webkit'].map(prefix => prefix + str)

export { random, randomColor, rgbaString, vendorPrefixed, vendorPrefix }

