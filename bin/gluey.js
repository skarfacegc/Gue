#!/usr/bin/env node

'use strict';

const Liftoff = require('liftoff');
const argv = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');
var prettyMs = require('pretty-ms');

const glueyCli = new Liftoff({
  name: 'gluey',
  processTitle: 'gluey',
  moduleName: 'gluey',
  configName: 'glueyfile',
});

glueyCli.launch({
  cwd: argv.cwd,
  configPath: argv.myappfile,
  require: argv.require,
  completion: argv.completion
}, invoke);

function invoke(env) {
  require(env.configPath);
  const glueInst = require(env.modulePath);
  const actions = argv._;
  const actionList = actions.length ? actions : ['default'];
  const availableTasks = glueInst.taskList();

  if (!env.configPath) {
    glueInst.log(chalk.red('No gulpfile found'));
    process.exit(1);
  }

  // add node_modules/.bin to the path.
  // this should be relative to the project root
  // if liftoff is working correctly.  :)
  process.env.PATH = env.configBase + '/node_modules/.bin:' +
    process.env.PATH;

  if (argv.l) {
    glueInst.log(availableTasks.join('\n'));
    process.exit(0);
  }

  //
  // Setup orcestrator event listeners
  //

  // Log task start
  glueInst.on('task_start', (event) => {
    glueInst.log(chalk.green('[' + event.task + '] ') + chalk.blue('started'));
  });

  // Log task stop and task duration
  glueInst.on('task_stop', (event) => {
      glueInst.log(chalk.green('[' + event.task + '] ') +
      chalk.blue('finished in ') + chalk.magenta(prettyMs(event.duration)));
    });

  // Print stderr and the task finish notification on error
  glueInst.on('task_err', (event)=> {
    glueInst.log(chalk.green('[' + event.task + '] ') +
      chalk.red(event.err.stderr));
    glueInst.log(chalk.green('[' + event.task + '] ') +
      chalk.blue('finished in ') + chalk.magenta(prettyMs(event.duration)));
  });

  // If there was an error in any of the tasks set the exit code
  glueInst.on('err', (event) => {
    glueInst.exitCode = 1;
  });

  // setup process event listener so we can
  // exit with the right code
  process.once('exit', (code) => {
    if (glueInst.exitCode === 1) {
      process.exit(1);
    }
  });

  // Now lets make do stuff
  glueInst.start(actionList);
}
//
