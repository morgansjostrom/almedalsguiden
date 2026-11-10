(() => {
  'use strict';
  let dialog;
  function sizeContent() {
    if (!dialog?.open) return;
    const map = document.getElementById('map');
    const body = dialog.querySelector('.program-details-body');
    const width = window.innerWidth;
    const height = window.innerHeight;
    // Use the same content bounds as programPopupOptions() for map popups.
    body.style.width = Math.max(160, Math.min(600, width - 66)) + 'px';
    body.style.maxHeight = Math.min(window.innerHeight - 60, Math.max(80, height - 110)) + 'px';
    body.classList.remove('leaflet-popup-scrolled');
    body.classList.toggle('leaflet-popup-scrolled', body.scrollHeight > body.clientHeight);
  }
  window.addEventListener('resize', sizeContent);
  window.AlmedalProgramDetails = {
    open(content) {
      if (!dialog) {
        dialog = document.createElement('dialog');
        dialog.className = 'program-details-dialog';
        dialog.setAttribute('aria-label', 'Programpunkt');
        dialog.innerHTML = '<button type="button" class="program-details-close" aria-label="Stäng programpunkten">×</button><div class="program-details-body leaflet-popup-content"></div>';
        dialog.querySelector('button').onclick = () => dialog.close();
        dialog.addEventListener('click', e => {
          if (e.target !== dialog) return;
          const r = dialog.getBoundingClientRect();
          if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
        });
        document.body.append(dialog);
      }
      dialog.querySelector('.program-details-body').replaceChildren(content);
      dialog.showModal();
      sizeContent();
    }
  };
})();
