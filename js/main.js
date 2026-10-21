(function () {
  "use strict";
  var CFG = window.SITE_CONFIG || {};
  var IMG_RE = /\.(png|jpe?g|webp|svg|gif|avif)$/i;

  /* ---------- Мобільне меню ---------- */
  var burger = document.querySelector(".burger");
  var nav = document.getElementById("nav");
  function closeMenu() {
    nav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
  }
  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) closeMenu();
  });

  /* ---------- Підсвітка активного пункту меню ---------- */
  var links = {};
  document.querySelectorAll(".nav__list a").forEach(function (a) {
    links[a.getAttribute("href").slice(1)] = a;
  });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = links[en.target.id];
        if (a && en.isIntersecting) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove("is-active"); });
          a.classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(links).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  /* ---------- Hero: якщо фону немає — лишається градієнт ---------- */
  var heroImg = document.querySelector("#heroBg img");
  if (heroImg) {
    heroImg.addEventListener("error", function () {
      document.getElementById("heroBg").classList.add("is-missing");
    });
  }

  /* ---------- Hero: відеофон (якщо файли є) ---------- */
  var hv = document.getElementById("heroVideo");
  if (hv) {
    var videoOff = function () {
      hv.classList.add("is-off");
      try { hv.pause(); } catch (e) {}
    };
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var saveData = navigator.connection && navigator.connection.saveData;
    if (reduce || saveData) {
      videoOff();
    } else {
      /* error останнього <source> означає, що жоден файл не завантажився */
      var lastSrc = document.getElementById("heroVideoLast");
      if (lastSrc) lastSrc.addEventListener("error", videoOff);
      hv.addEventListener("error", videoOff);
      /* події могли відбутися ще до виконання скрипта — тому ще й перевіряємо стан напряму */
      var checkVideo = function () {
        if (hv.networkState === 3) { videoOff(); return; } /* NETWORK_NO_SOURCE: файлів немає */
        if (!hv.paused && hv.readyState >= 2) hv.classList.add("is-ready");
      };
      ["playing", "loadeddata", "canplay", "timeupdate"].forEach(function (ev) { hv.addEventListener(ev, checkVideo); });
      window.addEventListener("load", checkVideo);
      checkVideo();
      var pl = hv.play();
      if (pl && pl.catch) pl.catch(function () { /* автозапуск заблоковано — лишається картинка */ });
      /* поза екраном відео не програємо — економимо батарею */
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (en) {
          if (hv.classList.contains("is-off")) return;
          if (en[0].isIntersecting) { var q = hv.play(); if (q && q.catch) q.catch(function () {}); } else { hv.pause(); }
        }).observe(document.getElementById("hero"));
      }
    }
  }

  /* ---------- Кнопка «Взяти участь» ---------- */
  var joinBtn = document.getElementById("joinBtn");
  if (joinBtn && CFG.registrationUrl) {
    joinBtn.href = CFG.registrationUrl;
    joinBtn.target = "_blank";
    joinBtn.rel = "noopener";
  }

  /* ---------- Таймер ---------- */
  var target = CFG.eventDate ? new Date(CFG.eventDate).getTime() : NaN;
  var cd = document.getElementById("countdown");
  function pad(n) { return String(n).padStart(2, "0"); }
  function tick() {
    if (isNaN(target)) { cd.hidden = true; return; }
    var d = Math.max(0, target - Date.now());
    var v = {
      days: Math.floor(d / 864e5),
      hours: Math.floor(d / 36e5) % 24,
      minutes: Math.floor(d / 6e4) % 60,
      seconds: Math.floor(d / 1e3) % 60
    };
    Object.keys(v).forEach(function (k) {
      cd.querySelector('[data-unit="' + k + '"]').textContent = k === "days" ? v[k] : pad(v[k]);
    });
  }
  tick();
  setInterval(tick, 1000);

  /* ---------- GitHub API: список файлів у папці ---------- */
  function listGithub(path) {
    var g = CFG.github || {};
    if (!g.enabled || !g.owner || !g.repo) return Promise.resolve(null);
    var url = "https://api.github.com/repos/" + g.owner + "/" + g.repo +
      "/contents/" + path + "?ref=" + encodeURIComponent(g.branch || "main");
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    }).then(function (items) {
      return items.filter(function (i) { return i.type === "file" && IMG_RE.test(i.name); })
        .map(function (i) { return i.name; });
    }).catch(function () { return null; });
  }

  function niceName(file) {
    return file.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
  }

  /* ---------- Логотипи ---------- */
  function renderLogos(box, folder, items) {
    box.textContent = "";
    if (!items.length) {
      var p = document.createElement("p");
      p.className = "logo-empty";
      p.textContent = "Інформація з'явиться незабаром.";
      box.appendChild(p);
      return;
    }
    items.forEach(function (it) {
      var img = document.createElement("img");
      img.src = "logos/" + folder + "/" + encodeURIComponent(it.file);
      img.alt = it.name || niceName(it.file);
      img.loading = "lazy";
      var wrap;
      if (it.url) {
        wrap = document.createElement("a");
        wrap.href = it.url;
        wrap.target = "_blank";
        wrap.rel = "noopener";
        wrap.title = img.alt;
      } else {
        wrap = document.createElement("div");
      }
      wrap.className = "logo-item";
      wrap.appendChild(img);
      box.appendChild(wrap);
    });
  }

  document.querySelectorAll("[data-logos]").forEach(function (box) {
    var folder = box.getAttribute("data-logos");
    var manual = (CFG.logos && CFG.logos[folder]) || [];
    renderLogos(box, folder, manual);

    listGithub("logos/" + folder).then(function (files) {
      if (!files) return;
      var known = {};
      manual.forEach(function (m) { known[m.file] = true; });
      var merged = manual.slice();
      files.forEach(function (f) {
        if (!known[f]) merged.push({ file: f, name: niceName(f), url: (CFG.logoLinks || {})[f] });
      });
      renderLogos(box, folder, merged);
    });
  });

  /* ---------- Фотогалерея: карусель + lightbox ---------- */
  var track = document.getElementById("galleryGrid");
  var carousel = document.getElementById("carousel");
  var dotsBox = document.getElementById("carouselDots");
  var empty = document.getElementById("galleryEmpty");
  var box = document.getElementById("lightbox");
  var lbImg = box.querySelector("img");
  var files = [], cur = 0, timer = null;

  function src(f) { return "images/gallery/" + encodeURIComponent(f); }
  function perView() { return window.innerWidth <= 560 ? 1 : window.innerWidth <= 900 ? 2 : 3; }
  function pages() { return Math.max(1, files.length - perView() + 1); }

  function goTo(i, instant) {
    var n = pages();
    cur = (i % n + n) % n;
    var item = track.children[cur];
    if (item) track.scrollTo({ left: item.offsetLeft - track.offsetLeft, behavior: instant ? "auto" : "smooth" });
    markDots();
  }
  function markDots() {
    Array.prototype.forEach.call(dotsBox.children, function (d, k) {
      if (k === cur) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current");
    });
  }
  function onScroll() {
    var w = track.children[0] ? track.children[0].getBoundingClientRect().width + 12 : 1;
    var i = Math.round(track.scrollLeft / w);
    if (i !== cur) { cur = Math.min(i, pages() - 1); markDots(); }
  }
  function buildDots() {
    dotsBox.textContent = "";
    for (var k = 0; k < pages(); k++) {
      (function (k) {
        var d = document.createElement("button");
        d.type = "button";
        d.setAttribute("aria-label", "Фото " + (k + 1));
        d.addEventListener("click", function () { goTo(k); restart(); });
        dotsBox.appendChild(d);
      })(k);
    }
    markDots();
  }
  function restart() {
    clearInterval(timer);
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || files.length <= perView()) return;
    timer = setInterval(function () { if (!document.hidden && !box.open) goTo(cur + 1); }, 4500);
  }

  /* lightbox */
  var lbIndex = 0;
  function lbShow(i) {
    lbIndex = (i % files.length + files.length) % files.length;
    lbImg.src = src(files[lbIndex]);
  }
  function lbOpen(i) {
    lbShow(i);
    if (box.showModal) box.showModal(); else window.open(src(files[i]), "_blank");
  }
  box.querySelector(".lb-prev").addEventListener("click", function (e) { e.stopPropagation(); lbShow(lbIndex - 1); });
  box.querySelector(".lb-next").addEventListener("click", function (e) { e.stopPropagation(); lbShow(lbIndex + 1); });
  box.querySelector(".lb-close").addEventListener("click", function (e) { e.stopPropagation(); box.close(); });
  box.addEventListener("click", function (e) { if (e.target === box || e.target === lbImg) box.close(); });
  box.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") lbShow(lbIndex - 1);
    if (e.key === "ArrowRight") lbShow(lbIndex + 1);
  });
  /* свайп у lightbox */
  var tx = null;
  box.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 50) lbShow(lbIndex + (dx < 0 ? 1 : -1));
  });

  function renderGallery(list) {
    files = list;
    track.textContent = "";
    carousel.hidden = !files.length;
    empty.hidden = files.length > 0;
    files.forEach(function (f, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("aria-label", "Відкрити фото " + (i + 1));
      var img = document.createElement("img");
      img.src = src(f);
      img.alt = "Фото з виставки " + (i + 1);
      img.loading = "lazy";
      img.decoding = "async";
      btn.appendChild(img);
      btn.addEventListener("click", function () { lbOpen(i); });
      track.appendChild(btn);
    });
    cur = 0;
    buildDots();
    restart();
  }

  carousel.querySelector(".carousel__btn--prev").addEventListener("click", function () { goTo(cur - 1); restart(); });
  carousel.querySelector(".carousel__btn--next").addEventListener("click", function () { goTo(cur + 1); restart(); });
  track.addEventListener("scroll", function () { clearTimeout(track._t); track._t = setTimeout(onScroll, 80); }, { passive: true });
  carousel.addEventListener("mouseenter", function () { clearInterval(timer); });
  carousel.addEventListener("mouseleave", restart);
  track.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { goTo(cur - 1); restart(); }
    if (e.key === "ArrowRight") { goTo(cur + 1); restart(); }
  });
  window.addEventListener("resize", function () { if (files.length) { buildDots(); goTo(Math.min(cur, pages() - 1), true); restart(); } });

  /* Джерела списку фото (по черзі): gallery.json (його створює автообробка) -> GitHub API -> CFG.gallery */
  function loadGallery() {
    return fetch("images/gallery/gallery.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (list) { if (!Array.isArray(list)) throw 0; return list.filter(function (f) { return IMG_RE.test(f); }); })
      .catch(function () { return listGithub("images/gallery"); })
      .then(function (list) {
        var all = (list || []).slice();
        (CFG.gallery || []).forEach(function (f) { if (all.indexOf(f) < 0) all.push(f); });
        return all;
      });
  }
  loadGallery().then(renderGallery);

  /* ---------- Форма: лист надсилається без бази даних через FormSubmit ---------- */
  var MAIL_TO = "expo@nubip.edu.ua";
  var MAIL_SUBJECT = "Звернення з сайту НУБіП.Тваринництво";
  document.getElementById("contactForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target;
    var status = document.getElementById("formStatus");
    var btn = f.querySelector("button[type=submit]");
    if (f._honey.value) return; /* спам-пастка */

    function fallback() {
      var body = "Ім'я/компанія: " + f.name.value + "\nE-mail: " + f.email.value + "\n\n" + f.message.value;
      var href = "mailto:" + MAIL_TO + "?subject=" + encodeURIComponent(MAIL_SUBJECT) + "&body=" + encodeURIComponent(body);
      status.textContent = "";
      status.appendChild(document.createTextNode("Не вдалося надіслати автоматично. "));
      var a = document.createElement("a");
      a.href = href;
      a.textContent = "Відкрити лист у поштовій програмі";
      status.appendChild(a);
      status.className = "form__status is-error";
    }

    btn.disabled = true;
    status.className = "form__status";
    status.textContent = "Надсилаємо…";
    fetch("https://formsubmit.co/ajax/" + MAIL_TO, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        _subject: MAIL_SUBJECT,
        _replyto: f.email.value,
        _captcha: "false",
        "Ім'я / компанія": f.name.value,
        "E-mail": f.email.value,
        "Повідомлення": f.message.value
      })
    }).then(function (r) {
      return r.json().then(function (j) { if (!r.ok || String(j.success) === "false") throw new Error("fail"); });
    }).then(function () {
      f.reset();
      status.textContent = "Дякуємо! Повідомлення надіслано.";
      status.className = "form__status is-ok";
    }).catch(fallback).then(function () { btn.disabled = false; });
  });

  document.getElementById("year").textContent = new Date().getFullYear();
})();
