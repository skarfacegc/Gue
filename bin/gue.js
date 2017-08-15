#!/usr/bin/env node

'use strict';

const Liftoff = require('liftoff');
const argv = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');
const beeper = require('beeper');

const gueCli = new Liftoff({
  name: 'gue',
  processTitle: 'gue',
  moduleName: 'gue',
  configName: 'guefile',
});

gueCli.launch({
  cwd: argv.cwd,
  configPath: argv.config,
  require: argv.require,
}, invoke);

function invoke(env) {

  if (!env.configPath) {
    console.error(chalk.red('No gulpfile found'));
    process.exit(1);
  }

  require(env.configPath);
  const gueInst = require(env.modulePath);
  const actions = argv._;
  const actionList = actions.length ? actions : ['default'];
  const availableTasks = gueInst.taskList();

  // add node_modules/.bin to the path.
  // this should be relative to the project root
  // if liftoff is working correctly.  :)
  process.env.PATH = env.configBase + '/node_modules/.bin:' +
    process.env.PATH;

  // Change directory to configBase to make sure everything
  // is relative to the project root
  // Fixes issue #4
  process.chdir(env.configBase);

  if (argv.l) {
    gueInst.log(availableTasks.join('\n'));
    process.exit(0);
  }

  // setup process event listener so we can
  // exit with the right code
  process.once('exit', (code) => {
    if (gueInst.exitCode === 1) {
      process.exit(1);
    }
  });

  console.log(actionList);

  // Now lets make do stuff
  gueInst.gueTasks.runTaskParallel(actionList);
}
//
