const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const async = require('async')

const TYPES = {
  FILE: 'file',
  DIR: 'dir'
}

function generateObj(src) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const rs = fs.createReadStream(src);
    rs.on('data', (data) => hash.update(data))
    rs.on('end', () => {
      hash.update(path.basename(src))
      resolve({
        type: TYPES.FILE,
        hash: hash.digest('hex')
      })
    })
    rs.on('error', reject)
  })
}

generateTree = function(src, excludeItsRoot) {
  return new Promise((resolve, reject) => {
    let obj = {};
    src = path.resolve(src)
    const stat = fs.statSync(src)

    if (!stat.isDirectory())
      return generateObj(src).then((o) => resolve(o)).catch(reject)
    
    const hash = crypto.createHash('md5')
    const tasks = fs.readdirSync(src).map(f => {
      const _path = path.resolve(src, f)
      return function(cb) {
        generateTree(_path, true).then((o) => {
          obj[path.basename(_path)] = o
          hash.update(o.hash)
          cb(null)
        }).catch(cb)
      }
    })

    async.parallel(tasks, (err) => {
      if(err)
        reject(err)
      else {
        obj.type = TYPES.DIR,
        obj.hash = hash.digest('hex')
        if(!excludeItsRoot) {
          const rootObj = {}
          rootObj[path.basename(src)] = obj
          resolve(rootObj)
        } else
          resolve(obj)
      }
    })
  })
}

module.exports = generateTree