import pako from 'pako';
import { createNanoEvents } from 'nanoevents';
import * as THREE from 'three/build/three.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MeshLine, MeshLineMaterial } from 'three.meshline';
import { LightenDarkenColor, toSpherical, toCartesian } from './utils';
import { generateGraticules, wireframe } from './graticules';
import { loadRecipes } from './recipes';
import modelsData from './modelsData';

export default class {
  constructor({ tooltipContainer, container, data, width, height, setTooltipContent, assetPathResolver }) {
    this.tooltipContainer = tooltipContainer;
    this.container = container;
    this.rendererWidth = width;
    this.rendererHeight = height;
    this.getTooltipContent = setTooltipContent;
    this.emitter = createNanoEvents();
    this.eventHandlers = {};
    this.data = JSON.parse(pako.inflate(atob(data), { to: 'string' }));
    this.recipeMaterials = loadRecipes(assetPathResolver);
  }

  // render:start, render:complete, entity:select
  on(eventName, callback) {
    if (this.eventHandlers[eventName]) {
      // Unbind
      this.eventHandlers[eventName].call();
    }
    this.eventHandlers[eventName] = this.emitter.on(eventName, callback);
  }

  render() {
    var camera,
      scene,
      renderer,
      sphere,
      controls,
      buildings = [],
      buildingsGroup,
      beltsGroup,
      selected,
      lastMousePosition;

    const {
      data: bp,
      tooltipContainer,
      container,
      rendererWidth,
      rendererHeight,
      getTooltipContent,
      emitter,
      recipeMaterials,
    } = this;

    const mouse = new THREE.Vector2();

    function init() {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(
        50,
        rendererWidth / rendererHeight,
        1,
        10000
      );
      camera.position.z = 500;
      scene.add(camera);

      renderer = new THREE.WebGLRenderer({
        antialias: true,
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(rendererWidth, rendererHeight);
      container.appendChild(renderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableZoom = true;
      controls.minDistance = 250;
      controls.maxDistance = 700;

      const lights = [];
      lights[0] = new THREE.SpotLight(0xffffff, 1, 0);
      lights[1] = new THREE.SpotLight(0xffffff, 1, 0);
      lights[2] = new THREE.SpotLight(0xffffff, 1, 0);

      lights[0].position.set(0, 800, 0);
      lights[1].position.set(800, 1000, 800);
      lights[2].position.set(-800, -1000, -800);
      const ligthsGroup = new THREE.Group();
      //ligthsGroup.add(lights[0]);
      ligthsGroup.add(lights[1]);
      ligthsGroup.add(lights[2]);

      scene.add(ligthsGroup);

      const light = new THREE.AmbientLight(0x404040); // soft white light
      scene.add(light);

      renderGlobe();
    }

    function renderGlobe() {
      var globe = new THREE.Group();

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

      var graticules = generateGraticules();
      var normalWf = wireframe(graticules.normal, 200.1, lineMaterial);
      var intermediateWf = wireframe(
        graticules.intermediate,
        200.1,
        intermediateMaterial
      );
      var mainWf = wireframe(graticules.main, 200.1, mainLineMaterial);

      var sphereGeometry = new THREE.SphereGeometry(200, 36, 36);
      const sphereMaterial = new THREE.MeshPhongMaterial({
        color: 0x156289,
        emissive: 0x072534,
        side: THREE.DoubleSide,
      });
      sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

      scene.add(globe);
      globe.add(sphere);
      globe.add(normalWf);
      globe.add(intermediateWf);
      globe.add(mainWf);
    }

    function renderBP() {
      var reference = toSpherical(bp, [0, 0]);
      var orig = [
        controls.minPolarAngle,
        controls.maxPolarAngle,
        controls.minAzimuthAngle,
        controls.maxAzimuthAngle,
      ];

      controls.minPolarAngle = reference.theta;
      controls.maxPolarAngle = reference.theta;
      controls.minAzimuthAngle = reference.phi;
      controls.maxAzimuthAngle = reference.phi;
      controls.update();

      controls.minPolarAngle = orig[0];
      controls.maxPolarAngle = orig[1];
      controls.minAzimuthAngle = orig[2];
      controls.maxAzimuthAngle = orig[3];
      controls.update();

      buildingsGroup = new THREE.Group();
      beltsGroup = new THREE.Group();
      scene.add(buildingsGroup);
      scene.add(beltsGroup);

      var positions = {};

      //recipeMaterial.repeat.set(meshWidth / textureWidth, meshHeight / textureHeight);
      const recipeGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);

      for (let i = 0; i < bp.copiedBuildings.length; i++) {
        const building = bp.copiedBuildings[i];
        var model = modelsData[building.modelIndex];
        var stick = new THREE.Object3D();
        var point = toCartesian(toSpherical(bp, building.cursorRelativePos));
        stick.lookAt(point);
        buildingsGroup.add(stick);
        var geometry = new THREE.BoxGeometry(
          model.size[0] - 0.25,
          model.size[1] - 0.25,
          model.size[2]
        );
        //const material = new THREE.MeshBasicMaterial({color: 0xffff00});

        const material = new THREE.MeshPhongMaterial({
          color: LightenDarkenColor(model.color || 0xcccccc, -0.5), // model.color || 0xcccccc,
          emissive: LightenDarkenColor(model.color || 0xcccccc, 0),
          emissiveIntensity: 0.5,
          reflectivity: 1,
          side: THREE.FrontSide,
        });
        var mesh = new THREE.Mesh(geometry, material);
        mesh.rotateZ(THREE.Math.degToRad(building.cursorRelativeYaw));
        mesh.position.set(0, 0, 200.2 + model.size[2] / 2);

        mesh.data = building;
        stick.add(mesh);

        var geo = new THREE.EdgesGeometry(geometry);
        var mat = new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.3,
          linewidth: 2,
        });

        var wireframe = new THREE.LineSegments(geo, mat);
        wireframe.rotateZ(THREE.Math.degToRad(building.cursorRelativeYaw));
        wireframe.position.set(0, 0, 200.2 + model.size[2] / 2);
        stick.add(wireframe);

        if (building.recipeId != 0 && recipeMaterials[building.recipeId]) {
          const plane = new THREE.Mesh(
            recipeGeometry,
            recipeMaterials[building.recipeId]
          );
          plane.position.set(0, 0, 200.3 + model.size[2]);
          stick.add(plane);
        }
        positions[building.originalId] = point;
        buildings.push(mesh);
      }

      // const markerGeometry = new THREE.SphereGeometry(0.3, 4, 4);
      // const markerMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});

      var beltMap = {};
      for (let i = 0; i < bp.copiedBelts.length; i++) {
        const belt = bp.copiedBelts[i];
        var point = toCartesian(toSpherical(bp, belt.cursorRelativePos));
        positions[belt.originalId] = point;
        beltMap[belt.originalId] = belt;
      }
      var lanes = [];
      for (let i = 0; i < bp.copiedBelts.length; i++) {
        let belt = bp.copiedBelts[i];

        if (belt.seen) continue;

        var lane = [];
        do {
          lane.push(positions[belt.originalId]);
          belt.seen = true;
          belt = beltMap[belt.outputId];
        } while (belt && !belt.seen);
        if (belt) {
          lane.push(positions[belt.originalId]);
        }
        belt = beltMap[bp.copiedBelts[i].backInputId];

        if (belt) {
          do {
            lane.unshift(positions[belt.originalId]);
            belt.seen = true;
            belt = beltMap[belt.backInputId];
          } while (belt && !belt.seen);
        }
        if (belt) {
          lane.unshift(positions[belt.originalId]);
        }
        lanes.push(lane);
      }

      // var resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
      lanes.forEach((lane) => {
        const materialA = new MeshLineMaterial({
          color: 0xff0000,
          linewidth: 0.7,
        });

        const lineGeo = new MeshLine();
        lineGeo.setPoints(lane);

        const line = new THREE.Mesh(lineGeo.geometry, materialA);
        beltsGroup.add(line);
      });
    }

    const raycaster = new THREE.Raycaster();
    raycaster.params = {
      Mesh: {threshold: 0.5},
      Line: {threshold: 1},
      LOD: {},
      Points: {threshold: 1},
      Sprite: {},
    };

    function renderScene() {
      // update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);

      var cameraDistance = controls.target.distanceTo(
        controls.object.position
      );
      controls.rotateSpeed = (cameraDistance ** 2) / (controls.maxDistance ** 2);
      // calculate objects intersecting the picking ray
      const intersects = raycaster.intersectObjects(buildings);

      if (intersects.length && selected != intersects[0]) {
        if (selected) {
          selected.material.emissiveIntensity = 0.5;
        }
        document.body.style.cursor = 'pointer';
        selected = intersects[0].object;
        selected.material.emissiveIntensity = 1;
        var data = selected.data;
        tooltipContainer.style.display = 'block';
        tooltipContainer.innerHTML = getTooltipContent(data);
      } else {
        if (selected) {
          selected.material.emissiveIntensity = 0.5;
        }
        document.body.style.cursor = '';
        selected = null;
        tooltipContainer.style.display = 'none';
      }

      if (selected && lastMousePosition) {
        tooltipContainer.style.left = lastMousePosition.x - 60 + 'px';
        tooltipContainer.style.top = lastMousePosition.y - 105 + 'px';
      }

      renderer.render(scene, camera);
    }

    function animate() {
      requestAnimationFrame(animate);
      renderScene();
    }

    function onMouseMove(event) {
      const containerBounds = container.getBoundingClientRect();

      const relativeX = event.clientX - containerBounds.left;
      const relativeY = event.clientY - containerBounds.top;

      lastMousePosition = { x: relativeX, y: relativeY };

      mouse.x = ((relativeX / rendererWidth) * 2) - 1;
      mouse.y = (-(relativeY / rendererHeight) * 2) + 1;
    }

    function onClick() {
      if (selected) {
        emitter.emit('entity:select', selected.data);
      }
    }

    emitter.emit('render:start');
    init();
    renderBP();
    animate();
    emitter.emit('render:complete');

    container.addEventListener('pointermove', onMouseMove, false);
    container.addEventListener('click', onClick, false);
  }
}
