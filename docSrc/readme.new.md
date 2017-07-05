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
project directory. The guefile is a js module that contains your task
definitions and filSets.

### CLI Example
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
  gue.autoWatch(fileSet);
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

**Notes:**
- Dependencies are not guaranteed to complete in any particular order, but
they will all complete prior to current task's function.
- Tasks should call the function passed to the callback or return a promise
when complete.  If your task never completes, you are probably not correctly
ending the task.

#### Task examples
```js

// if % gue is run without any arguments, run a and b tasks
gue.task('default', ['a','b']);

// A task that returns a promise
gue.task('a', ()=>{
  return promiseMethod(args);
})

// An async method, runs the c task first
gue.task('b', ['c'], (done) =>{
  asyncMethod(args);
  done();
})

```


### File Sets
File sets are used by ```autoWatch``` to automatically run tasks based on
changed (updated, added, deleted, etc) files. File sets let you think in terms
of what needs to happen when a file changes, rather than just focusing on
tasks. They can help minimize task dependencies for connivence and use task
dependencies for actual dependencies.

File Sets provide a ```fileSet.getFiles(setName)``` and a
```fileSet.getGlob(setName)``` that can be used in tasks so you can use your
file set definitions in your tasks.  Add a new glob to your allSrc file set
and you'll automatically start linting those files, without having to modify
your tasks.

**Notes**
- ```node_modules``` and ```coverage``` directories are automatically excluded
from all globs
- ```gue.getGlob``` is preferred over ```gue.getFiles``` due to potential
issues with shell command line length (when calling the shell).  However,
[multimatch](https://www.npmjs.com/package/multimatch) allows for non shell
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
  gue.autoWatch(fileSet);
})

// When using autoWatch the linter will run on any .js change
gue.task('lint', () =>{
    return gue.shell('jscs ' + fileSet.getFiles('allSrc'));
});

// We generally want our linter to run with the tests, but it's not a
// true dependency. Rather than making test depend on lint, we'll let
// the fileSet match take care of linting for us
gue.task('test', () => {
  return gue.shell('nyc --reporter lcov --reporter text ' +
  'mocha ' + fileSet.getFiles('unitTests'));
});

```

### Shell Commands
<!-- TODO: Doc this when the shell commands are re-worked -->

{{>main}}
