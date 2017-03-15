Gluey
==
[![Build Status](https://travis-ci.org/skarfacegc/Gluey.svg?branch=master)](https://travis-ci.org/skarfacegc/Gluey)

[![NPM](https://nodei.co/npm/gluey.png?downloads=true)](https://nodei.co/npm/gluey/)

A lightweight task runner.  This is little more than a thin wrapper on orchestrator.  Goal is to provide the task composition / dependency chaining of Gulp without having to deal with streams. The only task type is currently a shell command.  Since Gluey is really geared towards executing shell commands it shouldn't need much in the way of plugins.


[Gluey-test](https://github.com/skarfacegc/Gluey-test) is a sample project using Gluey.


    // glueyfile.js
    const glue = require('gluey');
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
**gluey.task(name, ['deps'], () => {})**

Create a new task.  `['deps']` are run before the task, order is not guaranteed.

**gluey.shell('shell command')**

Executes the shell command, returns a promise with the command's output.  
Shell command is a lodash template with `{{}}` as the tags.  The Gluey.options object is passed
to the lodash render.  This allows for variable substitution as seen in the example above with `{{files}}`



**gluey.setOption('name','value')**

Programatic way to set values in Gluey.options.

CLI
--
    # Run a task
    % gluey <task name>

    # Get a list of tasks
    % gluey -l
