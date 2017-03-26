# Gue

[![Build Status](https://travis-ci.org/skarfacegc/Gue.svg?branch=master)](https://travis-ci.org/skarfacegc/Gue)

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

### API
Your ```guefile.js``` defines the tasks and their dependencies.

#### setOption(name, value)
- **name** name of the option to set
- **value** value of the option

Sets values to be used in ```gue.shell()``` for the [lodash](https://www.npmjs.com/package/lodash.template) template replacement.

#### shell(command, templateValue)
- **command** string to be executed ```echo helloWorld```
- **templateValue** object to override values set by setOption
- **returns** Promise with stdout on success or stderr on failure

Shell commands print their buffer when the task is completed.  If a shell
command exits with a non zero status a flag is set so that gue exits with 1.  A
shell command that errors will have it's stderr printed in red.  See the fail
task in the output above.

Shell commands are run through the [lodash](https://www.npmjs.com/package/lodash.template) template system using ```{{}}``` as
the replacement tokens.  The substitution values may be passed in as an optional
third argument, or they may be loaded from the values specified
with ```gue.setOption()```. If ```templateValue``` is set, it
overrides ```gue.setOption```.

```javascript
gue.setOption('myString', 'foobar');

// foobar
gue.shell('echo {{myString}}');

// woot
gue.shell('echo {{myString}}', {myString: 'woot'});
```

#### task(name, deps, function(callback))
- **name** name of the task
- **deps** array of tasks to complete prior to executing this task
- **function** the content of the task

Tasks should either return a promise or execute the callback to let gue know
that the task is done.  Orchestrator guarantees that the dependencies will
finish prior to running the task, but the dependencies will run concurrently.
See the
[orchestrator](https://www.npmjs.com/package/orchestrator#orchestratoraddname-deps-function)
docs for the add method for more details. Task is just a
passthrough to ```orchestrator.add```.


```javascript
// task that calls an async method that uses promises
gue.task('myPromiseTask', ['dep1','dep2'], () =>{
  return methodThatReturnsAPromise();
});

// task that calls an async method that takes a callback
gue.task('myCallbackTask', ['dep1','dep2'], (done) => {
  somethingAsync(() =>{
    //... do stuff
    done();
  });
});

// Task alias
gue.task('runTests', ['lint','test','coverage']);

// No dependencies
gue.task('myTask', () =>{
  console.log('foo');
});
```

#### taskList()
Returns an array of the defined tasks.
