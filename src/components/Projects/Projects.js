import { initSectionTour } from '../Tour/Tour.js';

const TOUR_STEPS = [
  { target: '#projects .plist button:nth-of-type(2)', text: 'Pick any project from this list.' },
  { target: '#projects .flip button[data-side="front"]', text: 'Click here to see how the website looks.', click: true },
  { target: '#projects .flip button[data-side="back"]', text: 'Click here to see how it was built and how it runs.', click: true },
  { target: '#projects .plink--live', text: 'Click here to visit the live version of the website.' },
  { target: '#projects .plink--code', text: 'Click here to read the code behind it.' },
];

export function initProjects() {
  const section = document.querySelector('#projects');
  const work = section?.querySelector('.work');
  if (!work) return;
  const frame = work.querySelector('.frame');

  const tabs = work.querySelectorAll('[role="tab"]');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.setAttribute('aria-selected', x === t));
    frame.querySelectorAll('[data-p]').forEach(el => el.toggleAttribute('hidden', el.dataset.p !== t.dataset.p));
    work.querySelector('.viewer__url').textContent = t.dataset.url;
    // "Visit site" / "View code" hide when the project has no URL for them yet
    const live = work.querySelector('.plink--live'), code = work.querySelector('.plink--code');
    live.hidden = !t.dataset.live; if (t.dataset.live) live.href = t.dataset.live;
    code.hidden = !t.dataset.code; if (t.dataset.code) code.href = t.dataset.code;
  }));

  const flips = work.querySelectorAll('.flip button');
  flips.forEach(b => b.addEventListener('click', () => {
    frame.dataset.side = b.dataset.side;
    flips.forEach(x => x.setAttribute('aria-pressed', x === b));
  }));

  initSectionTour({
    section, id: 'projects', steps: TOUR_STEPS,
    // put the frame back on the screenshot once the tour finishes
    onEnd: () => section.querySelector('.flip button[data-side="front"]').click(),
  });
}

