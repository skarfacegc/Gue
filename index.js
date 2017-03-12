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

  concatOptions(name, optionList) {
    this.options[name] = [];
    if (isArray(optionList)) {
      optionList.forEach((element)=> {
        if (isArray(this.options[element])) {
          this.options[name] =
            this.options[name].concat(this.options[element]);
        } else {
          throw new Error('Can\'t concat non arrays');
        }
      });
    } else {
      throw new Error('Can\'t concat non arrays');
    }
  }

  taskList() {
    return Object.keys(this.tasks);
  }
}
module.exports = Gluey;
