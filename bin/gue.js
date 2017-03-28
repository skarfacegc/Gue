#!/usr/bin/env node

'use strict';

const Liftoff = require('liftoff');
const argv = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');

const gueCli = new Liftoff({
  name: 'gue',
  processTitle: 'gue',
  moduleName: 'gue',
  configName: 'guefile',
});

gueCli.launch({
  cwd: argv.cwd,
  configPath: argv.myappfile,
  require: argv.require,
  completion: argv.completion
}, invoke);

function invoke(env) {
  require(env.configPath);
  const gueInst = require(env.modulePath);
  const actions = argv._;
  const actionList = actions.length ? actions : ['default'];
  const availableTasks = gueInst.taskList();

  if (!env.configPath) {
    gueInst.log(chalk.red('No gulpfile found'));
    process.exit(1);
  }

  // add node_modules/.bin to the path.
  // this should be relative to the project root
  // if liftoff is working correctly.  :)
  process.env.PATH = env.configBase + '/node_modules/.bin:' +
    process.env.PATH;

  if (argv.l) {
    gueInst.log(availableTasks.join('\n'));
    process.exit(0);
  }

  //
  // Setup orcestrator event listeners
  //

  // Log task start
  gueInst.on('task_start', (event) => {
    gueInst.log('started', event.task, 'normal');
  });

  // Log task stop and task duration
  gueInst.on('task_stop', (event) => {
    gueInst.log('finished in', event.task, 'normal', event.duration);
  });

  // Print stderr and the task finish notification on error
  gueInst.on('task_err', (event)=> {
    gueInst.log(event.err.stderr, event.task, 'error');
    gueInst.log('finished in', event.task, 'normal', event.duration);
  });

  // If there was an error in any of the tasks set the exit code
  gueInst.on('err', (event) => {
    gueInst.exitCode = 1;
  });

  // setup process event listener so we can
  // exit with the right code
  process.once('exit', (code) => {
    if (gueInst.exitCode === 1) {
      process.exit(1);
    }
  });

  // Now lets make do stuff
  gueInst.start(actionList);
}
//
