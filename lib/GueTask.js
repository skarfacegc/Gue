const gueEvents = require('./GueEvents');

/**
 * GueTask - Methods that deal with a single task
 * since runTask needs to interact with the dependency tree
 * that action is in the GueTasks module (since GueTasks deals with
 * lists of tasks).  Executing the task action lives here.
 */
class GueTask {
  /**
   * constructor - Create a new task with dependencies and actions.
   * You must have either a dependency or an action.
   * You may have both dependencies and an action
   *
   * @param {String} name         Name of the task
   * @param {Array|Function} dependencies Array of dependencies or the task
   * action
   * @param {Function} action     Task action (function)
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
      throw Error('GueTask.constructor no name provided');
    }

    // Make sure dependency is an array if we have an action
    if (typeof action === 'function' && !Array.isArray(dependencies)) {
      throw Error('GueTask.constructor dependencies is not an array');
    }

    // Handles the 2 arg constructor with function
    // new GueTask('mytask', ()=>{return Promise.resolve()})
    if (typeof dependencies === 'function' && action === undefined) {
      action = dependencies;
      dependencies = undefined;
    }

    // Make sure we have something to do
    // Either an action or a dependency
    if (action === undefined && !Array.isArray(dependencies)) {
      throw Error('GueTask.constructor no action or dependencies defined');
    }

    // Make sure that if we have an action the action is a function
    if (action !== undefined && typeof action !== 'function') {
      throw Error('GueTask.constructor action must be a function');
    }

    this.name = name;
    this.dependencies = dependencies;
    this.action = action;
    this.startTime = 0;
    this.endTime = 0;
    this.actionStartTime = 0;
    this.actionEndTime = 0;
  }

  /**
   * hasDependencies - returns true if a task has dependencies
   *
   * @return {boolean} true if a task has dependencies
   */
  hasDependencies() {
    if (Array.isArray(this.dependencies)) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * beginTask - Marks the task as started
   *
   * handles any task start activities. Currently just
   * sets the start time and sends the start message to
   * gueEvents
   *
   */
  taskStarted() {
    this.startTime = Date.now();
    gueEvents.emit('GueTask.taskStarted', this);
  }

  /**
   * endTask - Marks the task as done
   *
   * handles any task end activities. Currently just
   * sets the end time and sends the end message to
   * gueEvents
   *
   */
  taskFinished() {
    this.endTime = Date.now();
    gueEvents.emit('GueTask.taskFinished', this);
  }

  /**
   * taskFinishedWithError - Marks a task as finished with an error
   * emits the task failed event
   *
   * @param {string} message Error message
   *
   */
  taskFinishedWithError(message) {
    this.endTime = Date.now();
    gueEvents.emit('GueTask.taskFinished.error', this, message);
  }

  /**
   * getTaskDuration - Returns how long the task ran
   *
   * @return {integer} Number of ms the task ran
   */
  getTaskDuration() {
    let retVal = 0;
    if (this.endTime > 0) {
      retVal = this.endTime - this.startTime;
    }

    return retVal;
  }

  /**
   * startAction - Handles execution start
   */
  startAction() {
    this.actionStartTime = Date.now();
    gueEvents.emit('GueTask.startAction', this);
  }

  /**
   * endAction - Handles execute completion
   */
  endAction() {
    this.actionEndTime = Date.now();
    gueEvents.emit('GueTask.endAction', this);
  }

  /**
   * endActionWithError - end the action and emits an error
   *
   * @param {string} message The error message
   *
   */
  endActionWithError(message) {
    this.actionEndTime = Date.now();
    gueEvents.emit('GueTask.endAction.error', this, message);
  }

  /**
   * getActionDuration - Returns how long the action ran
   *
   * @return {integer} Number of ms the action ran
   */
  getActionDuration() {
    let retVal = 0;
    if (this.actionEndTime > 0) {
      retVal = this.actionEndTime - this.actionStartTime;
    }

    return retVal;
  }

  /**
   * execute - executes the task's action
   *
   * This does not check/resolve dependencies
   *
   * @return {promise} returns a promise for the running action
   */
  runAction() {
    // If we don't have an action treat it as resolved
    let action;
    if (this.action) {
      action = this.action;
    } else {
      action = () => {
        return Promise.resolve();
      };
    }

    this.startAction();
    return action()
      .then((val) => {
        this.endAction();
        return val;
      })
      .catch((val) => {
        this.endActionWithError(val);
        throw val;
      });
  }
}

module.exports = GueTask;
