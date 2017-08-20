const gue = require('../../../index');

gue.task('fail', ['a'], () => {
  return Promise.resolve();
});

gue.task('a', () => {
  return Promise.reject();
});
