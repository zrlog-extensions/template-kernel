/* Kernel: progressive enhancements for navigation and long-form reading. */
(function () {
  'use strict';

  function start() {
    if (document.documentElement.classList.contains('kernel-initialized')) return;
    document.documentElement.classList.add('kernel-initialized');

    var body = document.body;
    var article = document.getElementById('article-content');
    var readingContainer = document.querySelector('[data-terminal-scroll]');
    var terminalInput = document.querySelector('[data-terminal-input]');
    var composingInputs = new WeakSet();
    var selectedEntry = null;
    var navigation = document.getElementById('site-navigation');
    var menuToggles = Array.from(document.querySelectorAll('[data-menu-toggle]'));
    var palette = document.getElementById('command-palette');
    var commandInput = document.getElementById('command-input');
    var commandOpeners = Array.from(document.querySelectorAll('[data-command-open]'));
    var canOpenPalette = palette && commandInput && typeof palette.showModal === 'function';
    var focusBeforePalette = null;
    var menuIsOpen = false;
    var tocEntries = [];
    var progressBars = Array.from(document.querySelectorAll('[data-reading-progress]'));
    var framePending = false;
    var uniqueIdNumber = 0;
    var themes = ['black', 'amber', 'dracula', 'nord'];
    var pageData = null;
    try {
      var dataElement = document.getElementById('kernel-data');
      var parsedData = dataElement && JSON.parse(dataElement.textContent);
      if (parsedData && parsedData.schemaVersion === 1) pageData = parsedData;
    } catch (error) { /* Native navigation remains available with missing or invalid data. */ }
    function dataLinks(kind) {
      if (!pageData || !Array.isArray(pageData[kind])) return null;
      return pageData[kind].filter(function (item) {
        return item && typeof item.title === 'string' && navigationUrl(item.url);
      }).map(function (item) {
        return { title: item.title, href: navigationUrl(item.url), index: typeof item.index === 'string' ? item.index : undefined };
      });
    }
    var sessionKey = 'kernel-session-v1';
    var session = {};
    try { session = JSON.parse(sessionStorage.getItem(sessionKey) || '{}') || {}; } catch (error) { /* Optional storage. */ }
    if (typeof session !== 'object' || Array.isArray(session)) session = {};
    var pageKey = location.pathname + location.search;
    var submitted = false;
    var navigationFocus = null;
    function saveSession() {
      try { sessionStorage.setItem(sessionKey, JSON.stringify(session)); } catch (error) { /* Navigation still works. */ }
    }
    function rememberList() {
      if (!article && currentEntries().length) {
        session.returnPath = pageKey;
        saveSession();
      }
    }
    function returnToList() {
      var target = navigationUrl(session.returnPath || body.dataset.homeUrl || '/');
      if (target && new URL(target).origin === location.origin) {
        navigationFocus = 'workspace';
        window.location.assign(target);
      }
    }
    document.addEventListener('click', function (event) {
      if (entryForTarget(event.target)) rememberList();
    });
    document.addEventListener('submit', function () { submitted = true; });
    window.addEventListener('pagehide', function () {
      var pages = session.pages && typeof session.pages === 'object' ? session.pages : {};
      pages[pageKey] = {
        selected: selectedEntry && selectedEntry.querySelector('[data-entry-link]').getAttribute('href'),
        scroll: readingContainer ? readingContainer.scrollTop : 0,
        mode: navigationFocus || (document.activeElement === terminalInput || document.activeElement === commandInput ? 'input' : 'workspace'),
        draft: !submitted && terminalInput ? terminalInput.value : ''
      };
      session.pages = Object.fromEntries(Object.entries(pages).slice(-30));
      session.pending = { mode: pages[pageKey].mode, time: Date.now() };
      saveSession();
    });
    document.addEventListener('compositionstart', function (event) { composingInputs.add(event.target); });
    document.addEventListener('compositionend', function (event) { composingInputs.delete(event.target); });

    function applyTheme(theme, persist) {
      if (!themes.includes(theme)) return false;
      document.documentElement.dataset.theme = theme;
      document.querySelectorAll('[data-theme-select]').forEach(function (select) {
        select.value = theme;
      });
      document.querySelectorAll('[data-theme-value]').forEach(function (button) {
        button.setAttribute('aria-pressed', String(button.dataset.themeValue === theme));
      });
      if (persist) {
        try {
          document.cookie = 'kernel-theme=' + theme + '; Path=/; Max-Age=31536000; SameSite=Lax' +
            (window.location.protocol === 'https:' ? '; Secure' : '');
        } catch (error) { /* The selected palette still works when cookies are unavailable. */ }
      }
      return true;
    }

    applyTheme(themes.includes(document.documentElement.dataset.theme)
      ? document.documentElement.dataset.theme : 'black', false);
    document.querySelectorAll('[data-theme-select]').forEach(function (select) {
      select.addEventListener('change', function () {
        if (!applyTheme(select.value, true)) select.value = document.documentElement.dataset.theme;
      });
    });

    function focusElement(element) {
      if (element && element.isConnected && typeof element.focus === 'function') {
        element.focus({ preventScroll: true });
      }
    }

    function setMenuOpen(open, restoreFocus) {
      if (!navigation) return;
      menuIsOpen = open;
      navigation.classList.toggle('is-open', open);
      menuToggles.forEach(function (toggle) {
        toggle.setAttribute('aria-expanded', String(open));
      });
      if (!open && restoreFocus) focusElement(menuToggles[0]);
    }

    if (navigation) {
      menuToggles.forEach(function (toggle) {
        toggle.setAttribute('aria-controls', navigation.id);
        toggle.addEventListener('click', function () {
          setMenuOpen(!menuIsOpen, false);
        });
      });
      navigation.addEventListener('click', function (event) {
        if (event.target instanceof Element && event.target.closest('a[href]')) {
          setMenuOpen(false, false);
        }
      });
      setMenuOpen(false, false);
    }

    function isEditing(target) {
      return target instanceof Element && !!target.closest(
        'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]'
      );
    }

    function entryForTarget(target) {
      return target instanceof Element && target.closest('a[data-entry-link]')
        ? target.closest('.entry[data-entry-index]') : null;
    }

    function markSelectedEntry(entry) {
      document.querySelectorAll('.entry.is-keyboard-selected').forEach(function (item) {
        item.classList.toggle('is-keyboard-selected', item === entry);
      });
      selectedEntry = entry;
      if (entry) entry.classList.add('is-keyboard-selected');
    }

    function focusWorkspace() {
      if (selectedEntry && selectedEntry.isConnected) {
        focusElement(selectedEntry.querySelector('a[data-entry-link]'));
        selectedEntry.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      } else {
        focusElement(readingContainer || document.getElementById('main-content'));
      }
    }

    document.addEventListener('focusin', function (event) {
      var entry = entryForTarget(event.target);
      if (entry) markSelectedEntry(entry);
    });

    function filterCommandLinks() {
      var query = commandInput.value.trim().toLocaleLowerCase();
      palette.querySelectorAll('[data-command-link]').forEach(function (link) {
        var searchableText = (link.textContent + ' ' + (link.dataset.commandKeywords || '')).toLocaleLowerCase();
        link.hidden = query !== '' && !searchableText.includes(query);
      });
    }

    function openPalette(opener) {
      if (!canOpenPalette) return;
      if (!palette.open) {
        focusBeforePalette = opener || document.activeElement;
        palette.showModal();
      }
      filterCommandLinks();
      focusElement(commandInput);
      commandInput.select();
    }

    function closePalette() {
      if (canOpenPalette && palette.open) palette.close();
    }

    if (canOpenPalette) {
      document.documentElement.classList.add('command-ready');
      commandOpeners.forEach(function (opener) {
        opener.setAttribute('aria-controls', palette.id);
        opener.setAttribute('aria-haspopup', 'dialog');
        opener.addEventListener('click', function (event) {
          event.preventDefault();
          openPalette(opener);
        });
      });
      palette.querySelectorAll('[data-command-close]').forEach(function (closer) {
        closer.addEventListener('click', function (event) {
          event.preventDefault();
          closePalette();
        });
      });
      commandInput.addEventListener('input', filterCommandLinks);
      palette.addEventListener('close', function () {
        focusElement(focusBeforePalette);
        focusBeforePalette = null;
      });
      // Native dialog cancellation handles Escape and its focus trap.
      palette.addEventListener('click', function (event) {
        if (event.target !== palette) return;
        var bounds = palette.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom) {
          closePalette();
        }
      });
      // The search form deliberately retains its native POST submission.
    } else {
      commandOpeners.forEach(function (opener) { opener.hidden = true; });
    }

    document.addEventListener('keydown', function (event) {
      if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || composingInputs.has(event.target)) return;
      if (document.querySelector('#kernel-matrix[open]')) return;
      var key = event.key.toLowerCase();
      var inTerminalInput = event.target instanceof Element && event.target.matches('[data-terminal-input]');
      if (canOpenPalette && !event.altKey && key === 'k' &&
          (event.metaKey || (event.ctrlKey && !inTerminalInput))) {
        event.preventDefault();
        openPalette(document.activeElement);
        return;
      }
      if (event.key === 'Escape' && menuIsOpen && !(palette && palette.open)) {
        setMenuOpen(false, true);
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || isEditing(event.target) ||
          document.querySelector('dialog[open]')) return;
      var entryTarget = entryForTarget(event.target);
      var interactive = event.target instanceof Element && event.target.closest(
        'a[href], button, input, textarea, select, summary, [role="button"], [role="link"], [role="combobox"]'
      );
      if (interactive && !entryTarget) return;
      var inWorkspace = event.target === body || event.target === document.documentElement ||
        (readingContainer && readingContainer.contains(event.target)) ||
        (article && article.contains(event.target));
      if (!inWorkspace) return;
      if (canOpenPalette && event.key === '/') {
        event.preventDefault();
        openPalette(document.activeElement);
        return;
      }
      if (terminalInput && event.key === ':') {
        event.preventDefault();
        focusElement(terminalInput);
        terminalInput.select();
        return;
      }
      if (article && key === 'q' && !event.shiftKey) {
        event.preventDefault();
        returnToList();
        return;
      }
      var down = !event.shiftKey && (event.key === 'ArrowDown' || key === 'j');
      var up = !event.shiftKey && (event.key === 'ArrowUp' || key === 'k');
      if (!article && (down || up)) {
        var entries = Array.from(document.querySelectorAll('.entry[data-entry-index]')).filter(function (entry) {
          return entry.querySelector('a[data-entry-link]') && entry.getClientRects().length;
        });
        if (entries.length) {
          event.preventDefault();
          var currentIndex = entries.indexOf(entryTarget || selectedEntry);
          var nextIndex = currentIndex < 0 ? (down ? 0 : entries.length - 1)
            : Math.max(0, Math.min(entries.length - 1, currentIndex + (down ? 1 : -1)));
          markSelectedEntry(entries[nextIndex]);
          focusWorkspace();
          return;
        }
      }
      if (article && !entryTarget) {
        var scrolling = readingContainer || window;
        var viewport = readingContainer ? readingContainer.clientHeight : window.innerHeight;
        var distance = down ? 48 : up ? -48 : 0;
        if (event.key === ' ' || event.key === 'PageDown' || event.key === 'PageUp') {
          distance = Math.max(48, viewport * 0.85) *
            (event.key === 'PageUp' || (event.key === ' ' && event.shiftKey) ? -1 : 1);
        }
        if (distance) {
          event.preventDefault();
          scrolling.scrollBy({ top: distance, behavior: 'instant' });
          return;
        }
        if (!event.shiftKey && (event.key === 'Home' || event.key === 'End')) {
          event.preventDefault();
          scrolling.scrollTo({ top: event.key === 'Home' ? 0 :
            (readingContainer ? readingContainer.scrollHeight : document.documentElement.scrollHeight), behavior: 'instant' });
          return;
        }
      }
      if (terminalInput && Array.from(event.key).length === 1 && event.key.trim() &&
          !['/', ':'].includes(event.key) && !(down || up)) {
        event.preventDefault();
        terminalInput.value = event.key;
        terminalInput.dispatchEvent(new Event('input', { bubbles: true }));
        focusElement(terminalInput);
        terminalInput.setSelectionRange(1, terminalInput.value.length);
      }
    });

    // This is a small navigation vocabulary, never a shell or JavaScript evaluator.
    // Unrecognized input remains an ordinary blog search, including without JS.
    function navigationUrl(value) {
      if (typeof value !== 'string' || !value.trim()) return null;
      try {
        var url = new URL(value, document.baseURI);
        return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
      } catch (error) {
        return null;
      }
    }

    function currentEntries() {
      var dataEntries = dataLinks('articles');
      if (dataEntries) return dataEntries;
      var entries = [];
      document.querySelectorAll('.entry[data-entry-index]').forEach(function (entry) {
        var link = entry.querySelector('a[data-entry-link]');
        if (!link) return;
        var href = navigationUrl(link.getAttribute('href'));
        if (!href) return;
        entries.push({
          index: entry.dataset.entryIndex,
          title: link.textContent.trim().replace(/\s+/g, ' '),
          href: href
        });
      });
      return entries;
    }

    function normalizedEntryIndex(value) {
      return /^\d+$/.test(value) ? value.replace(/^0+(?=\d)/, '') : value;
    }

    function terminalLinks(kind) {
      var linksFromData = dataLinks(kind);
      if (linksFromData) return linksFromData;
      var links = [];
      document.querySelectorAll('a[data-terminal-kind="' + kind + '"]').forEach(function (link) {
        var href = navigationUrl(link.getAttribute('href'));
        if (href) links.push({ title: link.textContent.trim().replace(/\s+/g, ' '), href: href });
      });
      return links;
    }

    function normalizedCategory(value) {
      return value.normalize('NFKC').trim().toLocaleLowerCase();
    }

    function enterMatrix() {
      if (document.getElementById('kernel-matrix')) return;
      var previousFocus = document.activeElement;
      var dialog = document.createElement('dialog');
      if (typeof dialog.showModal !== 'function') return;
      dialog.id = 'kernel-matrix';
      dialog.className = 'matrix-room';
      dialog.setAttribute('aria-labelledby', 'matrix-title');
      var canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      var message = document.createElement('div');
      message.className = 'matrix-message';
      var eyebrow = document.createElement('p');
      eyebrow.className = 'matrix-eyebrow';
      eyebrow.textContent = 'TRANSMISSION FOUND';
      var title = document.createElement('h2');
      title.id = 'matrix-title';
      title.textContent = 'There is no spoon.';
      var rabbit = document.createElement('pre');
      rabbit.className = 'matrix-rabbit';
      rabbit.setAttribute('aria-hidden', 'true');
      rabbit.textContent = ' (\\_/)' + '\n' + ' (•_•)' + '\n' + ' / >_';
      var note = document.createElement('p');
      note.textContent = document.documentElement.lang.toLowerCase().startsWith('zh')
        ? '代码之外，还有你写下的世界。' : 'Beyond the code, there is the world you write.';
      var close = document.createElement('button');
      close.type = 'button';
      close.className = 'matrix-exit';
      close.textContent = '[ esc ]  return to reality';
      close.addEventListener('click', function () { dialog.close(); });
      message.append(eyebrow, rabbit, title, note, close);
      dialog.append(canvas, message);
      body.appendChild(dialog);
      dialog.showModal();
      focusElement(close);

      var context = canvas.getContext('2d');
      var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      var frame = 0;
      var lastTime = 0;
      var drops = [];
      var width = 0;
      var height = 0;
      var glyphs = '01{}[]<>/ZRLOGアイウエオカキクケコ';
      function draw() {
        if (!context) return;
        context.fillStyle = 'rgba(0, 7, 3, .10)';
        context.fillRect(0, 0, width, height);
        context.font = '14px monospace';
        drops.forEach(function (y, index) {
          context.fillStyle = index % 7 === 0 ? '#96edb0' : '#178842';
          context.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], index * 18, y);
          drops[index] = y > height + 60 ? -Math.random() * height : y + 12;
        });
      }
      function resize() {
        width = dialog.clientWidth;
        height = dialog.clientHeight;
        var ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        if (!context) return;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.fillStyle = '#000703';
        context.fillRect(0, 0, width, height);
        drops = Array.from({ length: Math.ceil(width / 18) }, function () { return Math.random() * height; });
        for (var i = 0; i < 16; i += 1) draw();
      }
      function tick(time) {
        if (!dialog.open || reducedMotion.matches || document.hidden) return;
        if (time - lastTime >= 65) { draw(); lastTime = time; }
        frame = window.requestAnimationFrame(tick);
      }
      function resume() {
        window.cancelAnimationFrame(frame);
        if (!reducedMotion.matches && !document.hidden) frame = window.requestAnimationFrame(tick);
      }
      dialog.addEventListener('close', function () {
        window.cancelAnimationFrame(frame);
        window.removeEventListener('resize', resize);
        document.removeEventListener('visibilitychange', resume);
        reducedMotion.removeEventListener('change', resume);
        dialog.remove();
        focusElement(previousFocus);
      }, { once: true });
      window.addEventListener('resize', resize);
      document.addEventListener('visibilitychange', resume);
      reducedMotion.addEventListener('change', resume);
      resize();
      resume();
    }

    document.querySelectorAll('form[data-terminal-form]').forEach(function (form) {
      var input = form.querySelector('[data-terminal-input]');
      var output = document.querySelector('[data-terminal-output]');
      if (!input || !output) return;
      if (input.dataset.commandPlaceholder) input.placeholder = input.dataset.commandPlaceholder;
      if (input.dataset.commandLabel) input.setAttribute('aria-label', input.dataset.commandLabel);
      var helpText = body.dataset.terminalHelpLabel ||
        'help / ?  查看帮助\nls  列出当前页文章\ncat 01  打开编号对应的文章\ncd / · cd ~ · cd .. · home  返回首页\nsearch / grep <关键词>  搜索文章\nclear  清空输出\n直接输入关键词也可以搜索。';
      var notFoundText = body.dataset.terminalNotFound || '当前页没有这篇文章';
      var emptyText = body.dataset.terminalEmpty || '当前页没有文章。';
      var boundaryText = body.dataset.terminalBoundary || '已到达分页边界。';
      var themeChangedText = body.dataset.themeChanged || '配色已切换为';
      var history = Array.isArray(session.history) ? session.history.filter(function (value) { return typeof value === 'string'; }).slice(-100) : [];
      var historyIndex = history.length;
      var historyDraft = '';
      var composing = false;
      var completionItems = [];
      var completionIndex = -1;
      var completionBox = document.createElement('div');
      completionBox.className = 'terminal-completions';
      completionBox.id = 'terminal-completions';
      completionBox.setAttribute('role', 'listbox');
      completionBox.hidden = true;
      form.appendChild(completionBox);
      input.setAttribute('role', 'combobox');
      input.setAttribute('aria-autocomplete', 'list');
      input.setAttribute('aria-controls', completionBox.id);
      input.setAttribute('aria-expanded', 'false');
      input.setAttribute('autocomplete', 'off');

      function closeCompletions() {
        completionBox.hidden = true;
        completionItems = [];
        completionIndex = -1;
        input.setAttribute('aria-expanded', 'false');
        input.removeAttribute('aria-activedescendant');
      }

      function cancelInput() {
        input.value = '';
        historyIndex = history.length;
        historyDraft = '';
        closeCompletions();
        focusWorkspace();
      }

      function acceptCompletion(index) {
        var item = completionItems[index];
        if (!item) return;
        input.value = item.value;
        submitted = false;
        historyIndex = history.length;
        historyDraft = input.value;
        closeCompletions();
        focusElement(input);
        input.setSelectionRange(input.value.length, input.value.length);
      }

      function selectCompletion(index) {
        completionIndex = (index + completionItems.length) % completionItems.length;
        Array.from(completionBox.children).forEach(function (option, i) {
          option.setAttribute('aria-selected', String(i === completionIndex));
          if (i === completionIndex) {
            input.setAttribute('aria-activedescendant', option.id);
            option.scrollIntoView({ block: 'nearest', behavior: 'instant' });
          }
        });
      }

      function completeInput() {
        closeCompletions();
        if (composing || !input.value.trim() || input.selectionStart !== input.value.length ||
            input.selectionEnd !== input.value.length) return false;
        var value = input.value.trimStart();
        var match = /^(\S+)\s+(.*)$/.exec(value);
        var candidates;
        var query;
        if (!match) {
          query = value.toLocaleLowerCase();
          candidates = ['help', 'ls', 'open', 'cat', 'less', 'cd', 'home', 'q', 'next', 'prev',
            'tags', 'categories', 'archive', 'links', 'search', 'grep', 'clear', 'theme'].map(function (command) {
            return { value: command + (['cat', 'less', 'cd', 'search', 'grep', 'theme', 'tags', 'categories', 'archive', 'links'].includes(command) ? ' ' : ''), label: command, search: command };
          });
        } else {
          var command = match[1].toLowerCase();
          query = match[2].toLocaleLowerCase();
          var argumentsList = command === 'theme' ? themes.map(function (theme) { return { value: theme, label: theme }; }) :
            command === 'cat' || command === 'less' ? [{ value: 'README.md', label: 'README.md' }].concat(currentEntries().map(function (entry) {
              var filename = new URL(entry.href).pathname.split('/').pop();
              return { value: entry.index, label: entry.index + '  ' + entry.title, search: entry.index + ' ' + entry.title + ' ' + filename };
            })) : command === 'cd' ? ['/', '~', '..'].concat(terminalLinks('categories').map(function (category) { return category.title; })).map(function (name) { return { value: name, label: name }; }) :
            ['tags', 'categories', 'archive', 'archives', 'links'].includes(command) ? terminalLinks(command === 'archive' ? 'archives' : command).map(function (item) { return { value: item.title, label: item.title }; }) : [];
          candidates = argumentsList.map(function (item) {
            return { value: command + ' ' + item.value, label: command + ' ' + item.label, search: item.search || item.label };
          });
        }
        completionItems = candidates.filter(function (candidate) {
          return match ? candidate.search.toLocaleLowerCase().includes(query) : candidate.search.startsWith(query);
        });
        if (!completionItems.length) return false;
        completionBox.replaceChildren();
        completionItems.forEach(function (candidate, index) {
          var option = document.createElement('div');
          option.className = 'terminal-completion-option';
          option.id = 'terminal-completion-' + index;
          option.setAttribute('role', 'option');
          option.setAttribute('aria-selected', 'false');
          option.dataset.completionValue = candidate.value;
          option.textContent = candidate.label;
          option.addEventListener('mousedown', function (event) { event.preventDefault(); });
          option.addEventListener('click', function () { acceptCompletion(index); });
          completionBox.appendChild(option);
        });
        completionBox.hidden = false;
        input.setAttribute('aria-expanded', 'true');
        return true;
      }

      function revealOutput() {
        output.hidden = false;
        // Position after the submit handler restores input focus. A terminal response
        // is immediate; explicit instant behavior also overrides smooth-scroll CSS.
        window.requestAnimationFrame(function () {
          if (readingContainer) {
            readingContainer.scrollTo({ top: readingContainer.scrollHeight, behavior: 'instant' });
          } else {
            output.scrollIntoView({ block: 'end', behavior: 'instant' });
          }
        });
      }

      function showText(text) {
        var paragraph = document.createElement('p');
        paragraph.className = 'terminal-message';
        paragraph.textContent = text;
        output.replaceChildren(paragraph);
        revealOutput();
      }

      function showLinks(links) {
        if (!links.length) {
          showText(emptyText);
          return;
        }
        var list = document.createElement('ul');
        list.className = 'terminal-file-list';
        links.forEach(function (entry) {
          var item = document.createElement('li');
          var link = document.createElement('a');
          link.href = entry.href;
          link.textContent = (entry.index ? entry.index + '  ' : '') + entry.title;
          item.appendChild(link);
          list.appendChild(item);
        });
        output.replaceChildren(list);
        revealOutput();
      }

      function confirmTheme(theme) {
        if (!applyTheme(theme, true)) return;
        showText(themeChangedText.includes('{theme}')
          ? themeChangedText.replaceAll('{theme}', theme) : themeChangedText + ' ' + theme);
        focusElement(input);
      }

      function showThemes() {
        var options = document.createElement('div');
        options.className = 'terminal-theme-options';
        themes.forEach(function (theme) {
          var button = document.createElement('button');
          button.type = 'button';
          button.className = 'terminal-theme-option';
          button.dataset.themeValue = theme;
          button.textContent = theme;
          button.setAttribute('aria-pressed', String(document.documentElement.dataset.theme === theme));
          button.addEventListener('click', function () { confirmTheme(theme); });
          options.appendChild(button);
        });
        output.replaceChildren(options);
        revealOutput();
      }

      function showNotFound(index) {
        showText(notFoundText.includes('{index}')
          ? notFoundText.replaceAll('{index}', index)
          : notFoundText + (index ? ' ' + index : ''));
      }

      function goHome() {
        var homeUrl = navigationUrl(body.dataset.homeUrl || '/');
        if (homeUrl) window.location.assign(homeUrl);
        else showNotFound('home');
      }

      function readmeText(element) {
        if (!element) return '';
        var copy = element.cloneNode(true);
        copy.querySelectorAll('[aria-hidden="true"]').forEach(function (decoration) {
          decoration.remove();
        });
        return copy.textContent.trim().replace(/\s+/g, ' ');
      }

      input.addEventListener('compositionstart', function () { composing = true; closeCompletions(); });
      input.addEventListener('compositionend', function () { composing = false; completeInput(); });
      input.addEventListener('blur', closeCompletions);
      input.addEventListener('click', completeInput);
      input.addEventListener('input', function () {
        submitted = false;
        completeInput();
        historyIndex = history.length;
        historyDraft = input.value;
      });
      input.addEventListener('keydown', function (event) {
        if (composing || event.isComposing || event.keyCode === 229 || event.defaultPrevented) return;
        if (event.key === 'Escape' && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          if (!completionBox.hidden) closeCompletions();
          else cancelInput();
          return;
        }
        if (event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
          var editingKey = event.key.toLowerCase();
          if (editingKey === 'u' || editingKey === 'k') {
            event.preventDefault();
            input.value = editingKey === 'u' ? '' : input.value.slice(0, input.selectionStart);
            input.setSelectionRange(input.value.length, input.value.length);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            return;
          }
          if (editingKey === 'c' && input.selectionStart === input.selectionEnd && !String(window.getSelection())) {
            event.preventDefault();
            cancelInput();
            return;
          }
        }
        if (event.key === 'Tab' && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey && input.value.trim()) {
          if (!completionBox.hidden || completeInput()) {
            event.preventDefault();
            acceptCompletion(completionIndex < 0 ? 0 : completionIndex);
          }
          return;
        }
        if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && !completionBox.hidden) {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            selectCompletion(completionIndex < 0 ? (event.key === 'ArrowDown' ? 0 : completionItems.length - 1) : completionIndex + (event.key === 'ArrowDown' ? 1 : -1));
            return;
          }
          if (event.key === 'Enter' && completionIndex >= 0) {
            event.preventDefault();
            acceptCompletion(completionIndex);
            return;
          }
          if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) closeCompletions();
        }
        if (composing || event.isComposing || event.keyCode === 229 || event.defaultPrevented ||
            event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
            !history.length || !['ArrowUp', 'ArrowDown'].includes(event.key)) return;
        if (event.key === 'ArrowDown' && historyIndex === history.length) return;
        event.preventDefault();
        if (event.key === 'ArrowUp') {
          if (historyIndex === history.length) historyDraft = input.value;
          historyIndex = Math.max(0, historyIndex - 1);
        } else {
          historyIndex = Math.min(history.length, historyIndex + 1);
        }
        input.value = historyIndex === history.length ? historyDraft : history[historyIndex];
        // Search inputs support selection ranges; place the caret after the recalled command.
        input.setSelectionRange(input.value.length, input.value.length);
      });

      form.addEventListener('submit', function (event) {
        if (composing) {
          event.preventDefault();
          return;
        }
        closeCompletions();
        var value = input.value.trim();
        if (!value) {
          event.preventDefault();
          focusElement(input);
          return;
        }
        if (value.toLowerCase() !== 'matrix') history.push(value);
        if (history.length > 100) history.shift();
        session.history = history;
        saveSession();
        historyIndex = history.length;
        historyDraft = '';
        var parts = /^(\S+)(?:\s+([\s\S]*))?$/.exec(value);
        var command = parts[1].toLowerCase();
        submitted = true;
        var argument = (parts[2] || '').trim();
        var navigationCommands = { tags: 'tags', categories: 'categories', archive: 'archives', archives: 'archives', links: 'links' };
        var isCurrentPageListing = command === 'ls' && (!argument ||
          argument.split(/\s+/).every(function (option) {
            return ['-l', '-t', '-lt', './posts/'].includes(option);
          }));

        if (command === 'search' || command === 'grep') {
          if (!argument) {
            event.preventDefault();
            focusElement(input);
            return;
          }
          // Let this very same submit event perform the form's native POST.
          input.value = argument;
          return;
        }

        if (command === 'matrix' && !argument) {
          event.preventDefault();
          enterMatrix();
          input.value = '';
          return;
        } else if ((command === 'help' || command === '?') && !argument) {
          event.preventDefault();
          showText(helpText);
        } else if (isCurrentPageListing) {
          event.preventDefault();
          showLinks(currentEntries());
        } else if (Object.prototype.hasOwnProperty.call(navigationCommands, command)) {
          event.preventDefault();
          var directoryLinks = terminalLinks(navigationCommands[command]);
          if (!argument) showLinks(directoryLinks);
          else {
            var directoryEntry = directoryLinks.find(function (item) { return normalizedCategory(item.title) === normalizedCategory(argument); });
            if (directoryEntry) window.location.assign(directoryEntry.href);
            else showNotFound(argument);
          }
        } else if ((command === 'next' || command === 'prev') && !argument) {
          event.preventDefault();
          var pageLink = document.querySelector('nav.pagination a[rel~="' + command + '"]') ||
            document.querySelector('nav a[rel~="' + command + '"]');
          var pageUrl = pageLink && navigationUrl(pageLink.getAttribute('href'));
          if (pageUrl) window.location.assign(pageUrl);
          else showText(boundaryText.replaceAll('{direction}', command));
        } else if (command === 'theme') {
          event.preventDefault();
          if (themes.includes(argument.toLowerCase())) confirmTheme(argument.toLowerCase());
          else showThemes();
        } else if (command === 'open' && !argument) {
          event.preventDefault();
          var selectedLink = selectedEntry && selectedEntry.isConnected && selectedEntry.querySelector('[data-entry-link]');
          var selectedUrl = selectedLink && navigationUrl(selectedLink.getAttribute('href'));
          if (selectedUrl) {
            rememberList();
            navigationFocus = 'workspace';
            window.location.assign(selectedUrl);
          } else {
            showText(document.documentElement.lang.toLowerCase().startsWith('zh')
              ? '请先用 ↑/↓ 或 j/k 选中文章，再输入 open。'
              : 'Select an article with ↑/↓ or j/k, then enter open.');
          }
        } else if (command === 'cat' || command === 'less') {
          event.preventDefault();
          if (argument === 'README.md') {
            var readmeTitle = document.getElementById('readme-title');
            if (readmeTitle) {
              var title = document.createElement('p');
              title.className = 'terminal-readme-title';
              title.textContent = readmeText(readmeTitle);
              var introduction = document.createElement('p');
              introduction.className = 'terminal-message';
              introduction.textContent = readmeText(document.querySelector('.intro-text'));
              output.replaceChildren(title, introduction);
              revealOutput();
            } else {
              goHome();
            }
          } else {
            var matchingEntry = currentEntries().find(function (entry) {
              return normalizedEntryIndex(entry.index) === normalizedEntryIndex(argument);
            });
            if (matchingEntry) {
              var entryNode = Array.from(document.querySelectorAll('.entry[data-entry-index]')).find(function (entry) {
                return entry.dataset.entryIndex === matchingEntry.index;
              });
              if (entryNode) markSelectedEntry(entryNode);
              rememberList();
              navigationFocus = 'workspace';
              window.location.assign(matchingEntry.href);
            }
            else showNotFound(argument);
          }
        } else if (command === 'q' && !argument) {
          event.preventDefault();
          returnToList();
        } else if ((command === 'home' && !argument) ||
                   (command === 'cd' && ['/', '~', '..'].includes(argument))) {
          event.preventDefault();
          goHome();
        } else if (command === 'cd') {
          event.preventDefault();
          var categories = terminalLinks('categories');
          var categoryName = normalizedCategory(argument);
          var matchingCategory = categories.find(function (category) {
            return normalizedCategory(category.title) === categoryName;
          }) || categories.find(function (category) {
            var lastSegment = new URL(category.href).pathname.split('/').filter(Boolean).pop() || '';
            try { lastSegment = decodeURIComponent(lastSegment); } catch (error) { /* Match the raw path if malformed. */ }
            return normalizedCategory(lastSegment) === categoryName;
          });
          if (matchingCategory) window.location.assign(matchingCategory.href);
          else showNotFound(argument);
        } else if (command === 'clear' && !argument) {
          event.preventDefault();
          output.replaceChildren();
          output.hidden = true;
          input.value = '';
        } else {
          // Bare text is a search term, not an unknown executable command.
          input.value = value;
          return;
        }
        focusElement(input);
        input.select();
      });
    });

    function unusedId(prefix) {
      var candidate = prefix;
      var suffix = 2;
      while (document.getElementById(candidate)) {
        candidate = prefix + '-' + suffix;
        suffix += 1;
      }
      return candidate;
    }

    function headingSlug(text, index) {
      var normalized = text.normalize('NFKC').toLocaleLowerCase().trim();
      normalized = normalized.replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '');
      return 'section-' + (normalized || String(index + 1));
    }

    var toc = document.querySelector('[data-toc]');
    var tocList = document.querySelector('[data-toc-list]');
    if (toc && tocList) {
      var fragment = document.createDocumentFragment();
      if (article) {
        article.querySelectorAll('h2, h3, h4').forEach(function (heading, index) {
          var label = heading.textContent.trim().replace(/\s+/g, ' ');
          if (!label) return;
          if (!heading.id) heading.id = unusedId(headingSlug(label, index));
          var item = document.createElement('li');
          item.className = 'toc-item toc-level-' + heading.tagName.substring(1);
          var link = document.createElement('a');
          link.className = 'toc-link';
          link.href = '#' + encodeURIComponent(heading.id);
          link.textContent = label;
          item.appendChild(link);
          fragment.appendChild(item);
          tocEntries.push({ heading: heading, link: link });
        });
      }
      tocList.replaceChildren(fragment);
      toc.hidden = tocEntries.length === 0;
    } else if (toc) {
      toc.hidden = true;
    }

    function fallbackCopy(text) {
      var previousFocus = document.activeElement;
      var selection = window.getSelection();
      var ranges = [];
      if (selection) {
        for (var index = 0; index < selection.rangeCount; index += 1) {
          ranges.push(selection.getRangeAt(index).cloneRange());
        }
      }
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.readOnly = true;
      textarea.tabIndex = -1;
      textarea.setAttribute('aria-hidden', 'true');
      textarea.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;font-size:16px;';
      body.appendChild(textarea);
      var copied = false;
      try {
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        copied = typeof document.execCommand === 'function' && document.execCommand('copy') === true;
      } catch (error) {
        copied = false;
      } finally {
        textarea.remove();
        focusElement(previousFocus);
        if (selection) {
          selection.removeAllRanges();
          ranges.forEach(function (range) { selection.addRange(range); });
        }
      }
      return copied;
    }

    async function copyText(text) {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function' && window.isSecureContext) {
        // Rejections remain failures; never display success before the browser confirms it.
        await navigator.clipboard.writeText(text);
        return true;
      }
      return fallbackCopy(text);
    }

    if (article) {
      var copyLabel = body.dataset.copyLabel || '复制';
      var copiedLabel = body.dataset.copiedLabel || '已复制';
      var copyFailed = body.dataset.copyFailed || '复制失败，请手动复制';
      article.querySelectorAll('pre').forEach(function (pre) {
        var code = pre.querySelector('code');
        if (!code || pre.querySelector('.code-copy-button')) return;
        uniqueIdNumber += 1;
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'code-copy-button';
        button.textContent = copyLabel;
        var status = document.createElement('span');
        status.className = 'copy-status sr-only';
        status.id = unusedId('copy-status-' + uniqueIdNumber);
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        status.setAttribute('aria-atomic', 'true');
        button.setAttribute('aria-describedby', status.id);
        var resetTimer;
        button.addEventListener('click', async function () {
          window.clearTimeout(resetTimer);
          status.textContent = '';
          button.disabled = true;
          var successful = false;
          try {
            successful = await copyText(code.textContent);
          } catch (error) {
            successful = false;
          }
          var message = successful ? copiedLabel : copyFailed;
          button.textContent = message;
          button.dataset.state = successful ? 'success' : 'error';
          status.textContent = message;
          button.disabled = false;
          resetTimer = window.setTimeout(function () {
            button.textContent = copyLabel;
            delete button.dataset.state;
          }, 2400);
        });
        pre.appendChild(button);
        pre.appendChild(status);
      });
    }

    function updateReadingState() {
      framePending = false;
      if (!article) return;
      var bounds = article.getBoundingClientRect();
      var viewportTop = readingContainer
        ? readingContainer.getBoundingClientRect().top + readingContainer.clientTop : 0;
      var viewportHeight = readingContainer ? readingContainer.clientHeight : window.innerHeight;
      var scrollPosition = readingContainer ? readingContainer.scrollTop : window.scrollY;
      var articleStart = bounds.top - viewportTop + scrollPosition;
      var readableDistance = bounds.height - viewportHeight;
      var progress = readableDistance > 0
        ? Math.max(0, Math.min(1, (scrollPosition - articleStart) / readableDistance))
        : (bounds.bottom <= viewportTop + viewportHeight ? 1 : 0);
      progressBars.forEach(function (bar) {
        bar.style.width = (progress * 100).toFixed(2) + '%';
        bar.style.setProperty('--reading-progress', String(progress));
        if (bar.getAttribute('role') === 'progressbar') {
          bar.setAttribute('aria-valuemin', '0');
          bar.setAttribute('aria-valuemax', '100');
          bar.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
        }
      });
      if (tocEntries.length) {
        var current = tocEntries[0];
        var readingLine = viewportTop + Math.min(140, viewportHeight * 0.2);
        tocEntries.forEach(function (entry) {
          if (entry.heading.getBoundingClientRect().top <= readingLine) current = entry;
        });
        if (progress === 1) current = tocEntries[tocEntries.length - 1];
        tocEntries.forEach(function (entry) {
          var active = entry === current;
          entry.link.classList.toggle('is-active', active);
          if (active) entry.link.setAttribute('aria-current', 'location');
          else entry.link.removeAttribute('aria-current');
        });
      }
    }

    function scheduleReadingUpdate() {
      if (!framePending) {
        framePending = true;
        window.requestAnimationFrame(updateReadingState);
      }
    }

    if (article && (progressBars.length || tocEntries.length)) {
      (readingContainer || window).addEventListener('scroll', scheduleReadingUpdate, { passive: true });
      window.addEventListener('resize', scheduleReadingUpdate, { passive: true });
      window.addEventListener('pageshow', scheduleReadingUpdate);
      article.addEventListener('load', scheduleReadingUpdate, true);
      if (typeof ResizeObserver === 'function') {
        var readingObserver = new ResizeObserver(scheduleReadingUpdate);
        readingObserver.observe(article);
        if (readingContainer) readingObserver.observe(readingContainer);
      }
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(scheduleReadingUpdate);
      }
      scheduleReadingUpdate();
    }

    // Native anchors retain normal navigation; terminal output respects reduced motion.
    document.documentElement.classList.add('js-ready');
    function restoreSession() {
      var state = session.pages && session.pages[pageKey];
      var pending = session.pending;
      delete session.pending;
      saveSession();
      if (state && state.selected) {
        var link = Array.from(document.querySelectorAll('[data-entry-link]')).find(function (item) {
          return item.getAttribute('href') === state.selected;
        });
        if (link) markSelectedEntry(link.closest('.entry'));
      }
      if (window.matchMedia('(pointer: fine)').matches) {
        var mode = pending && Date.now() - pending.time < 30000 ? pending.mode : state && state.mode;
        var arrivingOnArticle = article && !state;
        if (mode === 'input' && terminalInput && !arrivingOnArticle) {
          terminalInput.value = state && typeof state.draft === 'string' ? state.draft : '';
          focusElement(terminalInput);
          terminalInput.setSelectionRange(terminalInput.value.length, terminalInput.value.length);
        } else focusWorkspace();
      }
      if (!location.hash && state && readingContainer && Number.isFinite(state.scroll)) {
        readingContainer.scrollTo({ top: state.scroll, behavior: 'instant' });
      }
    }
    restoreSession();
    window.addEventListener('pageshow', function (event) {
      if (!event.persisted) return;
      try {
        var restored = JSON.parse(sessionStorage.getItem(sessionKey) || '{}');
        if (restored && typeof restored === 'object' && !Array.isArray(restored)) session = restored;
      } catch (error) { /* Keep the in-memory session when storage is unavailable. */ }
      restoreSession();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
