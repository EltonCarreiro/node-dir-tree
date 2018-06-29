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
  // All JSON parse/stringify must be analyzed to be replaced in the future
  first = JSON.parse(JSON.stringify(first))
  second = JSON.parse(JSON.stringify(second))

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

function navigate(obj, propPath, returnNearest) {
  if(!propPath || !obj)
    return null

    if(obj.path === propPath)
    return obj
  
  if(propPath.indexOf(obj.path) === -1)
    return null;

  let _idx = obj.path.split(path.sep).length + 1
  curr = propPath.split(path.sep).slice(0, _idx).join(path.sep)
  let ref = obj.children.map((c) => navigate(c, propPath)).filter(c => c)
  if(ref.length)
    return ref[0]
    
  if(!returnNearest)
    return null

  let pathArr = propPath.split(path.sep).slice(0, -1)
  if (pathArr.length > 0)
    return navigate(obj, pathArr.join(path.sep), true)
}

function patch(src, diffs) {
  if (!src)
    return src
  
  let out = JSON.parse(JSON.stringify(src))
  if (!diffs || !diffs.length)
    return out

  diffs.map((diff) => {
    let ref = navigate(out, diff.path, true)
    if(!isDir(ref))
      ref = navigate(out, diff.path.split(path.sep).slice(0, -1).join(path.sep), true)
    if(diff.old === null) {
      ref.children.push(diff.new)
    } else {
      // check if reference really exists
      let idx = ref.children.findIndex(c => {
        return c.path === diff.new.path
      })
      if (diff.new === null)
        ref.children.splice(idx, 1)
      else
        ref.children[idx] = diff.new
    }
  })

  return out
}

module.exports = {
  generateTree,
  diff,
  patch,
  navigate
}