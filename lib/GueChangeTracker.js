const sha = require('sha');

/**
 * GueChangeTracker - Methods to track which files have changed
 *
 * GueChangeTracker contains methods to track which files have changed. The
 * goal is to provide methods similar to your favorite fsEvent handler but
 * tracks state on the file system.
 */
class GueChangeTracker {
  /**
   * constructor - Creates a GueChangeTracker instance
   *
   * @param {fileSet} fileSet fileSet object we want to track changes on
   * @param {path} dbFile  The location of the datafile
   *
   */
  constructor(fileSet, dbFile) {
    this.fileSet = fileSet;
    this.dbFile = dbFile;
  }

  /**
   * sumFile - Returns the checksum for the passed file
   *
   * @param {path} file Path of the file to checksum
   *
   * @return {promise} resolves to the computed hash
   */
  sumFile(file) {
    return new Promise((resolve, reject) => {
      sha.get(file, (err, hash) => {
        if (err) {
          reject(err);
        } else {
          resolve(hash);
        }
      });
    });
  }

  /**
   * checkFileSum - Description
   *
   * @param {string} file    path of file to check
   * @param {string} toCheck hash to compare
   *
   * @return {boolean} True if the file matches the expected hash,
   * false in all other cases
   */
  checkFileSum(file, toCheck) {
    return new Promise((resolve, reject) => {
      this.sumFile(file)
        .then(check => {
          resolve(check === toCheck);
        })
        .catch(() => {
          resolve(false);
        });
    });
  }
}

module.exports = GueChangeTracker;
