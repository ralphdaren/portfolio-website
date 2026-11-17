(function (Site) {
  function initHero() {
    document.querySelectorAll('.hero__headline .w, .hero__headline .pic')
      .forEach((el, i) => { el.style.animationDelay = `${300 + i * 60}ms`; });
  }

  Object.assign(Site, { initHero });
})(window.Site = window.Site || {});
