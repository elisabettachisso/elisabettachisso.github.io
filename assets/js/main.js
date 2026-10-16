(function () {
  var root = document.documentElement;
  var buttons = document.querySelectorAll('[data-set-lang]');
  var post = document.querySelector('[data-translation]');

  function apply(lang) {
    root.setAttribute('data-lang', lang);
    root.lang = lang;
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-set-lang') === lang));
    });
  }

  apply(root.getAttribute('data-lang') || 'it');

  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      var lang = b.getAttribute('data-set-lang');
      try { localStorage.setItem('lang', lang); } catch (e) {}
      // On an article, switch to its translation if one exists.
      if (root.hasAttribute('data-force-lang') && lang !== root.getAttribute('data-force-lang')) {
        if (post) { window.location.href = post.getAttribute('data-translation'); return; }
      }
      apply(lang);
    });
  });
})();
