import { GEAR_ITEMS } from './gearData.js';
import { initSectionTour } from '../Tour/Tour.js';

const TOUR_STEPS = [
  { target: '#gear .pin[data-i="0"]', text: 'Each dot is something on my desk. Click one to see what it is.', click: true },
  { target: '#gear .gear__name', text: 'Its photo and specs show up here.' },
  { target: '#gear .pin[data-i="7"]', text: 'Try another one, like my gaming keyboard.', click: true },
  { target: '#gear .gear__link', text: "Click here to see it on the maker's site." },
];

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const external = (href, text) =>
  `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(text)} <span aria-hidden="true">↗</span></a>`;

export function initGear() {
  const section = document.getElementById('gear');
  const desk = section?.querySelector('.desk');
  const panel = section?.querySelector('.gear__panel');
  const body = panel?.querySelector('.gear__body');
  if (!desk || !body) return;

  const pins = GEAR_ITEMS.map((item, i) => {
    const pin = document.createElement('button');
    pin.type = 'button';
    pin.className = 'pin';
    pin.dataset.i = i;
    pin.setAttribute('aria-label', item.name);
    pin.setAttribute('aria-controls', panel.id);
    pin.style.left = `${item.x}%`;
    pin.style.top = `${item.y}%`;
    pin.style.setProperty('--d', `${((i * 0.2) % 2.4).toFixed(1)}s`); // stagger the pulses
    pin.addEventListener('click', () => {
      show(i);
      // stacked layout: the panel is below the photo, so bring it into view
      if (matchMedia('(max-width: 960px)').matches) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return pin;
  });
  desk.append(...pins);

  function show(i) {
    const item = GEAR_ITEMS[i];
    pins.forEach((p, k) => p.setAttribute('aria-pressed', k === i));
    const specs = item.specs
      .map(([label, value, href]) => `<dt>${esc(label)}</dt><dd>${href ? external(href, value) : esc(value)}</dd>`)
      .join('');
    body.innerHTML = `
      <img class="gear__img" src="${esc(item.img)}" alt="${esc(item.name)}">
      <p class="gear__cat">${esc(item.cat)}</p>
      <h3 class="gear__name">${esc(item.name)}</h3>
      <p class="gear__desc">${esc(item.desc)}</p>
      <dl class="gear__specs">${specs}</dl>
      ${external(item.link, `View on ${item.site}`).replace('<a ', '<a class="gear__link" ')}`;
    // restart the entrance animation
    body.style.animation = 'none';
    body.offsetHeight;
    body.style.animation = '';
  }

  show(0);
  initSectionTour({ section, id: 'gear', steps: TOUR_STEPS, onEnd: () => show(0) });
}
