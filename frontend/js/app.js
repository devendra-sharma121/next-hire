// ── CONFIG ──
const API = 'http://localhost:5002/api';
const BASE_URL = 'http://localhost:5002';

// Converts stored path /uploads/file.pdf → full backend URL
function fileUrl(p, userId = null) {
  if (!p) return null;
  if (typeof p === 'object' && p.data) {
    return userId ? `${API}/candidate/resume/${userId}` : `${API}/candidate/resume`;
  }
  if (p.startsWith('http')) return p;
  return BASE_URL + p;
}

// ── STATE ──
const state = {
  user: null,
  token: null,
  page: 'dashboard',
};

// ── STORAGE ──
const store = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  del: (k) => localStorage.removeItem(k),
};

// ── HTTP ──
async function http(method, path, body) {
  const token = store.get('token');
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

const get = (p) => http('GET', p);
const post = (p, b) => http('POST', p, b);
const put = (p, b) => http('PUT', p, b);
const patch = (p, b) => http('PATCH', p, b);
const del = (p) => http('DELETE', p);

// ── TOAST ──
function toast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; el.style.transition = 'all .3s'; setTimeout(() => el.remove(), 300); }, 3000);
}

// ── MODAL ──
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ── NAV ──
const loadedPages = new Set();

function navigate(page, forceReload = false) {
  if (state.page === page && !forceReload) {
    return;
  }
  state.page = page;

  // Hide all pages, show target
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const el = document.getElementById(`page-${page}`);
  if (el) { el.classList.add('active'); }

  const nav = document.querySelector(`[data-page="${page}"]`);
  if (nav) nav.classList.add('active');

  // Only call load function if page hasn't been loaded yet, or forceReload
  if ((forceReload || !loadedPages.has(page)) && typeof window[`load_${page.replace(/-/g, '_')}`] === 'function') {
    loadedPages.add(page);
    window[`load_${page.replace(/-/g, '_')}`]();
  }
}

function reloadPage(page) {
  loadedPages.delete(page);
  navigate(page, true);
}

// ── AUTH ──
function initApp() {
  const token = store.get('token');
  const user = store.get('user');
  if (token && user) {
    state.token = token;
    state.user = user;
    showApp();
  } else {
    showAuth();
  }
}

function showAuth() {
  document.getElementById('authPage').classList.remove('hidden');
  document.getElementById('appPage').classList.add('hidden');
}

function showApp() {
  document.getElementById('authPage').classList.add('hidden');
  document.getElementById('appPage').classList.remove('hidden');
  loadedPages.clear();
  state.page = null; // force first navigation to load
  buildSidebar();
  
  // Navigate based on role
  if (state.user.role === 'admin') {
    navigate('admin-dashboard');
  } else if (state.user.role === 'recruiter') {
    navigate('dashboard');
  } else {
    navigate('dashboard');
  }
}

function logout() {
  store.del('token'); store.del('user');
  state.user = null; state.token = null;
  showAuth();
}

// ── SIDEBAR ──
function buildSidebar() {
  const user = state.user;
  if (!user) return;
  console.log('Building sidebar for role:', user.role);
  document.getElementById('sidebarUserName').textContent = user.name;
  document.getElementById('sidebarUserRole').textContent = user.role === 'admin' ? 'Admin' : user.role;
  document.getElementById('sidebarAvatar').textContent = user.name[0].toUpperCase();

  const recruiterNav = [
    { icon: '📊', label: 'Dashboard', page: 'dashboard' },
    { icon: '💼', label: 'Job Postings', page: 'jobs', badge: null },
    { icon: '👥', label: 'Candidates', page: 'candidates' },
    { icon: '📅', label: 'Interviews', page: 'interviews' },
    { icon: '💬', label: 'Messages', page: 'messages' },
    { icon: '📈', label: 'Analytics', page: 'analytics' },
  ];
  const candidateNav = [
    { icon: '🏠', label: 'Dashboard', page: 'dashboard' },
    { icon: '🔍', label: 'Find Jobs', page: 'jobs' },
    { icon: '📋', label: 'My Applications', page: 'applications' },
    { icon: '❤️', label: 'Saved Jobs', page: 'saved' },
    { icon: '📅', label: 'Interviews', page: 'interviews' },
    { icon: '💬', label: 'Messages', page: 'messages' },
    { icon: '👤', label: 'My Profile', page: 'profile' },
  ];
  const adminNav = [
    { icon: '📊', label: 'Dashboard', page: 'admin-dashboard' },
    { icon: '👥', label: 'All Users', page: 'admin-users' },
    { icon: '📝', label: 'Recruiter Requests', page: 'admin-recruiter-requests' },
    { icon: '💼', label: 'Recruiters', page: 'admin-recruiters' },
    { icon: '👤', label: 'Candidates', page: 'admin-candidates' },
    { icon: '📋', label: 'Jobs', page: 'admin-jobs' },
  ];

  const nav = user.role === 'admin' ? adminNav : (user.role === 'recruiter' ? recruiterNav : candidateNav);
  const container = document.getElementById('sidebarNav');
  container.innerHTML = nav.map(item => `
    <a class="nav-item" data-page="${item.page}" onclick="navigate('${item.page}')">
      <span class="icon">${item.icon}</span>
      <span>${item.label}</span>
      ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
    </a>
  `).join('');
}

// ── HELPERS ──
function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusBadge(status) {
  const map = {
    applied: 'badge-blue',
    reviewing: 'badge-yellow',
    shortlisted: 'badge-green',
    rejected: 'badge-red',
    selected: 'badge-green',
    scheduled: 'badge-purple',
    pending: 'badge-yellow',
    active: 'badge-green',
    closed: 'badge-red',
  };
  return `<span class="badge ${map[status] || 'badge-blue'}">${status}</span>`;
}

// Close dropdowns on click outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.dropdown')) {
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('open'));
  }
});

// Close modals on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

window.addEventListener('DOMContentLoaded', initApp);