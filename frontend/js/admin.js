// ── ADMIN DASHBOARD ──
window.load_admin_dashboard = async function() {
  const page = document.getElementById('page-admin-dashboard');
  page.innerHTML = '<div class="skeleton" style="height:400px"></div>';
  
  try {
    const data = await get('/admin/stats');
    const appsByStatus = data.appsByStatus || {};
    
    const applied = appsByStatus.applied || 0;
    const shortlisted = appsByStatus.shortlisted || 0;
    const rejected = appsByStatus.rejected || 0;
    const selected = appsByStatus.selected || 0;
    const totalApps = applied + shortlisted + rejected + selected ;
    
    page.innerHTML = `
      <div class="topbar"><div class="topbar-title">Admin Dashboard</div></div>
      <div class="stat-grid">
        <div class="stat-card blue fade-in">
          <div class="stat-icon">👥</div>
          <div class="card-title">Total Users</div>
          <div class="card-value">${data.totalUsers || 0}</div>
        </div>
        <div class="stat-card purple fade-in">
          <div class="stat-icon">💼</div>
          <div class="card-title">Jobs</div>
          <div class="card-value">${data.totalJobs || 0}</div>
        </div>
        <div class="stat-card green fade-in">
          <div class="stat-icon">📝</div>
          <div class="card-title">Applications</div>
          <div class="card-value">${data.totalApplications || 0}</div>
        </div>
        <div class="stat-card yellow fade-in">
          <div class="stat-icon">👔</div>
          <div class="card-title">Recruiters</div>
          <div class="card-value">${data.recruiters || 0}</div>
        </div>
        <div class="stat-card cyan fade-in">
          <div class="stat-icon">👤</div>
          <div class="card-title">Candidates</div>
          <div class="card-value">${data.candidates || 0}</div>
        </div>
      </div>
      <div class="grid-2 mt-24">
        <div class="card">
          <div class="card-title">Application Status (${totalApps})</div>
          <div style="height:200px;display:flex;align-items:center;justify-content:center">
            <canvas id="appsChart"></canvas>
          </div>
        </div>
        <div class="card">
          <div class="card-title">Application Breakdown</div>
          <div style="padding:20px">
            <div style="margin-bottom:12px;display:flex;justify-content:space-between">
              <span>Applied</span>
              <span class="badge badge-blue">${applied}</span>
            </div>
            <div style="margin-bottom:12px;display:flex;justify-content:space-between">
              <span>Shortlisted</span>
              <span class="badge badge-green">${shortlisted}</span>
            </div>
            <div style="margin-bottom:12px;display:flex;justify-content:space-between">
              <span>Rejected</span>
              <span class="badge badge-red">${rejected}</span>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span>Selected</span>
              <span class="badge badge-purple">${selected}</span>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Render chart
    if (totalApps > 0) {
      new Chart(document.getElementById('appsChart'), {
        type: 'doughnut',
        data: {
          labels: ['Applied', 'Shortlisted', 'Rejected', 'Selected'],
          datasets: [{ data: [applied, shortlisted, rejected, selected], backgroundColor: ['#6c63ff', '#00f5a0', '#ff4d6d', '#a855f7'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#888' } } }, cutout: '65%' }
      });
    }
  } catch (e) {
    page.innerHTML = '<div class="card" style="color:red">Error: ' + e.message + '</div>';
  }
};

// ── ADMIN USERS ──
window.load_admin_users = async function() {
  const page = document.getElementById('page-admin-users');
  page.innerHTML = '<div class="skeleton" style="height:300px"></div>';
  
  try {
    const data = await get('/admin/users');
    const users = data.users || [];
    page.innerHTML = `
      <div class="topbar"><div class="topbar-title">All Users (${users.length})</div></div>
      <div class="search-bar mb-24" style="max-width:400px">
        <span>🔍</span>
        <input type="text" placeholder="Search users..." oninput="adminSearchUsers(this.value)">
      </div>
      <div id="adminUsersList"></div>
    `;
    renderAdminUsers(users);
  } catch (e) { 
    page.innerHTML = '<div class="card" style="color:red">Error: ' + e.message + '</div>'; 
  }
};

let allAdminUsers = [];

function adminSearchUsers(q) {
  const filtered = allAdminUsers.filter(u => (u.name || '').toLowerCase().includes(q.toLowerCase()) || (u.email || '').toLowerCase().includes(q.toLowerCase()));
  renderAdminUsers(filtered);
}

function renderAdminUsers(users) {
  const el = document.getElementById('adminUsersList');
  if (!users.length) { el.innerHTML = '<div class="card" style="text-align:center;padding:60px">No users found</div>'; return; }
  el.innerHTML = `
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td style="font-weight:600">${u.name || '—'}</td>
                <td class="text-muted">${u.email || '—'}</td>
                <td><span class="badge ${u.role === 'admin' ? 'badge-red' : u.role === 'recruiter' ? 'badge-purple' : 'badge-blue'}">${u.role || ''}</span></td>
                <td>${u.role === 'recruiter' ? (u.recruiterRequestStatus === 'pending' ? '<span class="badge badge-yellow">Pending</span>' : u.recruiterRequestStatus === 'rejected' ? '<span class="badge badge-red">Rejected</span>' : '<span class="badge badge-green">Approved</span>') : '<span class="text-muted">—</span>'}</td>
                <td class="text-muted">${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                <td>
                  <select class="form-input" style="width:120px" onchange="changeUserRole('${u._id}', this.value)" ${u.role === 'admin' ? 'disabled' : ''}>
                    <option value="candidate" ${u.role === 'candidate' ? 'selected' : ''}>Candidate</option>
                    <option value="recruiter" ${u.role === 'recruiter' ? 'selected' : ''}>Recruiter</option>
                    <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                  </select>
                  ${u.role !== 'admin' ? '<button class="btn btn-danger btn-sm" style="margin-left:8px" onclick="deleteUser(\'' + u._id + '\')">Delete</button>' : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function changeUserRole(userId, role) {
  try {
    await patch('/admin/users/' + userId + '/role', { role });
    toast('Role updated', 'success');
    reloadPage('admin-users');
  } catch (e) { toast(e.message, 'error'); }
}

async function deleteUser(userId) {
  if (!confirm('Delete this user?')) return;
  try {
    await del('/admin/users/' + userId);
    toast('User deleted', 'success');
    reloadPage('admin-users');
  } catch (e) { toast(e.message, 'error'); }
}

// ── ADMIN JOBS ──
window.load_admin_jobs = async function() {
  const page = document.getElementById('page-admin-jobs');
  page.innerHTML = '<div class="skeleton" style="height:300px"></div>';
  
  try {
    const data = await get('/admin/jobs');
    const list = data.jobs || [];
    page.innerHTML = `
      <div class="topbar"><div class="topbar-title">All Jobs (${list.length})</div></div>
      <div id="adminJobsList"></div>
    `;
    renderAdminJobs(list);
  } catch (e) { 
    page.innerHTML = '<div class="card" style="color:red">Error: ' + e.message + '</div>'; 
  }
};

function renderAdminJobs(jobs) {
  const el = document.getElementById('adminJobsList');
  if (!jobs.length) { el.innerHTML = '<div class="card" style="text-align:center;padding:60px">No jobs found</div>'; return; }
  el.innerHTML = `
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Title</th><th>Company</th><th>Location</th><th>Type</th><th>Applicants</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${jobs.map(j => `
              <tr>
                <td style="font-weight:600">${j.title || '—'}</td>
                <td class="text-muted">${j.postedBy?.company || '—'}</td>
                <td>${j.location || '—'}</td>
                <td>${j.type || 'Full-time'}</td>
                <td><span class="badge badge-blue">${j.applicantCount || 0}</span></td>
                <td><span class="badge ${j.status === 'active' ? 'badge-green' : 'badge-red'}">${j.status || 'active'}</span></td>
                <td><button class="btn btn-glass btn-sm" onclick="viewJobDetails('${j._id}')">View</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function viewJobDetails(jobId) {
  try {
    const data = await get('/admin/jobs/' + jobId);
    const j = data.job;
    document.getElementById('profileModal').innerHTML = `
      <div class="modal-overlay open" onclick="this.classList.remove('open')">
        <div class="modal" style="max-width:680px" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title">${j.title || 'Job'}</div>
            <button type="button" class="modal-close" onclick="this.closest('.modal-overlay').classList.remove('open')">✕</button>
          </div>
          <div style="margin-bottom:16px">
            <span class="badge badge-purple">${j.type || 'Full-time'}</span>
            <span class="badge ${j.status === 'active' ? 'badge-green' : 'badge-red'}">${j.status || 'active'}</span>
          </div>
          <div style="color:var(--muted);margin-bottom:20px">${j.description || 'No description'}</div>
          <div class="form-label">Skills</div>
          <div class="flex gap-8" style="flex-wrap:wrap">${(j.skills || []).map(s => '<span class="badge badge-purple">' + s + '</span>').join('') || 'None'}</div>
          <div class="divider"></div>
          <div class="card-title">Applicants (${(data.applications || []).length})</div>
          <div>${(data.applications || []).map(a => '<div style="padding:8px 0;border-bottom:1px solid var(--border)">' + (a.candidate?.name || 'Unknown') + ' - ' + (a.status || '') + '</div>').join('') || 'No applicants'}</div>
        </div>
      </div>
    `;
  } catch (e) { toast(e.message, 'error'); }
}

// ── ADMIN RECRUITERS ──
window.load_admin_recruiters = async function() {
  const page = document.getElementById('page-admin-recruiters');
  page.innerHTML = '<div class="skeleton" style="height:300px"></div>';
  
  try {
    const data = await get('/admin/recruiters');
    const list = data.recruiters || [];
    page.innerHTML = `
      <div class="topbar"><div class="topbar-title">All Recruiters (${list.length})</div></div>
      <div id="adminRecruitersList"></div>
    `;
    renderAdminRecruiters(list);
  } catch (e) { 
    page.innerHTML = '<div class="card" style="color:red">Error: ' + e.message + '</div>'; 
  }
};

function renderAdminRecruiters(recruiters) {
  const el = document.getElementById('adminRecruitersList');
  if (!recruiters.length) { el.innerHTML = '<div class="card" style="text-align:center;padding:60px">No recruiters found</div>'; return; }
  el.innerHTML = `
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Status</th><th>Joined</th></tr></thead>
          <tbody>
            ${recruiters.map(r => `
              <tr>
                <td style="font-weight:600">${r.name || '—'}</td>
                <td class="text-muted">${r.email || '—'}</td>
                <td>${r.company || '—'}</td>
                <td>${r.isApprovedRecruiter ? '<span class="badge badge-green">Approved</span>' : '<span class="badge badge-yellow">Pending</span>'}</td>
                <td class="text-muted">${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ── ADMIN CANDIDATES ──
window.load_admin_candidates = async function() {
  const page = document.getElementById('page-admin-candidates');
  page.innerHTML = '<div class="skeleton" style="height:300px"></div>';
  
  try {
    const data = await get('/admin/candidates');
    const list = data.candidates || [];
    page.innerHTML = `
      <div class="topbar"><div class="topbar-title">All Candidates (${list.length})</div></div>
      <div id="adminCandidatesList"></div>
    `;
    renderAdminCandidates(list);
  } catch (e) { 
    page.innerHTML = '<div class="card" style="color:red">Error: ' + e.message + '</div>'; 
  }
};

function renderAdminCandidates(candidates) {
  const el = document.getElementById('adminCandidatesList');
  if (!candidates.length) { el.innerHTML = '<div class="card" style="text-align:center;padding:60px">No candidates found</div>'; return; }
  el.innerHTML = `
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Title</th><th>Skills</th><th>Joined</th></tr></thead>
          <tbody>
            ${candidates.map(c => `
              <tr>
                <td style="font-weight:600">${c.name || '—'}</td>
                <td class="text-muted">${c.email || '—'}</td>
                <td>${c.title || '—'}</td>
                <td>${(c.skills || []).slice(0,3).map(s => '<span class="job-tag">' + s + '</span>').join('')}</td>
                <td class="text-muted">${c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ── ADMIN RECRUITER REQUESTS ──
window.load_admin_recruiter_requests = async function() {
  const page = document.getElementById('page-admin-recruiter-requests');
  page.innerHTML = '<div class="skeleton" style="height:300px"></div>';
  
  try {
    const data = await get('/admin/recruiters');
    const pending = (data.recruiters || []).filter(r => r.recruiterRequestStatus === 'pending');
    page.innerHTML = `
      <div class="topbar"><div class="topbar-title">Recruiter Requests (${pending.length})</div></div>
      <div id="recruiterRequestsList"></div>
    `;
    renderRecruiterRequests(pending);
  } catch (e) { 
    page.innerHTML = '<div class="card" style="color:red">Error: ' + e.message + '</div>'; 
  }
};

function renderRecruiterRequests(recruiters) {
  const el = document.getElementById('recruiterRequestsList');
  if (!recruiters.length) { el.innerHTML = '<div class="card" style="text-align:center;padding:60px">No pending requests</div>'; return; }
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px">
      ${recruiters.map(r => `
        <div class="card flex-center gap-16">
          <div class="avatar">${(r.name||'?')[0]}</div>
          <div style="flex:1">
            <div style="font-weight:600">${r.name || 'Unknown'}</div>
            <div class="text-muted">${r.email || ''}</div>
            <div class="text-muted" style="font-size:12px">${r.company || 'No company'}</div>
          </div>
          <div class="flex gap-8">
            <button class="btn btn-success btn-sm" onclick="approveRecruiter('${r._id}')">Approve</button>
            <button class="btn btn-danger btn-sm" onclick="rejectRecruiter('${r._id}')">Reject</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

async function approveRecruiter(userId) {
  try {
    await patch('/admin/users/' + userId + '/approve-recruiter', {});
    toast('Recruiter approved', 'success');
    reloadPage('admin-recruiter-requests');
  } catch (e) { toast(e.message, 'error'); }
}

async function rejectRecruiter(userId) {
  try {
    await patch('/admin/users/' + userId + '/reject-recruiter', {});
    toast('Recruiter rejected', 'success');
    reloadPage('admin-recruiter-requests');
  } catch (e) { toast(e.message, 'error'); }
}