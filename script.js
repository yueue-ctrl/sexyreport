const hero = document.querySelector(".hero");
const weeklyContent = document.querySelector(".weekly-content");
const placeholderContent = document.querySelector(".placeholder-content");
const clock = document.querySelector("#clock");
const siteHeader = document.querySelector(".site-header");
const brandLine = document.querySelector(".brand-line");
const menuButton = document.querySelector("button.menu-button");
const siteMenu = document.querySelector("#site-menu");
const menuClose = document.querySelector(".menu-close");
const brandSlogans = ["Design is...", "Design is thinking", "Design is making", "Design is learning"];
let currentBrandText = "Design intern";
let isHeaderCompact = false;
let scrollTicking = false;
let menuHideTimer = null;

function setMenuOpen(isOpen) {
  if (!siteMenu || !menuButton) return;

  if (menuHideTimer) {
    window.clearTimeout(menuHideTimer);
    menuHideTimer = null;
  }

  if (isOpen) {
    siteMenu.hidden = false;
    siteMenu.setAttribute("aria-hidden", "false");
    menuButton.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
    window.requestAnimationFrame(() => {
      siteMenu.classList.add("is-open");
    });
    return;
  }

  siteMenu.classList.remove("is-open");
  siteMenu.setAttribute("aria-hidden", "true");
  menuButton.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
  menuHideTimer = window.setTimeout(() => {
    if (!siteMenu.classList.contains("is-open")) {
      siteMenu.hidden = true;
    }
  }, 420);
}

if (siteMenu) {
  siteMenu.hidden = true;
  siteMenu.classList.remove("is-open");
  siteMenu.setAttribute("aria-hidden", "true");
}

if (menuButton) {
  menuButton.addEventListener("click", () => setMenuOpen(true));
}

if (menuClose) {
  menuClose.addEventListener("click", () => setMenuOpen(false));
}

document.addEventListener("click", (event) => {
  if (!siteMenu) return;

  const target = event.target;
  if (!siteMenu.classList.contains("is-open")) return;
  if (target.closest(".menu-button") || target.closest(".site-menu")) return;

  setMenuOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  setMenuOpen(false);
});

if (siteMenu) {
  siteMenu.querySelectorAll(".menu-primary a[data-placeholder]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      showPlaceholder();
      setMenuOpen(false);
    });
  });
}

document.querySelectorAll("[data-placeholder]").forEach((link) => {
  if (link.closest(".menu-primary")) return;

  link.addEventListener("click", (event) => {
    event.preventDefault();
    showPlaceholder();
  });
});

document.querySelectorAll("[data-open-menu]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    setMenuOpen(true);
  });
});

function showPlaceholder() {
  if (hero) hero.hidden = true;
  if (weeklyContent) weeklyContent.hidden = true;
  if (placeholderContent) placeholderContent.hidden = false;
}

function updateClock() {
  if (!clock) return;

  const now = new Date();
  clock.textContent = now.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

updateClock();
setInterval(updateClock, 1000);

function updateHeaderVisibility() {
  if (!siteHeader || !brandLine) {
    scrollTicking = false;
    return;
  }

  const currentScrollY = window.scrollY;
  const nextBrandText =
    currentScrollY < 80 ? "Design intern" : brandSlogans[Math.floor((currentScrollY - 80) / 280) % brandSlogans.length];
  const shouldCompact = currentScrollY > 150;

  if (shouldCompact !== isHeaderCompact) {
    isHeaderCompact = shouldCompact;
    siteHeader.classList.toggle("is-compact", isHeaderCompact);
  }

  if (nextBrandText !== currentBrandText) {
    brandLine.textContent = nextBrandText;
    currentBrandText = nextBrandText;
  }

  scrollTicking = false;
}

window.addEventListener(
  "scroll",
  () => {
    if (scrollTicking) return;

    scrollTicking = true;
    window.requestAnimationFrame(updateHeaderVisibility);
  },
  { passive: true },
);

updateHeaderVisibility();

const thumbnailToggle = document.querySelector("#thumbnail-toggle");
const timelineTable = document.querySelector(".timeline-table");
const timelineScroll = document.querySelector(".timeline-scroll");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let thumbnailObserver = null;
const visibleThumbnailVideos = new Map();
const maxPlayingThumbnails = 4;

function stopThumbnailVideo(video, releaseSource = false) {
  video.pause();
  if (!releaseSource) return;

  video.removeAttribute("src");
  video.load();
  video.dataset.loaded = "false";
}

function loadThumbnailVideo(video) {
  if (video.dataset.loaded === "true") return;

  video.src = video.dataset.src;
  video.dataset.loaded = "true";
  video.load();
}

function updatePlayingThumbnailVideos() {
  const videosToPlay = reduceMotion.matches
    ? []
    : [...visibleThumbnailVideos.entries()]
        .sort((first, second) => second[1] - first[1])
        .slice(0, maxPlayingThumbnails)
        .map(([video]) => video);

  visibleThumbnailVideos.forEach((_, video) => {
    if (videosToPlay.includes(video)) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  });
}

function createTimelineThumbnails() {
  if (!timelineTable) return;

  timelineTable.querySelectorAll(".timeline-bar").forEach((bar) => {
    if (bar.querySelector(".timeline-thumbnail")) return;

    const label = bar.querySelector("strong")?.textContent.trim() || "查看项目";
    const source = bar.dataset.thumbnail;
    bar.setAttribute("aria-label", label);

    if (!source || bar.closest(".timeline-text-only")) return;

    bar.classList.add("has-thumbnail");

    if (bar.dataset.thumbnailType === "video") {
      const video = document.createElement("video");
      video.className = "timeline-thumbnail";
      video.dataset.src = source;
      video.dataset.loaded = "false";
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "none";
      video.setAttribute("aria-hidden", "true");
      bar.append(video);
      return;
    }

    const image = document.createElement("img");
    image.className = "timeline-thumbnail";
    image.src = source;
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    bar.append(image);
  });
}

function observeThumbnailVideos() {
  if (!timelineTable || !timelineScroll) return;

  thumbnailObserver?.disconnect();
  thumbnailObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (!entry.isIntersecting) {
          visibleThumbnailVideos.delete(video);
          video.pause();
          return;
        }

        loadThumbnailVideo(video);
        visibleThumbnailVideos.set(video, entry.intersectionRatio);
      });
      updatePlayingThumbnailVideos();
    },
    { root: timelineScroll, rootMargin: "80px", threshold: 0.12 },
  );

  timelineTable.querySelectorAll("video.timeline-thumbnail").forEach((video) => thumbnailObserver.observe(video));
}

function setThumbnailMode(isEnabled) {
  if (!thumbnailToggle || !timelineTable) return;

  thumbnailToggle.setAttribute("aria-checked", String(isEnabled));
  timelineTable.classList.toggle("is-thumbnail-mode", isEnabled);

  if (isEnabled) {
    createTimelineThumbnails();
    observeThumbnailVideos();
  } else {
    thumbnailObserver?.disconnect();
    visibleThumbnailVideos.clear();
    timelineTable.querySelectorAll("video.timeline-thumbnail").forEach((video) => stopThumbnailVideo(video, true));
  }
}

if (thumbnailToggle && timelineTable) {
  thumbnailToggle.addEventListener("click", () => {
    setThumbnailMode(thumbnailToggle.getAttribute("aria-checked") !== "true");
  });

  reduceMotion.addEventListener?.("change", () => {
    if (thumbnailToggle.getAttribute("aria-checked") === "true") updatePlayingThumbnailVideos();
  });
}
