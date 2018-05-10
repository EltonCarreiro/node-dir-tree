# node-dir-tree
Represent your directory structure in JSON format

node-dir-tree recursively scans your directory generating a JSON file which represents your directory structure. For each file/directory a hash is computed, the hash generation is based on:

* file hash - The hash is based on the file's content and name (extension included);
* directory hash - The hash is based on all the child hashes (i.e. files and directories it contains), and it's name.

Usage:

Install

```bash
$ npm i node-dir-tree --save
```

Require and just pass the directory

```javascript
const dirtree = require('node-dir-tree')

dirtree('./exfolder')
  .then((tree) => console.log(JSON.stringify(tree)))
  .catch((err) => console.error(err))
```

Example:


For a folder structure like below:
```
exfolder
 |- foo
 |   |- foo.txt
 |   |- bar.txt
 |- foo.txt
```

The generated JSON would look like (Assuming all the files are empty)

```javascript
{
  "name": "exfolder",
  "relativePath": ".",
  "path": "C:\\Users\\Elton Carreiro\\Desktop\\node-dir-tree\\demo\\exfolder",
  "type": "dir",
  "hash": "d37fab45ef09e444d1c0e9c77cfb0a48",
  "children": [
    {
      "name": "foo",
      "relativePath": "foo",
      "path": "C:\\Users\\Elton Carreiro\\Desktop\\node-dir-tree\\demo\\exfolder\\foo",
      "type": "dir",
      "hash": "02c4258dde69d831e5b83098220fb0e0",
      "children": [
        {
          "name": "bar.txt",
          "relativePath": "foo\\bar.txt",
          "path": "C:\\Users\\Elton Carreiro\\Desktop\\node-dir-tree\\demo\\exfolder\\foo\\bar.txt",
          "type": "file",
          "hash": "2923031cca09dee688f9dbd686d80e7b"
        },
        {
          "name": "foo.txt",
          "relativePath": "foo\\foo.txt",
          "path": "C:\\Users\\Elton Carreiro\\Desktop\\node-dir-tree\\demo\\exfolder\\foo\\foo.txt",
          "type": "file",
          "hash": "4fd8cc85ca9eebd2fa3c550069ce2846"
        }
      ]
    },
    {
      "name": "foo.txt",
      "relativePath": "foo.txt",
      "path": "C:\\Users\\Elton Carreiro\\Desktop\\node-dir-tree\\demo\\exfolder\\foo.txt",
      "type": "file",
      "hash": "4fd8cc85ca9eebd2fa3c550069ce2846"
    }
  ]
}
```

Note in the above example that, even if the files content are the same (because they're empty), the hashes aren't, since the algorithm also inclues the file name and the extension to compute the hash.
