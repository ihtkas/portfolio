// Lighthouse CI config. The post URL is read from the build, so it never depends on a sample slug.
const { existsSync, readdirSync } = require('node:fs');

const post = existsSync('dist/writing')
  ? readdirSync('dist/writing', { withFileTypes: true })
      .filter((e) => e.isDirectory() && existsSync(`dist/writing/${e.name}/index.html`))
      .map((e) => e.name)
      .sort()[0]
  : undefined;

module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: [
        '/index.html',
        '/writing/index.html',
        ...(post ? [`/writing/${post}/index.html`] : []),
        '/projects/index.html',
        '/resume/index.html',
      ],
      numberOfRuns: 3,
      settings: { chromeFlags: '--no-sandbox --headless=new' },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.98 }],
        'categories:accessibility': ['error', { minScore: 0.98 }],
        'categories:best-practices': ['error', { minScore: 0.98 }],
        'categories:seo': ['error', { minScore: 0.98 }],
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
};
