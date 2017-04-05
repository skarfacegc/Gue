'use strict';
const Orchestrator = require('orchestrator');
const execa = require('execa');
const template = require('lodash.template');
const templateSettings = require('lodash.templatesettings');
const chalk = require('chalk');
const trimNewlines = require('trim-newlines');
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

  log(message, taskname, duration) {
    if (!taskname && !duration) {
      this._log('clean', message);
    } else {
      this._log('normal', message, taskname, duration);
    }
  }

  errLog(message, taskname, duration) {
    this._log('error', message, taskname, duration);
  }

  shell(command, value) {
    return this._shell('print', command, value);
  }

  _shell(mode, command, values) {

    const lodashVars = (values && typeof values !== undefined) ? values :
      this.options;

    templateSettings.interpolate = /{{([\s\S]+?)}}/g;
    const compiledCmd = template(command);
    return execa.shell(compiledCmd(lodashVars), {env: {FORCE_COLOR: 'true'}})
      .then((result) => {
        if (mode === 'print') {
          this.errLog(trimNewlines(result.stderr));
          this.log(trimNewlines(result.stdout));
        }
        return result.stdout;
      })
      .catch((result) => {
        this.exitCode = 1;
        if (mode === 'print') {
          this.errLog(trimNewlines(result.stderr));
          this.log(trimNewlines(result.stdout));
        }
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

  _log(type, message, taskname, duration) {
    let composedMessage = '';

    if (!message || message === '') {
      return;
    }

    if (taskname && taskname !== undefined) {
      composedMessage += chalk.bold.green(
        util.leftPad('[' + taskname + '] ', 3 + util.maxLen(this.runList())));
    }

    if (type === 'error') {
      composedMessage += chalk.red(message);
    } else if (type === 'normal') {
      composedMessage += chalk.cyan(message);
    } else if (type === 'clean') {
      composedMessage += message;
    } else {
      composedMessage += message;
    }

    if (duration !== undefined && duration > 0.0) {
      composedMessage += ' ' + chalk.white(prettyMs(duration));
    }
    console.log(composedMessage);
  }

}
module.exports = new Gue();
