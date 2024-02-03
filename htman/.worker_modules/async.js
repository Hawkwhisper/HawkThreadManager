/**
 * Asynchronously iterates over an array of objects with customizable rules and callbacks.
 *
 * @param {Array} object_array - The array of objects to be iterated asynchronously.
 * @param {Object} rules - Customizable rules for iteration (e.g., start and end indices).
 * @param {number} interupt - Time interval (in milliseconds) to yield control and allow other tasks.
 * @param {Function} processor - Asynchronous function to process each item in the array.
 * @param {Function} onYield - Asynchronous callback called when control is yielded after the specified interval.
 * @param {Function} onError - Asynchronous callback called on any processing error.
 * @param {Function} onFinish - Asynchronous callback called when iteration finishes.
 * @returns {Promise} - A promise that resolves when the iteration is complete.
 */
async function asyncIterator(
  object_array,
  rules = { start: 0, end: object_array.length },
  interupt = 16.6,
  processor = async (item, index) => {},
  onYield = async (index) => {},
  onError = async (error) => {},
  onFinish = async (object_array) => {}
) {
  // Destructure rules to get start and end indices
  const { start, end } = rules;

  // Convert interupt to a number
  interupt = Number(interupt);

  try {
    // Create the generator function
    async function* gen() {
      var timer = performance.now();
      while (true) {
        for (let i = start; i < end; i++) {
          // Allow a break from the loop after the specified interupt ms
          if (performance.now() > timer + interupt) {
            timer = performance.now() + interupt;
            yield i;
          }
          try {
            // Process each item asynchronously
            await processor(object_array[i], i);
          } catch (e) {
            // Handle errors during processing
            onError(e);
            return Promise.reject(e);
          }
        }
        return;
      }
    }

    // Create an updater
    const updater = gen();

    // Recursive function to update and continue processing
    async function update() {
      const next = await updater.next();
      if (next.done) {
        // Processing finished, trigger the onFinish callback
        onFinish(object_array);
        return Promise.resolve(object_array);
      } else {
        // Control yielded, trigger the onYield callback and continue processing
        onYield(next.value);
        update();
      }
    }

    // Start the asynchronous update process
    update();
  } catch (e) {
    // Handle any unexpected errors
    onError(e);
    return Promise.reject(e);
  }
}

self.asyncIterator = asyncIterator;