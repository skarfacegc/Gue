Gue
==
[![Build Status](https://travis-ci.org/skarfacegc/Gue.svg?branch=master)](https://travis-ci.org/skarfacegc/Gue)

[![NPM](https://nodei.co/npm/gue.png?downloads=true)](https://nodei.co/npm/gue/)

A lightweight task runner.  This is little more than a thin wrapper on orchestrator.  Goal is to provide the task composition / dependency chaining of Gulp without having to deal with streams. The only task type is currently a shell command.  Since Gue is really geared towards executing shell commands it shouldn't need much in the way of plugins.


[Gue-test](https://github.com/skarfacegc/Gue-test) is a sample project using Gue.


    // guefile.js
    const glue = require('gue');
    glue.setOption('files', 'test/**/*.test.js');
    glue.task('coverage', () => {
      glue.shell('nyc mocha {{files}}')
      .then((data) => {
        console.log(data);
      })
      .catch((err)=>{
        console.log('ERROR ' + err);
      });
    });

Current issues
--
This is very early in development.  Not sure if this will end up being useful or not.

- Error logging doesn't really exist / isn't tested at the moment
  - Everything will probably print the error and exit
- Would like to add task timers etc
- Would like to have some way to force order on deps in tasks
- Not sure if the API is super useful or not



API
--
**gue.task(name, ['deps'], () => {})**

Create a new task.  `['deps']` are run before the task, order is not guaranteed.

**gue.shell('shell command')**

Executes the shell command, returns a promise with the command's output.  
Shell command is a lodash template with `{{}}` as the tags.  The Gue.options object is passed
to the lodash render.  This allows for variable substitution as seen in the example above with `{{files}}`



**gue.setOption('name','value')**

Programatic way to set values in Gue.options.

CLI
--
    # Run a task
    % gue <task name>

    # Get a list of tasks
    % gue -l
