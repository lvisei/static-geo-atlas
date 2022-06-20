const fsPromises = require("fs").promises;

async function getDirFiles(dir) {
  const dirents = await fsPromises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const result = `${dir}/${dirent.name}`;
      return dirent.isDirectory() ? getDirFiles(result) : result;
    })
  );
  return Array.prototype.concat(...files);
}

module.exports = getDirFiles;
