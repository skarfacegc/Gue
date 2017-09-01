const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
const ChaiAsPromised = require('chai-as-promised');
const GueTask = require('../../lib/GueTask');
const gueEvents = require('../../lib/GueEvents');

chai.use(sinonChai);
chai.use(ChaiAsPromised);

describe('GueTask', () => {
  describe('constructor', () => {
    it('should require a name', () => {
      expect(() => {
        new GueTask('', ['task', 'list'], () => {});
      }).to.throw();
    });

    it('should require an action', () => {
      expect(() => {
        new GueTask('foo');
      }).to.throw();
    });

    it('should make sure that action is a function', () => {
      expect(() => {
        new GueTask('foo', 'NotAFunction');
      }).to.throw();
    });

    it('should successfully create a task', () => {
      const sampleFn = () => {
        console.log('woot');
      };
      const newTask = new GueTask('foo', ['task', 'list'], sampleFn);
      expect(newTask.name).to.equal('foo');
      expect(newTask.dependencies).to.deep.equal(['task', 'list']);
      expect(newTask.action).to.deep.equal(sampleFn);
    });

    it('should correctly handle a task without dependencies', () => {
      const sampleFn = () => {
        console.log('woot');
      };
      const newTask = new GueTask('foo', sampleFn);
      expect(newTask.dependencies).to.be.undefined;
      expect(newTask.action).to.deep.equal(sampleFn);
    });

    it('should throw if dependencies is not an array', () => {
      const sampleFn = () => {
        console.log('woot');
      };
      expect(() => {
        new GueTask('foo', sampleFn, sampleFn);
      }).to.throw();
    });

    it('should ensure that action is a function', () => {
      expect(() => {
        new GueTask('foo', ['bar'], 'foo');
      }).to.throw();
    });
  });

  describe('hasDependencies', () => {
    it('should return true if there are dependencies', () => {
      const gueTask = new GueTask('foo', ['bar']);
      expect(gueTask.hasDependencies()).to.be.true;
    });

    it('should return false if there are no dependencies', () => {
      const gueTask = new GueTask('foo', () => {
        return Promise.resolve();
      });
      expect(gueTask.hasDependencies()).to.be.false;
    });
  });

  describe('taskStarted', () => {
    it('should emit a GueTask.beginTask event', () => {
      const beginTaskEventStub = sinon.stub();
      const gueTask = new GueTask('foo', () => {
        Promise.resolve();
      });

      gueEvents.on('GueTask.taskStarted', () => {
        beginTaskEventStub();
      });

      gueTask.taskStarted();
      expect(beginTaskEventStub).to.be.called;
      gueEvents.removeAllListeners();
    });

    it('should set the start time correctly', () => {
      let fakeClock = sinon.useFakeTimers(500);
      const gueTask = new GueTask('foo', () => {
        Promise.resolve();
      });

      gueTask.taskStarted();
      expect(gueTask.startTime).to.equal(500);
      fakeClock.restore();
    });
  });

  describe('taskFinished', () => {
    it('should emit a GueTask.taskFinished event', () => {
      const endTaskEventStub = sinon.stub();
      const gueTask = new GueTask('foo', () => {
        Promise.resolve();
      });

      gueEvents.on('GueTask.taskFinished', () => {
        endTaskEventStub();
      });

      gueTask.taskFinished();
      expect(endTaskEventStub).to.be.called;
      gueEvents.removeAllListeners();
    });

    it('should set the end time correctly', () => {
      const fakeClock = sinon.useFakeTimers(600);
      const gueTask = new GueTask('foo', () => {
        Promise.resolve();
      });

      gueTask.taskFinished();
      expect(gueTask.endTime).to.equal(600);
      fakeClock.restore();
    });
  });

  describe('taskFinishedWithError', () => {
    it('should set the end time correctly', () => {
      const fakeClock = sinon.useFakeTimers(600);
      const gueTask = new GueTask('foo', () => {
        Promise.resolve();
      });

      gueTask.taskFinishedWithError();
      expect(gueTask.endTime).to.equal(600);
      fakeClock.restore();
    });

    it('should emit a GueTask.taskFinished.error event', () => {
      const endTaskEventStub = sinon.stub();
      const gueTask = new GueTask('foo', () => {
        Promise.resolve();
      });

      gueEvents.on('GueTask.taskFinished.error', (obj, val) => {
        endTaskEventStub(val);
      });

      gueTask.taskFinishedWithError('MyMessage');
      expect(endTaskEventStub).to.be.calledWith('MyMessage');
      gueEvents.removeAllListeners();
    });
  });

  describe('getTaskDuration', () => {
    it('should return the correct duration', () => {
      const gueTask = new GueTask('foo', () => {
        Promise.resolve();
      });
      gueTask.endTime = 500;
      gueTask.startTime = 400;
      expect(gueTask.getTaskDuration()).to.equal(100);
    });

    it('should handle tasks with no end correctly', () => {
      const gueTask = new GueTask('foo', () => {
        Promise.resolve();
      });
      gueTask.startTime = 500;

      expect(gueTask.getTaskDuration()).to.equal(0);
    });
  });

  describe('startAction', () => {
    it('should emit a GueTask.startAction event', () => {
      const startActionEventStub = sinon.stub();
      const gueTask = new GueTask('foo', () => {
        Promise.resolve();
      });

      gueEvents.on('GueTask.startAction', () => {
        startActionEventStub();
      });

      gueTask.startAction();
      expect(startActionEventStub).to.be.called;
      gueEvents.removeAllListeners();
    });

    it('should set the action start time', () => {
      const fakeClock = sinon.useFakeTimers(1000);
      const gueTask = new GueTask('foo', () => {
        Promise.resolve();
      });

      gueTask.startAction();
      expect(gueTask.actionStartTime).to.equal(1000);
      fakeClock.restore();
    });
  });

  describe('endAction', () => {
    it('should emit a GueTask.endAction event', () => {
      const endActionEventStub = sinon.stub();
      const gueTask = new GueTask('foo', () => {
        Promise.resolve();
      });

      gueEvents.on('GueTask.endAction', () => {
        endActionEventStub();
      });

      gueTask.endAction();
      expect(endActionEventStub).to.be.called;
      gueEvents.removeAllListeners();
    });

    it('should set the action start time', () => {
      const fakeClock = sinon.useFakeTimers(2000);
      const gueTask = new GueTask('foo', () => {
        Promise.resolve();
      });

      gueTask.endAction();
      expect(gueTask.actionEndTime).to.equal(2000);
      fakeClock.restore();
    });
  });

  describe('endActionWithError', () => {
    it('should set the end time correctly', () => {
      const fakeClock = sinon.useFakeTimers(600);
      const gueTask = new GueTask('foo', () => {
        Promise.resolve();
      });

      gueTask.endActionWithError();
      expect(gueTask.actionEndTime).to.equal(600);
      fakeClock.restore();
    });

    it('should emit a GueTask.endAction.error event', () => {
      const endTaskEventStub = sinon.stub();
      const gueTask = new GueTask('foo', () => {
        Promise.resolve();
      });

      gueEvents.on('GueTask.endAction.error', (obj, val) => {
        endTaskEventStub(val);
      });

      gueTask.endActionWithError('MyMessage');
      expect(endTaskEventStub).to.be.calledWith('MyMessage');
      gueEvents.removeAllListeners();
    });
  });

  describe('getActionDuration', () => {
    it('should return the correct duration', () => {
      const gueTask = new GueTask('foo', () => {
        Promise.resolve();
      });
      gueTask.actionEndTime = 500;
      gueTask.actionStartTime = 400;
      expect(gueTask.getActionDuration()).to.equal(100);
    });

    it('should handle actions with no end time', () => {
      const gueTask = new GueTask('foo', () => {
        Promise.resolve();
      });
      gueTask.actionStartTime = 500;

      expect(gueTask.getActionDuration()).to.equal(0);
    });
  });

  describe('runAction', () => {
    it('should run the action', () => {
      const gueTask = new GueTask('foo', () => {
        return new Promise((resolve, reject) => {
          setTimeout(function() {
            resolve();
          }, 50);
        });
      });
      return expect(gueTask.runAction()).to.be.fulfilled;
    });

    it('should propagate rejected promises', () => {
      const gueTask = new GueTask('foo', () => {
        return Promise.reject('failed');
      });
      return expect(gueTask.runAction()).to.eventually.be.rejectedWith(
        'failed'
      );
    });

    it('should emit an error if the task fails', () => {
      const gueTask = new GueTask('foo', () => {
        return Promise.reject('failed');
      });

      gueTask.runAction().catch(() => {});

      gueEvents.on('GueTask.runAction.error', val => {
        expect(val).to.eventually.equal('failed');
      });

      gueEvents.removeAllListeners();
    });

    it('should handle tasks without an action', () => {
      const gueTask = new GueTask('foo', ['bar']);
      expect(gueTask.runAction()).to.eventually.fulfilled;
    });
  });
});
