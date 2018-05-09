# node-dir-tree
Represent your directory structure in JSON format

node-dir-tree recursively scans your directory generating a JSON file which represents your directory structure. For each file/directory a hash is computed, the hash generation is based on:

* file hash - The hash is based on the file's content and name (extension included);
* directory hash - The hash is based on all the child hashes, i.e. files and directories it contains

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
  "exfolder": {
    "foo": {
      "bar.txt": {
        "type": "file",
        "hash": "2923031cca09dee688f9dbd686d80e7b"
      },
      "foo.txt": {
        "type": "file",
        "hash": "4fd8cc85ca9eebd2fa3c550069ce2846"
      },
      "type": "dir",
      "hash": "791664ccbd765c4a7ae832933bc61939"
    },
    "foo.txt": {
      "type": "file",
      "hash": "4fd8cc85ca9eebd2fa3c550069ce2846"
    },
    "type": "dir",
    "hash": "4327f6e483cd9f6109fe1deb0dcbcc73"
  }
}
```

Note that event if the file contents are the same (since they're empty), the hashes aren't the same, since the algorithm also inclues the file name and the extension.
