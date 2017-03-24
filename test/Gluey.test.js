'use strict';

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
chai.use(sinonChai);

describe('Gluey', () => {
  describe('constructor', () => {
    it('should have an options property', () => {
      const glue = require('../index.js');
      expect(glue.options).to.exist;
    });
  });

  describe('task', () => {
    it('should successfully create a task', () => {
      const glue = require('../index.js');
      glue.task('foo', ['bar'], () => {});

      expect(glue.tasks).to.have.property('foo');
      expect(glue.tasks.foo.dep).to.deep.equal(['bar']);
      expect(glue.tasks.foo.name).to.equal('foo');
    });
  });

  describe('setOption', () => {
    it('should add an option', () => {
      const glue = require('../index.js');
      glue.setOption('foo', 'bar');
      expect(glue.options.foo).to.equal('bar');
    });
  });

  describe('shell', () => {
    it('should run the command with replacement', () => {
      const glue = require('../index.js');
      glue.setOption('test', 'TestString');
      glue.printBuffer = false;
      return glue.shell('echo {{test}}')
      .then((data)=> {
        expect(data).to.equal('TestString');
      });
    });

    it('should run a command with passed replacement', () => {
      const glue = require('../index.js');
      this.printBuffer = false;
      return glue.shell('echo {{foo}}', {
        foo: 'woot'
      })
      .then((data) => {
        expect(data).to.equal('woot');
      });
    });

    it('should handle command failures', (done) => {
      const glue = require('../index.js');
      glue.shell('badcommand')
        .then(()=> {
          done(new Error('Should not have succeeded'));
        })
        .catch((err) => {
          expect(err.stderr).to.contain('badcommand');
          done();
        });
    });

    it('should print messages when printBuffer is true', () => {
      const glue = require('../index.js');
      const logStub = sinon.stub();
      glue.log = logStub;
      glue.printBuffer = true;
      return glue.shell('echo HelloWorld')
        .then(() => {
          expect(logStub).to.have.been.calledWith('HelloWorld');
        });
    });

    it('should not print messages when printBuffer is false', () => {
      const glue = require('../index.js');
      const logStub = sinon.stub();
      glue.log = logStub;
      glue.printBuffer = false;
      return glue.shell('echo HelloWorld')
        .then(() => {
          expect(logStub).to.have.not.been.called;
        });
    });

  });

  describe('taskList', () => {
    it('should return the list of tasks', () => {
      const glue = require('../index.js');
      glue.task('testTask', () => {});
      expect(glue.taskList()).to.contain('testTask');
    });
  });

});
