(function (Site) {
  function initStack() {
    const tabs = [...document.querySelectorAll('#stack [role="tab"]')];
    if (!tabs.length) return;

    function select(tab) {
      tabs.forEach(t => {
        const on = t === tab;
        t.setAttribute('aria-selected', on);
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', e => {
        const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        const to = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1
          : step ? (i + step + tabs.length) % tabs.length : null;
        if (to === null) return;
        e.preventDefault();
        tabs[to].focus();
        select(tabs[to]);
      });
    });
  }

  Object.assign(Site, { initStack });
})(window.Site = window.Site || {});
