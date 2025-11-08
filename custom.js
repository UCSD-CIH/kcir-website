<link rel="stylesheet" href="https://use.typekit.net/tri2vlr.css">

<script>
(function (Drupal, once) {
  var pressMediaListingPath = '/research/media';
  var pressMediaTypeLabelOverrides = {
    'article': '50',
    'broadcast': '53',
    'video': '49'
  };

  function buildPressTypeFilterUrl(termId) {
    var encodedId = encodeURIComponent(termId);
    return pressMediaListingPath +
      '?field_press_type_target_id%5B' + encodedId + '%5D=' + encodedId +
      '&keys=';
  }

  function removeNoopener(link) {
    var relValue = link.getAttribute('rel');
    if (!relValue) return;
    var filtered = relValue
      .split(/\s+/)
      .filter(function (token) {
        return token.toLowerCase() !== 'noopener' && token !== '';
      });
    if (filtered.length) {
      link.setAttribute('rel', filtered.join(' '));
    } else {
      link.removeAttribute('rel');
    }
  }

  function rewritePressMediaTypeLink(link) {
    if (!link) return false;
    var href = link.getAttribute('href') || '';
    var match = href.match(/\/taxonomy\/term\/(\d+)(?:[/?#]|$)/);
    if (!match || !match[1]) return false;

    var termId = match[1];
    var labelKey = (link.textContent || '').trim().toLowerCase();
    var overrideId = pressMediaTypeLabelOverrides[labelKey];
    var targetId = overrideId || termId;

    link.setAttribute('href', buildPressTypeFilterUrl(targetId));
    link.removeAttribute('target');
    removeNoopener(link);
    return true;
  }

  // Syncs each Press & Media card's title and thumbnail with the external link field.
  Drupal.behaviors.pressMediaCardLinker = {
    attach: function (context) {
      context.querySelectorAll('.press-media.press-media-card:not([data-pm-linked])').forEach(function (card) {
        card.setAttribute('data-pm-linked', '1');

        // 1) Get external URL
        var linkFieldA = card.querySelector('.field--name-field-press-link a');
        if (!linkFieldA || !linkFieldA.href) return;
        var url = linkFieldA.href;

        // 2) Hide original External Link field immediately (no flash)
        var linkField = card.querySelector('.field--name-field-press-link');
        if (linkField) linkField.style.display = 'none';

        // 3) TITLE → retarget or wrap
        var titleA = card.querySelector('h2 a');
        if (titleA) {
          titleA.href = url;
          titleA.target = '_blank';
          titleA.rel = 'noopener noreferrer';
        } else {
          var h2 = card.querySelector('h2');
          if (h2) {
            var a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = h2.textContent.trim();
            h2.textContent = '';
            h2.appendChild(a);
          }
        }

        // 4) THUMBNAIL → wrap the image or retarget existing link
        var thumbGroup = card.querySelector('.group--press-media-thumbnail');
        if (thumbGroup) {
          var img = thumbGroup.querySelector('.field--name-field-press-thumbnail img, .field--name-field-press-thumbnail picture img') 
                    || thumbGroup.querySelector('img, picture img');
          if (img) {
            var existing = img.closest('a');
            if (existing) {
              existing.href = url;
              existing.target = '_blank';
              existing.rel = 'noopener noreferrer';
            } else {
              var wrap = document.createElement('a');
              wrap.href = url;
              wrap.target = '_blank';
              wrap.rel = 'noopener noreferrer';
              wrap.className = 'pm-card-thumb-link';
              img.parentNode.insertBefore(wrap, img);
              wrap.appendChild(img);
            }
          }
        }

        card.querySelectorAll('.field--name-field-press-type a[href*="/taxonomy/term/"]').forEach(function (link) {
          rewritePressMediaTypeLink(link);
        });
      });
    }
  };

  // Routes Press & Media Type tag links back to the filtered listing view.
  Drupal.behaviors.pressTypeTagFilterLinks = {
    attach: function (context) {
      once('pressTypeTagFilterLinks', '.field--name-field-press-type a[href*="/taxonomy/term/"]', context)
        .forEach(function (link) {
          rewritePressMediaTypeLink(link);
        });
    }
  };

  // Keeps exposed filter accordions collapsed by default on Press & Media view.
  Drupal.behaviors.pressMediaFilterUI = {
    attach: function (context) {
      once('pressMediaFilterUI', '.view-press-media .view-filters', context).forEach(function (filters) {
        var detailsList = filters.querySelectorAll('details');
        detailsList.forEach(function (details) {
          details.removeAttribute('open');
        });

        var params = new URLSearchParams(window.location.search);
        var hasPressTypeParam = false;
        params.forEach(function (_, key) {
          if (key.indexOf('field_press_type_target_id') === 0) {
            hasPressTypeParam = true;
          }
        });

        if (hasPressTypeParam) {
          var typeInput = filters.querySelector('input[name*="field_press_type_target_id"]');
          if (typeInput) {
            var typeDetails = typeInput.closest('details');
            if (typeDetails) typeDetails.setAttribute('open', 'open');
          }
        }
      });
    }
  };

  function isExternalUrl(href) {
    if (!href) return false;
    try {
      var url = new URL(href, window.location.origin);
      return url.origin !== window.location.origin;
    } catch (e) {
      return false;
    }
  }

  function enforceNavLink(link) {
    if (!link) return;

    var href = link.getAttribute('href') || '';
    if (!isExternalUrl(href)) return;

    if (link.getAttribute('target') !== '_self') {
      link.setAttribute('target', '_self');
    }
    removeNoopener(link);
  }

  // Forces main-nav external links to open in the current tab and strips noopener.
  Drupal.behaviors.extLinkOverride = {
    attach: function (context) {
      once('extLinkOverrideNav', '#block-dxpr-theme-main-menu', context).forEach(function (nav) {
        function processLink(link) {
          enforceNavLink(link);
        }

        nav.querySelectorAll('a[href]').forEach(processLink);

        var observer = new MutationObserver(function (mutations) {
          mutations.forEach(function (mutation) {
            if (mutation.type === 'childList') {
              mutation.addedNodes.forEach(function (node) {
                if (!node || node.nodeType !== 1) return;
                if (node.matches && node.matches('a[href]')) {
                  processLink(node);
                }
                node.querySelectorAll && node.querySelectorAll('a[href]').forEach(processLink);
              });
            } else if (mutation.type === 'attributes') {
              var target = mutation.target;
              if (!target || target.nodeType !== 1 || !target.matches('a[href]')) return;
              processLink(target);
            }
          });
        });

        observer.observe(nav, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: ['target', 'href']
        });
      });
    }
  };

})(Drupal, once);
</script>
