(function (Site) {
  // Copy button beside the email. Falls back to a hidden textarea + execCommand where the
  // Clipboard API isn't available (e.g. the page opened straight from disk in some browsers).
  function initContact() {
    const btn = document.querySelector('#contact .contact__copy');
    if (!btn) return;
    const email = btn.dataset.copy;
    let timer;

    function fallbackCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.append(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    }

    btn.addEventListener('click', async () => {
      let ok = false;
      try { await navigator.clipboard.writeText(email); ok = true; } catch { ok = fallbackCopy(email); }
      btn.textContent = ok ? 'Copied' : 'Copy failed';
      btn.classList.toggle('is-done', ok);
      clearTimeout(timer);
      timer = setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('is-done'); }, 1800);
    });
  }

  Object.assign(Site, { initContact });
})(window.Site = window.Site || {});
