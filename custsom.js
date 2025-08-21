<link rel="stylesheet" href="https://use.typekit.net/tri2vlr.css">

<script>
(function (Drupal) {
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
          // Prefer image inside the official thumbnail field, supporting <picture>
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
      });
    }
  };
})(Drupal);
</script>
