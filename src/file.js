const path = require("path");
const rimraf = require("rimraf");
const fs = require("fs").promises;
const recursiveCopy = require("recursive-copy");

async function copy(source, destination) {
  await recursiveCopy(source, destination, { overwrite: true });
}

async function find(directory = ".") {
  const directoryEntries = await fs.readdir(directory, { withFileTypes: true });

  const paths = await Promise.all(
    directoryEntries.map(async (directoryEntry) => {
      const resolvedPath = path.resolve(directory, directoryEntry.name);

      if (directoryEntry.isDirectory()) {
        return find(resolvedPath);
      }

      if (resolvedPath.endsWith(".md")) {
        return {
          filename: directoryEntry.name.replace(".md", ""),
          content: await fs.readFile(resolvedPath, "utf-8"),
        };
      }

      return [];
    })
  );

  return Array.prototype.concat(...paths);
}

async function freshDirectory(directory) {
  await new Promise((resolve) => rimraf(directory, resolve));

  await fs.mkdir(directory);
}

async function write(files, outDir) {
  await Promise.all(
    files.map(async (file) => {
      const filePath = `${outDir}/${file.filename}`;

      await ensureDirectoryExists(filePath);

      return fs.writeFile(filePath, file.content);
    })
  );
}

async function ensureDirectoryExists(filePath) {
  const dirname = path.dirname(filePath);

  await fs.stat(dirname).catch(() => {
    ensureDirectoryExists(dirname);

    return fs.mkdir(dirname);
  });
}

async function directoryExists(filePath) {
  let exists = true;

  await fs.stat(filePath).catch(() => {
    exists = false;
  });

  return exists;
}

module.exports.copy = copy;
module.exports.directoryExists = directoryExists;
module.exports.ensureDirectoryExists = ensureDirectoryExists;
module.exports.find = find;
module.exports.freshDirectory = freshDirectory;
module.exports.write = write;
