'use strict';
const execa = require('execa');
const chalk = require('chalk');
const trimNewlines = require('trim-newlines');
const prettyMs = require('pretty-ms');
const chokidar = require('chokidar');
const handlebars = require('handlebars');
const beeper = require('beeper');
const FileSet = require('./lib/fileSet');
const GueTasks = require('./lib/GueTasks');
const gueEvents = require('./lib/GueEvents');

/**
 * Gue - The main class for the gue task runner
 */
class Gue {
  /**
   * This doesn't take anything interesting.
   *
   * @example
   * const gue = require('gue');
   */
  constructor() {
    this.options = {};
    this.fileSet = new FileSet();
    this.gueTasks = new GueTasks();
    this.registerEventHandlers();
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
   * - Tasks should return a promise.
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
   */
  task(name, deps, func) {
    this.gueTasks.addTask(name, deps, func);
  }

  /**
   * Runs a shell command and prints the output
   *
   * Shell commands print their buffer when the task is completed.  If a shell
   * command exits with a non zero status a flag is set so that gue exits
   * with 1. STDERR is printed in red.
   *
   * The command string is actually a
   * [handlebars](https://www.npmjs.com/package/handlebars) template.
   *
   * The following helpers are provided:
   * - ```{{files "fileSet"}}```: expands to the files matching the glob in
   *   fileSet.  **the quotes are required**
   * - ```{{globs "fileSet"}}```: expands to the glob(s) in the fileSet.
   *   **the quotes are required**
   *
   * @param {string} command The shell command to run
   * @param {object} value passed to handlebars render
   * @return {promise} Promise containing the
   * [execa](https://www.npmjs.com/package/execa) result
   *
   * @example
   * gue.fileSet.add('exampleSet', 'README.*');
   *
   * // README.md
   * gue.shell('echo {{files "exampleSet"}}');
   *
   * // *.md
   * gue.shell('echo {{globs "exampleSet"}}');
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
   * @param {array} value Additional values that get passed to the template
   *
   * @return {promise} Promise containing the
   * [execa](https://www.npmjs.com/package/execa) result
   */
  silentShell(command, value) {
    return this._shell('silent', command, value);
  }

  /**
   * watch = watch the specified files and run taskList when a change is
   * detected
   *
   * This is just a passthrough to _watch.  Done to make it easier to
   * maintain API compatibility.
   *
   * @param {glob} glob [chokidar](https://github.com/paulmillr/chokidar)
   *  compatible glob
   * @param {tasklist} taskList  tasks to run when a file in files changes
   *
   * @return {Promise} A promise for this._watch
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
    return new Promise(() => {
      return this._watch(glob, taskList);
    });
  }

  /**
   * smartWatch - Watch all files specified in the fileset, run the appropriate
   * tasks when one of the files is changed
   *
   * @param {fileSet} fileSet the fileset object that contains the files to
   * watch
   *
   * @return {Promise} returns a promise for this._smartWatch
   *
   */
  smartWatch(fileSet) {
    this.log('Started. ^c to stop', 'smartWatch');
    return new Promise(() => {
      this._smartWatch(fileSet);
    });
  }

  /**
   * Return an array of the defined tasks
   *
   * @return {array} Array of the defined tasks
   */
  taskList() {
    return Object.keys(this.gueTasks.tasks);
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
   * @param {string} command The shell command/shell command template to run
   * @param {object} values  values to pass to the command template
   *
   * @return {promise} Promise containing the
   * [execa](https://www.npmjs.com/package/execa) result
   */
  _shell(mode, command, values) {
    const that = this;

    this.debugLog(command, 'debug');

    const shellOpts = {
      env: {
        FORCE_COLOR: 'true',
        PATH: process.env.PATH
      }
    };

    const compiledCmd = buildCmd(that, command);

    this.debugLog(compiledCmd(values), 'debug');

    return execa
      .shell(compiledCmd(values), shellOpts)
      .then(result => {
        if (mode === 'print') {
          this.errLog(trimNewlines(result.stderr));
          this.log(trimNewlines(result.stdout));
        }
        return result;
      })
      .catch(result => {
        if (mode === 'print') {
          this.errLog(trimNewlines(result.stderr));
          this.log(trimNewlines(result.stdout));
        }
        throw result;
      });
  }

  /**
   * Uses the fileset object passed to figure out which tasks to run
   * based on the files that have changed.
   *
   * @param {Object} fileSet fileSet object
   *
   * @return {Object} chokidar watcher
   */
  _smartWatch(fileSet) {
    const chokidarOpts = {
      ignoreInitial: true
    };

    const watcher = chokidar.watch(fileSet.getAllFiles(), chokidarOpts);

    // This shares a very similar structure to the handler in
    // _watch.  Only way I could figure out how to extract it involved
    // passing two closures which seemed to be worse than repeating myself
    // a bit
    watcher.on('all', (event, path) => {
      const tasks = fileSet.getTasks(path);
      this.log(
        path + ' ' + event + ' running [' + tasks.join(',') + ']',
        'smartWatch'
      );

      // Stop the watch, then restart after tasks have run
      // this fixes looping issues if files are modified
      // during the run (as with jscs fix)
      watcher.close();
      this.gueTasks
        .runTaskParallel(tasks, true)
        .catch(() => {
          // don't let errors stop the restart
        })
        .then(() => {
          this._smartWatch(fileSet);
        });
    });

    return watcher;
  }

  /**
   * Watch the specified files and run taskList when a change is detected
   *
   * @param {glob} glob [chokidar](https://github.com/paulmillr/chokidar)
   *  compatible glob
   * @param {(string|string[])} taskList  tasks to run when a file in files
   * changes
   * @return {object} Returns the chokidar watcher
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
      this.gueTasks
        .runTaskParallel(taskList, true)
        .catch(() => {
          // don't let errors stop the restart
        })
        .then(() => {
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

    if (
      duration !== undefined &&
      duration > 0.0 &&
      process.env.NODE_ENV !== 'snapshot'
    ) {
      composedMessage += ' ' + chalk.white(prettyMs(duration));
    }
    console.log(composedMessage);
  }

  /**
   * registerEventHandlers - Register the event handlers
   *
   * These mainly handle ensuring that logs are emitted
   * and the exit code is set correctly
   *
   */
  registerEventHandlers() {
    // Log task start
    gueEvents.on('GueTask.taskStarted', task => {
      if (task.name !== 'default') {
        this.log('started', task.name, 'normal');
      }
    });

    // Log task stop and task duration
    gueEvents.on('GueTask.taskFinished', task => {
      if (task.name !== 'default') {
        this.log('finished in', task.name, task.getTaskDuration());
      }
    });

    // Print stderr and the task finish notification on error
    gueEvents.on('GueTask.taskFinished.error', (task, message) => {
      process.exitCode = 1;
      beeper(1);
      this.errLog('finished with error in', task.name, task.getTaskDuration());
    });
  }
}
module.exports = new Gue();

//
// Some helpers
//

/**
 * buildCmd - Generates the handlebars template
 *
 * @param {Gue} that    The Gue object instance to work on
 * @param {string} command The template string
 *
 * @return {handlebars} Handlebars template object
 */
function buildCmd(that, command) {
  handlebars.registerHelper('files', setName => {
    return that.fileSet.getFiles(setName);
  });

  handlebars.registerHelper('globs', setName => {
    return that.fileSet.getGlobs(setName);
  });

  return handlebars.compile(command);
}
