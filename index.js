'use strict';
const Orchestrator = require('orchestrator');
const execa = require('execa');
const template = require('lodash.template');
const templateSettings = require('lodash.templatesettings');

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
    return execa.shell(compiledCmd(this.options), {env: {FORCE_COLOR: 'true'}})
      .then((result) => {
        return result.stdout;
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
