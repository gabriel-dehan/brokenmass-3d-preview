import * as THREE from 'three';
import recipes from '../data/gameRecipes.json';

const loader = new THREE.TextureLoader();

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

  return recipeMaterials;
};
