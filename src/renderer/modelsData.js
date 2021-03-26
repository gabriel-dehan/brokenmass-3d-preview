import * as THREE from 'three';
import {BufferGeometryUtils} from 'three/examples/jsm/utils/BufferGeometryUtils';
import {LightenDarkenColor} from './utils';

const modelsData = {
  // Splitter
  38: {
    size: [2.700000047683716, 2.700000047683716, 2.4000000953674316],
    offset: [0, 0, 1.2000000476837158],
    color: 0x556C8D,
  },
  39: {
    size: [2, 2.700000047683716, 2.940000057220459],
    offset: [0, 0, 1.4700000286102295],
  },
  40: {
    size: [2.700000047683716, 2.700000047683716, 2.9600000381469727],
    offset: [0, 0, 1.4800000190734863],
  },
  // Tesla
  44: {
    size: [1.25, 1.25, 6],
    offset: [0, 0, 3],
    color: 0xffcb35,
  },
  // Energy exchanger
  45: {
    size: [8.300000190734863, 8.300000190734863, 12],
    offset: [0, 0, 6],
    color: 0xffcb35,
  },
  // Accumulator
  46: {
    size: [3.2699999809265137, 2.9800000190734863, 4.460000038146973],
    offset: [0, -0.09000000357627869, 2.2300000190734863],
    color: 0xffcb35,
  },
  // PLS
  49: {
    size: [7.599999904632568, 7.599999904632568, 25],
    offset: [0, 0, 12.5],
    color: 0x474641,
  },
  // ILS
  50: {
    size: [8, 8, 34],
    offset: [0, 0, 17],
    color: 0x474641,
  },
  // Storage MK I
  51: {
    size: [3.200000047683716, 3.200000047683716, 2.6700000762939453],
    offset: [0, 0, 1.3300000429153442],
  },
  // Storage MK II
  52: {
    size: [6.199999809265137, 4.199999809265137, 4],
    offset: [0, 0, 2],
  },
  // Wind turbine
  53: {
    size: [3.5, 3.799999952316284, 7.400000095367432],
    offset: [-0.30000001192092896, 0, 3.700000047683716],
  },
  // Thermal power station
  54: {
    size: [4.800000190734863, 9, 4.199999809265137],
    offset: [-0.4000000059604645, 0.44999998807907104, 2.0999999046325684],
  },
  // Solar panel
  55: {
    size: [3.5999999046325684, 3.5999999046325684, 4],
    offset: [0, 0, 2],
  },
  // Artificial star
  56: {
    size: [5.599999904632568, 5.599999904632568, 10.199999809265137],
    offset: [0, 0, 5.099999904632568],
  },
  57: {
    size: [3.799999952316284, 6.800000190734863, 3.5999999046325684],
    offset: [0, 0.30000001192092896, 1.7999999523162842],
  },
  60: {
    size: [2.5999999046325684, 5.599999904632568, 6],
    offset: [0, 0.10000000149011612, 3],
  },
  61: {
    size: [6.900000095367432, 12.600000381469727, 11.600000381469727],
    offset: [0, 0.20000000298023224, 5.800000190734863],
  },
  // Smelter
  62: {
    size: [3.200000047683716, 3.200000047683716, 3.799999952316284],
    offset: [0, 0, 1.899999976158142],
    color: 0xa8b3c3,
  },
  // Refinery
  63: {
    size: [4.199999809265137, 7.400000095367432, 10.600000381469727],
    offset: [0, -0.3199999928474426, 5.300000190734863],
  },
  // Chemical plant
  64: {
    size: [9.199999809265137, 5.300000190734863, 6.300000190734863],
    offset: [0.47999998927116394, 0.7799999713897705, 3.1500000953674316],
  },
  // Assembler MK I
  65: {
    size: [4.199999809265137, 4.199999809265137, 4.599999904632568],
    offset: [0, 0, 2.299999952316284],
    color: 0xe8a931,
  },
  // Assembler MK II
  66: {
    size: [4.199999809265137, 4.199999809265137, 4.599999904632568],
    offset: [0, 0, 2.299999952316284],
    color: 0x05A79C,
  },
  // Assembler MK III
  67: {
    size: [4.199999809265137, 4.199999809265137, 4.599999904632568],
    offset: [0, 0, 2.299999952316284],
    color: 0x23a7d5,
  },
  // Satelite Substation
  68: {
    size: [3.5, 3.5, 7],
    offset: [0, 0, 3.5],
    color: 0xffcb35,
  },
  // Particle collider
  69: {
    size: [11.199999809265137, 6.099999904632568, 13],
    offset: [-0.699999988079071, 0, 6.5],
  },
  // Matrix lab
  70: {
    size: [6.099999904632568, 6.099999904632568, 3.0999999046325684],
    offset: [0, 0, 1.5499999523162842],
  },
  // Wireless power tower
  71: {
    size: [2.299999952316284, 2.299999952316284, 9.199999809265137],
    offset: [0, 0, 4.599999904632568],
    color: 0xffcb35,
  },
  // EM-Rail ejector
  72: {
    size: [5, 5, 6],
    offset: [0, 0, 3],
  },
  // Ray receiver
  73: {
    size: [7, 5, 10],
    offset: [0, 0, 5],
    color: 0x400000,
  },
  74: {
    size: [15, 18.200000762939453, 19],
    offset: [0, 0, 9.5],
  },
  117: {
    size: [8, 8, 34],
    offset: [0, 0, 17],
  },
  // Nuclear power station
  118: {
    size: [4.800000190734863, 9, 4.199999809265137],
    offset: [-0.4000000059604645, 0.44999998807907104, 2.0999999046325684],
  },
  // Fractionator
  119: {
    size: [4.800000190734863, 4.800000190734863, 9.399999618530273],
    offset: [0, 0, 4.699999809265137],
  },
  120: {
    size: [3.799999952316284, 3.1500000953674316, 2.5],
    offset: [-0.17000000178813934, 0, 1.0800000429153442],
  },
  // Storage tank
  121: {
    size: [4.800000190734863, 4.800000190734863, 4],
    offset: [0, 0, 2],
  },
};

