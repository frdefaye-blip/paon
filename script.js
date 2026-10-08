document.querySelectorAll('[data-top]').forEach(button => {
  button.addEventListener('click', () => {
    window.scrollTo({top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
    document.querySelector('h1').focus({preventScroll: true});
  });
});
