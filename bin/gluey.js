#!/usr/bin/env node

'use strict';

const Liftoff = require('liftoff');
const argv = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');

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
  if (!env.configPath) {
    console.log(chalk.red('No gulpfile found'));
    process.exit(1);
  }

  require(env.configPath);
  const glueInst = require(env.modulePath);
  const actions = argv._;
  const actionList = actions.length ? actions : ['default'];
  const availableTasks = glueInst.taskList();

  if (argv.l) {
    console.log(availableTasks.join('\n'));
    process.exit(0);
  }

  // Now lets make do stuff
  glueInst.start(actionList);
}
//
