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
    var ref = dirtree.navigate(trees[0], 'c:\\Users\\Elton Carreiro\\Desktop\\node-dir-tree\\demo\\exfolder\\foo\\bar.txt')
    var ref2 = dirtree.navigate(trees[0], 'c:\\Users\\Elton Carreiro\\Desktop\\node-dir-tree\\demo\\exfolder\\foo\\bar2.txt')
    var ref3 = dirtree.navigate(trees[0], 'c:\\Users\\Elton Carreiro\\Desktop\\node-dir-tree\\demo\\exfolder\\foo')
    console.log(diff)
  })