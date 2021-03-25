import { Vector3 } from 'three/build/three.module';

const DEGREES_TO_RADIANS = Math.PI / 180;

export function LightenDarkenColor(num, amt) {
  var r = Math.min(255, Math.round((num >> 16) * (1 + amt)));
  var b = Math.min(255, Math.round(((num >> 8) & 0x00ff) * (1 + amt)));
  var g = Math.min(255, Math.round((num & 0x0000ff) * (1 + amt)));
  var newColor = g | (b << 8) | (r << 16);
  return newColor;
}

function clamp(coord) {
  coord.theta = ((coord.theta + Math.PI) % (2 * Math.PI)) - Math.PI;
  coord.phi = ((coord.phi + Math.PI) % (2 * Math.PI)) - Math.PI;
  return coord;
}

export function toSpherical(blueprint, pos) {
  return clamp({
    theta: (DEGREES_TO_RADIANS * (pos[0] + blueprint.referencePos[0])) / 100,
    phi: (DEGREES_TO_RADIANS * (pos[1] + blueprint.referencePos[1])) / 100,
    radius: 200.2,
  });
}

export function toCartesian(coord) {
  var x = coord.radius * Math.sin(coord.theta) * Math.cos(coord.phi);
  var y = coord.radius * Math.cos(coord.theta);
  var z = coord.radius * Math.sin(coord.theta) * Math.sin(coord.phi);
  return new Vector3(x, y, z);
}