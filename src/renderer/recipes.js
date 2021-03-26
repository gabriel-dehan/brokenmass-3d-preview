import * as THREE from 'three';
import recipes from '../data/gameRecipes.json';

const loader = new THREE.TextureLoader();

var additionalItems = {
  1208: 'Critical photon',
};

export const loadRecipes = (assetPathResolver) => {
  const recipeMaterials = {};

  Object.keys(recipes).map((id) => {
    const texture = loader.load(assetPathResolver('recipes', id));

    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);

    recipeMaterials[id] = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });
  });

  Object.keys(additionalItems).map((id) => {
    const texture = loader.load(assetPathResolver('entities', id));

    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);

    recipeMaterials[id] = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });
  });

  return recipeMaterials;
};
