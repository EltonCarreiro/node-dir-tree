const dirtree = require('../index')

dirtree('./exfolder')
  .then((tree) => console.log(JSON.stringify(tree)))
  .catch((err) => console.error(err))