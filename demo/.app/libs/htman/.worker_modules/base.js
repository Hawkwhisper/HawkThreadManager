// The command to be executed by the main program, parsed from an external source
self.$exec = '/*#command*/';

// Shared data storage for communication with the main program
self.$shares = {};

// Flag indicating whether the initialization has been performed
let $__initialized = false;

// Function to send a termination message to the main program
self.destroy = () => self.sendMessage({ terminate: true })

// Event listener for messages from the main program
self.onmessage = function (message) {
    // Extract relevant information from the incoming message
    const { method, data, label } = message.data;

    // Switch statement to handle different message methods
    switch (method) {
        case 'tick':
            // Perform initialization if not done already
            if (!$__initialized) {
                $__initialized = true;
                $initializer(); // Placeholder for an initialization function
            }

            // Execute the specified command from external source
            $exec(); // Placeholder for the parsed command

            break;

        case 'shareSet':
            // Update shared data based on the provided label
            self.$shares[label] = data;
            break;
    }
}
