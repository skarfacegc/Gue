[![Build Status](https://travis-ci.org/skarfacegc/Gue.svg?branch=master)](https://travis-ci.org/skarfacegc/Gue) [![Coverage Status](https://coveralls.io/repos/github/skarfacegc/Gue/badge.svg)](https://coveralls.io/github/skarfacegc/Gue) [![dependencies Status](https://david-dm.org/skarfacegc/Gue/status.svg)](https://david-dm.org/skarfacegc/Gue)

[![NPM](https://nodei.co/npm/gue.png?downloads=true)](https://nodei.co/npm/gue/)

# Gue
Gue (pronounced goo) is a task runner for node. Rather than relying on plugins
Gue provides a built in way to easily run shell commands. Gue also provides
automatic watching using the fileSets feature.

<!-- toc -->

## Installation
You can install gue globally with ```npm install -g gue``` and/or locally
with ```npm install -D gue```.  If installed in both places the global gue
will automatically use the locally installed gue (courtesy of [liftoff](https://www.npmjs.com/package/liftoff)).

## Usage
When you run gue it looks for ```guefile.js``` at the top level of your
project directory. The guefile is a module that contains your task
definitions and fileSets.

### CLI Example
```shell
# run the task named 'default'
% gue

# Run the coverage task
% gue coverage

# Run the coverage task and the lint task
# These tasks will start at the same time
% gue coverage lint

# List the tasks defined in guefile.js
% gue -l

# Specify an alternate config
% gue --config=foo.js
```

## Example guefile.js
```js
const gue = require('gue');
fileSet = gue.fileSet;

fileSet.add('allSrc', '**/*.js', 'lint');
fileSet.add('src', ['*.js','lib/*.js','bin/*.js'], 'test');
fileSet.add('unitTests', 'test/**/*.test.js', 'test');

// Run lint and test if no other tasks are specified
gue.task('default', ['lint','test']);

// Magic watching!
// Run the tasks for each fileSet whose glob matches the changed file
// the tasklist is de-duped
gue.task('watch', () =>{
  gue.smartWatch(fileSet);
});

// Run unit tests and capture code coverage
gue.task('test', () => {
  return gue.shell('nyc --reporter lcov --reporter text ' +
  'mocha ' + fileSet.getFiles('unitTests'));
});

// Run the linter
gue.task('lint', () => {
  return gue.shell('jscs ' + fileSet.getFiles('allSrc'));
});
```



### Tasks
Tasks define the actions you want to perform. A task consists of:
- a name
- an optional list of dependencies to run before running this task
- an optional function that is the code to be executed
- you must provide a dependency list or a function

**Notes:**
- Dependencies will execute in the order that they are listed


#### Task examples
```js

// if % gue is run without any arguments, run a and b tasks
gue.task('default', ['a']);

gue.task('a', ['b'], ()=>{
  return promiseMethod(args);
})

gue.task('b', () =>{
  return new Promise((resolve, reject)=>{
    setTimeout(resolve, 10);
  })
})
```


### File Sets
File sets are used by ```smartWatch``` to automatically run tasks based on
changed (updated, added, deleted, etc) files. File sets let you think in terms
of what needs to happen when a file changes, rather than just focusing on
tasks. They can help minimize task dependencies for convenience  and use task
dependencies for actual dependencies.

File sets are defined with a name, a list of globs, and an optional task name
to execute if a file change is detected by ```smartWatch```. The globs are
processed with [multimatch](https://www.npmjs.com/package/multimatch).

The FileSet object provides two methods that can be called in your task actions.

- ```fileSet.getGlobs(setName)``` returns the globs that you specified. This is
preferred to getFiles as you can overflow the shell command line length if your
glob matches many files.
- ```fileSet.getFiles(setName)``` returns a list of every file that matches
the glob provided in the fileSet. This may be preferable as
[multimatch](https://www.npmjs.com/package/multimatch) can be more expressive
than normal shell globs



**Notes**
- ```node_modules``` and ```coverage``` directories are automatically excluded
from all globs
- ```gue.getGlobs``` is preferred over ```gue.getFiles``` due to potential
issues with shell command line length (when calling the shell).  However,
 allows for non shell
compatible globs.
- Globs are resolved using [multimatch](https://www.npmjs.com/package/multimatch)

#### File Set Example
```js

const gue = require('gue');
const fileSet = gue.fileSet;

fileSet.add('allSrc', ['**/*.js'], 'lint');
fileSet.add('libs', ['lib/**/*.js'], 'test');
fileSet.add('src', ['src/**/*.js', 'index.js'], 'test');

gue.task('watch', ()=>{
  gue.smartWatch(fileSet);
})

// When using smartWatch the linter will run on any .js change
gue.task('lint', () =>{
    return gue.shell('jscs \{\{globs "allSrc"\}\});
});

// We generally want our linter to run with the tests, but it's not a
// true dependency. Rather than making test depend on lint, we'll let
// the fileSet match take care of linting for us
gue.task('test', () => {
  return gue.shell('nyc --reporter lcov --reporter text ' +
  'mocha \{\{files "unitTests"\}\}));
});

```

### Shell Commands
<!-- TODO: Doc this when the shell commands are re-worked -->

## Classes

<dl>
<dt><a href="#Gue">Gue</a></dt>
<dd><p>Gue - The main class for the gue task runner</p>
</dd>
<dt><a href="#FileSet">FileSet</a></dt>
<dd><p>Methods to handle sets of files in Gue</p>
<p>These really should not be called directly</p>
</dd>
<dt><a href="#GueTasks">GueTasks</a></dt>
<dd><p>GueTasks - Methods that deal with lists of tasks</p>
</dd>
<dt><a href="#GueTask">GueTask</a></dt>
<dd><p>GueTask - Methods that deal with a single task
since runTask needs to interact with the dependency tree
that action is in the GueTasks module (since GueTasks deals with
lists of tasks).  Executing the task action lives here.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#buildCmd">buildCmd(that, command)</a> ⇒ <code>handlebars</code></dt>
<dd><p>buildCmd - Generates the handlebars template</p>
</dd>
</dl>

<a name="Gue"></a>

## Gue
Gue - The main class for the gue task runner

<!-- don't display the scope information -->

* [Gue](#Gue)
    * [new Gue()](#new_Gue_new)
    * [.task(name, deps, func)](#Gue+task)
    * [.shell(command, value)](#Gue+shell) ⇒ <code>promise</code>
    * [.silentShell(command, value)](#Gue+silentShell) ⇒ <code>promise</code>
    * [.watch(glob, taskList)](#Gue+watch) ⇒ <code>Promise</code>
    * [.smartWatch(fileSet)](#Gue+smartWatch) ⇒ <code>Promise</code>
    * [.taskList()](#Gue+taskList) ⇒ <code>array</code>
    * [.log(message, taskname, duration)](#Gue+log)
    * [.errLog(message, taskname, duration)](#Gue+errLog)
    * [.debugLog(message, taskname)](#Gue+debugLog)
    * [._shell(mode, command, values)](#Gue+_shell) ⇒ <code>promise</code>
    * [._smartWatch(fileSet)](#Gue+_smartWatch) ⇒ <code>Object</code>
    * [._watch(glob, taskList)](#Gue+_watch) ⇒ <code>object</code>
    * [._log(type, message, taskname, duration)](#Gue+_log)
    * [.registerEventHandlers()](#Gue+registerEventHandlers)


* * *

<a name="new_Gue_new"></a>

### new Gue()
This doesn't take anything interesting.

<!-- don't display the scope information -->
**Example**  
```js
const gue = require('gue');
```

* * *

<a name="Gue+task"></a>

### gue.task(name, deps, func)
Create a new task

Tasks are the core of gue.  They are the bits that contain the
work you want done.  A gue task consists of a name and one or more
things to do.  Each task may define a list of dependencies that will
run to completion prior to running the current task.  Each task may
also specify a function to run.

Tasks are just javascript.  You don't need to just use ```gue.shell```.


- Tasks should return a promise.

<!-- don't display the scope information -->

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the task |
| deps | <code>array</code> | Array of task dependencies |
| func | <code>function</code> | The function to execute for this task |

**Example**  
```js
// Create a task that just calls dep1 and dep2
task('mytask', ['dep1','dep2']);

// Create a task that runs tests and code coverage
task('coverage', () =>{
  return gue.shell('nyc mocha tests/*.js')
})

// Create a task that calls a linter task prior to coverage
task('coverage', ['lint'], () =>{
  return gue.shell('nyc mocha tests/*.js')
})
```

* * *

<a name="Gue+shell"></a>

### gue.shell(command, value) ⇒ <code>promise</code>
Runs a shell command and prints the output

Shell commands print their buffer when the task is completed.  If a shell
command exits with a non zero status a flag is set so that gue exits
with 1. STDERR is printed in red.

The command string is actually a
[handlebars](https://www.npmjs.com/package/handlebars) template.

The following helpers are provided:
- ```{{files "fileSet"}}```: expands to the files matching the glob in
  fileSet.  **the quotes are required**
- ```{{globs "fileSet"}}```: expands to the glob(s) in the fileSet.
  **the quotes are required**

<!-- don't display the scope information -->
**Returns**: <code>promise</code> - Promise containing the
[execa](https://www.npmjs.com/package/execa) result  

| Param | Type | Description |
| --- | --- | --- |
| command | <code>string</code> | The shell command to run |
| value | <code>object</code> | passed to handlebars render |

**Example**  
```js
gue.fileSet.add('exampleSet', 'README.*');

// README.md
gue.shell('echo {{files "exampleSet"}}');

// *.md
gue.shell('echo {{globs "exampleSet"}}');

// woot
gue.shell('echo {{myString}}', {myString: 'woot'});
```

* * *

<a name="Gue+silentShell"></a>

### gue.silentShell(command, value) ⇒ <code>promise</code>
same as shell but doesn't print any output

<!-- don't display the scope information -->
**Returns**: <code>promise</code> - Promise containing the
[execa](https://www.npmjs.com/package/execa) result  

| Param | Type | Description |
| --- | --- | --- |
| command | <code>string</code> | The shell command to run |
| value | <code>array</code> | Additional values that get passed to the template |


* * *

<a name="Gue+watch"></a>

### gue.watch(glob, taskList) ⇒ <code>Promise</code>
watch = watch the specified files and run taskList when a change is
detected

This is just a passthrough to _watch.  Done to make it easier to
maintain API compatibility.

<!-- don't display the scope information -->
**Returns**: <code>Promise</code> - A promise for this._watch  

| Param | Type | Description |
| --- | --- | --- |
| glob | <code>glob</code> | [chokidar](https://github.com/paulmillr/chokidar)  compatible glob |
| taskList | <code>tasklist</code> | tasks to run when a file in files changes |

**Example**  
```js
// Run lint and coverage tasks if a file matching src/*.js changes
gue.watch('src/*.js', ['lint','coverage']);

// Run coverage task if a file matching tests/*.js changes
gue.watch('tests/*.js', 'coverage');
```

* * *

<a name="Gue+smartWatch"></a>

### gue.smartWatch(fileSet) ⇒ <code>Promise</code>
smartWatch - Watch all files specified in the fileset, run the appropriate
tasks when one of the files is changed

<!-- don't display the scope information -->
**Returns**: <code>Promise</code> - returns a promise for this._smartWatch  

| Param | Type | Description |
| --- | --- | --- |
| fileSet | <code>fileSet</code> | the fileset object that contains the files to watch |


* * *

<a name="Gue+taskList"></a>

### gue.taskList() ⇒ <code>array</code>
Return an array of the defined tasks

<!-- don't display the scope information -->
**Returns**: <code>array</code> - Array of the defined tasks  

* * *

<a name="Gue+log"></a>

### gue.log(message, taskname, duration)
Prints a log message

- If only message is passed it behaves like console.log
- If taskname is passed it's added as a tag to the message
and the message is colorized
- If duration is passed the duration of the task is printed

<!-- don't display the scope information -->

| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | The string to log |
| taskname | <code>string</code> | The name of the task |
| duration | <code>type</code> | The task duration in ms |


* * *

<a name="Gue+errLog"></a>

### gue.errLog(message, taskname, duration)
Prints an error message

Decorates like log, but message is printed in red

<!-- don't display the scope information -->

| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | The string to log |
| taskname | <code>string</code> | The name of the task |
| duration | <code>int</code> | The task duration in ms |


* * *

<a name="Gue+debugLog"></a>

### gue.debugLog(message, taskname)
Prints a debug message

<!-- don't display the scope information -->

| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | The message to print |
| taskname | <code>string</code> | The name of the task |


* * *

<a name="Gue+_shell"></a>

### gue._shell(mode, command, values) ⇒ <code>promise</code>
This is what actually does the shell execution for ```shell```
and ```silentShell```

See the documentation for '''shell''' for more information

<!-- don't display the scope information -->
**Returns**: <code>promise</code> - Promise containing the
[execa](https://www.npmjs.com/package/execa) result  

| Param | Type | Description |
| --- | --- | --- |
| mode | <code>string</code> | 'print' or 'silent' |
| command | <code>type</code> | The shell command/shell command template to run |
| values | <code>type</code> | values to pass to the command template |


* * *

<a name="Gue+_smartWatch"></a>

### gue._smartWatch(fileSet) ⇒ <code>Object</code>
Uses the fileset object passed to figure out which tasks to run
based on the files that have changed.

<!-- don't display the scope information -->
**Returns**: <code>Object</code> - chokidar watcher  

| Param | Type | Description |
| --- | --- | --- |
| fileSet | <code>Object</code> | fileSet object |


* * *

<a name="Gue+_watch"></a>

### gue._watch(glob, taskList) ⇒ <code>object</code>
Watch the specified files and run taskList when a change is detected

<!-- don't display the scope information -->
**Returns**: <code>object</code> - Returns the chokidar watcher  

| Param | Type | Description |
| --- | --- | --- |
| glob | <code>glob</code> | [chokidar](https://github.com/paulmillr/chokidar)  compatible glob |
| taskList | <code>string</code> \| <code>Array.&lt;string&gt;</code> | tasks to run when a file in files changes |

**Example**  
```js
// Run lint and coverage tasks if a file matching src/*.js changes
gue._watch('src/*.js', ['lint','coverage']);

// Run coverage task if a file matching tests/*.js changes
gue._watch('tests/*.js', 'coverage');
```

* * *

<a name="Gue+_log"></a>

### gue._log(type, message, taskname, duration)
does the actual printing for ```log``` and ```errLog```

- Error type prints the message in red
- Debug prints the message in yellow
- Normal type prints the message in cyan
- Clean type prints the message without any coloring

<!-- don't display the scope information -->

| Param | Type | Description |
| --- | --- | --- |
| type | <code>string</code> | error normal clean |
| message | <code>string</code> | The string to log |
| taskname | <code>string</code> | The name of the task |
| duration | <code>int</code> | The task duration in ms |


* * *

<a name="Gue+registerEventHandlers"></a>

### gue.registerEventHandlers()
registerEventHandlers - Register the event handlers

These mainly handle ensuring that logs are emitted
and the exit code is set correctly

<!-- don't display the scope information -->

* * *

<a name="FileSet"></a>

## FileSet
Methods to handle sets of files in Gue

These really should not be called directly

<!-- don't display the scope information -->

* [FileSet](#FileSet)
    * [new FileSet()](#new_FileSet_new)
    * [.add(name, globArg, tasks)](#FileSet+add) ⇒ <code>object</code>
    * [.getTasks(fileArg)](#FileSet+getTasks) ⇒ <code>array</code>
    * [.getGlobs(setName)](#FileSet+getGlobs) ⇒ <code>string</code>
    * [.getFiles(setName)](#FileSet+getFiles) ⇒ <code>string</code>
    * [.getAllFiles()](#FileSet+getAllFiles) ⇒ <code>array</code>


* * *

<a name="new_FileSet_new"></a>

### new FileSet()
Create a new FileSet object instance

<!-- don't display the scope information -->

* * *

<a name="FileSet+add"></a>

### fileSet.add(name, globArg, tasks) ⇒ <code>object</code>
Add a new file set.

Adds a file set named ```name``` that groups files selected by ```glob```
Associates the list of tasks with that set of files.

<!-- don't display the scope information -->
**Returns**: <code>object</code> - The fileset  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the fileset |
| globArg | <code>glob</code> \| <code>globs</code> | [multimatch](https://www.npmjs.com/package/multimatch)     compatible glob |
| tasks | <code>array</code> | List of tasks to associate with this glob |


* * *

<a name="FileSet+getTasks"></a>

### fileSet.getTasks(fileArg) ⇒ <code>array</code>
Return the list of tasks associated with the passed file

<!-- don't display the scope information -->
**Returns**: <code>array</code> - list of reduced tasks that match the file  

| Param | Type | Description |
| --- | --- | --- |
| fileArg | <code>filename</code> \| <code>Array.&lt;filenames&gt;</code> | The file(s) to find tasks for |


* * *

<a name="FileSet+getGlobs"></a>

### fileSet.getGlobs(setName) ⇒ <code>string</code>
Gets the globs for a given fileSet

This is useful to get the glob for a specific set of tests etc

WARNING: multimatch globs are not always shell compatible.
you may want to use getFiles unless you have lots of files that
match the glob.

<!-- don't display the scope information -->
**Returns**: <code>string</code> - space separated list of globs  

| Param | Type | Description |
| --- | --- | --- |
| setName | <code>string</code> | The name of the file set with the glob you want |


* * *

<a name="FileSet+getFiles"></a>

### fileSet.getFiles(setName) ⇒ <code>string</code>
Get a list of the files matching the glob for the pass set name

<!-- don't display the scope information -->
**Returns**: <code>string</code> - Space separated list of files  

| Param | Type | Description |
| --- | --- | --- |
| setName | <code>string</code> | Name of the fileSet |


* * *

<a name="FileSet+getAllFiles"></a>

### fileSet.getAllFiles() ⇒ <code>array</code>
Return the list of all files from all globs in all fileSets

<!-- don't display the scope information -->
**Returns**: <code>array</code> - List of all files  

* * *

<a name="GueTasks"></a>

## GueTasks
GueTasks - Methods that deal with lists of tasks

<!-- don't display the scope information -->

* [GueTasks](#GueTasks)
    * [new GueTasks()](#new_GueTasks_new)
    * [.addTask(name, dependencies, action)](#GueTasks+addTask)
    * [.runTaskParallel(tasks, swallowError)](#GueTasks+runTaskParallel) ⇒ <code>promise</code>
    * [.runTask(taskName)](#GueTasks+runTask) ⇒ <code>promise</code>


* * *

<a name="new_GueTasks_new"></a>

### new GueTasks()
constructor - Doesn't do anything interesting

<!-- don't display the scope information -->

* * *

<a name="GueTasks+addTask"></a>

### gueTasks.addTask(name, dependencies, action)
addTask - Add a new task

This just calls new GueTask and puts the result onto the task list

dependencies are optional, if only two arguments are passed
then the 2nd argument is assumed to be the task itself and must
be a function

You can just have dependencies without a task (for task group aliases)

<!-- don't display the scope information -->

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Description |
| dependencies | <code>array</code> \| <code>function</code> | A list of tasks (or the action function if there are no dependencies) |
| action | <code>function</code> | The action to run after dependencies have been met |

**Example**  
```js
// Add a new task named myTask that runs console.log('foo') when executed
addTask('myTask', () =>{
  return Promise.resolve('foo')
}

// Add a new task named ourTask that runs myTask and yourTask
addTask('ourTask', ['yourTask','myTask']);

// Add a new task named theirTask that runs ourTask before running
// return Promise.resolve('woot')
addTask('theirTask',['ourTask'], () =>{
  return Promise.resolve('woot');
}
```

* * *

<a name="GueTasks+runTaskParallel"></a>

### gueTasks.runTaskParallel(tasks, swallowError) ⇒ <code>promise</code>
runTaskParallel - Run tasks in parallel

This will run tasks concurrently. Each task's dependencies will
still run sequentially. If swallowError is true then a catch
is added for each task that swallows the error

<!-- don't display the scope information -->

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| tasks | <code>string</code> \| <code>array</code> |  | One or more tasks to run |
| swallowError | <code>boolean</code> | <code>false</code> | Set to true to ignore rejected tasks |


* * *

<a name="GueTasks+runTask"></a>

### gueTasks.runTask(taskName) ⇒ <code>promise</code>
runTask - execute the action of a single task

<!-- don't display the scope information -->
**Returns**: <code>promise</code> - Resolved or rejected promise  

| Param | Type | Description |
| --- | --- | --- |
| taskName | <code>string</code> | The name of the task to execute |


* * *

<a name="GueTask"></a>

## GueTask
GueTask - Methods that deal with a single task
since runTask needs to interact with the dependency tree
that action is in the GueTasks module (since GueTasks deals with
lists of tasks).  Executing the task action lives here.

<!-- don't display the scope information -->

* [GueTask](#GueTask)
    * [new GueTask(name, dependencies, action)](#new_GueTask_new)
    * [.hasDependencies()](#GueTask+hasDependencies) ⇒ <code>boolean</code>
    * [.taskStarted()](#GueTask+taskStarted)
    * [.taskFinished()](#GueTask+taskFinished)
    * [.taskFinishedWithError(message)](#GueTask+taskFinishedWithError)
    * [.getTaskDuration()](#GueTask+getTaskDuration) ⇒ <code>integer</code>
    * [.startAction()](#GueTask+startAction)
    * [.endAction()](#GueTask+endAction)
    * [.endActionWithError(message)](#GueTask+endActionWithError)
    * [.getActionDuration()](#GueTask+getActionDuration) ⇒ <code>integer</code>
    * [.runAction()](#GueTask+runAction) ⇒ <code>promise</code>


* * *

<a name="new_GueTask_new"></a>

### new GueTask(name, dependencies, action)
constructor - Create a new task with dependencies and actions.
You must have either a dependency or an action.
You may have both dependencies and an action

<!-- don't display the scope information -->

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | Name of the task |
| dependencies | <code>Array</code> \| <code>function</code> | Array of dependencies or the task action |
| action | <code>function</code> | Task action (function) |

**Example**  
```js
// creates a task named foo that runs tasks a and b prior to
// running Promise.resolve()
new GueTask('foo',['a','b'],() =>{
  return Promise.resolve();
});

// Creates a task named foo2 that just executes promise.resolve
new GueTask('foo2', () =>{
  return Promise.resolve();
}

// Creates a task named foo3 that runs tasks a and b
new GueTask('foo3', ['a','b'])
```

* * *

<a name="GueTask+hasDependencies"></a>

### gueTask.hasDependencies() ⇒ <code>boolean</code>
hasDependencies - returns true if a task has dependencies

<!-- don't display the scope information -->
**Returns**: <code>boolean</code> - true if a task has dependencies  

* * *

<a name="GueTask+taskStarted"></a>

### gueTask.taskStarted()
beginTask - Marks the task as started

handles any task start activities. Currently just
sets the start time and sends the start message to
gueEvents

<!-- don't display the scope information -->

* * *

<a name="GueTask+taskFinished"></a>

### gueTask.taskFinished()
endTask - Marks the task as done

handles any task end activities. Currently just
sets the end time and sends the end message to
gueEvents

<!-- don't display the scope information -->

* * *

<a name="GueTask+taskFinishedWithError"></a>

### gueTask.taskFinishedWithError(message)
taskFinishedWithError - Marks a task as finished with an error
emits the task failed event

<!-- don't display the scope information -->

| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | Error message |


* * *

<a name="GueTask+getTaskDuration"></a>

### gueTask.getTaskDuration() ⇒ <code>integer</code>
getTaskDuration - Returns how long the task ran

<!-- don't display the scope information -->
**Returns**: <code>integer</code> - Number of ms the task ran  

* * *

<a name="GueTask+startAction"></a>

### gueTask.startAction()
startAction - Handles execution start

<!-- don't display the scope information -->

* * *

<a name="GueTask+endAction"></a>

### gueTask.endAction()
endAction - Handles execute completion

<!-- don't display the scope information -->

* * *

<a name="GueTask+endActionWithError"></a>

### gueTask.endActionWithError(message)
endActionWithError - end the action and emits an error

<!-- don't display the scope information -->

| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | The error message |


* * *

<a name="GueTask+getActionDuration"></a>

### gueTask.getActionDuration() ⇒ <code>integer</code>
getActionDuration - Returns how long the action ran

<!-- don't display the scope information -->
**Returns**: <code>integer</code> - Number of ms the action ran  

* * *

<a name="GueTask+runAction"></a>

### gueTask.runAction() ⇒ <code>promise</code>
execute - executes the task's action

This does not check/resolve dependencies

<!-- don't display the scope information -->
**Returns**: <code>promise</code> - returns a promise for the running action  

* * *

<a name="buildCmd"></a>

## buildCmd(that, command) ⇒ <code>handlebars</code>
buildCmd - Generates the handlebars template

<!-- don't display the scope information -->
**Returns**: <code>handlebars</code> - Handlebars template object  

| Param | Type | Description |
| --- | --- | --- |
| that | [<code>Gue</code>](#Gue) | The Gue object instance to work on |
| command | <code>string</code> | The template string |


* * *

