const DEGREES_TO_RADIANS = Math.PI / 180;
import * as THREE from 'three/build/three.module';

export const LightenDarkenColor = function (num, amt) {
  var r = Math.min(255, Math.round((num >> 16) * (1 + amt)));
  var b = Math.min(255, Math.round(((num >> 8) & 0x00ff) * (1 + amt)));
  var g = Math.min(255, Math.round((num & 0x0000ff) * (1 + amt)));
  var newColor = g | (b << 8) | (r << 16);
  return newColor;
};

export const clamp = function (coord) {
  coord.theta = ((coord.theta + Math.PI) % (2 * Math.PI)) - Math.PI;
  coord.phi = ((coord.phi + Math.PI) % (2 * Math.PI)) - Math.PI;
  return coord;
};

export const toSpherical = function (pos, referencePos) {
  return clamp({
    theta: (DEGREES_TO_RADIANS * (pos[0] + referencePos[0])) / 100,
    phi: (DEGREES_TO_RADIANS * (pos[1] + referencePos[1])) / 100,
    radius: 200.2,
  });
};

export const toCartesian = function (coord) {
  var x = coord.radius * Math.sin(coord.theta) * Math.cos(coord.phi);
  var y = coord.radius * Math.cos(coord.theta);
  var z = coord.radius * Math.sin(coord.theta) * Math.sin(coord.phi);
  return new THREE.Vector3(x, y, z);
};
