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

  /**
   * This doesn't take anything interesting.
   *
   * @example
   * const gue = require('gue');
   */
  constructor(...args) {
    super(...args);
    this.exitCode = 0;
    this.options = {};
  }

  /**
   * Create a new task
   *
   * Tasks are the core of gue.  They are the bits that contain the
   * work you want done.  A gue task consists of a name and one or more
   * things to do.  Each task may define a list of dependencies that will
   * run to completion prior to running the current task.  Each task may
   * also specify a function to run.
   *
   *
   * - Tasks should return a promise or call the callback that is passed
   * to the function.
   * - Dependencies will run to completion prior to executing the current task.
   * These tasks will run asynchronously (order is not guaranteed)
   *
   * @param {string} name Name of the task
   * @param {array} deps Array of task dependencies
   * @param {function} func The function to execute for this task
   *
   * @example
   * // Create a task that just calls dep1 and dep2
   * task('mytask', ['dep1','dep2']);
   *
   * // Create a task that runs tests and code coverage
   * task('coverage', () =>{
   *   return gue.shell('nyc mocha tests/*.js')
   * })
   *
   * // Create a task that calls a linter task prior to coverage
   * task('coverage', ['lint'], () =>{
   *   return gue.shell('nyc mocha tests/*.js')
   * })
   *
   * // Example of using a callback
   * task('nonPromise', (done) => {
   *   plainFunction();
   *   done();
   * })
   */
  task(name, deps, func) {
    super.add(name, deps, func);
  }

  /**
   * Runs a shell command and prints the output
   *
   * Shell commands print their buffer when the task is completed.  If a shell
   * command exits with a non zero status a flag is set so that gue exits
   * with 1. A shell command that errors will have it's stderr printed in red.
   * See the fail task in the output above. Shell commands are run through the
   *  [lodash](https://www.npmjs.com/package/lodash.template) template system
   *  using ```{{}}``` as the replacement tokens.  The substitution values
   * may be passed in as an optional third argument, or they may be loaded from
   *  the values specified with ```gue.setOption()```. If ```templateValue``` is
   *  set, it overrides ```gue.setOption```.
   *

   *
   * @param {string} command The shell command to run
   * @param {literal} value An optional override of the values set with
   * setOption
   * @returns {promise} Promise containing the
   * [execa](https://www.npmjs.com/package/execa) result
   *
   * @example
   * gue.setOption('myString', 'foobar');
   *
   * // foobar
   * gue.shell('echo {{myString}}');
   *
   * // woot
   * gue.shell('echo {{myString}}', {myString: 'woot'});
   */
  shell(command, value) {
    return this._shell('print', command, value);
  }

  /**
   * same as shell but doesn't print any output
   *
   * @param {string} command The shell command to run
   * @param {literal} value An optional override of the values set with
   * setOption
   *
   * @returns {promise} Promise containing the
   * [execa](https://www.npmjs.com/package/execa) result
   */
  silentShell(command, value) {
    return this._shell('silent', command, value);
  }

  /**
   * Sets a name value binding for use in the lodash expansion
   * in the shell commands
   *
   * @param {string} name  name of the value
   * @param {literal} value the value itself
   *
   */
  setOption(name, value) {
    this.options[name] = value;
  }

  /**
   * Return an array of the defined tasks
   *
   * @returns {array} Array of the defined tasks
   */
  taskList() {
    return Object.keys(this.tasks);
  }

  /**
   * Prints a log message
   *
   * If only the message is passed it behaves like console.log
   * If duration isn't passed it isn't printed
   *
   * @param {string} message  The string to log
   * @param {string} taskname The name of the task
   * @param {type} duration The task duration in ms
   *
   */
  log(message, taskname, duration) {
    if (!taskname && !duration) {
      this._log('clean', message);
    } else {
      this._log('normal', message, taskname, duration);
    }
  }

  /**
   * Prints an error message
   *
   * Message is printed in red
   * If only the message is passed it behaves like console.log
   * If duration isn't passed it isn't printed
   *
   * @param {string} message  The string to log
   * @param {string} taskname The name of the task
   * @param {int} duration The task duration in ms
   *
   */
  errLog(message, taskname, duration) {
    this._log('error', message, taskname, duration);
  }

  /**
   * This is what actually does the shell execution for ```shell```
   * and ```silentShell```
   *
   * See the documentation for '''shell''' for more information
   *
   * @param {string} mode    'print' or 'silent'
   * @param {type} command The shell command to run
   * @param {type} values  an optional override of the values set with
   * setOption
   *
   * @returns {promise} Promise containing the
   * [execa](https://www.npmjs.com/package/execa) result
   */
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
        return Promise.resolve(result);
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

  /**
   * does the acutal printing for ```log``` and ```errLog```
   *
   * - Error type prints the message in red
   * - Normal type prints the message in cyan
   * - Clean type prints the message without any coloring
   *
   * @param {string} type     error normal clean
   * @param {string} message  The string to log
   * @param {string} taskname The name of the task
   * @param {int} duration The task duration in ms
   *
   */
  _log(type, message, taskname, duration) {
    let composedMessage = '';

    if (!message || message === '') {
      return;
    }

    if (taskname && taskname !== undefined) {
      composedMessage += chalk.bold.green(
        util.leftPad('[' + taskname + '] ', 3 + util.maxLen(this._runList())));
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

  /**
   * Returns the list of active tasks without 'default' if it's there
   * Used mainly to set the width of taskname in ```_log```
   *
   * @returns {array} Array of the active tasks
   */
  _runList() {
    let myArr = this.seq;
    let indexToRemove = myArr.indexOf('default');
    if (indexToRemove > 0) {
      myArr.splice(indexToRemove, 1);
    }
    return myArr;
  }

}
module.exports = new Gue();
