/**
 * Transforms an asynchronous function using Node JS callbacks
 * into a promise-style asynchronous function
 * 
 * @param {Function} fn - The function to be transformed
 */
function promisify(fn) {
    if(typeof fn !== 'function') throw new Error('fn must be a function')
    const len = fn.length
    return function () {
        const args = Array.prototype.slice.call(arguments, 0, len - 1)
        return new Promise((resolve, reject) => {
            fn.call(this, ...args, (err, result) => {
                if(err) reject(err)
                else resolve(result)
            })
        })
    }
}

module.exports = promisify