const gue = require('../../../index');

gue.task('fail', () => {
  return Promise.reject();
});
