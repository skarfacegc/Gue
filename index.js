'use strict';
const Orchestrator = require('orchestrator');
const execa = require('execa');
const template = require('lodash.template');
const templateSettings = require('lodash.templatesettings');
const chalk = require('chalk');
const trim = require('trim');

class Gue extends Orchestrator {

  constructor(...args) {
    super(...args);
    this.exitCode = 0;
    this.options = {};
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
        result.stdout = trim(result.stdout);
        this.log(result.stdout);
        return result.stdout;
      })
      .catch((err) => {
        this.exitCode = 1;
        err.stderr = trim(err.stderr);
        return Promise.reject(err);
      });
  }

  setOption(name, value) {
    this.options[name] = value;
  }

  taskList() {
    return Object.keys(this.tasks);
  }

  log(message) {
    console.log(message);
  }
}
module.exports = new Gue();
