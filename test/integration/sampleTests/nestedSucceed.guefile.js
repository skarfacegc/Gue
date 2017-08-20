const gue = require('../../../index');

gue.task('succeed', ['a'], () => {
  return Promise.resolve();
});

gue.task('a', () => {
  return Promise.resolve();
});
