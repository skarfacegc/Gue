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
      expect(glue).to.have.property('options');
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

  describe('concatOption', () => {
    it('should concat options correctly', () => {
      const glue = require('../index.js');
      glue.setOption('x', ['a','b']);
      glue.setOption('y', ['c','d']);
      glue.concatOptions('z', ['x','y']);

      expect(glue.options.z).to.deep.equal(['a','b','c','d']);
    });

    it('should reject non array options', ()=> {
      const glue = require('../index.js');
      glue.setOption('foo', 'bar');
      expect(() => {
        glue.concatOptions('baz', ['foo']);
      }).to.throw();

      expect(()=> {
        glue.concatOptions('baz', 'bar');
      }).to.throw();
    });
  });

  describe('shell', () => {
    it('should run the command with replacement', () => {
      const glue = require('../index.js');
      glue.setOption('test', 'TestString');
      return glue.shell('echo {{test}}')
      .then((data)=> {
        expect(data).to.equal('TestString\n');
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
