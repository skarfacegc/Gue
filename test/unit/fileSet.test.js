'use strict';

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
const sandbox = sinon.sandbox.create();
const FileSet = require('../../lib/fileSet');

describe('lib/fileSet', () => {
  describe('constructor', () => {
    it('should return a new fileSet object', () => {
      expect(new FileSet()).to.be.an.instanceof(FileSet);
    });
  });

  describe('add', () => {
    it('should return a list of files', () => {
      const fileSet = new FileSet();
      const fileSetDef = fileSet.add('foo', 'LICENSE', 'bar');

      const testSetDef = {
        name: 'foo',
        glob: 'LICENSE',
        files: ['LICENSE'],
        tasks: ['bar']
      };

      expect(fileSetDef).to.deep.equal(testSetDef);
    });

    it('should update the global files list', () => {
      const fileSet = new FileSet();
      fileSet.add('foo', 'LICENSE', 'bar');
      fileSet.add('foo2', 'README.md', 'bar');

      expect(fileSet.allFiles).to.deep.equal(['LICENSE','README.md']);
    });

    it('should update the glob map correctly', () => {
      const fileSet = new FileSet();
      fileSet.add('foo', 'README.md', 'bar');
      fileSet.add('baz', 'README.md', ['bar','zoop']);
      expect(fileSet.globMap['README.md']).to.deep.equal(['bar','zoop']);
    });

    it('should always save tasks as an array', () => {
      const fileSet = new FileSet();
      fileSet.add('foo', 'README.md', 'singleTask');
      fileSet.add('bar', 'LICENSE', ['one','two']);
      expect(fileSet.fileSets.foo.tasks).to.be.an.array;
      expect(fileSet.fileSets.bar.tasks).to.be.an.array;
    });

    it('should remove duplicates from allFiles', () => {
      const fileSet = new FileSet();
      fileSet.add('foo', 'README.md', 'task');
      fileSet.add('foo2', 'README.md', 'task');
      expect(fileSet.allFiles).to.deep.equal(['README.md']);
    });

    it('should handle an array of globs', () => {
      const fileSet = new FileSet();
      fileSet.add('foo', ['README.md','LICENSE'], 'myTask');
      expect(fileSet.globMap).to.deep.equal({
        'README.md': ['myTask'],
        'LICENSE': ['myTask']
      });
    });
  });

  describe('getTasks', () => {
    it('should return the list of tasks for a given file', () => {
      const fileSet = new FileSet();
      fileSet.add('foo', '*.js', 'starTask');
      fileSet.add('index', 'index.js', 'indexTask');
      expect(fileSet.getTasks('index.js')).to.deep
        .equal(['starTask','indexTask']);
    });

    it('should return an empty list on no match', () => {
      const fileSet = new FileSet();

      fileSet.add('foo', '*.js', 'starTask');
      expect(fileSet.getTasks('baz')).to.deep.equal([]);
    });

    it('should return an empty list if file is undefined', () => {
      const fileSet = new FileSet();
      expect(fileSet.getTasks()).to.deep.equal([]);
    });

    it('should remove duplicate tasks', () => {
      const fileSet = new FileSet();
      fileSet.add('foo', '*.js', ['myTask', 'yourtask']);
      fileSet.add('index', 'index.js', 'myTask');

      expect(fileSet.getTasks('index.js')).to.deep.equal(['myTask','yourtask']);
    });

    it('should take a list of files', () => {
      const fileSet = new FileSet();

      fileSet.add('foo', 'README.md', 'ReadTask');
      fileSet.add('bar', 'LICENSE', 'LicTask');

      expect(fileSet.getTasks(['README.md','LICENSE'])).to.deep
        .equal(['ReadTask','LicTask']);
    });

    it('should handle a single file matching multiple globs', () => {
      const fileSet = new FileSet();

      fileSet.add('first', ['README.md'], ['task1','task2']);
      fileSet.add('second', 'README.m?', 'task3');

      expect(fileSet.getTasks(['README.md'])).to.deep
        .equal(['task1','task2','task3']);
    });
  });

  describe('getFiles', () => {
    it('should return the list of files for a taskname', () => {
      const fileSet = new FileSet();
      fileSet.add('foo', 'README.md', 'myTask');

      expect(fileSet.getFiles('foo')).to.deep.equal(['README.md']);
    });
  });

  describe('getGlob', () => {
    it('should return the glob for the passed fileSet', () => {
      const fileSet = new FileSet();
      fileSet.add('foo', 'README.md', 'myTask');

      expect(fileSet.getGlob('foo')).to.deep.equal('README.md');
    });
  });

  describe('getAllFiles', () => {
    it('should return the glob for the passed fileSet', () => {
      const fileSet = new FileSet();
      fileSet.add('foo', 'README.md', 'myTask');
      fileSet.add('bar', 'LICENSE', 'otherTask');

      expect(fileSet.getAllFiles()).to.deep.equal(['README.md','LICENSE']);
    });
  });
});
