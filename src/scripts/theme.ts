type Theme = 'light' | 'dark';

const root = document.documentElement;

function effective(): Theme {
  const set = root.dataset['theme'];
  if (set === 'light' || set === 'dark') return set;
  return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function render(button: HTMLElement): void {
  const next: Theme = effective() === 'light' ? 'dark' : 'light';
  button.setAttribute('aria-label', `Switch to ${next} theme`);
}

for (const button of document.querySelectorAll<HTMLElement>('[data-theme-toggle]')) {
  render(button);
  button.addEventListener('click', () => {
    const next: Theme = effective() === 'light' ? 'dark' : 'light';
    root.dataset['theme'] = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      // storage unavailable: the choice lasts for this page only
    }
    render(button);
  });
}
