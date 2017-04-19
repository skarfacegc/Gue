'use strict;'

const globby = require('globby');
const multimatch = require('multimatch');
const isArray = require('lodash.isarray');
const uniq = require('lodash.uniq');
const util = require('../lib/Util');

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
    this.globMap = {};  // This is used to resolve a filename to a taskList
    this.allFiles = [];

    // dfeaultGlob is applied when returning file lists
    this.defaultGlob = ['**', '!node_modules/**', '!coverage/**'];
    return this;
  }

  /**
   * Add a new file set.
   *
   * Adds a file set named ```name``` that groups files selected by ```glob```
   * Associates the list of tasks with that set of files.
   *
   * @param {string} name  Name of the fileset
   * @param {(glob|globs)} globArg [multimatch](https://www.npmjs.com/package/multimatch)
   *     compatible glob
   * @param {array} tasks List of tasks to associate with this glob
   *
   * @returns {object} The fileset
   */
  add(name, globArg, tasks) {
    let retStruct = {};
    let globs = [];
    retStruct.name = name;
    retStruct.files = globby.sync(globArg);
    retStruct.globs = util.toArray(globArg);

    // if tasks is an array use it, otherwise
    // push it onto tasks (so that tasks is always an array)
    retStruct.tasks = [];
    if (isArray(tasks)) {
      retStruct.tasks = tasks;
    } else {
      retStruct.tasks.push(tasks);
    }

    this.fileSets[name] = retStruct;

    retStruct.globs.forEach((glob) => {
      // Init the globMap array if it doesn't exist
      if (!isArray(this.globMap[glob])) {
        this.globMap[glob] = retStruct.tasks;
      } else {
        this.globMap[glob] = uniq(this.globMap[glob].concat(retStruct.tasks));
      }
    });

    // Add the newly matched files to the allFiles array
    this.allFiles = uniq(this.allFiles.concat(retStruct.files));

    return retStruct;
  }

  /**
   * Return the list of tasks associated with the passed file
   *
   * @param {(filename|filenames[])} fileArg The file(s) to find tasks for
   *
   * @returns {array} list of reduced tasks that match the file
   */
  getTasks(fileArg) {
    let retList = [];
    let fileList  = [];

    if (isArray(fileArg)) {
      fileList = fileArg;
    } else {
      fileList.push(fileArg);
    }

    fileList.forEach((file) => {
      if (file && file !== undefined) {
        // Loop through the globs in globMap and build a list
        // of the tasks that match the fileSet name in the globMap
        Object.keys(this.globMap).forEach((element) => {

          const result = multimatch(file, element);
          if (result && result.length > 0) {
            retList = retList
              .concat(this.globMap[element]);
          }
        });
      }
    });

    return uniq(retList);
  }

  /**
   * Gets the glob for a given fileSet
   *
   * This is useful to get the glob for a specific set of tests etc
   *
   * WARNING: multimatch globs are not always shell compatible.
   * you may want to use getFiles unless you have lots of files that
   * match the glob.
   *
   * @param {string} setName The name of the file set with the glob you want
   *
   * @returns {string} space separated list of globs
   */
  getGlob(setName) {
    return this.fileSets[setName].globs.join(' ');
  }

  /**
   * Get a list of the files matching the glob for the pass set name
   *
   * @param {string} setName Name of the fileSet
   *
   * @returns {string} Space separated list of files
   */
  getFiles(setName) {
    const fileList = globby.sync(this.fileSets[setName].globs);
    const cleanedList = multimatch(fileList, this.defaultGlob);
    return cleanedList.join(' ');
  }

  /**
   * Return the list of all files from all globs in all fileSets
   *
   * @returns {array} List of all files
   */
  getAllFiles() {
    return multimatch(this.allFiles, this.defaultGlob);
  }
}

module.exports = FileSet;
