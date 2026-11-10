(() => {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('contact-status');
  const button = document.getElementById('contact-submit');
  if (!form || !status || !button) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity() || button.disabled) return;
    const fields = ['firstName', 'lastName', 'company', 'email'];
    const data = {};
    for (const name of fields) {
      const input = form.elements.namedItem(name);
      const value = input.value.trim();
      input.setCustomValidity(value ? '' : 'Fyll i detta fält.');
      input.addEventListener('input', () => input.setCustomValidity(''), { once: true });
      data[name] = value;
    }
    if (!form.reportValidity()) return;
    button.disabled = true;
    button.textContent = 'Skickar…';
    status.textContent = '';
    try {
      const response = await fetch('/api/public/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data), signal: AbortSignal.timeout(15000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Det gick inte att skicka. Försök igen.');
      status.textContent = 'Tack! Vi har tagit emot dina kontaktuppgifter.';
      form.reset();
    } catch (error) {
      status.textContent = error instanceof Error && error.name !== 'TimeoutError'
        ? error.message : 'Det gick inte att skicka just nu. Försök igen eller mejla info@almedalskompassen.se.';
    } finally {
      button.disabled = false;
      button.textContent = 'Skicka';
    }
  });
})();