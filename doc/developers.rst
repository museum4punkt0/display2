Using the viewer in your code
=============================

Stand alone build
-----------------

This build has no dependencies and you can include it directly in a html file.

See ``doc/stand-alone-demo`` as the example.

You just include ``./node_modules/@smb/display/dist/esm/smbDisplay.js`` as a module 
Then load your story json like this:

.. code:: js

  import {createScene} from '@smb/display';
  createScene(document.getElementById('root'), 'minimal.json');

If you use this in a larger project, be aware that this build comes with react, react-dom, three.js
*BUNDLED*. If you yourself use react, you will now have 2 reacts in the same page.

Library build
-------------

The *recommended* build.

It just bundles the viewer code and some problematic parts of three.js

It is the responsibility of your application to bundle the viewer, react and three.js into a package to be used by the browser.

This build has a cjs and a esm variant distribution.

To use it just import the Viewer component and use it in your react component:

.. code:: jsx

  import {Viewer} from '@smb/display';  // require('@smb/display') works too
  
  function App() {
    return (
      <div> 
        <Viewer src='minimal.json' baseResourceUrl='' />
      </div>
    );

You should be able to use this in node. But most code requires a browser.

See ``doc/react-rollup-demo`` and ``doc/next-demo``.


Assets
------

The library build bundles images under ``/src/assets/`` .

The library expects to load at least ``src/assets/sprite.png``
You have to make that publicly available.

The View component and createScene both have a baseResourceUrl parameter.
The resource loads are relative to that.

The other assets are equirectangular hdri environment maps. 
They are optional but highly recommended for visual fidelity.
If missing we will create a simple hdri map programmatically.

See ``Viewer.tsx:viewerAssets`` for the mapping between these assets and the environment select control.

I cannot import the thing
-------------------------

- try tsconfig moduleResolution: nodeNext
- try to import it just from a node console without all the tooling

Next.js complains
-----------------

- Are you in a component with a *'use client';* declaration?
- The pages can't be just client components, define one in a different file
