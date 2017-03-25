'use strict';
const Orchestrator = require('orchestrator');
const execa = require('execa');
const template = require('lodash.template');
const templateSettings = require('lodash.templatesettings');
const chalk = require('chalk');
const trim = require('trim');

class Gluey extends Orchestrator {

  constructor(...args) {
    super(...args);
    this.exitCode = 0;
    this.options = {};
    this.cmdOutput = true;
  }

  task(name, deps, func) {
    super.add(name, deps, func);
  }

  shell(command, values) {

    const lodashVars = (values && typeof values != undefined) ? values :
      this.options;

    templateSettings.interpolate = /{{([\s\S]+?)}}/g;
    const compiledCmd = template(command);
    return execa.shell(compiledCmd(lodashVars), {env: {FORCE_COLOR: 'true'}})
      .then((result) => {
        if (this.cmdOutput) {
          this.log(result.stdout);
        }
        return trim(result.stdout);
      })
      .catch((err) => {
        this.exitCode = 1;
        return Promise.reject(err);
      });
  }

  setOption(name, value) {
    this.options[name] = value;
  }

  // Toggle automatic printing
  enableOutput() {
    this.cmdOutput = true;
  }
  disableOutput() {
    this.cmdOutput = false;
  }

  taskList() {
    return Object.keys(this.tasks);
  }

  log(message) {
    console.log(message);
  }
}
module.exports = new Gluey();
