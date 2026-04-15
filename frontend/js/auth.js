// ── AUTH LOGIC ──
let authMode = 'login';
let selectedRole = 'candidate';

function toggleAuth(mode) {
  authMode = mode;
  document.getElementById('authTitle').textContent = mode === 'login' ? 'Welcome back' : 'Join NextHire AI';
  document.getElementById('authSub').textContent = mode === 'login' ? 'Sign in to your account' : 'Create your account in seconds';
  document.getElementById('authBtn').textContent = mode === 'login' ? 'Sign In' : 'Create Account';
  document.getElementById('authToggle').innerHTML = mode === 'login'
    ? `Don't have an account? <a href="#" onclick="toggleAuth('signup')" class="text-accent">Sign up</a>`
    : `Already have an account? <a href="#" onclick="toggleAuth('login')" class="text-accent">Sign in</a>`;
  document.getElementById('roleSelector').style.display = mode === 'signup' ? 'grid' : 'none';
  document.getElementById('nameGroup').style.display = mode === 'signup' ? 'block' : 'none';
  document.getElementById('companyGroup').style.display = 'none';
  document.getElementById('passwordHint').style.display = mode === 'signup' ? 'block' : 'none';
}

function selectRole(role) {
  selectedRole = role;
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-role="${role}"]`).classList.add('active');
  document.getElementById('companyGroup').style.display = role === 'recruiter' ? 'block' : 'none';
}

async function handleAuth(e) {
  e.preventDefault();
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;

  // Password validation for signup (only affects new users)
  if (authMode === 'signup') {
    if (password.length < 8 || password.length > 16) {
      toast('Password must be 8-16 characters', 'error');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      toast('Password must contain at least one uppercase letter', 'error');
      return;
    }
    if (!/[0-9]/.test(password)) {
      toast('Password must contain at least one number', 'error');
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      toast('Password must contain at least one special character', 'error');
      return;
    }
  }

  try {
    let data;
    if (authMode === 'login') {
      data = await post('/auth/login', { email, password });
    } else {
      const name = document.getElementById('authName').value;
      const company = document.getElementById('authCompany')?.value;
      data = await post('/auth/register', { name, email, password, role: selectedRole, ...(company ? { company } : {}) });
    }
    
    // Check if recruiter needs admin approval
    if (data.pending) {
      toast(data.message, 'warning');
      return;
    }
    
    store.set('token', data.token);
    store.set('user', data.user);
    state.token = data.token;
    state.user = data.user;
    toast(`Welcome, ${data.user.name}!`, 'success');
    showApp();
    
    // Redirect based on role
    if (state.user.role === 'admin') {
      navigate('admin-dashboard');
    } else if (state.user.role === 'recruiter') {
      navigate('dashboard');
    } else {
      navigate('dashboard');
    }
  } catch (err) {
    toast(err.message, 'error');
  }
}