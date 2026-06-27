// Run: node scripts/fetch-github-stats.js
// Fetches language byte counts across all public repos

const https = require('https');
const fs = require('fs');
const path = require('path');

const GITHUB_USERNAME = 'ralphdaren';
const HTML_PATH = path.join(__dirname, '..', 'index.html');
const TOP_N = 4;ß

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'portfolio-stats-script' } }, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve(JSON.parse(data)));
      res.on('error', reject);
    });
  });
}

async function main() {
  const repos = await get(
    `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100`
  );

  const totals = {};
  for (const repo of repos) {
    const langs = await get(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${repo.name}/languages`
    );
    for (const [lang, bytes] of Object.entries(langs)) {
      totals[lang] = (totals[lang] || 0) + bytes;
    }
  }

  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);
  const top = Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, TOP_N)
    .map(([lang, bytes]) => ({ lang, pct: Math.round((bytes / grandTotal) * 100) }));

  console.log('GitHub language stats:');
  top.forEach(({ lang, pct }) => console.log(`  ${lang}: ${pct}%`));

  const rows = top
    .map(
      ({ lang, pct }) => `          <div class="skill-bar-row" data-reveal>
            <div class="skill-bar__header">
              <span>${lang}</span>
              <span class="t-accent">${pct}%</span>
            </div>
            <div class="skill-bar__track">
              <div class="skill-bar__fill" data-level="${pct}%"></div>
            </div>
          </div>`
    )
    .join('\n');

  const html = fs.readFileSync(HTML_PATH, 'utf-8');
  const updated = html.replace(
    /(<!-- GITHUB-STATS-START -->)[\s\S]*?(<!-- GITHUB-STATS-END -->)/,
    `$1\n${rows}\n          $2`
  );

  fs.writeFileSync(HTML_PATH, updated);
  console.log('index.html updated.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
