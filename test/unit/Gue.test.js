'use strict';

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
const sandbox = sinon.sandbox.create();
const gue = require('../../index');
const chalk = require('chalk');
const chokidar = require('chokidar');
const FileSet = require('../../lib/fileSet');

chai.use(sinonChai);

describe('Gue', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('constructor', () => {
    it('should have an options property', () => {
      expect(gue.options).to.exist;
    });
  });

  describe('task', () => {
    it('should successfully create a task', () => {
      gue.task('foo', ['bar'], () => {});

      expect(gue.tasks).to.have.property('foo');
      expect(gue.tasks.foo.dep).to.deep.equal(['bar']);
      expect(gue.tasks.foo.name).to.equal('foo');
    });
  });

  describe('setOption', () => {
    it('should add an option', () => {
      gue.setOption('foo', 'bar');
      expect(gue.options.foo).to.equal('bar');
    });
  });

  describe('_log', () => {
    it('should not decorate in clean mode', () => {
      const logStub = sandbox.stub(console, 'log');
      gue._log('clean', 'Hello');
      expect(logStub).to.be.calledWith('Hello');
    });

    it('should not decorate if an invalid mode is passed', () => {
      const logStub = sandbox.stub(console, 'log');
      gue._log('', 'Hello');
      expect(logStub).to.be.calledWith('Hello');
    });

    it('should correctly color the taskname and message', () => {
      var compareString = chalk.bold.green('[taskname] ');
      compareString += chalk.cyan('foo');

      const logStub = sandbox.stub(console, 'log');
      gue._log('normal', 'foo', 'taskname');
      expect(logStub).to.be.calledWith(compareString);
    });

    it('should print a colored duration if provided', () => {
      var compareString = chalk.bold.green('[taskname] ');
      compareString += chalk.cyan('foo');
      compareString += ' ' + chalk.white('1ms');

      const logStub = sandbox.stub(console, 'log');
      gue._log('normal', 'foo', 'taskname', 1);
      expect(logStub).to.be.calledWith(compareString);
    });

    it('should correctly color errors', () => {
      var compareString = chalk.red('foo');

      const logStub = sandbox.stub(console, 'log');
      gue._log('error', 'foo');
      expect(logStub).to.be.calledWith(compareString);
    });

    it('should correctly color debug messages', () => {
      var compareString = chalk.yellow('foo');

      const logStub = sandbox.stub(console, 'log');
      gue._log('debug', 'foo');
      expect(logStub).to.be.calledWith(compareString);
    });
  });

  describe('log', () => {
    it('should call _log correctly if all fields are defined', () => {
      const _logStub = sandbox.stub(gue, '_log');
      gue.log('foo', 'bar', 1);
      expect(_logStub).to.be.calledWith('normal', 'foo', 'bar', 1);
    });

    it('should call _log correctly if just message is passed', () => {
      const _logStub = sandbox.stub(gue, '_log');
      gue.log('plain');
      expect(_logStub).to.be.calledWith('clean', 'plain');
    });
  });

  describe('errLog', () => {
    it('should call _log correctly', () => {
      const _logStub = sandbox.stub(gue, '_log');
      gue.errLog('err');
      expect(_logStub).to.be.calledWith('error', 'err');
    });
  });

  describe('debugLog', () => {
    it('should call _log correctly', () => {
      const _logStub = sandbox.stub(gue, '_log');

      gue.debug = true;
      gue.debugLog('err');
      gue.debug = false;

      expect(_logStub).to.be.calledWith('debug', 'err');
    });

    it('should not log if debug is false', () => {
      const _logStub = sandbox.stub(gue, '_log');
      gue.debug = false;
      gue.debugLog('err');
      expect(_logStub).to.not.be.called;
    });
  });

  describe('_shell', () => {

    it('should expand fileSet files', () => {
      const fileSet = gue.fileSet;
      fileSet.add('testSet', '*README.md*');

      gue._shell('silent', 'echo {{files "testSet"}}')
        .then((data) => {
          expect(data.stdout).to.equal('README.md');
        });
    });

    it('should expand fileSet globs', () => {
      const fileSet = gue.fileSet;
      fileSet.add('globTest', '*.md');

      gue._shell('silent', 'echo \'{{globs "globTest"}}\'')
        .then((data) => {
          expect(data.stdout).to.equal('*.md');
        });
    });

    it('should run a command with passed replacement', () => {
      return gue._shell('silent', 'echo {{foo}}', {
        foo: 'woot'
      })
      .then((data) => {
        expect(data.stdout).to.equal('woot');
      });
    });

    it('should handle command failures', (done) => {
      gue._shell('silent', 'badcommand')
        .then(()=> {
          done(new Error('Should not have succeeded'));
        })
        .catch((err) => {
          expect(err.stderr).to.contain('badcommand');
          done();
        });
    });

    it('should not print on successs when called in silent mode', (done) => {
      const logStub = sandbox.stub();
      gue.log = logStub;
      gue._shell('silent', 'echo foo')
        .then((data) => {
          expect(logStub).to.not.be.called;
          done();
        })
        .catch((data) => {
          done(new Error('Should not have gotten here'));
        });
    });

    it('should not print on failure when called in silent mode', (done) => {
      const logStub = sandbox.stub();
      gue.log = logStub;
      gue._shell('silent', 'bad command')
        .then((data) => {
          done(new Error('Should not have gotten here'));
        })
        .catch((data) => {
          expect(logStub).to.not.be.called;
          done();
        });
    });

    it('should print on success when called in print mode', (done) => {
      const logStub = sandbox.stub();
      gue.log = logStub;
      gue._shell('print', 'echo foo')
        .then((data) => {
          expect(logStub).to.be.calledWith('foo');
          done();
        })
        .catch((data) => {
          done(new Error('Should not have gotten here'));
        });
    });

    it('should print on failure when called in print mode', (done) => {
      const logStub = sandbox.stub();
      sandbox.stub(console, 'log');
      gue.errLog = logStub;
      gue._shell('print', 'badcommand')
        .then((data) => {
          done(new Error('Should not have gotten here'));
        })
        .catch((data) => {
          expect(logStub).to.be
            .calledWithMatch(/badcommand.*not found/);
          done();
        });
    });
  });

  describe('shell', () => {
    it('should call _shell with the print mode set', () => {
      const _shellStub = sandbox.stub(gue, '_shell');
      gue.shell('/bin/ls');
      expect(_shellStub).to.be.calledWith('print', '/bin/ls');
    });
  });

  describe('silentShell', () => {
    it('should call _shell with the silent mode set', () => {
      const _shellStub = sandbox.stub(gue, '_shell');
      gue.silentShell('/bin/ls');
      expect(_shellStub).to.be.calledWith('silent', '/bin/ls');
    });
  });

  describe('taskList', () => {
    it('should return the list of tasks', () => {
      gue.task('testTask', () => {});
      expect(gue.taskList()).to.contain('testTask');
    });
  });

  describe('_watch', () => {
    it('should call chokidar correctly and start the correct tasks', () => {
      const watchStub = sandbox.stub(chokidar, 'watch').callsFake(()=> {
        return {on: () => {}};  // replace the on event handler
      });
      gue._watch(['foo'], ['bar']);
      expect(watchStub).to.be.calledWith(['foo']);
    });

    it('should run tasks when an event is emitted', () => {
      const watcher = gue._watch(__dirname, 'foo');

      // don't restart the watch loop
      watcher.close = () => {};
      const startStub = sandbox.stub(gue, 'start');

      watcher.emit('all');
      expect(startStub).to.be.calledWith('foo');
    });

    it('should restart the _watch correctly', () => {
      const watcher = gue._watch(__dirname, 'foo');

      // don't restart the watch loop
      watcher.close = () => {};
      const startStub = sandbox.stub(gue, 'start').yields();
      const _watchStub = sandbox.stub(gue, '_watch');
      watcher.emit('all');
      expect(_watchStub).to.be.calledWith(__dirname, 'foo');
    });
  });

  describe('watch', () => {
    it('should call _watch correctly', () => {
      const _watchStub = sandbox.stub(gue, '_watch');
      gue.watch('.', 'bar');
      expect(_watchStub).to.be.calledWith('.', 'bar');
    });
  });

  describe('autoWatch', ()=> {
    it('should call chokidar correctly', () => {
      const fileSet = new FileSet();
      fileSet.add('setName', 'README.md', ['task1']);
      const watchStub = sandbox.stub(chokidar, 'watch').callsFake(() => {
        return {on: () => {}};
      });
      gue.autoWatch(fileSet);
      expect(watchStub).to.be.calledWith(['README.md']);
    });

    it('should restart correctly', () => {
      const fileSet = new FileSet();
      fileSet.add('setName', 'README.md', 'myTask');
      fileSet.add('licSet', 'LICENSE', 'licTask');

      const watcher = gue.autoWatch(fileSet);

      // Don't restart the watcher
      watcher.close = () => {};
      sandbox.stub(gue, 'start').yields();

      const autoWatchStub = sandbox.stub(gue, 'autoWatch');
      watcher.emit('all');
      expect(autoWatchStub).to.be.calledWith(fileSet);
    });

    it('should start the correct tasks', () => {
      const fileSet = new FileSet();
      fileSet.add('testSet', 'foo', ['tasks','yayTasks']);

      const watcher = gue.autoWatch(fileSet);
      const startStub = sandbox.stub(gue, 'start');

      // We don't want the watch to restart
      sandbox.stub(gue, 'autoWatch');
      watcher.close = () => {};

      watcher.emit('all', 'change', 'foo');
      expect(startStub).to.be.calledWith(['tasks','yayTasks']);
    });
  });
});
