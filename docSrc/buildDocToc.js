// This builds the top level TOC pointing to the different
// documentation versions
const dirTree = require('directory-tree');

const docsDir = dirTree('./docs');
console.log('Docs are available for the following versions: ');
console.log('<ul>');
docsDir.children.forEach((dir) => {
  if (dir.type === 'directory') {
    console.log('<li><a href="'+dir.name+'/index.html">'+ dir.name + '</a>');
  }
});
console.log('</ul>');
