/**
 * Sigma Learn — Global Application JS
 * Gère : L'état d'authentification, utilitaires globaux, effets, toasts, infobulles
 */

// ============================================
// FIREBASE INITIALIZATION
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyA5o-fJw4-OPobphoPo-byPp5Ps2Y17Jt0",
  authDomain: "eduverse-ac9e5.firebaseapp.com",
  projectId: "eduverse-ac9e5",
  storageBucket: "eduverse-ac9e5.firebasestorage.app",
  messagingSenderId: "1035205455347",
  appId: "1:1035205455347:web:d5295d5472e5d5b1e23686",
  measurementId: "G-JRV3C6BQCM"
};

let firebaseInitialized = false;

async function initFirebase() {
  if (firebaseInitialized) return;
  const urls = [
    "https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js",
    "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth-compat.js",
    "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore-compat.js",
    "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage-compat.js"
  ];
  for (const url of urls) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  window.firebase.initializeApp(firebaseConfig);
  window.db = window.firebase.firestore();
  window.storage = window.firebase.storage();
  window.auth = window.firebase.auth();
  firebaseInitialized = true;

  // Dispatch event so other files know Firebase is ready
  document.dispatchEvent(new Event('FirebaseReady'));
}

// Start loading immediately
initFirebase().catch(err => console.error("Firebase init failed:", err));

// ============================================
// AUTH STATE MANAGER
// ============================================
const Auth = {
  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem('sigma_current_user') || 'null');
    } catch { return null; }
  },

  isLoggedIn() {
    return !!this.getCurrentUser();
  },

  logout() {
    localStorage.removeItem('sigma_current_user');
    window.location.href = this.getBasePath() + 'index.html';
  },

  updateUser(updates) {
    const user = this.getCurrentUser();
    if (!user) return;
    const updated = { ...user, ...updates };
    localStorage.setItem('sigma_current_user', JSON.stringify(updated));

    // Sync to Firestore if Firebase available
    if (window.db && user.email) {
      window.db.collection('users').doc(user.email).set(updates, { merge: true }).catch(console.error);
    }
    return updated;
  },

  addXP(amount) {
    const user = this.getCurrentUser();
    if (!user) return;
    const newPoints = (user.points || 0) + amount;
    const newLevel = Math.floor(newPoints / 500) + 1;
    this.updateUser({ points: newPoints, level: newLevel });
    Toast.show(`+${amount} XP gagnés ! ⭐`, 'success');
  },

  getBasePath() {
    const path = window.location.pathname;
    return path.includes('/pages/') ? '../' : './';
  },

  getAccessLevels() {
    return { PRONUNCIATION: 2, VR: 3, COMMUNITY: 5 };
  }
};

