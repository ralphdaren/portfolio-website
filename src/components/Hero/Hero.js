(function (Site) {
  // The four pictures in the headline are the tour's stops, then a sweep across the side menu.
  const TOUR_STEPS = [
    { target: '#intro .pic--me', text: "Hi, I'm Ralph, the person behind this portfolio. Thanks for stopping by!" },
    { target: '#intro .pic--code:not(.pic--term)', text: 'This is what I do: you bring the idea, and I turn it into a website.' },
    { target: '#intro .pic--term', text: 'I take each project all the way, from design to build to launch.' },
    { target: '#intro .pic--work', text: 'Like this! A live site I built for a real client. More on it in Projects.' },
    // a quick sweep across the menu; on phones the menu hides its labels, so the bubble names each section
    {
      target: '.sidenav', sweep: '.sidenav a:not([href="#intro"])',
      name: a => (matchMedia('(max-width: 768px)').matches ? a.textContent.trim() : null),
      text: "That's the tour! Use this menu to jump to any section, or just keep scrolling.",
    },
  ];

  function initHero() {
    const section = document.querySelector('#intro');
    if (!section) return;
    section.querySelectorAll('.hero__headline .w, .hero__headline .pic')
      .forEach((el, i) => { el.style.animationDelay = `${300 + i * 60}ms`; });

    // the spotlight waits for the headline's entrance animation to finish
    Site.initSectionTour({ section, id: 'intro', steps: TOUR_STEPS, introDelay: 2600 });
  }

  Object.assign(Site, { initHero });
})(window.Site = window.Site || {});
