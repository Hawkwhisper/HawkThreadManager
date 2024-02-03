/**
 * Sends an IPC message
 * @param {*} message 
 */
self.reply = (message) => {
    self.postMessage(message)
}