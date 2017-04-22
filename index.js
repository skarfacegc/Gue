'use strict';
const Orchestrator = require('orchestrator');
const execa = require('execa');
const template = require('lodash.template');
const templateSettings = require('lodash.templatesettings');
const chalk = require('chalk');
const trimNewlines = require('trim-newlines');
const util = require('./lib/Util');
const prettyMs = require('pretty-ms');
const chokidar = require('chokidar');
const FileSet = require('./lib/fileSet');

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
    this.fileSet = new FileSet();

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
   * Tasks are just javascript.  You don't need to just use ```gue.shell```.
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
   * with 1. STDERR is printed in red.
   * Shell commands are run through the
   * [lodash](https://www.npmjs.com/package/lodash.template) template system
   * using ```{{}}``` as the replacement tokens.  The substitution values
   * may be passed in as an optional third argument, or they may be loaded from
   * the values specified with ```gue.setOption()```. If ```templateValue``` is
   * set, it overrides ```gue.setOption```.
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
   * Watch the specified files and run taskList when a change is detected
   *
   * This is just a passthrough to _watch.  Done to make it easier to
   * maintain API compatibility.
   *
   * @param {glob} files [chokidar](https://github.com/paulmillr/chokidar)
   *  compatible glob
   * @param {tasklist} taskList  tasks to run when a file in files changes
   *
   * @example
   * // Run lint and coverage tasks if a file matching src/*.js changes
   * gue.watch('src/*.js', ['lint','coverage']);
   *
   * // Run coverage task if a file matching tests/*.js changes
   * gue.watch('tests/*.js', 'coverage');
   *
   */
  watch(glob, taskList) {
    this.log('Started. ^c to stop', 'watch');
    return this._watch(glob, taskList);
  }

  /**
   * Uses the fileset object passed to figure out which tasks to run
   * based on the files that have changed.
   *
   * @param {Object} fileSet fileSet object
   *
   * @returns {Object} chokidar watcher
   */
  autoWatch(fileSet) {
    const chokidarOpts = {
      ignoreInitial: true
    };

    const watcher = chokidar.watch(fileSet.getAllFiles(), chokidarOpts);

    // This shares a very similar structure to the handler in
    // _watch.  Only way I could figure out how to extract it involved
    // passing two closures which seemed to be worse than repeating myself
    // a bit
    watcher.on('all', (event, path)=> {
      const tasks = fileSet.getTasks(path);
      this.log(path + ' ' + event + ' running [' + tasks.join(',') + ']',
        'autoWatch');

      // Stop the watch, then restart after tasks have run
      // this fixes looping issues if files are modified
      // during the run (as with jscs fix)
      watcher.close();
      this.start(tasks, () => {
        this.autoWatch(fileSet);
      });
    });

    return watcher;
  }

  /**
   * Sets a name value binding for use in the lodash expansion
   * in the shell commands
   *
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
   * - If only message is passed it behaves like console.log
   * - If taskname is passed it's added as a tag to the message
   * and the message is colorized
   * - If duration is passed the duration of the task is printed
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
   * Decorates like log, but message is printed in red
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
   * Prints a debug message
   *
   * @param {string} message  The message to print
   * @param {string} taskname The name of the task
   *
   */
  debugLog(message, taskname) {
    if (this.debug) {
      this._log('debug', message, taskname);
    }
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

    this.debugLog(command, 'debug');

    const lodashVars = (values && typeof values !== undefined) ? values :
      this.options;

    const shellOpts = {
      env: {
        FORCE_COLOR: 'true',
        PATH: process.env.PATH
      }
    };

    templateSettings.interpolate = /{{([\s\S]+?)}}/g;
    const compiledCmd = template(command);
    return execa.shell(compiledCmd(lodashVars), shellOpts)
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
   * Watch the specified files and run taskList when a change is detected
   *
   * @param {glob} files [chokidar](https://github.com/paulmillr/chokidar)
   *  compatible glob
   * @param {(string|string[])} taskList  tasks to run when a file in files changes
   * @returns {object} Returns the chokidar watcher
   * @example
   * // Run lint and coverage tasks if a file matching src/*.js changes
   * gue._watch('src/*.js', ['lint','coverage']);
   *
   * // Run coverage task if a file matching tests/*.js changes
   * gue._watch('tests/*.js', 'coverage');
   *
   */
  _watch(glob, taskList) {
    const chokidarOpts = {
      ignoreInitial: true
    };

    const watcher = chokidar.watch(glob, chokidarOpts);

    watcher.on('all', (event, path) => {
      this.log('\n');
      this.log(path + ' ' + event, 'watch');

      // Stop the watch, then restart after tasks have run
      // this fixes looping issues if files are modified
      // during the run (as with jscs fix)
      watcher.close();
      this.start(taskList, () => {
        this._watch(glob, taskList);
      });
    });

    return watcher;
  }

  /**
   * does the actual printing for ```log``` and ```errLog```
   *
   * - Error type prints the message in red
   * - Debug prints the message in yellow
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
      composedMessage += chalk.bold.green('[' + taskname + '] ');
    }

    if (type === 'error') {
      composedMessage += chalk.red(message);
    } else if (type === 'debug') {
      composedMessage += chalk.yellow(message);
    } else if (type === 'normal') {
      composedMessage += chalk.cyan(message);
    } else if (type === 'clean') {
      composedMessage += message;
    } else {
      composedMessage += message;
    }

    if (duration !== undefined && duration > 0.0 &&
        process.env.NODE_ENV !== 'snapshot') {
      composedMessage += ' ' + chalk.white(prettyMs(duration));
    }
    console.log(composedMessage);
  }
}
module.exports = new Gue();
