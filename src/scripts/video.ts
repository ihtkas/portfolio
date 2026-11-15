// Click-to-play facade: swap the poster link for a privacy-friendly YouTube embed.
document.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a.vid[data-youtube]');
  const id = link?.dataset['youtube'];
  if (!link || !id) return;
  event.preventDefault();
  const frame = document.createElement('iframe');
  frame.className = 'vid-frame';
  frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1`;
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.allow = 'autoplay; encrypted-media';
  frame.allowFullscreen = true;
  frame.title = link.dataset['title'] ?? 'Video';
  link.replaceWith(frame);
  frame.focus();
});
