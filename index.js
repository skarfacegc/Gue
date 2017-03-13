'use strict';
const Orchestrator = require('orchestrator');
const cmd = require('node-cmd');
const template = require('lodash.template');
const templateSettings = require('lodash.templatesettings');
const isArray = require('is-array');

class Gluey extends Orchestrator {

  constructor(...args) {
    super(...args);
    this.options = {};
  }

  task(name, deps, func) {
    super.add(name, deps, func);
  }

  shell(command) {
    templateSettings.interpolate = /{{([\s\S]+?)}}/g;
    const compiledCmd = template(command);
    return new Promise((resolve,reject) => {
      cmd.get(compiledCmd(this.options), (data, err, stderr) => {
        resolve(data);
      });
    });
  }

  setOption(name, value) {
    this.options[name] = value;
  }

  taskList() {
    return Object.keys(this.tasks);
  }
}
module.exports = new Gluey();
