'use strict';

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
const sandbox = sinon.sandbox.create();

chai.use(sinonChai);

describe('Gue', () => {
  describe('constructor', () => {
    it('should have an options property', () => {
      const gue = require('../index.js');
      expect(gue.options).to.exist;
    });
  });

  describe('task', () => {
    it('should successfully create a task', () => {
      const gue = require('../index.js');
      gue.task('foo', ['bar'], () => {});

      expect(gue.tasks).to.have.property('foo');
      expect(gue.tasks.foo.dep).to.deep.equal(['bar']);
      expect(gue.tasks.foo.name).to.equal('foo');
    });
  });

  describe('setOption', () => {
    it('should add an option', () => {
      const gue = require('../index.js');
      gue.setOption('foo', 'bar');
      expect(gue.options.foo).to.equal('bar');
    });
  });

  describe('log', () => {
    it('should call console.log correctly', () => {
      const gue = require('../index.js');
      const logStub = sandbox.stub(console, 'log');
      gue.log('Hello');
      expect(logStub).to.be.calledWith('Hello');
      sandbox.restore();
    });
  });

  describe('shell', () => {
    it('should run the command with replacement', () => {
      const gue = require('../index.js');
      gue.setOption('test', 'TestString');
      return gue.shell('echo {{test}}')
      .then((data)=> {
        expect(data).to.equal('TestString');
      });
    });

    it('should run a command with passed replacement', () => {
      const gue = require('../index.js');
      return gue.shell('echo {{foo}}', {
        foo: 'woot'
      })
      .then((data) => {
        expect(data).to.equal('woot');
      });
    });

    it('should handle command failures', (done) => {
      const gue = require('../index.js');
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
      const gue = require('../index.js');
      gue.task('testTask', () => {});
      expect(gue.taskList()).to.contain('testTask');
    });
  });

});
