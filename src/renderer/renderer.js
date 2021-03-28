import pako from 'pako';
import {createNanoEvents} from 'nanoevents';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {MeshLine, MeshLineMaterial} from 'three.meshline';
import {generateGraticules, wireframe} from './graticules';
import {loadRecipes} from './recipes';
import {buildingsData, beltsData} from './modelsData';
import {toSpherical, toCartesian, degToRad, clamp} from './utils';

export default class {
  constructor({
    tooltipContainer,
    container,
    data,
    setTooltipContent,
    assetPathResolver,
    beltMovement,
  }) {
    this.tooltipContainer = tooltipContainer;
    this.container = container;
    this.rendererWidth = container.clientWidth;
    this.rendererHeight = container.clientHeight;
    this.setTooltipContent = setTooltipContent;
    this.emitter = createNanoEvents();
    this.eventHandlers = {};
    this.assetPathResolver = assetPathResolver;
    this.mouse = new THREE.Vector2();
    this.lastMousePosition = null;
    this.isPaused = false;
    this.selected = null;
    this.beltMovement = beltMovement;

    this.requestedRendering = false;
    this.loadAssets();
    this.parseBlueprint(data);
  }

  loadAssets() {
    THREE.DefaultLoadingManager.onLoad = () =>
      this.emitter.emit('assets:loader:complete');

    this.planetTexture = new THREE.TextureLoader().load(
      this.assetPathResolver('textures', 'planet')
    );
    this.planetNormalMap = new THREE.TextureLoader().load(
      this.assetPathResolver('textures', 'planetNormalMap')
    );
    this.recipeMaterials = loadRecipes(this.assetPathResolver);
  }

  pause() {
    if (!this.isPaused) {
      this.isPaused = true;
      this.emitter.emit('render:pause');
    }
  }

  restart() {
    if (this.isPaused) {
      this.isPaused = false;
      this.emitter.emit('render:restart');
      this.animate();
    }
  }

  downloadCanvasAsImage() {
    this.renderer.preserveDrawingBuffer = true;
    this.renderer.render(this.scene, this.camera);
    const downloadLink = document.createElement('a');
    downloadLink.setAttribute('download', 'thumbnail.png');
    const dataURL = this.renderer.domElement.toDataURL('image/png');
    const url = dataURL.replace(
      /^data:image\/png/,
      'data:application/octet-stream'
    );
    downloadLink.setAttribute('href', url);
    downloadLink.click();

    this.renderer.preserveDrawingBuffer = false;
  }

  parseBlueprint(data) {
    this.data = JSON.parse(pako.inflate(atob(data), {to: 'string'}));
    this.buildings = [];
    this.belts = [];
  }

  // render:start, render:complete, assets:loader:complete, render:pause, render:restart, entity:select
  on(eventName, callback) {
    if (this.eventHandlers[eventName]) {
      // Unbind if already existing
      this.eventHandlers[eventName].call();
    }
    this.eventHandlers[eventName] = this.emitter.on(eventName, callback);
  }

