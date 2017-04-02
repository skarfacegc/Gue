'use strict';
const Orchestrator = require('orchestrator');
const execa = require('execa');
const template = require('lodash.template');
const templateSettings = require('lodash.templatesettings');
const chalk = require('chalk');
const trim = require('trim');
const util = require('./lib/Util');
const prettyMs = require('pretty-ms');

class Gue extends Orchestrator {

  constructor(...args) {
    super(...args);
    this.exitCode = 0;
    this.options = {};
  }

  task(name, deps, func) {
    super.add(name, deps, func);
  }

  shell(command, values) {

    const lodashVars = (values && typeof values !== undefined) ? values :
      this.options;

    templateSettings.interpolate = /{{([\s\S]+?)}}/g;
    const compiledCmd = template(command);
    return execa.shell(compiledCmd(lodashVars), {env: {FORCE_COLOR: 'true'}})
      .then((result) => {
        result.stdout = trim(result.stdout);
        this.log(result.stdout);
        return result.stdout;
      })
      .catch((result) => {
        this.exitCode = 1;
        result.stderr = trim(result.stderr);
        this.log(trim(result.stdout));
        return Promise.reject(result);
      });
  }

  setOption(name, value) {
    this.options[name] = value;
  }

  taskList() {
    return Object.keys(this.tasks);
  }

  // Display the list of tasks to run
  // removes default if it exists
  runList() {
    let myArr = this.seq;
    let indexToRemove = myArr.indexOf('default');
    if (indexToRemove > 0) {
      myArr.splice(indexToRemove, 1);
    }
    return myArr;
  }

  log(message, taskname, type, duration) {
    let composedMessage = '';

    if (!message || message === '') {
      return;
    }

    // If we should use colored logging
    if (taskname || type || duration) {
      if (taskname && taskname !== undefined) {

        composedMessage += chalk.bold.green(
          util.leftPad('[' + taskname + '] ', 3 + util.maxLen(this.runList())));
      }

      if (type === 'error') {
        composedMessage += chalk.red(message);
      } else {
        composedMessage += chalk.cyan(message);
      }

      if (duration) {
        composedMessage += ' ' + chalk.white(prettyMs(duration));
      }
    } else {
      composedMessage += message;
    }
    console.log(composedMessage);
  }

}
module.exports = new Gue();
