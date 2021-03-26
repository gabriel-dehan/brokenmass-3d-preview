import * as THREE from 'three/build/three.module';

const ANGLE_STEP = 0.36;
const grid = [
  {
    segments: 20,
    count: 5,
  },
  {
    segments: 40,
    count: 5,
  },
  {
    segments: 80,
    count: 5,
  },
  {
    segments: 100,
    count: 5,
  },
  {
    segments: 160,
    count: 10,
  },
  {
    segments: 200,
    count: 10,
  },
  {
    segments: 300,
    count: 15,
  },
  {
    segments: 400,
    count: 15,
  },
  {
    segments: 500,
    count: 25,
  },
  {
    segments: 600,
    count: 25,
  },
  {
    segments: 800,
    count: 50,
  },
  {
    segments: 1000,
    count: 80,
  },
];

function* range(start, stop, step) {
  for (let i = 0, v = start; v < stop; v = start + ++i * step) {
    yield v;
  }
}

function meridian(x, y0, y1, dy = ANGLE_STEP) {
  x = Math.round(x * 100) / 100;
  return Array.from(range(y0, y1 + 1e-6, dy), (y) => [x, y]);
}

function parallel(y, x0, x1, dx = ANGLE_STEP) {
  y = Math.round(y * 100) / 100;
  return Array.from(range(x0, x1 + 1e-6, dx), (x) => [x, y]);
}

function vertex([longitude, latitude], radius) {
  const lambda = (longitude * Math.PI) / 180;
  const phi = (latitude * Math.PI) / 180;
  return new THREE.Vector3(
    radius * Math.cos(phi) * Math.cos(lambda),
    radius * Math.sin(phi),
    -radius * Math.cos(phi) * Math.sin(lambda)
  );
}

export const generateGraticules = function () {
  const coords = [];
  const intermediateCoords = [];
  const mainCoords = [];
  for (let i = 0; i < 1000; i++) {
    const segment = parallel(i * ANGLE_STEP - 180, -180, 180);

    if (i % 10 === 0) {
      mainCoords.push(segment);
    } else if (i % 5 === 0) {
      intermediateCoords.push(segment);
    } else {
      coords.push(segment);
    }
  }

  let index = 0;
  grid.forEach((section) => {
    const angle = 360 / section.segments;

    const start = 90 - index * ANGLE_STEP;
    const end = 90 - (index + section.count) * ANGLE_STEP;

    for (let i = 0; i < section.segments; i++) {
      const segA = meridian(i * angle - 180, end, start);
      const segB = meridian(i * angle - 180, -start, -end);

      if (i % 10 === 0) {
        mainCoords.push(segA);
        mainCoords.push(segB);
      } else if (i % 5 === 0) {
        intermediateCoords.push(segA);
        intermediateCoords.push(segB);
      } else {
        coords.push(segA);
        coords.push(segB);
      }
    }

    index += section.count;
  });

  return {
    normal: {
      type: 'MultiLineString',
      coordinates: coords,
    },
    intermediate: {
      type: 'MultiLineString',
      coordinates: intermediateCoords,
    },
    main: {
      type: 'MultiLineString',
      coordinates: mainCoords,
    },
  };
};

export const wireframe = function (multilinestring, radius, material) {
  const geometry = new THREE.Geometry();
  for (const P of multilinestring.coordinates) {
    for (let p0, p1 = vertex(P[0], radius), i = 1; i < P.length; ++i) {
      // eslint-disable-next-line no-unused-vars
      geometry.vertices.push((p0 = p1), (p1 = vertex(P[i], radius)));
    }
  }
  return new THREE.LineSegments(geometry, material);
};
