import React, { useEffect, useRef, useState } from 'react';
import { Euler, Object3D, Vector3 } from 'three';
import { SceneParser } from '../../artefactViewer';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { ResourceLoader } from '../../artefactViewer/resourceLoader';

function _arrayStr(v: number[], precision = 3) {
  const s = v.map(e => e.toFixed(precision)).join(', ');
  return `(${s})`;
}

function vectStr(v: Vector3) {
  return `vec3${_arrayStr(v.toArray())}`;
}

function eulerStr(e: Euler) {
  const exyz = [e.x, e.y, e.z];
  const s = exyz.map(a => {
    const api = (a / Math.PI).toFixed(2);
    return `${api} PI`;
  });
  return `euler(${s.join(', ')} , ${e.order})`;
}

function posRotStr(obj: Object3D) {
  const info = [
    'pos: ' + vectStr(obj.position),
    'rot:' + eulerStr(obj.rotation),
    'scale:' + vectStr(obj.scale),
  ];

  return info.join(' ');
}

function nodeStr(node: Object3D) {
  const info = `[${node.type} "${node.name}"]   `;
  const aux = posRotStr(node);
  return info.padEnd(40, ' . ') + '  ' + aux;
}

function nodeTreeStr(node: Object3D, level: number, lines: string[]) {
  lines.push('  '.repeat(level) + nodeStr(node));
  node.children.forEach(c => nodeTreeStr(c, level + 1, lines));
  return lines;
}

function TreeDump({ gltf }: { gltf: GLTF }) {
  const sceneInfo = nodeTreeStr(gltf.scene, 1, []);
  const camerasInfo = gltf.cameras.map(c => '   ' + c.name);
  const animationInfo: string[] = [];

  gltf.animations.forEach(an => {
    animationInfo.push(`   "${an.name}" duration:${an.duration.toFixed(3)}`);
    animationInfo.push('   Tracks:');
    an.tracks.forEach(t => animationInfo.push('       ' + t.name));
  });

  return (
    <>
      <p> Scene </p>
      <pre>{sceneInfo.join('\n')}</pre>
      <p> Cameras </p>
      <pre>{camerasInfo.join('\n')}</pre>
      <p> Animation </p>
      <pre>{animationInfo.join('\n')}</pre>
    </>
  );
}

function SceneParserDump({ sceneParser }: { sceneParser: SceneParser }) {
  const lines: string[] = [];
  const diagStr = sceneParser.boundingCubeDiagonal.toFixed(4);

  lines.push(`center ${vectStr(sceneParser.center)}, diagonal ${diagStr}`);

  lines.push('[[ empty 2 cam]]');

  for (const [camName, empty] of sceneParser.cameraToPoi) {
    lines.push(
      `  [${empty.type} "${empty.name}"] [4 camera "${camName}"] parent ${
        empty.parent?.name || ''
      }`
    );
    lines.push('    ' + posRotStr(empty));
  }
  return <pre>{lines.join('\n')}</pre>;
}

function khrMaterialVariantsInfo(sceneParser: SceneParser) {
  if (!sceneParser.khrMaterialVariantsParser) {
    return [];
  }
  const khrParser = sceneParser.khrMaterialVariantsParser;
  const ret: string[] = [];
  khrParser.variants.forEach((v, i) => ret.push(`${i}   ${v}`));
  ret.push('');
  khrParser.meshMappings.forEach(([mesh, mat]) => {
    ret.push(`mesh ${mesh.name} mappings: `);
    mat.forEach(m => {
      ret.push(`      variantIds ${m.variants.join(' ')} matid ${m.material}`);
    });
  });
  return ret;
}

/**
 * This is a debug tool.
 * Dumps the structure of the gltf file in a pre node.
 * @param param.src url to the gltf
 */
export function GltfDump({
  src = '',
  baseResourceUrl = '',
}: {
  src: string;
  baseResourceUrl: string;
}) {
  const loaderRef = useRef(new ResourceLoader(baseResourceUrl));
  const [gltf, setGltf] = useState<GLTF | null>(null);

  useEffect(() => {
    let canceled = false;
    async function load() {
      const ret = await loaderRef.current.loadGltf(src, undefined);
      if (canceled) {
        return;
      }
      setGltf(ret);
    }
    void load();
    return () => {
      canceled = true;
    };
  }, [src, baseResourceUrl]);

  if (gltf == null) {
    return <pre>no gltf loaded</pre>;
  }

  const sceneParser = SceneParser.parse(gltf);
  let extensionNames: string[] = [];

  const userData = gltf.userData as { [ix: string]: unknown } | undefined;
  if (userData?.gltfExtensions) {
    extensionNames = Object.keys(userData.gltfExtensions);
  }

  const variantsExtensionInfo = khrMaterialVariantsInfo(sceneParser);

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ flex: 2 }}>
        <h3>Tree</h3>
        <TreeDump gltf={gltf} />
        <h3>SceneParser info</h3>
        <SceneParserDump sceneParser={sceneParser} />
        <h3>Extensions</h3>
        <pre>{extensionNames.join('\n')}</pre>
        <h3>User data block</h3>
        <pre>{JSON.stringify(gltf.userData, undefined, '  ')}</pre>
        <h3>material variants</h3>
        <pre>{variantsExtensionInfo.join('\n')}</pre>
      </div>
    </div>
  );
}
