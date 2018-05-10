const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const async = require('async')

const TYPES = {
  FILE: 'file',
  DIR: 'dir'
}

function generateFileObj(src, root) {
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
        hash: hash.digest('hex')
      })
    })
    rs.on('error', reject)
  })
}

function generateDirObj(src, root, children) {
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
    children: children
  }

  obj.relativePath = obj.relativePath.length ? obj.relativePath : '.'
  return obj
}

generateTree = function(src, root) {
  return new Promise((resolve, reject) => {
    const children = []
    root = root || src
    src = path.resolve(src)
    const stat = fs.statSync(src)

    if (!stat.isDirectory())
      return generateFileObj(src, root).then((o) => resolve(o)).catch(reject)
    
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
        resolve(generateDirObj(src, root, children))
      }
    })
  })
}

module.exports = generateTree