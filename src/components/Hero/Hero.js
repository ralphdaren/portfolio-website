export function initHero() {
  document.querySelectorAll('.hero__headline .w, .hero__headline .pic')
    .forEach((el, i) => { el.style.animationDelay = `${300 + i * 60}ms`; });
}
