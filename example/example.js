/* eslint-disable no-undef */
// Could be an import in a classic application
const Preview3DRenderer = Brokenmass3DPreview;

(function () {
  const tooltipContainer = document.querySelector(
    '[data-preview-target=tooltip]'
  );
  const container = document.querySelector('[data-preview-target=output]');
  const actionButton = document.querySelector('[data-preview-target=action]');

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
        return `https://dyson-sphere-blueprints-dev.s3-eu-west-1.amazonaws.com/public/game_icons/${assetType}/${id}.png`;
      },
    });

    renderer.on('render:start', function () {
      console.log('Started');
      // Display loader for instance
    });

    renderer.on('render:complete', function () {
      console.log('Rendered');
      // Hide loader
    });

    renderer.on('entity:select', function (data) {
      console.log('Select', data);
    });

    renderer.render();
  });
})();
