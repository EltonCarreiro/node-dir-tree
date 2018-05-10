const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const async = require('async')

const TYPES = {
  FILE: 'file',
  DIR: 'dir'
}

function generateObj(src, root) {
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

generateTree = function(src, root) {
  return new Promise((resolve, reject) => {
    let obj = {};
    const children = []
    root = root || src
    src = path.resolve(src)
    const stat = fs.statSync(src)

    if (!stat.isDirectory())
      return generateObj(src, root).then((o) => resolve(o)).catch(reject)
    
    const hash = crypto.createHash('md5')
    const tasks = fs.readdirSync(src).map(f => {
      const _path = path.resolve(src, f)
      return function(cb) {
        generateTree(_path, root).then((o) => {
          children.push(o);
          hash.update(o.hash)
          cb(null)
        }).catch(cb)
      }
    })

    async.parallel(tasks, (err) => {
      if(err)
        reject(err)
      else {
        obj.name = path.basename(src),
        obj.relativePath = path.relative(root, src),
        obj.relativePath = obj.relativePath.length ? obj.relativePath : '.'
        obj.path = src,
        obj.type = TYPES.DIR,
        hash.update(obj.name)
        obj.hash = hash.digest('hex')
        obj.children = children
        resolve(obj)
      }
    })
  })
}

module.exports = generateTree