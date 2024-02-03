/**
 * Assigns keys to chunks of data in the shared array based on the provided label and variable names.
 *
 * @param {string} label - The label identifying the shared data array.
 * @param {string[]} variableNames - An array of variable names to be assigned to each chunk.
 * @returns {Object[]} - An array of objects, each representing a chunk of data with assigned keys.
 */
function assignKeys(label, variableNames) {
    // Retrieve the shared data array based on the provided label
    const data = $shares[label];

    // If the data is not found, log an error and return an empty array
    if (!data) {
        console.error("Data not found for label:", label);
        return [];
    }

    // Initialize an array to store the resulting chunks of data
    const result = [];

    // Determine the size of each chunk based on the number of variable names
    const chunkSize = variableNames.length;

    // Iterate through the data array, creating chunks and assigning keys
    for (let i = 0; i < data.length; i += chunkSize) {
        // Create a chunk object and populate it with data based on variable names
        const chunk = variableNames.reduce((acc, key, j) => {
            acc[key] = $shares[label][i + j][j];
            return acc;
        }, {});

        // Define getters and setters for each variable in the chunk
        for (let j = 0; j < variableNames.length; j++) {
            const dataIndex = i + j;
            const key = variableNames[j];

            // Assign the current value and define getter/setter for dynamic access
            chunk[key] = $shares[label][dataIndex];
            Object.defineProperty(chunk, key, {
                get: () => $shares[label][dataIndex],
                set: (value) => { $shares[label][dataIndex] = value; },
                enumerable: true,
                configurable: true
            });
        }

        // Add the created chunk to the result array
        result.push(chunk);
    }

    // Return the array of objects representing chunks with assigned keys
    return result;
}