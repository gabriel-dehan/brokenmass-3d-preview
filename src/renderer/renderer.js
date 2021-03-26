import pako from 'pako';
import {createNanoEvents} from 'nanoevents';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {MeshLine, MeshLineMaterial} from 'three.meshline';
import {generateGraticules, wireframe} from './graticules';
import {loadRecipes} from './recipes';
import modelsData from './modelsData';
import {toSpherical, toCartesian, degToRad, clamp} from './utils';

export default class {
  constructor({
    tooltipContainer,
    container,
    data,
    setTooltipContent,
    assetPathResolver,
  }) {
    this.tooltipContainer = tooltipContainer;
    this.container = container;
    this.rendererWidth = container.clientWidth;
    this.rendererHeight = container.clientHeight;
    this.setTooltipContent = setTooltipContent;
    this.emitter = createNanoEvents();
    this.eventHandlers = {};
    this.recipeMaterials = loadRecipes(assetPathResolver);
    this.mouse = new THREE.Vector2();
    this.lastMousePosition = null;

    this.selected = null;
    this.parseBlueprint(data);
  }

  parseBlueprint(data) {
    this.data = JSON.parse(pako.inflate(atob(data), {to: 'string'}));
    this.buildings = [];
    this.belts = [];
  }

  // render:start, render:complete, entity:select
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
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x104d6c,
      emissive: 0x072534,
      side: THREE.DoubleSide,
    });
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
      antialias: true,
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
      this.selected.data
    );
  }

  hideTooltip() {
    this.tooltipContainer.style.display = 'none';
  }

  repositionTooltip() {
    this.tooltipContainer.style.left = this.lastMousePosition.x + 'px';
    this.tooltipContainer.style.top = this.lastMousePosition.y + 'px';
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

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
      },
      false
    );
    this.container.addEventListener(
      'click',
      () => {
        if (this.selected) {
          this.emitter.emit('entity:select', this.selected.data);
        }
      },
      false
    );

    window.addEventListener(
      'resize',
      () => {
        this.rendererWidth = this.container.clientWidth;
        this.rendererHeight = this.container.clientHeight;

        this.camera.aspect = this.rendererWidth / this.rendererHeight;

        this.camera.updateProjectionMatrix();
        this.camera.lookAt(this.scene.position);

        this.renderer.setSize(this.rendererWidth, this.rendererHeight);
        this.renderer.render(this.scene, this.camera);
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
      avg.phi += sphericalPosition.phi / this.data.copiedBuildings.length;
    }

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
      const modelData = modelsData[building.modelIndex];

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

      buildingMesh.data = building;

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

    const segments = [];
    for (let i = 0; i < this.data.copiedBelts.length; i++) {
      // create an array of connected belts , in order of connection
      let belt = this.data.copiedBelts[i];

      if (belt.seen) continue;

      const segment = [];
      do {
        segment.push(positionsMap[belt.originalId]);
        belt.seen = true;
        belt = beltMap[belt.outputId];
      } while (belt && !belt.seen);
      if (belt) {
        segment.push(positionsMap[belt.originalId]);
      }
      belt = beltMap[this.data.copiedBelts[i].backInputId];

      if (belt) {
        do {
          segment.unshift(positionsMap[belt.originalId]);
          belt.seen = true;
          belt = beltMap[belt.backInputId];
        } while (belt && !belt.seen);
      }
      if (belt) {
        segment.unshift(positionsMap[belt.originalId]);
      }

      segments.push(segment);
    }

    const beltMaterial = new MeshLineMaterial({
      color: 0x282828,
      linewidth: 0.6,
    });

    segments.forEach((lane) => {
      const beltGeometry = new MeshLine();
      beltGeometry.setPoints(lane);

      const line = new THREE.Mesh(beltGeometry.geometry, beltMaterial);
      beltsGroup.add(line);
    });
  }

  render() {
    this.emitter.emit('render:start');
    this.initScene();
    this.initEvents();

    this.renderGlobe();

    this.renderBP();
    this.centerCamera();
    this.animate();

    this.emitter.emit('render:complete');
  }
}
