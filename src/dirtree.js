const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const async = require('async')

const TYPES = {
  FILE: 'file',
  DIR: 'dir'
}

const isDir = (a) => a.type === TYPES.DIR

function generateFileObj(src, root, stat) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const rs = fs.createReadStream(src);
    rs.on('data', (data) => hash.update(data))
    rs.on('end', () => {
      hash.update(path.basename(src))
      resolve({
        name: path.basename(src),
        relativePath: path.relative(root, src),
        path: src,
        type: TYPES.FILE,
        hash: hash.digest('hex'),
        stat: transformStat(stat)
      })
    })
    rs.on('error', reject)
  })
}

function generateDirObj(src, root, children, stat) {
  const hash = crypto.createHash('md5')
  const name = path.basename(src);
  children.map((c) => hash.update(c.hash))
  hash.update(name)
  const obj = {
    name: name,
    relativePath: path.relative(root, src),
    path: src,
    type: TYPES.DIR,
    hash: hash.digest('hex'),
    stat: transformStat(stat),
    children: children
  }

  obj.relativePath = obj.relativePath.length ? obj.relativePath : '.'
  return obj
}

function fillChildrenDiff(arr, count) {
  for(var i = 0; i < count; i++)
    arr.push(null)
}

/*
  {
    changed: [
      {
        from:
      }
    ]
  }
*/

function generateDiffObj(first, second) {
  let filePath = first === null ? second.path : first.path
  return { path: filePath, old: first, new: second }
}

function sortChildren(children) {
  return children.sort((a, b) => {
    if(a.name > b.name)
      return 1
    else if (b.name > a.name)
      return -1
    else
      return 0
  })
}

function transformStat(stat) {
  return Object.keys(stat)
    .reduce((prev, curr) => {
      prev[curr] = stat[curr]
      return prev
    }, {})
}

generateTree = function(src, root) {
  return new Promise((resolve, reject) => {
    const children = []
    root = root || src
    src = path.resolve(src)
    const stat = fs.statSync(src)

    if (!stat.isDirectory())
      return generateFileObj(src, root, stat).then((o) => resolve(o)).catch(reject)
    
    const tasks = fs.readdirSync(src).map(f => {
      const _path = path.resolve(src, f)
      return function(cb) {
        generateTree(_path, root).then((o) => {
          children.push(o);
          cb(null)
        }).catch(cb)
      }
    })

    async.parallel(tasks, (err) => {
      if(err)
        reject(err)
      else {
        resolve(generateDirObj(src, root, children, stat))
      }
    })
  })
}

function diff(first, second) {
  if(first === null || second === null)
    return generateDiffObj(first, second)

  if(first.hash === second.hash)
    return []
  
  if(isDir(first) && isDir(second)) {
    firstChildren = sortChildren(first.children)
    secondChildren = sortChildren(second.children)

    if(firstChildren.length > secondChildren.length) {
      fillChildrenDiff(secondChildren, firstChildren.length - secondChildren.length)
    } else if(secondChildren.length > firstChildren.length) {
      fillChildrenDiff(firstChildren, secondChildren.length - firstChildren.length)
    }

    return firstChildren
      .map((f, idx) => diff(f, secondChildren[idx]))
      // Just to remove equal objects
      .filter(r => r.length === undefined)
  } else {
    return generateDiffObj(first, second)
  }
}

function patch(src, diff) {

}

module.exports = {
  generateTree: generateTree,
  diff: diff,
  patch: patch
}