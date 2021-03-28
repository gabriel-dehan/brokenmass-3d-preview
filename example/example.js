/* eslint-disable no-undef */
// Could be an import in a classic application
const Preview3DRenderer = Brokenmass3DPreview;

(function () {
  const tooltipContainer = document.querySelector(
    '[data-preview-target=tooltip]'
  );
  const container = document.querySelector('[data-preview-target=output]');
  const actionButton = document.querySelector('[data-preview-target=action]');
  const pauseButton = document.querySelector('[data-preview-target=pause]');
  const saveButton = document.querySelector('[data-preview-target=save]');
  const beltsButton = document.querySelector('[data-preview-target=belts]');

  actionButton.addEventListener('click', function () {
    // Clear the container
    container.innerHTML = '';

    const data = document
      .querySelector('[data-preview-target=data]')
      .value.trim();

    const renderer = new Preview3DRenderer({
      tooltipContainer,
      container,
      data: data === '' ? window.DEFAULT_BLUEPRINT : data,
      setTooltipContent: (data) => {
        return `
          <p>originalId  ${data.originalId}</p>
          <p>modelIndex: ${data.modelIndex}</p>
          <p>recipeId:   ${data.recipeId}</p>
        `.trim();
      },
      assetPathResolver: (assetType, id) => {
        // Faster loading for textures
        const extension = assetType === 'textures' ? 'jpg' : 'png';
        return `https://dyson-sphere-blueprints-dev.s3-eu-west-1.amazonaws.com/public/game_icons/${assetType}/${id}.${extension}`;
      },
    });

    renderer.on('render:start', function () {
      // Loader for instance
      console.log('Started rendering');
    });

    renderer.on('render:complete', function () {
      console.log('Rendered');
      // Hide loader
    });

    renderer.on('assets:loader:complete', function () {
      // Hide loader
      console.log('Done loading assets');
    });

    renderer.on('render:pause', function () {
      console.log('Paused');
    });

    renderer.on('render:restart', function () {
      console.log('Restarted');
    });

    renderer.on('entity:select', function (data) {
      console.log('Select', data);
    });

    renderer.render();

    saveButton.addEventListener('click', function () {
      renderer.downloadCanvasAsImage();
    });

    pauseButton.addEventListener('click', function (e) {
      if (renderer.isPaused) {
        renderer.restart();
        e.target.textContent = 'Pause';
      } else {
        renderer.pause();
        e.target.textContent = 'Restart';
      }
    });

    beltsButton.addEventListener('click', function (e) {
      if (renderer.beltMovement) {
        renderer.setBeltMovement(false);
        e.target.textContent = 'Activate belts';
      } else {
        renderer.setBeltMovement(true);
        e.target.textContent = 'Deactivate belts';
      }

    });

  });
})();
