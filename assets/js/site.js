(function () {
  "use strict";

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function outerWidthWithMargin(el) {
    if (!el) return 0;
    var rect = el.getBoundingClientRect();
    var style = window.getComputedStyle(el);
    var ml = parseFloat(style.marginLeft) || 0;
    var mr = parseFloat(style.marginRight) || 0;
    return rect.width + ml + mr;
  }

  function initGreedyNav() {
    var nav = document.querySelector("nav.greedy-nav");
    if (!nav) return;

    var btn = nav.querySelector(".greedy-nav__toggle");
    var vlinks = nav.querySelector(".visible-links");
    var hlinks = nav.querySelector(".hidden-links");
    var logo = nav.querySelector(".site-logo");
    var logoImg = nav.querySelector(".site-logo img");
    var title = nav.querySelector(".site-title");
    var searchBtn = nav.querySelector("button.search__toggle");

    if (!btn || !vlinks || !hlinks) return;

    var numOfItems = 0;
    var breakWidths = [];
    var closingTimer = null;

    function getBreakpoint(width) {
      if (width < 768) return 0;
      if (width < 1024) return 1;
      if (width < 1280) return 2;
      return 3;
    }

    function measureLinks() {
      numOfItems = 0;
      breakWidths = [];
      var totalSpace = 0;

      Array.prototype.forEach.call(vlinks.children, function (item) {
        totalSpace += outerWidthWithMargin(item);
        numOfItems += 1;
        breakWidths.push(totalSpace);
      });

      Array.prototype.forEach.call(hlinks.children, function (item) {
        var clone = item.cloneNode(true);
        clone.style.visibility = "hidden";
        clone.style.position = "absolute";
        vlinks.appendChild(clone);
        totalSpace += outerWidthWithMargin(clone);
        numOfItems += 1;
        breakWidths.push(totalSpace);
        vlinks.removeChild(clone);
      });
    }

    function closeHiddenMenu() {
      hlinks.classList.add("hidden");
      btn.classList.remove("close");
    }

    measureLinks();
    var lastBreakpoint = getBreakpoint(window.innerWidth);

    function check() {
      var curBreakpoint = getBreakpoint(window.innerWidth);
      if (curBreakpoint !== lastBreakpoint) {
        measureLinks();
        lastBreakpoint = curBreakpoint;
      }

      var safety = 0;
      while (safety < 50) {
        safety += 1;
        var numOfVisible = vlinks.children.length;
        var navStyle = window.getComputedStyle(nav);
        var navInnerWidth =
          nav.clientWidth -
          (parseFloat(navStyle.paddingLeft) || 0) -
          (parseFloat(navStyle.paddingRight) || 0);

        var availableSpace =
          navInnerWidth -
          (logo ? outerWidthWithMargin(logo) : 0) -
          (title ? outerWidthWithMargin(title) : 0) -
          (searchBtn ? outerWidthWithMargin(searchBtn) : 0) -
          (numOfVisible !== breakWidths.length ? outerWidthWithMargin(btn) : 0);

        var requiredSpace = numOfVisible > 0 ? breakWidths[numOfVisible - 1] : 0;

        if (numOfVisible > 0 && requiredSpace > availableSpace) {
          var lastVisible = vlinks.lastElementChild;
          if (!lastVisible) break;
          hlinks.insertBefore(lastVisible, hlinks.firstElementChild);
        } else if (
          hlinks.children.length > 0 &&
          availableSpace + (numOfVisible === breakWidths.length - 1 ? outerWidthWithMargin(btn) : 0) >
            breakWidths[numOfVisible]
        ) {
          var firstHidden = hlinks.firstElementChild;
          if (!firstHidden) break;
          vlinks.appendChild(firstHidden);
        } else {
          break;
        }
      }

      var visibleCount = vlinks.children.length;
      btn.setAttribute("count", String(numOfItems - visibleCount));
      if (visibleCount === numOfItems) {
        btn.classList.add("hidden");
        closeHiddenMenu();
      } else {
        btn.classList.remove("hidden");
      }
    }

    window.addEventListener("resize", check);

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var isHidden = hlinks.classList.toggle("hidden");
      btn.classList.toggle("close", !isHidden);
      if (closingTimer) {
        clearTimeout(closingTimer);
        closingTimer = null;
      }
    });

    hlinks.addEventListener("mouseleave", function () {
      closingTimer = setTimeout(closeHiddenMenu, 1000);
    });

    hlinks.addEventListener("mouseenter", function () {
      if (closingTimer) {
        clearTimeout(closingTimer);
        closingTimer = null;
      }
    });

    document.addEventListener("click", function (e) {
      if (!hlinks.classList.contains("hidden") && !hlinks.contains(e.target) && e.target !== btn) {
        closeHiddenMenu();
      }
    });

    if (logoImg && !logoImg.complete) {
      logoImg.addEventListener("load", check, { once: true });
      logoImg.addEventListener("error", check, { once: true });
    }
    check();
  }

  function initSidebar() {
    var sidebar = document.querySelector(".sidebar");
    var followBtn = document.querySelector(".author__urls-wrapper button");
    var authorUrls = document.querySelector(".author__urls");

    function updateStickySidebar() {
      if (!sidebar) return;
      var showSticky = followBtn
        ? window.getComputedStyle(followBtn).display === "none"
        : window.innerWidth > 1024;
      sidebar.classList.toggle("sticky", showSticky);
    }

    updateStickySidebar();
    window.addEventListener("resize", updateStickySidebar);

    if (followBtn && authorUrls) {
      followBtn.addEventListener("click", function () {
        authorUrls.classList.toggle("is--visible");
        followBtn.classList.toggle("open");
      });
    }
  }

  function initSearch() {
    var toggleBtn = document.querySelector(".search__toggle");
    var searchContent = document.querySelector(".search-content");
    var initialContent = document.querySelector(".initial-content");
    var searchInput = document.getElementById("search");
    var resultsDiv = document.getElementById("results");

    function closeSearch() {
      if (!searchContent || !initialContent) return;
      if (initialContent.classList.contains("is--hidden")) {
        searchContent.classList.remove("is--visible");
        initialContent.classList.remove("is--hidden");
      }
    }

    if (toggleBtn && searchContent && initialContent) {
      toggleBtn.addEventListener("click", function () {
        var visible = searchContent.classList.toggle("is--visible");
        initialContent.classList.toggle("is--hidden", visible);
        if (visible && searchInput) {
          setTimeout(function () {
            searchInput.focus();
          }, 200);
        }
      });
    }

    document.addEventListener("keyup", function (e) {
      if (e.key === "Escape" || e.keyCode === 27) {
        closeSearch();
      }
    });

    if (!searchInput || !resultsDiv) return;

    function runSearch(rawQuery) {
      var trimmed = rawQuery.trim().toLowerCase();
      if (!trimmed) {
        resultsDiv.innerHTML = "";
        return;
      }

      var store = Array.isArray(window.__SEARCH_INDEX__) ? window.__SEARCH_INDEX__ : [];
      var tokens = trimmed.split(/\s+/).filter(Boolean);
      var matches = [];

      store.forEach(function (item, idx) {
        var title = String(item.title || "");
        var excerpt = String(item.excerpt || "");
        var content = String(item.content || "");
        var categories = Array.isArray(item.categories) ? item.categories.join(" ") : "";
        var tags = Array.isArray(item.tags) ? item.tags.join(" ") : "";

        var titleLower = title.toLowerCase();
        var taxonomyLower = (categories + " " + tags).toLowerCase();
        var excerptLower = excerpt.toLowerCase();
        var contentLower = content.toLowerCase();
        var combined = titleLower + " " + taxonomyLower + " " + excerptLower + " " + contentLower;

        var allFound = tokens.every(function (token) {
          return combined.indexOf(token) !== -1;
        });
        if (!allFound) return;

        var score = 0;
        tokens.forEach(function (token) {
          if (titleLower.indexOf(token) !== -1) score += 100;
          if (taxonomyLower.indexOf(token) !== -1) score += 40;
          if (excerptLower.indexOf(token) !== -1) score += 20;
          if (contentLower.indexOf(token) !== -1) score += 5;
        });

        matches.push({ item: item, score: score, order: idx });
      });

      matches.sort(function (a, b) {
        if (b.score !== a.score) return b.score - a.score;
        return a.order - b.order;
      });

      var htmlParts = ['<p class="results__found">' + matches.length + " 개 결과 발견</p>"];
      matches.forEach(function (entry) {
        var doc = entry.item;
        var summarySource = doc.excerpt || doc.content || "";
        var summaryWords = summarySource.trim().split(/\s+/);
        var summary =
          summaryWords.length > 20
            ? summaryWords.slice(0, 20).join(" ") + "..."
            : summarySource;

        var teaserHtml = doc.teaser
          ? '<div class="archive__item-teaser"><img src="' + escapeHtml(doc.teaser) + '" alt=""></div>'
          : "";

        htmlParts.push(
          '<div class="list__item">' +
            '<article class="archive__item" itemscope itemtype="https://schema.org/CreativeWork">' +
              '<h2 class="archive__item-title" itemprop="headline">' +
                '<a href="' + escapeHtml(doc.url) + '" rel="permalink">' + escapeHtml(doc.title) + "</a>" +
              "</h2>" +
              teaserHtml +
              '<p class="archive__item-excerpt" itemprop="description">' + escapeHtml(summary) + "</p>" +
            "</article>" +
          "</div>"
        );
      });

      resultsDiv.innerHTML = htmlParts.join("");
    }

    searchInput.addEventListener("input", function () {
      runSearch(searchInput.value);
    });
  }

  function initHeadingAnchors() {
    var container = document.querySelector(".page__content");
    if (!container) return;

    var headings = container.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]");
    Array.prototype.forEach.call(headings, function (heading) {
      if (heading.querySelector(".header-link")) return;
      var anchor = document.createElement("a");
      anchor.className = "header-link";
      anchor.href = "#" + heading.id;
      anchor.title = "Permalink";

      var sr = document.createElement("span");
      sr.className = "sr-only";
      sr.textContent = "Permalink";

      var icon = document.createElement("i");
      icon.className = "fas fa-link";
      icon.setAttribute("aria-hidden", "true");

      anchor.appendChild(sr);
      anchor.appendChild(icon);
      heading.appendChild(anchor);
    });
  }

  function initTocScrollSpy() {
    var toc = document.querySelector("nav.toc");
    if (!toc) return;

    var links = Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]'));
    var items = links
      .map(function (link) {
        var rawId = link.getAttribute("href").slice(1);
        var id = rawId;
        try {
          id = decodeURIComponent(rawId);
        } catch (err) {
          id = rawId;
        }
        var target = document.getElementById(id);
        var li = link.closest("li");
        return target && li ? { target: target, li: li } : null;
      })
      .filter(Boolean);

    if (items.length === 0) return;

    var ticking = false;
    function updateActive() {
      ticking = false;
      var activeItem = null;
      for (var i = 0; i < items.length; i++) {
        var top = items[i].target.getBoundingClientRect().top;
        if (top <= 48) {
          activeItem = items[i];
        } else {
          break;
        }
      }

      items.forEach(function (entry) {
        entry.li.classList.toggle("active", entry === activeItem);
      });
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(updateActive);
        }
      },
      { passive: true }
    );
    updateActive();
  }

  function initSmoothScroll() {
    document.addEventListener("click", function (e) {
      var link = e.target.closest('a[href*="#"]');
      if (!link) return;
      if (link.pathname !== window.location.pathname || !link.hash || link.hash === "#") return;

      var rawId = link.hash.slice(1);
      var id = rawId;
      try {
        id = decodeURIComponent(rawId);
      } catch (err) {
        id = rawId;
      }
      var target = document.getElementById(id);
      if (!target) return;

      e.preventDefault();
      var y = target.getBoundingClientRect().top + window.pageYOffset - 20;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      if (window.history && window.history.pushState) {
        window.history.pushState(null, "", link.hash);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initGreedyNav();
    initSidebar();
    initSearch();
    initHeadingAnchors();
    initTocScrollSpy();
    initSmoothScroll();
  });
})();
