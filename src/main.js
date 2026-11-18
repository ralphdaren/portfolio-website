// Entry point. Every file in src/ is a plain script that adds what it shares to window.Site,
// so the page also works when opened straight from disk (file://). Load order is set in index.html.
(function (Site) {
  Site.initSideNav();
  Site.initHero();
  Site.initAbout();
  Site.initProjects();
  Site.initStack();
  Site.initGear();
  Site.initContact();
})(window.Site);
