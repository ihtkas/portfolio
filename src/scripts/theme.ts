type Theme = 'light' | 'dark';

const root = document.documentElement;

function effective(): Theme {
  // Dark unless the visitor chose light with the toggle; the system setting is not used.
  return root.dataset['theme'] === 'light' ? 'light' : 'dark';
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
