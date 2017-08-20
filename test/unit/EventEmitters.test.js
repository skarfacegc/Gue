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
});
