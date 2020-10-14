/**
 * Inverts a predicate
 * 
 * @param {Function} predicate - The predicate to be inverted
 * @returns {Function} the inverted predicate
 */
function not(predicate) {
    return value => !predicate(value)
}

/**
 * Checks if a value is undefined or not
 * 
 * @param {Any} value - The input value
 * @returns {Boolean} `true`, if the input is `undefined`, `false` otherwise
 */
function isUndefined(value) {
    return value === undefined
}

module.exports = {
    not,
    isUndefined
}