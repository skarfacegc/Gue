'use strict;'

const globby = require('globby');
const minimatch = require('minimatch');
const isArray = require('lodash.isarray');
const uniq = require('lodash.uniq');

/**
 * Methods to handle sets of files in Gue
 *
 * These really should not be called directly
 */
class FileSet {
  /**
   * Create a new FileSet object instance
   *
   * @returns {object} FileSet Object
   */
  constructor() {
    this.fileSets = {};
    this.globMap = {};  // This is used to resolve a filename to a fileSet
    this.allFiles = [];
    return this;
  }

  /**
   * Add a new file set.
   *
   * Adds a file set named ```name``` that groups files selected by ```glob```
   * Associates the list of tasks with that set of files.
   *
   * @param {string} name  Name of the fileset
   * @param {glob} glob  (minimatch)[https://www.npmjs.com/package/minimatch]
   *     compatible glob
   * @param {array} tasks List of tasks to associate with this glob
   *
   * @returns {object} The fileset
   */
  add(name, glob, tasks) {
    let retStruct = {};
    retStruct.name = name;
    retStruct.files = globby.sync(glob);
    retStruct.glob = glob;

    // if tasks is an array use it, otherwise
    // push it onto tasks (so that tasks is always an array)
    retStruct.tasks = [];
    if (isArray(tasks)) {
      retStruct.tasks = tasks;
    } else {
      retStruct.tasks.push(tasks);
    }

    this.fileSets[name] = retStruct;

    // Init the globMap array if it doesn't exist
    if (this.globMap[glob] === undefined) {
      this.globMap[glob] = [name];
    } else {
      this.globMap[glob].push(name);
    }

    // Add the newly matched files to the allFiles array
    this.allFiles = uniq(this.allFiles.concat(retStruct.files));

    return retStruct;
  }

  /**
   * Return the list of tasks associated with the passed file
   *
   * @param {filename} file The file to find tasks for
   *
   * @returns {array} list of reduced tasks that match the file
   */
  getTasks(file) {
    let retList = [];
    if (file && file !== undefined) {

      // Loop through the globs in globMap and build a list
      // of the tasks that match the fileSet name in the globMap
      Object.keys(this.globMap).forEach((element) => {
        if (minimatch(file, element)) {
          retList = retList.concat(this.fileSets[this.globMap[element]].tasks);
        }
      });
    }
    return uniq(retList);
  }

  /**
   * Get the list of files for a given task
   *
   * @param {string} taskName Name of the task you want the file list for
   *
   * @returns {array} List of files
   */
  getFiles(taskName) {
    return this.fileSets[taskName].files;
  }
}

module.exports = FileSet;
