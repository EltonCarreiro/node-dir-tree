const dirtree = require('../index')

async function a() {
  return await Promise.all([
    dirtree.generateTree('./demo/exfolder'),
    dirtree.generateTree('./demo/exfolder2')
  ])
}

a()
  .then(trees => {
    var diff = JSON.stringify(dirtree.diff(trees[0], trees[1]))
    console.log(diff)
  })