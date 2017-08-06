const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const sandbox = sinon.sandbox.create();
const expect = chai.expect;
const ChaiAsPromised = require('chai-as-promised');

const GueTasks = require('../../lib/GueTasks');
const GueTask = require('../../lib/GueTask');
const gueEvents = require('../../lib/GueEvents');

chai.use(sinonChai);
chai.use(ChaiAsPromised);

describe('Event Emitters', () => {
  it('should emit task start and stop events', ()=> {
    const gueTasks = new GueTasks();
    const eventStub = sinon.stub();

    gueTasks.addTask('a', () => {
      return Promise.resolve('a');
    });

    gueEvents.on('GueTask.beginTask', (val)=> {
      eventStub('beginTask', val);
    });

    gueEvents.on('GueTask.endTask', (val)=> {
      eventStub('endTask', val);
    });

    return gueTasks.runTask('a').then(()=> {
      expect(eventStub.getCall(0)).to.be.calledWith('beginTask');
      expect(eventStub.getCall(1)).to.be.calledWith('endTask');
      gueEvents.removeAllListeners();
    });
  });

  it('should emit action start and stop events', () => {
    const gueTasks = new GueTasks();
    const eventStub = sinon.stub();

    gueTasks.addTask('a', ()=> {
      console.log('\tRun');
      return Promise.resolve('a');
    });

    gueEvents.on('GueTask.startAction', (val)=> {
      eventStub('startAction', val);
    });

    gueEvents.on('GueTask.endAction', (val)=> {
      eventStub('endAction', val);
    });

    return gueTasks.runTask('a').then(() => {
      expect(eventStub.getCall(0)).to.be.calledWith('startAction');
      expect(eventStub.getCall(1)).to.be.calledWith('endAction');
      gueEvents.removeAllListeners();
    });
  });
});
