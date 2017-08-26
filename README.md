[![Build Status](https://travis-ci.org/skarfacegc/Gue.svg?branch=master)](https://travis-ci.org/skarfacegc/Gue) [![Coverage Status](https://coveralls.io/repos/github/skarfacegc/Gue/badge.svg)](https://coveralls.io/github/skarfacegc/Gue) [![dependencies Status](https://david-dm.org/skarfacegc/Gue/status.svg)](https://david-dm.org/skarfacegc/Gue)

[![NPM](https://nodei.co/npm/gue.png?downloads=true)](https://nodei.co/npm/gue/)

# Gue
Gue (pronounced goo) is a task runner for node. Rather than relying on plugins
Gue provides a built in way to easily run shell commands. Gue also provides
automatic watching using the fileSets feature.

<!-- toc -->

## Installation
You can install gue globally with ```npm install -g gue``` and/or locally
with ```npm install -D gue```. If installed in both places the global gue
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
    return gue.shell('jscs ' + fileSet.getFiles('allSrc'));
});

// We generally want our linter to run with the tests, but it's not a
// true dependency. Rather than making test depend on lint, we'll let
// the fileSet match take care of linting for us
gue.task('test', () => {
  return gue.shell('nyc --reporter lcov --reporter text ' +
      'mocha {{globs "unitTests"}}'));
});
```

### Shell Commands
Gue provides support for shell commands that work well with FileSets.
Shell commands are executed with
[execa.shell](https://github.com/sindresorhus/execa). The command string is
a [handlebars](http://handlebarsjs.com/) template. There are two built in
helpers ```{{globs "fileSet"}}``` and ```{{files "fileSet"}}``` that
match ```fileSet.getFiles('name')``` and ```fileSet.getGlobs('name')```. This
allows the guefile to centrally define sets of files that are automatically
reflected in the relevant shell commands.


**Notes**
- ```[project directory]/node_modules/bin``` is automatically
added to ```$PATH```.  ```[project directory]``` is the directory that contains
the guefile
- ```gue.shell()``` prints stdout and stderr (in red)
- ```gue.silentShell()``` suppresses printing

### Shell command example
```js
gue.fileSet.add('exampleSet', 'README.*');

// README.md
gue.shell('echo {{files "exampleSet"}}');

// *.md
gue.shell('echo {{globs "exampleSet"}}');

// woot
gue.shell('echo {{myString}}', {myString: 'woot'});
```

