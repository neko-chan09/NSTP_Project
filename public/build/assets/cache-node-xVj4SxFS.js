import fs from "./__vite-browser-external-CvHwus-K.js";
const readCache = fs.promisify(fs.readFile);
const writeCache = fs.promisify(fs.writeFile);
const deleteCache = (path) => fs.promisify(fs.unlink)(path).catch(() => {
});
export {
  deleteCache,
  readCache,
  writeCache
};
//# sourceMappingURL=cache-node-xVj4SxFS.js.map
