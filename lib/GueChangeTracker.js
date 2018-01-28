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
  }
}

module.exports = GueChangeTracker;
