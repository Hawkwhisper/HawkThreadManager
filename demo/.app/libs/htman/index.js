const __isNode__ = typeof process !== 'undefined' && process.versions && process.versions.node;
class ThreadManager {
    //-- > :: PRIVATE :: Internal Variables
    _shares = {};
    _workers = [];

    //-- > :: PRIVATE :: Getter Functions

    /** Returns a bunch of code from whatever is in the .worker_modules directory
     * @private
     * @param {function} command 
     * @returns 
     */
    _getModules(command) {
        let results = "";

        const fixString = string => string.replace(/\'\/\*\#command\*\/\'/gm, command)

        // Check if running in Node.js environment
        if (__isNode__) {
            const { readFileSync, readdirSync } = require('fs');
            const { resolve } = require('path');
            readdirSync(resolve(__dirname, '.worker_modules')).map(file => {
                results += `//${file}\n${readFileSync(resolve(__dirname, '.worker_modules', file), 'utf-8')}\n//--end of ${file}\n\n`;
            });
        } else {
            // If not in Node.js, assume it's in a browser environment
            const modulePromises = ['assignKeys.js', 'async.js', 'base.js', 'reply.js'].map(async (file) => {
                const response = await fetch(`.worker_modules/${file}`);
                const moduleCode = await response.text();
                results += `//${file}\n${moduleCode}\n//--end of ${file}\n\n`;
            });

            // Wait for all module fetches to complete
            return Promise.all(modulePromises).then(() => results);
        }
        return fixString(results);
    }

    /** Creates a Blob containing the worker code based on provided parameters.
    * @param {string} uid - Unique identifier for the thread.
    * @param {function} command - Function to execute in the thread.
    * @param {string} inject - Code to inject into the thread (optional).
    * 
    */
    _makeBlob(initializer, command) {
        const $command = (`${command.toString()}`);
        const $initializer = `${initializer.toString()}`;
        const workerCode = `
            const $index = ${this._workers.length};
            $initializer = ${$initializer};
            ${this._getModules($command)}
        `;

        return URL.createObjectURL(new Blob([workerCode], { type: 'application/javascript' }));
    }

    //-- > Initializer Functions
    constructor() {
    }

    /** Creates a Shared buffer
     * @param {string} share_identifier - The label to give this share so others can access it easier
     * @param {number} length - The length
     * @param {ArrayBuffer} arrayType - The type of array buffer
     * @returns {ArrayBuffer} buffer
     * 
     * @note Array buffer types:
     *      Integers:
     * Int8Array - 1 byte per element (8-bit signed integer)
     * Uint8Array - 1 byte per element (8-bit unsigned integer)
     * Int16Array - 2 bytes per element (16-bit signed integer)
     * Uint16Array - 2 bytes per element (16-bit unsigned integer)
     * Int32Array - 4 bytes per element (32-bit signed integer)
     * Uint32Array - 4 bytes per element (32-bit unsigned integer)
     * 
     *      Floating Point:
     * Float32Array - 4 bytes per element (32-bit floating point)
     * Float64Array - 8 bytes per element (64-bit floating point)
     * 
     *      Specialized:
     * BigInt64Array - 8 bytes per element (64-bit signed integer using BigInt)
     * BigUint64Array - 8 bytes per element (64-bit unsigned integer using BigInt)
     */
    createSharedBuffer(share_identifier, length, arrayType) {
        const bytes = length * arrayType.BYTES_PER_ELEMENT;
        const Share = new arrayType(new SharedArrayBuffer(bytes));
        this._shares[share_identifier] = Share;
        this._workers.forEach(worker => worker.postMessage({ method: "shareSet", label: share_identifier, data: Share }));
        return Share;
    }

    /** Resizes a shared buffer
     * 
     * @param {string} share_identifier - The name of the buffer to modify
     * @param {number} new_length - The new length
     * @param {ArrayBuffer} arrayType - The targeted type
     * @returns {ArrayBuffer} buffer
     */
    resizeShare(share_identifier, new_length, arrayType) {
        const oldBuffer = this._shares[share_identifier].buffer;

        if (!oldBuffer || !(oldBuffer instanceof SharedArrayBuffer)) {
            console.error(`Invalid or non-existent SharedArrayBuffer for identifier: ${share_identifier}`);
            return;
        }

        const bytes = new_length * arrayType.BYTES_PER_ELEMENT;
        const newBuffer = new arrayType(new SharedArrayBuffer(bytes));

        // Update the reference to the new buffer
        this._shares[share_identifier] = newBuffer;

        // Notify workers about the resized buffer
        this._workers.forEach(worker => worker.postMessage({ method: "shareSet", label: share_identifier, data: newBuffer }));

        return newBuffer;
    }


    /** Creates a new worker to run a command.
     * @param {function} initialize - Runs only once
     * @param {function} command - Runs every time tick is called
     * @returns 
     * 
     * Tasks have the following built in variables/functions:
     * 
     *  * $exec() will execute itself, recommended to leave this alone as 
     *            the "tick" request usually calls this.
     *  * $shares is an object that stores all shared arrays between the main 
     *            thread and worker threads
     *  * $index will return the thread index. Used for shared memory
     *  * destroy() will terminate the thread.
     *  * assignKeys() Acts the same as ThreadManager's assignKeys function.
     */
    async task(initialize, command) {
        return new Promise(async (resolve, reject) => {
            try {
                const uid = this._workers.length;
                const blob = this._makeBlob(initialize, command);
                const worker = new Worker(blob);

                worker._events = { message: [] };

                worker.destroy = () => {
                    this._workers[uid].terminate();
                    delete this._workers[uid];
                };
               
                worker.on = function (evt, func) {
                    if (!worker._events[evt]) worker._events[evt] = [];
                    worker._events[evt].push(func);
                }

                worker.onmessage = (event) => {
                    // Check if the worker should be terminated based on the message received
                    if (event.data.terminate) {
                        worker.terminate();
                    } else {
                        worker._events.message.forEach(func => func(event))
                    }
                };

                worker.tick = () => worker.postMessage({ method: "tick" });
                for (let label in this._shares) {
                    worker.postMessage({ method: "shareSet", label, data: this._shares[label] })
                }
                this._workers.push(worker);
                resolve(worker);
            } catch (e) {
                reject(e);
            }
        })
    }


    /** Creates keyname references to access shared memory chunks.
     * @param {string} label - The name of the shared object to apply this to
     * @param {['a','b','c','etc']} variableNames - The names of the items inside of the generated object.
     * @returns 
     * 
     * @example
     * const large_buffer = Manager._shares['particles']; //huge list of numbers
     * const partData = Manager.assignKeys('particles', ['x','y'])
     * for(let i=0;i<particle_count;i++) {
     *     const particle = partData[i];
     *     particle.x++;
     *     particle.y++
     * }
     */
    assignKeys(label, variableNames) {
        const data = this._shares[label];
        if (!data) {
            console.error("Data not found for label:", label);
            return [];
        }

        const result = [];
        const chunkSize = variableNames.length;

        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = variableNames.reduce((acc, key, j) => {
                acc[key] = this._shares[label][i + j][j];
                return acc;
            }, {});

            for (let j = 0; j < variableNames.length; j++) {
                const dataIndex = i + j;
                const key = variableNames[j];
                chunk[key] = this._shares[label][dataIndex];

                Object.defineProperty(chunk, key, {
                    get: () => this._shares[label][dataIndex],
                    set: (value) => { this._shares[label][dataIndex] = value; },
                    enumerable: true,
                    configurable: true
                });
            }
            result.push(chunk);
        }

        return result;
    }

    //-- > Getter Functions

    /**
     * Gets the shares and workers as an object.
     * @returns {Object} Object containing shares and workers.
     */
    getAll() {
        return {
            shares: this._shares,
            workers: this._workers,
        };
    }

    /**
     * Gets the shares.
     * @returns {Object} Object containing shares.
     */
    getShares = () => this._shares;

    /**
     * Gets the workers.
     * @returns {Object} Object containing workers.
     */
    getWorkers = () => this._workers;
}

if (__isNode__) {
    module.exports = ThreadManager;
} else {
    window.ThreadManager = ThreadManager;
}