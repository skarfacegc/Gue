const GueTask = require('./GueTask');

/**
 * GueTasks - Methods that deal with lists of tasks
 */
class GueTasks {
  /**
   * constructor - Doesn't do anything interesting
   *
   */
  constructor() {
    this.tasks = {};
  }

  /**
   * addTask - Add a new task
   *
   * This just calls new GueTask and puts the result onto the task list
   *
   * dependencies are optional, if only two arguments are passed
   * then the 2nd argument is assumed to be the task itself and must
   * be a function
   *
   * You can just have dependencies without a task (for task group aliases)
   *
   * @param {string} name         Description
   * @param {array|function} dependencies A list of tasks (or the action
   * function if there are no dependencies)
   * @param {function} action         The action to run after dependencies have
   * been met
   *
   * @example
   * // Add a new task named myTask that runs console.log('foo') when executed
   * addTask('myTask', () =>{
   *   return Promise.resolve('foo')
   * }
   *
   * // Add a new task named ourTask that runs myTask and yourTask
   * addTask('ourTask', ['yourTask','myTask']);
   *
   * // Add a new task named theirTask that runs ourTask before running
   * // return Promise.resolve('woot')
   * addTask('theirTask',['ourTask'], () =>{
   *   return Promise.resolve('woot');
   * }
   *
   */
  addTask(name, dependencies, action) {
    if (this.tasks[name]) {
      throw new Error('GueTasks.addTask() duplicate name ' + name);
    }

    this.tasks[name] = new GueTask(name, dependencies, action);
  }

  /**
   * runTaskParallel - Run tasks in parallel
   *
   * This will run tasks concurrently. Each task's dependencies will
   * still run sequentially. If swallowError is true then a catch
   * is added for each task that swallows the error
   *
   * @param {string|array} tasks One or more tasks to run
   * @param {boolean} swallowError Set to true to ignore rejected tasks
   *
   * @return {promise}
   */
  runTaskParallel(tasks, swallowError = false) {
    const runList = [];

    // default to propagating rejections
    let catchHandler = val => {
      throw val;
    };

    // Swallow rejections if swallowError is true
    // this allows watch/smartwatch to execute all tasks each time through
    if (swallowError) {
      catchHandler = val => {};
    }

    // Build the runlist
    // the catch is so that errors don't stop the watch
    if (!Array.isArray(tasks)) {
      runList.push(this.runTask(tasks).catch(catchHandler));
    } else {
      tasks.forEach(task => {
        runList.push(this.runTask(task).catch(catchHandler));
      });
    }
    return Promise.all(runList);
  }

  /**
   * runTask - execute the action of a single task
   *
   * @param {string} taskName The name of the task to execute
   *
   * @return {promise} Resolved or rejected promise
   */
  runTask(taskName) {
    const taskToRun = this.tasks[taskName];
    if (!taskToRun) {
      return Promise.reject(
        'GueTasks.runTask() ' + taskName + ' is not defined'
      );
    }

    taskToRun.taskStarted();
    if (taskToRun.hasDependencies()) {
      return taskToRun.dependencies
        .reduce((promise, currentTask) => {
          return promise.then(() => {
            return this.runTask(currentTask);
          });
        }, Promise.resolve())
        .then(() => {
          return taskToRun.runAction();
        })
        .then(val => {
          taskToRun.taskFinished();
          return val;
        })
        .catch(val => {
          taskToRun.taskFinishedWithError(val);
          throw val;
        });
    } else {
      return taskToRun
        .runAction()
        .then(val => {
          taskToRun.taskFinished();
          return val;
        })
        .catch(val => {
          taskToRun.taskFinishedWithError(val);
          throw val;
        });
    }
  }
}

module.exports = GueTasks;
