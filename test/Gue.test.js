'use strict';

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
const sandbox = sinon.sandbox.create();
const gue = require('../index');
const chalk = require('chalk');

chai.use(sinonChai);

describe('Gue', () => {
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

  describe('log', () => {
    it('should call console.log correctly', () => {
      const logStub = sandbox.stub(console, 'log');
      gue.log('Hello');
      sandbox.restore();

      expect(logStub).to.be.calledWith('Hello');
    });

    it('should correctly color the taskname and message', () => {
      var compareString = chalk.bold.green('[taskname] ');
      compareString += chalk.cyan('foo');

      const logStub = sandbox.stub(console, 'log');
      gue.log('foo', 'taskname');
      sandbox.restore();

      expect(logStub).to.be.calledWith(compareString);
    });

    it('should print a colored duration if provided', () => {
      var compareString = chalk.bold.green('[taskname] ');
      compareString += chalk.cyan('foo');
      compareString += ' ' + chalk.white('1ms');

      const logStub = sandbox.stub(console, 'log');
      gue.log('foo', 'taskname', 1);
      sandbox.restore();

      expect(logStub).to.be.calledWith(compareString);
    });

    it('should correctly color errors', () => {
      var compareString = chalk.red('foo');

      const logStub = sandbox.stub(console, 'log');
      gue.errLog('foo');
      sandbox.restore();

      expect(logStub).to.be.calledWith(compareString);
    });

  });

  describe('shell', () => {
    it('should run the command with replacement', () => {
      gue.setOption('test', 'TestString');
      return gue.shell('echo {{test}}')
      .then((data)=> {
        expect(data).to.equal('TestString');
      });
    });

    it('should run a command with passed replacement', () => {
      return gue.shell('echo {{foo}}', {
        foo: 'woot'
      })
      .then((data) => {
        expect(data).to.equal('woot');
      });
    });

    it('should handle command failures', (done) => {
      gue.shell('badcommand')
        .then(()=> {
          done(new Error('Should not have succeeded'));
        })
        .catch((err) => {
          expect(err.stderr).to.contain('badcommand');
          done();
        });
    });
  });

  describe('taskList', () => {
    it('should return the list of tasks', () => {
      gue.task('testTask', () => {});
      expect(gue.taskList()).to.contain('testTask');
    });
  });

  describe('runlist', () => {
    it('should return the run list without default', () => {
      gue.seq = ['a','b','default'];
      expect(gue.runList()).to.deep.equal(['a','b']);
    });
  });

});
