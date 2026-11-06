(() => {
  const toggle = document.querySelector('.navigation-toggle');
  const shell = document.querySelector('.app-shell');
  document.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    document.getElementById('main-content').focus();
  });
  const close = () => {
    toggle.setAttribute('aria-expanded', 'false');
    shell.classList.remove('navigation-open');
  };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    shell.classList.toggle('navigation-open', open);
    if (open) {
      const link = document.querySelector('.sidebar .nav-item[aria-current]') || document.querySelector('.sidebar .nav-item[data-route]');
      link?.focus();
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && shell.classList.contains('navigation-open')) {
      close();
      toggle.focus();
    }
  });
  matchMedia('(min-width: 761px)').addEventListener('change', close);

  const assistantLauncher = document.querySelector('.assistant-launcher');
  const assistantDialog = document.getElementById('assistant-dialog');
  assistantLauncher.addEventListener('click', () => {
    if (assistantDialog.open) return;
    close();
    assistantDialog.showModal();
    assistantLauncher.setAttribute('aria-expanded', 'true');
    document.body.classList.add('assistant-open');
  });
  assistantDialog.querySelector('.assistant-close').addEventListener('click', () => assistantDialog.close());
  assistantDialog.addEventListener('close', () => {
    document.body.classList.remove('assistant-open');
    assistantLauncher.setAttribute('aria-expanded', 'false');
    // The launcher is hidden with the mobile menu; return to its visible toggle.
    const focusTarget = matchMedia('(min-width: 761px)').matches ? assistantLauncher : toggle;
    focusTarget.focus({ preventScroll: true });
  });
})();
