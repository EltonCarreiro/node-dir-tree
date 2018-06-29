const dirtree = require('../index')

async function a() {
    let tree1 = await dirtree.generateTree('./demo/exfolder')
    let tree2 = await dirtree.generateTree('./demo/exfolder')
    let diff = dirtree.diff(tree1, tree2)
    let patch = dirtree.patch(tree1, diff)
}

a()