// ============================================
// THEME MANAGER
// ============================================
const Theme = {
  init() {
    const saved = localStorage.getItem('sigma_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    this.updateIcon(saved);
  },
  toggle() {
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', current);
    localStorage.setItem('sigma_theme', current);
    this.updateIcon(current);
  },
  updateIcon(theme) {
    document.querySelectorAll('.theme-toggle-icon').forEach(el => {
      el.textContent = theme === 'light' ? '🌙' : '☀️';
    });
  }
};

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================
const Toast = {
  container: null,

  init() {
    if (document.getElementById('toastContainer')) return;
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    this.container.id = 'toastContainer';
    document.body.appendChild(this.container);
  },

  show(message, type = 'info', duration = 3500) {
    this.init();
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: '💡' };
    const toast = document.createElement('div');
    toast.className = `toast ${type} animate-slideInRight`;
    toast.innerHTML = `
      <span style="font-size:1.1rem;">${icons[type] || '💡'}</span>
      <span style="flex:1;">${message}</span>
      <button onclick="this.parentElement.remove()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:0 0 0 0.5rem;font-size:1rem;">✕</button>
    `;
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};

// ============================================
// RIPPLE EFFECT
// ============================================
function addRippleEffect(element) {
  element.addEventListener('click', function (e) {
    const rect = this.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${e.clientX - rect.left - size / 2}px;
      top: ${e.clientY - rect.top - size / 2}px;
    `;
    this.classList.add('ripple-btn');
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  });
}

// ============================================
// INTERSECTION OBSERVER — SCROLL ANIMATIONS
// ============================================
function initScrollAnimations() {
  const animateEls = document.querySelectorAll('.glass-card, .animate-on-scroll');
  if (!animateEls.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fadeInUp');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  animateEls.forEach(el => {
    if (!el.className.includes('animate-')) observer.observe(el);
  });
}

// ============================================
// NAVBAR SCROLL EFFECT
// ============================================
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });
}

// ============================================
// SIDEBAR MOBILE TOGGLE
// ============================================
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  // Add mobile toggle button if it doesn't exist
  const navbar = document.querySelector('.nav-inner');
  if (navbar && !document.getElementById('sidebarToggle')) {
    const btn = document.createElement('button');
    btn.id = 'sidebarToggle';
    btn.className = 'btn btn-ghost btn-icon';
    btn.innerHTML = '☰';
    btn.title = 'Toggle menu';
    btn.style.display = 'none';
    btn.onclick = () => sidebar.classList.toggle('open');
    navbar.prepend(btn);

    const showToggle = () => { btn.style.display = window.innerWidth <= 1024 ? 'flex' : 'none'; };
    window.addEventListener('resize', showToggle);
    showToggle();
  }

  // Close sidebar on overlay click
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 1024 && sidebar.classList.contains('open')) {
      if (!sidebar.contains(e.target) && e.target.id !== 'sidebarToggle') {
        sidebar.classList.remove('open');
      }
    }
  });

  initSidebarLocks();
}

function initSidebarLocks() {
  const user = SigmaLearn.Auth.getCurrentUser();
  if (!user) return;

  const levels = SigmaLearn.Auth.getAccessLevels();
  const links = document.querySelectorAll('.sidebar-link');

  links.forEach(link => {
    const href = link.getAttribute('href');
    let locked = false;
    let required = 0;

    if (href.includes('pronunciation.html') && user.level < levels.PRONUNCIATION && user.role !== 'admin') {
      locked = true; required = levels.PRONUNCIATION;
    } else if (href.includes('vr-game.html') && user.level < levels.VR && user.role !== 'admin') {
      locked = true; required = levels.VR;
    } else if (href.includes('community.html') && user.level < levels.COMMUNITY && user.role !== 'admin') {
      locked = true; required = levels.COMMUNITY;
    }

    if (locked) {
      link.classList.add('link-locked');
      link.style.opacity = '0.5';
      const badge = document.createElement('span');
      badge.style.cssText = 'font-size:0.7rem; margin-left:auto; color:var(--warning); background:rgba(245,158,11,0.1); padding:2px 6px; border-radius:4px;';
      badge.innerHTML = `🔒 Niv.${required}`;
      link.appendChild(badge);

      // Prevent navigation if already on another page, or show toast
      link.onclick = (e) => {
        SigmaLearn.Toast.show(`Niveau ${required} requis pour accéder à cette section !`, 'warning');
        e.preventDefault();
        return false;
      };
    }
  });
}

// ============================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ============================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ============================================
// NUMBER COUNTER ANIMATION
// ============================================
function animateNumber(el, targetStr) {
  const target = parseFloat(targetStr.replace(/[^0-9.]/g, ''));
  const suffix = targetStr.replace(/[0-9.,]/g, '');
  let current = 0;
  const duration = 1500;
  const steps = 60;
  const increment = target / steps;
  const interval = duration / steps;

  const timer = setInterval(() => {
    current = Math.min(current + increment, target);
    el.textContent = Math.floor(current).toLocaleString() + suffix;
    if (current >= target) clearInterval(timer);
  }, interval);
}

// ============================================
// PAGE TRANSITION
// ============================================
function navigateTo(url) {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.2s ease';
  setTimeout(() => { window.location.href = url; }, 200);
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      // Focus search if present
      const searchEl = document.getElementById('searchInput');
      if (searchEl) { e.preventDefault(); searchEl.focus(); }
    }
  });
}

// ============================================
// PROGRESS BAR OBSERVER (auto-animate)
// ============================================
function initProgressBars() {
  const bars = document.querySelectorAll('.progress-fill[data-width]');
  if (!bars.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.width = entry.target.dataset.width;
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  bars.forEach(b => obs.observe(b));
}

// ============================================
// LOCAL STORAGE HELPERS
// ============================================
const Storage = {
  get(key, fallback = null) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  },
  remove(key) { localStorage.removeItem(key); },
  clear() { localStorage.clear(); }
};

// ============================================
// GLOBAL LESSON DATA (shared across pages)
// ============================================
const LESSONS_DATA = [
  { id: 1, emoji: '🗣️', title: 'Les bases du Djoula', category: 'Débutant', difficulty: 'Facile', duration: 45, rating: 4.9, students: 3120 },
  { id: 2, emoji: '👋', title: 'Salutations et Présentations', category: 'Conversation', difficulty: 'Facile', duration: 30, rating: 4.8, students: 2854 },
  { id: 3, emoji: '🛒', title: 'Au Marché : Négocier les prix', category: 'Pratique', difficulty: 'Moyen', duration: 40, rating: 4.7, students: 1940 },
  { id: 4, emoji: '🔢', title: 'Les Nombres et le Temps', category: 'Vocabulaire', difficulty: 'Facile', duration: 35, rating: 4.9, students: 2310 },
  { id: 5, emoji: '👨‍👩‍👧', title: 'La Famille et les Proches', category: 'Vocabulaire', difficulty: 'Moyen', duration: 40, rating: 4.8, students: 1650 },
  { id: 6, emoji: '🍲', title: 'Nourriture et Restauration', category: 'Pratique', difficulty: 'Moyen', duration: 45, rating: 4.6, students: 1420 },
  { id: 7, emoji: '🚌', title: 'Voyager et se déplacer', category: 'Conversation', difficulty: 'Moyen', duration: 30, rating: 4.7, students: 1280 },
  { id: 8, emoji: '❤️', title: 'Sentiments et Émotions', category: 'Vocabulaire', difficulty: 'Avancé', duration: 50, rating: 4.9, students: 850 },
  { id: 9, emoji: '📖', title: 'Grammaire Essentielle : Les Pronoms', category: 'Grammaire', difficulty: 'Avancé', duration: 60, rating: 4.5, students: 780 },
  { id: 10, emoji: '🏙️', title: 'Décrire sa Ville en Djoula', category: 'Pratique', difficulty: 'Avancé', duration: 55, rating: 4.8, students: 910 }
];

// ============================================
// LEVEL SYSTEM
// ============================================
const LevelSystem = {
  LEVEL_NAMES: [
    '', 'Explorateur Curieux', 'Chercheur de Savoir', 'Pensée Brillante', 'Érudit Dévoué',
    'Apprenti Expert', 'Maître d\\'Esprit', 'Sage', 'Luminaire', 'Oracle', 'Grand Maître'
  ],
  XP_PER_LEVEL: 500,

  getLevelFromXP(xp) {
    return Math.floor(xp / this.XP_PER_LEVEL) + 1;
  },

  getLevelName(level) {
    return this.LEVEL_NAMES[Math.min(level, this.LEVEL_NAMES.length - 1)] || 'Grand Master';
  },

  getProgressToNext(xp) {
    const xpInCurrentLevel = xp % this.XP_PER_LEVEL;
    return (xpInCurrentLevel / this.XP_PER_LEVEL) * 100;
  }
};

// ============================================
// AUTO-INIT ON DOM READY
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initSidebar();
  initSmoothScroll();
  initScrollAnimations();
  initProgressBars();
  initKeyboardShortcuts();
  Theme.init();

  // Apply ripple to all buttons
  document.querySelectorAll('.btn').forEach(addRippleEffect);

  // Page entry animation
  document.body.classList.add('page-enter');
});

// ============================================
// EXPORT GLOBALS (usable in any page)
// ============================================
window.SigmaLearn = { Auth, Toast, Storage, LevelSystem, LESSONS_DATA, Theme, navigateTo, animateNumber };
