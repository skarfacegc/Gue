const isArray = require('lodash.isarray');

/**
 * GueTask - Methods that deal with a single task
 */
class GueTask {
  /**
   * constructor - Description
   *
   * @param {String} name         Name of the task
   * @param {Array|Function} dependencies Array of dependencies or the task action
   * @param {Function} action     Task action (function)
   *
   * @returns {} Nothing
   *
   * @example
   * // creates a task named foo that runs tasks a and b prior to
   * // running Promise.resolve()
   * new GueTask('foo',['a','b'],() =>{
   *   return Promise.resolve();
   * });
   *
   * // Creates a task named foo2 that just executes promise.resolve
   * new GueTask('foo2', () =>{
   *   return Promise.resolve();
   * }
   *
   * // Creates a task named foo3 that runs tasks a and b
   * new GueTask('foo3', ['a','b'])
   */
  constructor(name, dependencies, action) {

    // Have to have a name
    if (name === '' || name === undefined) {
      throw Error('GueTask constructor: no name provided');
    }

    // Make sure dependency is an array if we have an action
    if (typeof action === 'function' && !isArray(dependencies)) {
      throw Error('GueTask constructor: dependencies is not an array');
    }

    // Handles the 2 arg constructor with function
    // new GueTask('mytask', ()=>{return Promise.resolve()})
    if (typeof dependencies === 'function' && action === undefined) {
      action = dependencies;
      dependencies = undefined;
    }

    // Make sure we have something to do
    // Either an action or a dependecy
    if (action === undefined && !isArray(dependencies)) {
      throw Error('GueTask constructor: no action or dependencies defined');
    }

    // Make sure that if we have an action the action is a function
    if (action !== undefined && typeof action !== 'function') {
      throw Error('GueTask constructor: action must be a function');
    }

    this.name = name;
    this.dependencies = dependencies;
    this.action = action;
    this.startTime = 0;
    this.endTime = 0;
  }

  /**
   * hasDependencies - returns true if a task has dependencies
   *
   * @returns {boolean} true if a task has dependencies
   */
  hasDependencies() {
    if (isArray(this.dependencies)) {
      return true;
    } else {
      return false;
    }
  }
}

module.exports = GueTask;
