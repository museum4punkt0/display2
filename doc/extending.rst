Implementation details
======================

Code structure
--------------

``src/components`` hosts react components, including the Viewer.

The components should not directly interact with 3d api's.

``src/hooks`` contains react hooks. 

``src/artefactViewer`` package contains code that deals with three.js 
scene graph and rendering apis.
The artefactViewer does not depend on react.

``src/artefactViewer/feature`` package implements various independent features of the viewer.


ArtefactViewer
--------------

The main module is ``sceneManager.ts``. It composes the features into a viewer.

``renderer.ts`` is the place where we interact with the dom and the 3d context.
No other modules should do those things. 

For example it handles resizes (depend on dom node size), issues draw calls (talking to gpu), etc.

``sceneParser.ts`` implements the specific subset of the scenegraph format we use.

For example we have a notion (not present in gltf or three) of a default camera centered on the mesh bbox.
We might interpret some empty nodes, or cameras as points of interest.

``sceneParser.ts`` should only operate on scenegraphs it creates.

``animationLoop.ts`` Handles animation scheduling


React components
----------------

In ``src/components/``.

The ``View3d`` component handles the 3d viewport only, without html description or controls.
It's main job is to synchronize react state with the sceneManager.

The main component is ``Viewer``. It wraps ``View3d`` and adds the controls
and the html story panel.

Features
--------

See ``interfaces.ts/IFeature`` interface. Lifecycle is:

- feature created
- onSceneCreation called on feature once the 3d scene has been created by sceneManager
- load called when a new 3d model has been loaded
- preDraw called on each animation frame

Features interact with the renderer and the scene manager via interfaces.
Thus the code does not depend on those objects. 

At runtime they will interact of course.