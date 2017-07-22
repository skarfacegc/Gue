const GueTask = require('./GueTask');
const isArray = require('lodash.isarray');

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
   * @param {array|function} dependencies A list of tasks or a function to run prior to task
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
   * // Add a new task named yourTask that runs console.log('foo') before
   * // running console.log('bar')
   * addTask('yourTask', () =>{
   *   return Promise.resolve('foo');
   * }, () =>{
   *   return Promise.resolve('bar');
   * }
   *
   * // Add a new task named ourTask that runs myTask and yourTask
   * addTask('ourTask', ['yourTask','myTask']);
   *
   * // Add a new task named theirTask taht runs ourTask before running
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
}

module.exports = GueTasks;