// tesla poles
modelsData[44].geometry = new THREE.CylinderGeometry(0.4, 0.5, 6, 8, 1)
  .rotateX(Math.PI / 2)
  .translate(0, 0, 3);

//factories
modelsData[65].geometry = modelsData[66].geometry = modelsData[67].geometry = BufferGeometryUtils.mergeBufferGeometries(
  [
    new THREE.BoxBufferGeometry(4, 4, 1).translate(0, 0, 0.5),
    new THREE.BoxBufferGeometry(0.3, 2, 4.6).translate(-1.3, 0, 2.3),
    new THREE.BoxBufferGeometry(0.3, 2, 4.6).translate(1.3, 0, 2.3),
    new THREE.BoxBufferGeometry(3.5, 3.5, 0.8).translate(0, 0, 3.95),
  ],
  false
);

//smelter
modelsData[62].geometry = BufferGeometryUtils.mergeBufferGeometries(
  [
    new THREE.BoxBufferGeometry(3, 3, 1).translate(0, 0, 0.5),
    new THREE.CylinderBufferGeometry(0.6, 1.2, 3.8, 16)
      .rotateX(Math.PI / 2)
      .translate(0, 0, 3.8 / 2),
    new THREE.CylinderBufferGeometry(1.1, 1.1, 0.5, 16)
      .rotateX(Math.PI / 2)
      .translate(0, 0, 3.8 - 0.25),
  ],
  false
);

// chemical plants
modelsData[64].geometry = BufferGeometryUtils.mergeBufferGeometries(
  [
    new THREE.BoxBufferGeometry(6, 5.1, 3).translate(-0.25, 0, 1.5),
    new THREE.BoxBufferGeometry(7.5, 5.1, 1).translate(-0.75, 0, 0.5),
    new THREE.CylinderBufferGeometry(1.5, 1.5, 4, 16)
      .rotateX(Math.PI / 2)
      .translate(2.5, 0.75, 2),
    new THREE.SphereBufferGeometry(1.8, 16, 16)
      .rotateX(Math.PI / 2)
      .translate(2.5, 0.75, 4.5),
  ],
  false
).translate(0.5, 0.78, 0);

// ray receiver
modelsData[73].geometry = BufferGeometryUtils.mergeBufferGeometries(
  [
    new THREE.BoxBufferGeometry(7, 1, 1.2).translate(0, 0, 0.6),
    new THREE.BoxBufferGeometry(5, 2.5, 2)
      .rotateZ(Math.PI / 2)
      .translate(0, 0, 1),

    new THREE.CylinderBufferGeometry(1, 1, 5, 8)
      .rotateX(Math.PI / 2)
      .translate(0, 0, 2.25),

    new THREE.ConeBufferGeometry(5, 2, 10, 1, true)
      .rotateX(-Math.PI / 2)
      .translate(0, 0, 3.7),

    new THREE.ConeBufferGeometry(1, 5, 10)
      .rotateX(Math.PI / 2)
      .translate(0, 0, 7.2),

    new THREE.SphereBufferGeometry(0.75, 8, 8)
      .rotateX(Math.PI / 2)
      .translate(0, 0, 9.25),
  ],
  false
);

modelsData[68].geometry = BufferGeometryUtils.mergeBufferGeometries(
  [
    new THREE.CylinderBufferGeometry(0.5, 1.8, 2.5, 4)
      .rotateY(Math.PI / 4)
      .rotateX(Math.PI / 2)
      .translate(0, 0, 1.25),
    new THREE.CylinderBufferGeometry(0.6, 1, 0.5, 4)
      .rotateY(Math.PI / 4)
      .rotateX(Math.PI / 2)
      .translate(1, 0, 0.25),
    new THREE.CylinderBufferGeometry(0.6, 1, 0.5, 4)
      .rotateY(Math.PI / 4)
      .rotateX(Math.PI / 2)
      .translate(-1, 0, 0.25),
    new THREE.CylinderBufferGeometry(0.6, 1, 0.5, 4)
      .rotateY(Math.PI / 4)
      .rotateX(Math.PI / 2)
      .translate(0, 1, 0.25),
    new THREE.CylinderBufferGeometry(0.6, 1, 0.5, 4)
      .rotateY(Math.PI / 4)
      .rotateX(Math.PI / 2)
      .translate(0, -1, 0.25),
    new THREE.CylinderBufferGeometry(1.8, 0.5, 2.5, 4)
      .rotateY(Math.PI / 4)
      .rotateX(Math.PI / 2)
      .translate(0, 0, 5.75),
  ],
  false
);
Object.values(modelsData).forEach((model) => {
  // create default box geometries for all entitities that don't have lowpoly models

  if (!model.geometry) {
    model.geometry = new THREE.BoxGeometry(
      model.size[0] - 0.25,
      model.size[1] - 0.25,
      model.size[2]
    ).translate(model.offset[0], model.offset[1], model.offset[2]);
  }
  model.wireframeGeometry = new THREE.EdgesGeometry(model.geometry);
  const defaultColor = 0xa3aebd;
  model.material = new THREE.MeshPhongMaterial({
    color: LightenDarkenColor(model.color || defaultColor, -0.2),
    emissive: model.color || defaultColor,
    emissiveIntensity: 0.5,
    reflectivity: 0,
    side: THREE.DoubleSide,
    shininess: 0.2,
  });
});

export default modelsData;
