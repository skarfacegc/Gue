[![Build Status](https://travis-ci.org/skarfacegc/Gue.svg?branch=master)](https://travis-ci.org/skarfacegc/Gue) [![Coverage Status](https://coveralls.io/repos/github/skarfacegc/Gue/badge.svg)](https://coveralls.io/github/skarfacegc/Gue) [![dependencies Status](https://david-dm.org/skarfacegc/Gue/status.svg)](https://david-dm.org/skarfacegc/Gue)


[![NPM](https://nodei.co/npm/gue.png?downloads=true)](https://nodei.co/npm/gue/)

- [CLI Documentation](#CLI)
- [API Documentation](#Gue)

Gue (_pronounced goo_) is yet another task runner. It is focused on making it
easy to run the shell commands that are documented with your toolchain of
choice. Gue is a thin wrapper on
[orchestrator](https://www.npmjs.com/package/orchestrator) with a fancy shell
command method and some built in logging.

### Motivation
A recent change to a plugin I used in another task runner broke my code coverage
task. This caused me to start looking at alternatives. The one that made the
most sense was to just use npm scripts, since the command line examples
in the tools I use normally work pretty well.

Npm scripts, while easy to use, did not lend themselves to code re-use. If I
want to perform the same steps on different sets of files
(generate code coverage for just client files for example) I would have to
duplicate code. I realized what I wanted was a programatic way to setup
shell calls along with the same task chaining I got used to in other task
runners.

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
```
This will generate output as shown below

![Run Example](http://i.imgur.com/f8J5toD.png?1)
<!-- jsdoc2md gets inserted below -->
<a name="Gue"></a>

## Gue
<!-- don't display the scope information -->

* [Gue](#Gue)
    * [new Gue()](#new_Gue_new)
    * [.task(name, deps, func)](#Gue+task)
    * [.shell(command, value)](#Gue+shell) ⇒ <code>promise</code>
    * [.silentShell(command, value)](#Gue+silentShell) ⇒ <code>promise</code>
    * [.watch(files, taskList)](#Gue+watch)
    * [.setOption(name, value)](#Gue+setOption)
    * [.taskList()](#Gue+taskList) ⇒ <code>array</code>
    * [.log(message, taskname, duration)](#Gue+log)
    * [.errLog(message, taskname, duration)](#Gue+errLog)
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
with 1. A shell command that errors will have it's stderr printed in red.
See the fail task in the output above. Shell commands are run through the
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

If only the message is passed it behaves like console.log
If duration isn't passed it isn't printed

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

Message is printed in red
If only the message is passed it behaves like console.log
If duration isn't passed it isn't printed

<!-- don't display the scope information -->

| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | The string to log |
| taskname | <code>string</code> | The name of the task |
| duration | <code>int</code> | The task duration in ms |


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
| taskList | <code>tasklist</code> | tasks to run when a file in files changes |

**Example**  
```js
// Run lint and coverage tasks if a file matching src/*.js changes
gue.watch('src/*.js', ['lint','coverage']);

// Run coverage task if a file matching tests/*.js changes
gue.watch('tests/*.js', 'coverage');
```

* * *

<a name="Gue+_log"></a>

### gue._log(type, message, taskname, duration)
does the acutal printing for ```log``` and ```errLog```

- Error type prints the message in red
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

