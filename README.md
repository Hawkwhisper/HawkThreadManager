# Hawk Thread Manager <span style='font-size: .6em;'><u>htman</u> - Efficient multi-threadding in JS</span>

This is a versatile JavaScript class designed to simplify the management of web workers and shared buffers, allowing for efficient parallel processing in both Node.js and browser environments.

## Features

- <u>**Web Workers Management**</u>
  <br>
  Easily create and manage worker threads to execute parallel tasks.
- <u>**Shared Buffers**</u>
  <br>
  Efficiently share data between the main thread and worker threads using shared buffers.
- <u>**Asynchronous Task Execution**</u>
  <br>
  Execute tasks asynchronously, making the most of parallel processing capabilities.
- <u>**Simple API**</u>
  <br>
  A straightforward API that abstracts the complexities of working with web workers and shared buffers.

## Usage

**Initialization**

```js
const manager = new ThreadManager()
```

**Creating Shared Buffers**

```js
const sharedBuffer = manager.createSharedBuffer(
  'exampleBuffer',
  100,
  Int32Array
)
```

**Creating and Running Tasks**

```js
const initialize = () => {
  /* Initialization code */
}
const command = () => {
  /* Task execution code */
}

manager
  .task(initialize, command)
  .then(worker => {
    // Task is running in a separate worker thread
    // Access shared buffers, manage data, and more
  })
  .catch(error => {
    console.error('Error creating task:', error)
  })
```

**Managing Shared Memory**

```js
const particleData = manager.assignKeys('exampleBuffer', ['x', 'y', 'z'])
for (let i = 0; i < particleData.length; i++) {
  // Access and manipulate shared memory efficiently
  particleData[i].x++
  particleData[i].y++
  particleData[i].z++
}
```

**Additional Functions**

```js
const allData = manager.getAll()
const allShares = manager.getShares()
const allWorkers = manager.getWorkers()
```

**Compatibility**

Hawk Thread Manager works seamlessly in both Node.js and browser environments, offering a unified solution for parallel processing tasks. For browsers, just use the class name "ThreadManager" as reference without trying to require it as a module.

## Workers

Since the worker code is generated, here are a list of default worker modules (located in the hidden folder .worker_modules):

### assignKeys.js

This function creates keyname references to access shared memory chunks.

#### Parameters

- `label` (String): The name of the shared object to apply this to.
- `variableNames` (Array): The names of the items inside the generated object.

#### Returns

An array of objects with keyname references to access shared memory chunks.

#### Example

> ```javascript
> const assignedData = assignKeys('exampleBuffer', ['x', 'y', 'z'])
> assignedData.forEach(item => {
>   item.x++ // Modies the items X position
>   item.y++ // Modies the items Y position
>   item.z++ // Modies the items Z position
> })
>
> // Note: assignedData is now an array of objects containing X/Y and Z values that point directly to the proper index of the shared buffer array
> ```

---

### async.js

This asynchronous utility function processes items in an array at a specified interval.

#### Parameters

- `object_array` - (Array)
  <br>
  The array of items to process.
- `interupt` - (Number, optional)
  <br>
  The interval duration in milliseconds (default: 16.6ms).
- `processor` (Function)
  <br>
  The asynchronous function to process each item.

- `onYield` - (Function)
  <br>
  The asynchronous function to execute after each yield.
- `onError` - (Function)
  <br>
  The asynchronous function to handle errors.
- `onFinish` - (Function)
  <br>
  The asynchronous function to execute when processing finishes.

#### Example

> ```js
> const data = [...]; // Array of items to process
> asyncIterator(data, 20, async (item, index) => {
>     // Process each item asynchronously
> }, async (index) => {
>     // Execute after each yield
> }, async (error) => {
>     // Handle errors
> }, async (object_array) => {
>     // Execute when processing finishes
> });
> ```

---

### base.js

This is the base script for web worker initialization and execution.

#### Functions

- `destroy`() - Terminates the worker.

#### Example

```js
try {
  ///some code?
} catch (e) {
  self.destroy()
}
```

---

### reply.js

This script provides a simple function to send a message from the worker.

#### Function

- `reply`(message) - Sends a message from the worker.

#### Example

```js
//main.js
htman.task(...).then(worker=>{
  worker.on('message', e=>{
    console.log(e.data);
  });
});

//worker.js
 try {
  ///some code?
  self.reply('Success!');
 } catch(e) {
  self.reply('Error!', e);
 }
```


 ># Demo
 > The Demo is a water simulation, a batch of particles making use of 10 workers to visualize water physics with 21,000+ particles

# Install
`npm install`

 ## Run
`npm start`

### Requires:
Electron.


#### Notes:
If using linux, try to use a wayland compositor if you're on Nvidia, web content with Nvidia Proprietary drivers on linux has a tiny rendering bug, also it forcefully sets some kind of janky synchronization so its all kinds of hecc. AMD Recommended on Linux, though oddly enough if you do force a wayland compositor to work with Nvidia (sway, hyprland, etc) it seems to be okay? Idk, nvidia+linux be weird mang