  renderGlobe() {
    const globe = new THREE.Group();

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.1,
      linewidth: 0.5,
    });
    const intermediateMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
    });
    const mainLineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
    });

    const graticules = generateGraticules();
    const normalWf = wireframe(graticules.normal, 200.1, lineMaterial);
    const intermediateWf = wireframe(
      graticules.intermediate,
      200.1,
      intermediateMaterial
    );
    const mainWf = wireframe(graticules.main, 200.1, mainLineMaterial);

    const sphereGeometry = new THREE.SphereGeometry(200, 36, 36);

    this.planetTexture.wrapS = THREE.RepeatWrapping;
    this.planetTexture.wrapT = THREE.RepeatWrapping;
    this.planetTexture.repeat = new THREE.Vector2(50, 50);
    this.planetNormalMap.wrapS = THREE.RepeatWrapping;
    this.planetNormalMap.wrapT = THREE.RepeatWrapping;
    this.planetNormalMap.repeat = new THREE.Vector2(50, 50);

    const sphereMaterial = new THREE.MeshStandardMaterial({
      map: this.planetTexture,
      normalMap: this.planetNormalMap,
      normalMapType: THREE.TangentSpaceNormalMap,
      roughness: 0.6,
      emissive: 0x1b1610,
      side: THREE.DoubleSide,
    });
    // Old sphere material, blue and without textures
    // const sphereMaterial = new THREE.MeshPhongMaterial({
    //   color: 0x104d6c,
    //   emissive: 0x072534,
    //   side: THREE.DoubleSide,
    // });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

    globe.add(sphere);
    globe.add(normalWf);
    globe.add(intermediateWf);
    globe.add(mainWf);

    this.scene.add(globe);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.rendererWidth / this.rendererHeight,
      0.1,
      10000
    );

    this.camera.position.z = 500;
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.rendererWidth, this.rendererHeight);
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.enableZoom = true;
    this.controls.minDistance = 250;
    this.controls.maxDistance = 700;

    this.raycaster = new THREE.Raycaster();
    this.raycaster.params = {
      Mesh: {threshold: 0.5},
      Line: {threshold: 1},
      LOD: {},
      Points: {threshold: 1},
      Sprite: {},
    };

    const cameraLight = new THREE.SpotLight(0xffffff, 1, 0);
    cameraLight.position.set(0, 0, 0);
    this.camera.add(cameraLight);
  }

  scaleRotationSpeed() {
    // scale rotation speed inversely proportional to camera distance
    const cameraDistance = this.controls.target.distanceTo(
      this.controls.object.position
    );
    this.controls.rotateSpeed =
      cameraDistance ** 2 / this.controls.maxDistance ** 2;
  }

  handleMouseInteraction() {
    // calculate objects intersecting the picking ray
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.buildings);

    if (this.lastMousePosition) {
      if (!intersects.length) {
        if (this.selected) {
          this.selected.material.emissiveIntensity = 0.5;
          this.selected = null;
        }
        this.container.style.cursor = '';
        this.hideTooltip();
      } else if (this.selected != intersects[0]) {
        if (this.selected) {
          this.selected.material.emissiveIntensity = 0.5;
        }

        this.selected = intersects[0].object;
        this.selected.material.emissiveIntensity = 1;
        this.container.style.cursor = 'pointer';
        this.showTooltip();
      }

      if (this.selected && this.lastMousePosition) {
        this.repositionTooltip();
      }
    }
  }

  showTooltip() {
    this.tooltipContainer.style.display = 'block';
    this.tooltipContainer.innerHTML = this.setTooltipContent(
      this.selected.userData
    );
  }

  hideTooltip() {
    this.tooltipContainer.style.display = 'none';
  }

  repositionTooltip() {
    this.tooltipContainer.style.left = this.lastMousePosition.x + 'px';
    this.tooltipContainer.style.top = this.lastMousePosition.y + 'px';
  }

  updateBelts() {
    if (!this.beltMovement) return;
    requestAnimationFrame(this.updateBelts.bind(this));

    this.belts.forEach((line) => {
      const mo = line.material.uniforms.mapOffset;
      if (mo != null) {
        mo.value.x -= 0.005 * line.userData.speed;
      }
    });

    this.requestRendering();
  }

  requestRendering() {
    if (!this.requestedRendering && !this.isPaused) {
      this.requestedRendering = true;

      requestAnimationFrame(this.animate.bind(this));
    }
  }

  animate() {
    this.requestedRendering = false;

    this.scaleRotationSpeed();

    this.handleMouseInteraction();

    this.renderer.render(this.scene, this.camera);
  }

  initEvents() {
    this.container.addEventListener(
      'pointermove',
      (event) => {
        const containerBounds = this.container.getBoundingClientRect();

        const relativeX = event.clientX - containerBounds.left;
        const relativeY = event.clientY - containerBounds.top;

        this.lastMousePosition = {x: relativeX, y: relativeY};

        this.mouse.x = (relativeX / this.rendererWidth) * 2 - 1;
        this.mouse.y = -(relativeY / this.rendererHeight) * 2 + 1;

        this.requestRendering();
      },
      false
    );
    this.container.addEventListener(
      'click',
      () => {
        if (this.selected) {
          this.emitter.emit('entity:select', this.selected.userData);
        }
      },
      false
    );

    this.controls.addEventListener('change', () => this.requestRendering());

    window.addEventListener(
      'resize',
      () => {
        this.rendererWidth = this.container.clientWidth;
        this.rendererHeight = this.container.clientHeight;

        this.camera.aspect = this.rendererWidth / this.rendererHeight;

        this.camera.updateProjectionMatrix();
        this.camera.lookAt(this.scene.position);

        this.renderer.setSize(this.rendererWidth, this.rendererHeight);

        this.requestRendering();
      },
      false
    );
  }

  centerCamera() {
    var avg = {
      theta: 0,
      phi: 0,
    };
    for (let i = 0; i < this.data.copiedBuildings.length; i++) {
      const sphericalPosition = this.data.copiedBuildings[i].sphericalPosition;
      avg.theta += sphericalPosition.theta / this.data.copiedBuildings.length;
      avg.phi +=
        ((sphericalPosition.phi > 0 ? 0 : 2 * Math.PI) +
          sphericalPosition.phi) /
        this.data.copiedBuildings.length;
    }

    clamp(avg);
    const orig = [
      this.controls.minPolarAngle,
      this.controls.maxPolarAngle,
      this.controls.minAzimuthAngle,
      this.controls.maxAzimuthAngle,
    ];

    this.controls.maxPolarAngle = this.controls.minPolarAngle = avg.theta;
    this.controls.maxAzimuthAngle = this.controls.minAzimuthAngle =
      Math.PI / 2 - avg.phi;

    this.controls.update();

    this.controls.minPolarAngle = orig[0];
    this.controls.maxPolarAngle = orig[1];
    this.controls.minAzimuthAngle = orig[2];
    this.controls.maxAzimuthAngle = orig[3];
    this.controls.update();
  }

  renderBP() {
    const buildingsGroup = new THREE.Group();
    const beltsGroup = new THREE.Group();
    this.scene.add(buildingsGroup);
    this.scene.add(beltsGroup);

    const positionsMap = {};

    const recipeGeometry = new THREE.PlaneGeometry(3, 3, 1, 1);

    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
      linewidth: 2,
    });

    for (let i = 0; i < this.data.copiedBuildings.length; i++) {
      const stick = new THREE.Object3D();

      const building = this.data.copiedBuildings[i];
      const modelData = buildingsData[building.modelIndex];

      building.sphericalPosition = toSpherical(
        building.cursorRelativePos,
        this.data.referencePos
      );
      building.cartesianPosition = toCartesian(building.sphericalPosition);

      stick.lookAt(building.cartesianPosition);
      buildingsGroup.add(stick);

      const buildingMesh = new THREE.Mesh(
        modelData.geometry,
        modelData.material.clone()
      );

      const wireframe = new THREE.LineSegments(
        modelData.wireframeGeometry,
        wireframeMaterial
      );

      buildingMesh.rotateZ(degToRad(building.cursorRelativeYaw));
      wireframe.rotateZ(degToRad(building.cursorRelativeYaw));

      buildingMesh.position.set(0, 0, 200.2);
      wireframe.position.set(0, 0, 200.2);
      stick.add(buildingMesh);
      stick.add(wireframe);

      buildingMesh.userData = building;

      if (
        building.recipeId != 0 &&
        building.modelIndex != 45 && // ingore recipe for energy exchangers
        this.recipeMaterials[building.recipeId]
      ) {
        let recipeMaterial = this.recipeMaterials[building.recipeId];
        if (building.modelIndex === 73) {
          // ray receivers set recipeId as one when generating photons
          recipeMaterial = this.recipeMaterials[1208];
        }
        const plane = new THREE.Mesh(recipeGeometry, recipeMaterial);
        plane.position.set(0, 0, 200.3 + modelData.size[2]);
        stick.add(plane);
      }

      positionsMap[building.originalId] = building.cartesianPosition;
      this.buildings.push(buildingMesh);
    }

    const beltMap = {};
    for (let i = 0; i < this.data.copiedBelts.length; i++) {
      const belt = this.data.copiedBelts[i];
      const beltPosition = toCartesian(
        toSpherical(belt.cursorRelativePos, this.data.referencePos)
      );
      positionsMap[belt.originalId] = beltPosition;
      beltMap[belt.originalId] = belt;
    }

    const beltTexture = new THREE.TextureLoader().load(
      this.assetPathResolver('textures', 'belt')
    );
    beltTexture.wrapS = THREE.RepeatWrapping;
    beltTexture.wrapT = THREE.RepeatWrapping;
    for (let i = 0; i < this.data.copiedBelts.length; i++) {
      // create an array of connected belts , in order of connection
      let belt = this.data.copiedBelts[i];
      const beltId = belt.protoId;
      if (belt.seen) continue;

      const segment = [];
      do {
        segment.push(positionsMap[belt.originalId]);
        belt.seen = true;
        belt = beltMap[belt.outputId];
      } while (belt && !belt.seen && beltId == belt.protoId);
      if (belt) {
        segment.push(positionsMap[belt.originalId]);
      }
      belt = beltMap[this.data.copiedBelts[i].backInputId];

      if (belt) {
        do {
          segment.unshift(positionsMap[belt.originalId]);
          belt.seen = true;

          if (
            beltMap[belt.backInputId] &&
            !beltMap[belt.backInputId].seen &&
            beltId == beltMap[belt.backInputId].protoId
          ) {
            belt = beltMap[belt.backInputId];
          } else if (
            beltMap[belt.leftInputId] &&
            !beltMap[belt.leftInputId].seen &&
            beltId == beltMap[belt.leftInputId].protoId
          ) {
            belt = beltMap[belt.leftInputId];
          } else {
            belt = beltMap[belt.rightInputId];
          }
        } while (belt && !belt.seen && beltId == belt.protoId);
      }
      if (belt) {
        segment.unshift(positionsMap[belt.originalId]);
      }
      const model = beltsData[beltId];
      const beltGeometry = new MeshLine();
      beltGeometry.setPoints(segment);
      const beltMaterial = new MeshLineMaterial({
        useMap: true,
        map: beltTexture,
        color: model.color,
        linewidth: 0.6,
        repeat: new THREE.Vector2(segment.length, 1),
      });

      beltMaterial.onBeforeCompile = function (shader) {
        shader.uniforms.mapOffset = {value: new THREE.Vector2(0, 0)};
        shader.fragmentShader = shader.fragmentShader.replace(
          'uniform float useMap;',
          'uniform float useMap;\nuniform vec2 mapOffset;'
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          'if( useMap == 1. ) c *= texture2D( map, vUV * repeat );',
          'if( useMap == 1. ) c *= texture2D( map, vUV * repeat + mapOffset);'
        );
      };

      const line = new THREE.Mesh(beltGeometry.geometry, beltMaterial);

      line.userData = model;

      beltsGroup.add(line);
      this.belts.push(line);
    }
  }

  render() {
    this.emitter.emit('render:start');
    this.initScene();
    this.initEvents();

    this.renderGlobe();

    this.renderBP();
    this.centerCamera();
    this.animate();

    if (this.beltMovement) {
      this.updateBelts();
    }

    this.emitter.emit('render:complete');
  }

  setBeltMovement(beltMovement) {
    if (beltMovement == this.beltMovement) return;
    this.beltMovement = beltMovement;

    if (beltMovement) {
      this.updateBelts();
    }
  }
}
