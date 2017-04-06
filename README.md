# Gue

[![Build Status](https://travis-ci.org/skarfacegc/Gue.svg?branch=master)](https://travis-ci.org/skarfacegc/Gue) [![Coverage Status](https://coveralls.io/repos/github/skarfacegc/Gue/badge.svg)](https://coveralls.io/github/skarfacegc/Gue) [![dependencies Status](https://david-dm.org/skarfacegc/Gue/status.svg)](https://david-dm.org/skarfacegc/Gue)


[![NPM](https://nodei.co/npm/gue.png?downloads=true)](https://nodei.co/npm/gue/)

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

# Run the specified task
% gue <task name>

# List the tasks defined in guefile.js
% gue -l
```

#### Examples

[Gue-test](https://github.com/skarfacegc/Gue-test) is a sample project using Gue.

```javascript
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
![Run Example](http://i.imgur.com/f8J5toD.png?1)

#

<!-- Start index.js -->
## API Documentation

### constructor

This doesn't take anything interesting.

Returns a gue instance

     const Gue = require('gue');
     const gue = new Gue();
----
### task(name, deps, func)

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

#### Params:

* **string** *name* Name of the task
* **array** *deps* Array of task dependencies
* **function** *func* The function to execute for this task

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
----
### setOption(name, value)

setOption - Sets a name value binding for use in the lodash expansion
in the shell commands

#### Params:

* **string** *name* name of the value
* **literal** *value* the value itself
----
### taskList()

Return an array of the defined tasks

#### Return:

* **array** Array of the defined tasks

----
### shell(command, value)

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

```javascript
gue.setOption('myString', 'foobar');

// foobar
gue.shell('echo {{myString}}');

// woot
gue.shell('echo {{myString}}', {myString: 'woot'});
```

#### Params:

* **string** *command* The shell command to run
* **literal** *value* An optional override of the values set with setOption

#### Return:

* **promise** Promise containing the
[execa](https://www.npmjs.com/package/execa) result
----
### silentShell(command, value)

same as shell but doesn't print any output

#### Params:

* **string** *command* The shell command to run
* **literal** *value* An optional override of the values set with setOption

#### Return:

* **promise** Promise containing the
[execa](https://www.npmjs.com/package/execa) result
----
### log(message, taskname, duration)

Prints a log message

If only the message is passed it behaves like console.log
If duration isn't passed it isn't printed

#### Params:

* **string** *message* The string to log
* **string** *taskname* The name of the task
* **type** *duration* The task duration in ms
----
### errLog(message, taskname, duration)

Prints an error message

Message is printed in red
If only the message is passed it behaves like console.log
If duration isn't passed it isn't printed

#### Params:

* **string** *message* The string to log
* **string** *taskname* The name of the task
* **int** *duration* The task duration in ms


----
## Private Methods
Not really private, but you shouldn't need to call them

----
### \_shell(mode, command, values)

This is what actually does the shell execution for ```shell```
and ```silentShell```

See the documentation for '''shell''' for more information

#### Params:

* **string** *mode* 'print' or 'silent'
* **type** *command* The shell command to run
* **type** *values* an optional override of the values set with setOption

#### Return:

* **promise** Promise containing the
[execa](https://www.npmjs.com/package/execa) result
----
### \_log(type, message, taskname, duration)

does the acutal printing for ```log``` and ```errLog```

- Error type prints the message in red
- Normal type prints the message in cyan
- Clean type prints the message without any coloring

#### Params:

* **string** *type* error|normal|clean
* **string** *message* The string to log
* **string** *taskname* The name of the task
* **int** *duration* The task duration in ms
----
### \_runList()

Returns the list of active tasks without 'default' if it's there
Used mainly to set the width of taskname in ```_log```

#### Return:

* **type** Description

<!-- End index.js -->
