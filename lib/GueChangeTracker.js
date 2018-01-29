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
   * @param {fileSet} fileSet Gue's fileSet object
   * @param {path} dbFile  The location of the datafile
   *
   */
  constructor(fileSet, dbFile) {
    this.fileSet = fileSet;
    this.dbFile = dbFile;

    this.checksumAlgo = 'md5';
  }

  /**
   * sumFile - Returns the checksum for the passed file
   *
   * @param {path} file Path of the file to checksum
   *
   * @return {string} the resulting checksum
   */
  sumFile(file) {
    return new Promise((resolve, reject) => {
      sha.get(file, (err, hash) => {
        resolve(hash);
      });
    });
  }
}

module.exports = GueChangeTracker;
