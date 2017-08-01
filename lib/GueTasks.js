const GueTask = require('./GueTask');
const isArray = require('lodash.isarray');
const gueEvents = require('./GueEvents');

/**
 * GueTasks - Methods that deal with lists of tasks
 */
class GueTasks {

  /**
   * constructor - Doesn't do anything interesting
   *
   * @returns nothing
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
   * @param {array|function} dependencies A list of tasks (or the action function
   * if there are no dependencies)
   * @param {function} task         The task to run
   *
   * @returns {type} nothing
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
      throw new Error('GueTasks addTask: duplicate name ' + name);
    }

    this.tasks[name] = new GueTask(name, dependencies, action);
  }

  /**
   * startTasks - Run the named task or tasks
   *
   * @param {array|string} taskNames an array of tasks or a task to run
   *
   * @returns {promise} resolved or rejected promise based
   */
  startTasks(taskNames) {
    // Normalize the task list
    if (!isArray(taskNames)) {
      taskNames = [taskNames];
    }

    taskNames.forEach((taskName)=> {
      this.runTask(taskName);
    });
  }

  /**
   * runTask - execute the action of a single task
   *
   * @param {string} taskName The name of the task to execute
   *
   * @returns {promise} Resolved or rejected promise
   */
  runTask(taskName) {
    let returnPromise = {};
    if (!this.tasks[taskName]) {
      throw Error('GueTasks.runTask() ' + taskName + 'is not defined');
    }

    this.tasks[taskName].beginTask();

    // Execute the task if there aren't any dependencies
    if (!this.tasks[taskName].hasDependencies()) {
      return this.tasks[taskName].runAction()
      .then((val)=> {
        this.tasks[taskName].endTask();
        return val;
      });
    } else {
      // Since we have dependencies, run 'em

      // Define the reduce function
      let reduceFn = (promise, cur) => {
        // process the dependencies first
        if (this.tasks[cur].hasDependencies()) {
          return this.runTask(cur);
        } else {
          // wait for the previous task to finish then execute the current
          return promise.then(() => {
            this.tasks[cur].beginTask();
            return this.tasks[cur].runAction();
          })
          .then((val)=> {
            this.tasks[cur].endTask();
            return val;
          });
        }
      };

      return this.tasks[taskName].dependencies
      .reduce(reduceFn, Promise.resolve())
      .then(() => {
        return this.tasks[taskName].runAction();
      })
      .then((val)=> {
        this.tasks[taskName].endTask();
        return val;
      });
    }
  }
}

module.exports = GueTasks;
