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

  /* ---------- Галерея + lightbox ---------- */
  var grid = document.getElementById("galleryGrid");
  var empty = document.getElementById("galleryEmpty");
  var box = document.getElementById("lightbox");

  function renderGallery(files) {
    grid.textContent = "";
    empty.hidden = files.length > 0;
    files.forEach(function (f) {
      var src = "images/gallery/" + encodeURIComponent(f);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("aria-label", "Відкрити фото");
      var img = document.createElement("img");
      img.src = src;
      img.alt = "";
      img.loading = "lazy";
      btn.appendChild(img);
      btn.addEventListener("click", function () {
        box.querySelector("img").src = src;
        if (box.showModal) box.showModal(); else window.open(src, "_blank");
      });
      grid.appendChild(btn);
    });
  }
  box.addEventListener("click", function () { box.close(); });

  var galleryFiles = (CFG.gallery || []).slice();
  renderGallery(galleryFiles);
  listGithub("images/gallery").then(function (files) {
    if (!files) return;
    files.forEach(function (f) { if (galleryFiles.indexOf(f) < 0) galleryFiles.push(f); });
    renderGallery(galleryFiles);
  });

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
