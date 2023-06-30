#!/usr/bin/env node
// a js file because typescript can't deal with
// the required shebang, nor the global self patching below
const smb = require('@smb/display');
const fs = require('fs');
const path = require('path');

// polyfill the self.URL that the gltfLoader uses
// we are in node not browser. Typescript gets angry about this redefine
global.self = { URL };

function usage() {
  console.log('usage  node glb2storyJson.js pathToModel.glb');
}

async function _main(pth) {
  const fr = await fs.promises.readFile(pth);
  // node has a strange notion of a global buffer, to get to the data we need to offset
  const uint8arr = fr.buffer.slice(
    fr.byteOffset,
    fr.byteOffset + fr.byteLength
  );
  const json = await smb._glb2storyJson(uint8arr, pth, path.dirname(pth));
  await fs.promises.writeFile(pth + '.json', json);
}

function main() {
  smb.logConfig('error', {});
  const argv = process.argv.slice(2);

  if (argv.length !== 1) {
    usage();
    return -1;
  }
  const pth = argv[0];

  if (!fs.statSync(pth).isFile()) {
    usage();
    return -1;
  }

  void _main(pth);
}

main();
