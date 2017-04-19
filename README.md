[![Build Status](https://travis-ci.org/skarfacegc/Gue.svg?branch=master)](https://travis-ci.org/skarfacegc/Gue) [![Coverage Status](https://coveralls.io/repos/github/skarfacegc/Gue/badge.svg)](https://coveralls.io/github/skarfacegc/Gue) [![dependencies Status](https://david-dm.org/skarfacegc/Gue/status.svg)](https://david-dm.org/skarfacegc/Gue)


[![NPM](https://nodei.co/npm/gue.png?downloads=true)](https://nodei.co/npm/gue/)

- [CLI Documentation](#CLI)
- [API Documentation](#Gue)

Gue (_pronounced goo_) is task runner that is focused on organizing and running
shell commands. Gue is a thin wrapper on
[orchestrator](https://www.npmjs.com/package/orchestrator) with a fancy shell
command, a build in watcher, and some basic logging.

### Motivation
A recent change to a plugin I used in another task runner broke my code coverage
task. This caused me to start looking at alternatives. Just using npm scripts
made a ton of sense since most tools have a well documented CLI. I was also
spending more time than I wanted to trying to map command line options into
the plugin I was using.  I liked shell commands, but I also liked the task
composition and re-use found in some of the other tools.
</map>

## Documentation
<a name='CLI'></a>
### CLI


The gue CLI looks for ```guefile.js``` at the project root.  All tasks defined
in the guefile are run relative to the project root (where your package.json
lives).  The time taken by each task is logged when the task finishes.  Gue will
exit with 1 if any of the tasks fail.

You can install gue globally with ```npm install -g gue``` and locally with
```npm install --save-deps gue```.  The global ```gue``` command will use the
version of gue in the local ```node_modules``` if available.
```shell
# run the task named 'default'
% gue

# Run the coverage task
% gue coverage

# Run the coverage task then the lint task
% gue coverage lint

# List the tasks defined in guefile.js
% gue -l

# Specify an alternate config
% gue --config=foo.js
```

#### guefile.js example

[Gue-test](https://github.com/skarfacegc/Gue-test) is a sample project using Gue.

```javascript
// sample guefile.js
const gue = require('gue');

// Set the value for 'files'
gue.setOption('testFiles', 'test/**/*.test.js');

// Set the default task
gue.task('default', ['coverage','fail']);

// Run code coverage using files as specified by
// setOption above
gue.task('coverage', () => {
  return gue.shell('nyc mocha {{testFiles}}');
});

// This task will fail
gue.task('fail', () => {
  return gue.shell('typo');
});

// A watch task
gue.task('watch', () => {
  gue.watch(gue.options.testFiles, 'coverage');
});
```
This will generate output as shown below

![Run Example](http://i.imgur.com/f8J5toD.png?1)
<!-- jsdoc2md gets inserted below -->
## Classes

<dl>
<dt><a href="#Gue">Gue</a></dt>
<dd></dd>
<dt><a href="#FileSet">FileSet</a></dt>
<dd><p>Methods to handle sets of files in Gue</p>
<p>These really should not be called directly</p>
</dd>
</dl>

<a name="Gue"></a>

## Gue
<!-- don't display the scope information -->

* [Gue](#Gue)
    * [new Gue()](#new_Gue_new)
    * [.task(name, deps, func)](#Gue+task)
    * [.shell(command, value)](#Gue+shell) ⇒ <code>promise</code>
    * [.silentShell(command, value)](#Gue+silentShell) ⇒ <code>promise</code>
    * [.watch(files, taskList)](#Gue+watch)
    * [.autoWatch(fileSet)](#Gue+autoWatch) ⇒ <code>Object</code>
    * [.setOption(name, value)](#Gue+setOption)
    * [.taskList()](#Gue+taskList) ⇒ <code>array</code>
    * [.log(message, taskname, duration)](#Gue+log)
    * [.errLog(message, taskname, duration)](#Gue+errLog)
    * [.debugLog(message, taskname)](#Gue+debugLog)
    * [._shell(mode, command, values)](#Gue+_shell) ⇒ <code>promise</code>
    * [._watch(files, taskList)](#Gue+_watch) ⇒ <code>object</code>
    * [._log(type, message, taskname, duration)](#Gue+_log)


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


- Tasks should return a promise or call the callback that is passed
to the function.
- Dependencies will run to completion prior to executing the current task.
These tasks will run asynchronously (order is not guaranteed)

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

// Example of using a callback
task('nonPromise', (done) => {
  plainFunction();
  done();
})
```

* * *

<a name="Gue+shell"></a>

### gue.shell(command, value) ⇒ <code>promise</code>
Runs a shell command and prints the output

Shell commands print their buffer when the task is completed.  If a shell
command exits with a non zero status a flag is set so that gue exits
with 1. STDERR is printed in red.
Shell commands are run through the
[lodash](https://www.npmjs.com/package/lodash.template) template system
using ```{{}}``` as the replacement tokens.  The substitution values
may be passed in as an optional third argument, or they may be loaded from
the values specified with ```gue.setOption()```. If ```templateValue``` is
set, it overrides ```gue.setOption```.

<!-- don't display the scope information -->
**Returns**: <code>promise</code> - Promise containing the
[execa](https://www.npmjs.com/package/execa) result  

| Param | Type | Description |
| --- | --- | --- |
| command | <code>string</code> | The shell command to run |
| value | <code>literal</code> | An optional override of the values set with setOption |

**Example**  
```js
gue.setOption('myString', 'foobar');

// foobar
gue.shell('echo {{myString}}');

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
| value | <code>literal</code> | An optional override of the values set with setOption |


* * *

<a name="Gue+watch"></a>

### gue.watch(files, taskList)
Watch the specified files and run taskList when a change is detected

This is just a passthrough to _watch.  Done to make it easier to
maintain API compatibility.

<!-- don't display the scope information -->

| Param | Type | Description |
| --- | --- | --- |
| files | <code>glob</code> | [chokidar](https://github.com/paulmillr/chokidar)  compatible glob |
| taskList | <code>tasklist</code> | tasks to run when a file in files changes |

**Example**  
```js
// Run lint and coverage tasks if a file matching src/*.js changes
gue.watch('src/*.js', ['lint','coverage']);

// Run coverage task if a file matching tests/*.js changes
gue.watch('tests/*.js', 'coverage');
```

* * *

<a name="Gue+autoWatch"></a>

### gue.autoWatch(fileSet) ⇒ <code>Object</code>
Uses the fileset object passed to figure out which tasks to run
based on the files that have changed.

<!-- don't display the scope information -->
**Returns**: <code>Object</code> - chokidar watcher  

| Param | Type | Description |
| --- | --- | --- |
| fileSet | <code>Object</code> | fileSet object |


* * *

<a name="Gue+setOption"></a>

### gue.setOption(name, value)
Sets a name value binding for use in the lodash expansion
in the shell commands

<!-- don't display the scope information -->

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | name of the value |
| value | <code>literal</code> | the value itself |


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
| command | <code>type</code> | The shell command to run |
| values | <code>type</code> | an optional override of the values set with setOption |


* * *

<a name="Gue+_watch"></a>

### gue._watch(files, taskList) ⇒ <code>object</code>
Watch the specified files and run taskList when a change is detected

<!-- don't display the scope information -->
**Returns**: <code>object</code> - Returns the chokidar watcher  

| Param | Type | Description |
| --- | --- | --- |
| files | <code>glob</code> | [chokidar](https://github.com/paulmillr/chokidar)  compatible glob |
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

<a name="FileSet"></a>

## FileSet
Methods to handle sets of files in Gue

These really should not be called directly

<!-- don't display the scope information -->

* [FileSet](#FileSet)
    * [new FileSet()](#new_FileSet_new)
    * [.add(name, globArg, tasks)](#FileSet+add) ⇒ <code>object</code>
    * [.getTasks(fileArg)](#FileSet+getTasks) ⇒ <code>array</code>
    * [.getGlob(setName)](#FileSet+getGlob) ⇒ <code>string</code>
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

<a name="FileSet+getGlob"></a>

### fileSet.getGlob(setName) ⇒ <code>string</code>
Gets the glob for a given fileSet

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

