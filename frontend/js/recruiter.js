// ── RECRUITER DASHBOARD ──
async function load_dashboard() {
  if (state.user?.role === 'admin') await load_admin_dashboard();
  else if (state.user?.role === 'recruiter') await loadRecruiterDashboard();
  else await loadCandidateDashboard();
}

async function loadRecruiterDashboard() {
  const page = document.getElementById('page-dashboard');
  page.innerHTML = `
    <div class="topbar">
      <div>
        <div class="topbar-title">Good morning, <span>${state.user.name.split(' ')[0]}</span> 👋</div>
        <div class="text-muted">Here's what's happening today</div>
      </div>
      <button class="btn btn-primary" onclick="openModal('jobModal')">+ Post New Job</button>
    </div>
    <div class="stat-grid" id="recStats">
      ${['','','',''].map(() => `<div class="stat-card skeleton" style="height:100px"></div>`).join('')}
    </div>
    <div class="grid-2 mb-24">
      <div class="card">
        <div class="card-title">Application Trend</div>
        <div class="chart-container"><canvas id="appChart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-title">Pipeline Status</div>
        <div class="chart-container"><canvas id="pipeChart"></canvas></div>
      </div>
    </div>
    <div class="card">
      <div class="flex-center gap-12 mb-16">
        <div style="font-weight:700;font-size:16px">Recent Applicants</div>
        <button class="btn btn-glass btn-sm ml-auto" onclick="navigate('candidates')">View All →</button>
      </div>
      <div id="recentApplicants"><div class="skeleton" style="height:200px;border-radius:12px"></div></div>
    </div>
  `;

  try {
    const [stats, apps] = await Promise.all([
      get('/recruiter/stats'),
      get('/recruiter/applications?limit=5'),
    ]);
    renderRecStats(stats);
    renderRecentApplicants(apps.applications || []);
    renderCharts(stats);
  } catch {
    renderRecStats({ totalJobs: 0, totalApplicants: 0, shortlisted: 0, interviews: 0 });
    renderRecentApplicants([]);
    renderCharts({ trend: [], pipeline: {} });
  }
}

function renderRecStats(s) {
  document.getElementById('recStats').innerHTML = `
    <div class="stat-card blue fade-in">
      <div class="stat-icon">💼</div>
      <div class="card-title">Active Jobs</div>
      <div class="card-value">${s.totalJobs || 0}</div>
      <div class="card-delta">↑ 2 this week</div>
    </div>
    <div class="stat-card purple fade-in">
      <div class="stat-icon">👥</div>
      <div class="card-title">Total Applicants</div>
      <div class="card-value">${s.totalApplicants || 0}</div>
      <div class="card-delta">↑ 12% vs last month</div>
    </div>
    <div class="stat-card green fade-in">
      <div class="stat-icon">⭐</div>
      <div class="card-title">Shortlisted</div>
      <div class="card-value">${s.shortlisted || 0}</div>
      <div class="card-delta">Ready for interview</div>
    </div>
    <div class="stat-card red fade-in">
      <div class="stat-icon">📅</div>
      <div class="card-title">Interviews</div>
      <div class="card-value">${s.interviews || 0}</div>
      <div class="card-delta">This week</div>
    </div>
  `;
}

function renderRecentApplicants(apps) {
  const el = document.getElementById('recentApplicants');
  if (!apps.length) { el.innerHTML = `<p class="text-muted" style="text-align:center;padding:40px">No applicants yet</p>`; return; }
  el.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Candidate</th><th>Job</th><th>Applied</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${apps.map(a => `
            <tr>
              <td>
                <div class="flex-center gap-8">
                  <div class="avatar" style="width:32px;height:32px;font-size:13px">${(a.candidate?.name||'?')[0]}</div>
                  <div>
                    <div style="font-weight:600">${a.candidate?.name || 'Unknown'}</div>
                    <div class="text-muted" style="font-size:11px">${a.candidate?.email || ''}</div>
                  </div>
                </div>
              </td>
              <td>${a.job?.title || '—'}</td>
              <td class="text-muted">${timeAgo(a.createdAt)}</td>
              <td>${statusBadge(a.status)}</td>
              <td>
                <div class="flex gap-8">
                  <button class="btn btn-glass btn-sm" onclick="viewCandidate('${a._id}')">View</button>
                  <button class="btn btn-success btn-sm" onclick="updateStatus('${a._id}','shortlisted')">Shortlist</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderCharts(stats) {
  const chartDefaults = {
    color: '#e8eaf6',
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'transparent',
  };

  // Trend chart
  const trend = stats.trend || [4, 8, 6, 12, 9, 15, 11, 18, 14, 20, 16, 24];
  new Chart(document.getElementById('appChart'), {
    type: 'line',
    data: {
      labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      datasets: [{
        label: 'Applications',
        data: trend,
        borderColor: '#6c63ff',
        backgroundColor: 'rgba(108,99,255,0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#6c63ff',
        pointRadius: 4,
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' } } } }
  });

  // Pipeline chart
  new Chart(document.getElementById('pipeChart'), {
    type: 'doughnut',
    data: {
      labels: ['Applied','Reviewing','Shortlisted','Rejected'],
      datasets: [{
        data: [stats.pipeline?.applied || 40, stats.pipeline?.reviewing || 25, stats.pipeline?.shortlisted || 20, stats.pipeline?.rejected || 15],
        backgroundColor: ['#6c63ff','#ffd166','#00f5a0','#ff4d6d'],
        borderWidth: 0,
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#888', padding: 16 } } }, cutout: '65%' }
  });
}

// ── JOBS PAGE ──
async function load_jobs() {
  if (state.user?.role === 'admin') await load_admin_jobs();
  else if (state.user?.role === 'recruiter') await loadRecruiterJobs();
  else await loadCandidateJobs();
}

async function loadRecruiterJobs() {
  const page = document.getElementById('page-jobs');
  page.innerHTML = `
    <div class="topbar">
      <div class="topbar-title">Job Postings</div>
      <button class="btn btn-primary" onclick="openModal('jobModal')">+ Post New Job</button>
    </div>
    <div class="search-bar mb-24" style="max-width:400px">
      <span>🔍</span>
      <input type="text" placeholder="Search jobs..." oninput="filterJobs(this.value)">
    </div>
    <div id="jobsList"><div class="skeleton" style="height:300px;border-radius:16px"></div></div>
  `;
  await fetchAndRenderJobs();
}

let allJobs = [];
async function fetchAndRenderJobs() {
  try {
    const data = await get('/recruiter/jobs');
    allJobs = data.jobs || [];
    renderJobsTable(allJobs);
  } catch { renderJobsTable([]); }
}

function filterJobs(q) {
  const filtered = allJobs.filter(j => j.title.toLowerCase().includes(q.toLowerCase()) || j.location?.toLowerCase().includes(q.toLowerCase()));
  renderJobsTable(filtered);
}

function renderJobsTable(jobs) {
  const el = document.getElementById('jobsList');
  if (!jobs.length) { el.innerHTML = `<div class="card" style="text-align:center;padding:60px"><div style="font-size:48px;margin-bottom:16px">💼</div><div class="text-muted">No jobs posted yet. Create your first listing!</div></div>`; return; }
  el.innerHTML = `
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Job Title</th><th>Location</th><th>Type</th><th>Applicants</th><th>Status</th><th>Posted</th><th>Actions</th></tr></thead>
          <tbody>
            ${jobs.map(j => `
              <tr>
                <td>
                  <div style="font-weight:600">${j.title}</div>
                  <div class="text-muted" style="font-size:11px">${j.department || ''}</div>
                </td>
                <td class="text-muted">${j.location}</td>
                <td>${statusBadge(j.type || 'fulltime')}</td>
                <td>
                  <span class="badge badge-blue">${j.applicantCount || 0} applied</span>
                </td>
                <td>${statusBadge(j.status || 'active')}</td>
                <td class="text-muted">${timeAgo(j.createdAt)}</td>
                <td>
                  <div class="flex gap-8">
                    <button class="btn btn-glass btn-sm" onclick="navigate('candidates')">Applicants</button>
                    <div class="dropdown">
                      <button class="btn btn-glass btn-sm btn-icon" onclick="this.nextElementSibling.classList.toggle('open')">⋯</button>
                      <div class="dropdown-menu">
                        <div class="dropdown-item" onclick="editJob('${j._id}')">✏️ Edit</div>
                        <div class="dropdown-item" onclick="toggleJobStatus('${j._id}')">🔄 Toggle Status</div>
                        <div class="dropdown-item danger" onclick="deleteJob('${j._id}')">🗑️ Delete</div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function deleteJob(id) {
  if (!confirm('Delete this job?')) return;
  try { await del(`/jobs/${id}`); toast('Job deleted', 'success'); reloadPage('jobs'); } catch (e) { toast(e.message, 'error'); }
}

async function editJob(id) {
  try {
    const data = await get(`/jobs/${id}`);
    const j = data.job;
    document.getElementById('jobId').value = j._id;
    document.getElementById('jobTitle').value = j.title || '';
    document.getElementById('jobDesc').value = j.description || '';
    document.getElementById('jobLocation').value = j.location || '';
    document.getElementById('jobType').value = j.type || 'Full-time';
    document.getElementById('jobSalary').value = j.salary || '';
    document.getElementById('jobSkills').value = (j.skills || []).join(', ');
    document.getElementById('jobDept').value = j.department || '';
    openModal('jobModal');
  } catch (e) { toast(e.message, 'error'); }
}

async function toggleJobStatus(id) {
  try {
    const data = await get(`/jobs/${id}`);
    const j = data.job;
    const newStatus = j.status === 'active' ? 'closed' : 'active';
    await put(`/jobs/${id}`, { status: newStatus });
    toast(`Job ${newStatus === 'active' ? 'activated' : 'closed'}`, 'success');
    reloadPage('jobs');
  } catch (e) { toast(e.message, 'error'); }
}

async function submitJob(e) {
  e.preventDefault();
  const id = document.getElementById('jobId').value;
  const body = {
    title: document.getElementById('jobTitle').value,
    description: document.getElementById('jobDesc').value,
    location: document.getElementById('jobLocation').value,
    type: document.getElementById('jobType').value,
    salary: document.getElementById('jobSalary').value,
    skills: document.getElementById('jobSkills').value.split(',').map(s => s.trim()),
    department: document.getElementById('jobDept').value,
  };
  try {
    if (id) { await put(`/jobs/${id}`, body); toast('Job updated!', 'success'); }
    else { await post('/jobs', body); toast('Job posted!', 'success'); }
    closeModal('jobModal');
    document.getElementById('jobForm').reset();
    reloadPage('jobs');
  } catch (e) { toast(e.message, 'error'); }
}

// ── CANDIDATES PAGE ──
async function load_candidates() {
  if (state.user?.role === 'admin') await load_admin_candidates();
  else await loadRecruiterCandidates();
}

async function loadRecruiterCandidates() {
  const page = document.getElementById('page-candidates');
  page.innerHTML = `
    <div class="topbar">
      <div class="topbar-title">Candidates</div>
      <div class="flex gap-12">
        <select class="form-input" style="width:160px" onchange="filterByStatus(this.value)">
          <option value="">All Status</option>
          <option value="applied">Applied</option>
          <option value="reviewing">Reviewing</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
    </div>
    <div class="search-bar mb-24" style="max-width:400px">
      <span>🔍</span>
      <input type="text" placeholder="Search candidates..." oninput="searchCandidates(this.value)">
    </div>
    <div id="candidatesGrid"><div class="skeleton" style="height:400px;border-radius:16px"></div></div>
  `;
  await fetchCandidates();
}

let allApplications = [];
async function fetchCandidates(status = '') {
  try {
    const data = await get(`/recruiter/applications${status ? `?status=${status}` : ''}`);
    allApplications = data.applications || [];
    renderCandidatesGrid(allApplications);
  } catch { renderCandidatesGrid([]); }
}

function filterByStatus(status) { fetchCandidates(status); }

function searchCandidates(q) {
  const filtered = allApplications.filter(a =>
    a.candidate?.name?.toLowerCase().includes(q.toLowerCase()) ||
    a.candidate?.email?.toLowerCase().includes(q.toLowerCase())
  );
  renderCandidatesGrid(filtered);
}

function renderCandidatesGrid(apps) {
  const el = document.getElementById('candidatesGrid');
  if (!apps.length) { el.innerHTML = `<div class="card" style="text-align:center;padding:60px"><div style="font-size:48px;margin-bottom:16px">👥</div><div class="text-muted">No candidates found</div></div>`; return; }
  el.innerHTML = `<div style="display:flex;flex-direction:column;gap:12px">
    ${apps.map(a => `
      <div class="candidate-card">
        <div class="avatar">${(a.candidate?.name||'?')[0]}</div>
        <div class="candidate-info">
          <div class="candidate-name">${a.candidate?.name || 'Unknown'}</div>
          <div class="candidate-title">${a.candidate?.title || 'Job Seeker'} • Applied for <strong>${a.job?.title || '?'}</strong></div>
          <div class="flex gap-8 mt-auto" style="margin-top:8px">
            ${(a.candidate?.skills||[]).slice(0,3).map(s => `<span class="job-tag">${s}</span>`).join('')}
          </div>
        </div>
        <div style="text-align:right">
          ${statusBadge(a.status)}
          <div class="candidate-actions mt-auto" style="margin-top:12px">
            <button class="btn btn-glass btn-sm" onclick="viewCandidateProfile('${a._id}')">Profile</button>
            <div class="dropdown">
              <button class="btn btn-primary btn-sm" onclick="this.nextElementSibling.classList.toggle('open')">Actions ▾</button>
              <div class="dropdown-menu">
                <div class="dropdown-item" onclick="updateStatus('${a._id}','shortlisted')">⭐ Shortlist</div>
                <div class="dropdown-item" onclick="scheduleInterview('${a._id}', '${a.candidate?.name || ''}')">📅 Schedule Interview</div>
                <div class="dropdown-item" onclick="updateStatus('${a._id}','selected')">✅ Select</div>
                <div class="dropdown-item danger" onclick="updateStatus('${a._id}','rejected')">❌ Reject</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('')}
  </div>`;
}

async function updateStatus(appId, status) {
  try {
    await patch(`/recruiter/applications/${appId}/status`, { status });
    toast(`Status updated to ${status}`, 'success');
    reloadPage('candidates');
  } catch (e) { toast(e.message, 'error'); }
}

async function viewCandidate(appId) {
  await viewCandidateProfile(appId);
}

async function viewCandidateProfile(appId) {
  try {
    const data = await get(`/recruiter/applications/${appId}`);
    if (!data.application) {
      toast('Application not found', 'error');
      return;
    }
    const c = data.application?.candidate || {};
    const a = data.application || {};
    document.getElementById('profileModal').innerHTML = `
      <div class="modal-overlay open" id="profileModal" onclick="this.classList.remove('open')">
        <div class="modal" style="max-width:680px" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title">Candidate Profile</div>
            <button type="button" class="modal-close" onclick="this.closest('.modal-overlay').classList.remove('open')">✕</button>
          </div>
          <div class="profile-header" style="margin-bottom:20px">
            <div class="avatar lg">${(c.name||'?')[0]}</div>
            <div>
              <div style="font-size:22px;font-weight:800">${c.name||'Unknown'}</div>
              <div class="text-muted">${c.title||''}</div>
              <div class="text-muted" style="font-size:12px">${c.email||''}</div>
            </div>
            <div style="margin-left:auto;text-align:right">
              ${statusBadge(a.status)}
              <div style="margin-top:12px;display:flex;gap:8px">
                <button class="btn btn-success btn-sm" onclick="updateStatus('${appId}','shortlisted')">Shortlist</button>
                <button class="btn btn-danger btn-sm" onclick="updateStatus('${appId}','rejected')">Reject</button>
              </div>
            </div>
          </div>
          <div class="grid-2">
            <div>
              <div class="form-label">Skills</div>
              <div class="flex gap-8" style="flex-wrap:wrap;margin-bottom:16px">${(c.skills||[]).map(s=>`<span class="badge badge-purple">${s}</span>`).join('') || '<span class="text-muted">None listed</span>'}</div>
              <div class="form-label">Experience</div>
              <div style="font-size:14px;margin-bottom:16px">${c.experience||'Not specified'}</div>
              <div class="form-label">Education</div>
              <div style="font-size:14px">${c.education||'Not specified'}</div>
            </div>
            <div>
              <div class="form-label">Applied For</div>
              <div style="font-weight:600;margin-bottom:16px">${a.job?.title||'—'}</div>
              <div class="form-label">Applied</div>
              <div class="text-muted" style="font-size:13px;margin-bottom:16px">${formatDate(a.createdAt)}</div>
              ${c.resume?.data ? `<a href="${fileUrl(c.resume, c._id)}" target="_blank" class="btn btn-primary btn-sm w-full" style="justify-content:center">📄 Download Resume</a>` : `<div class="text-muted">No resume uploaded</div>`}
            </div>
          </div>
          <div class="divider"></div>
          <button class="btn btn-glass w-full" style="justify-content:center" onclick="openChatWith('${c._id}','${c.name}')">💬 Message Candidate</button>
        </div>
      </div>
    `;
  } catch (e) { 
    console.error('Error:', e);
    toast('Error loading candidate: ' + e.message, 'error');
  }
}

// ── INTERVIEWS ──
async function load_interviews() {
  const page = document.getElementById('page-interviews');
  const isRecruiter = state.user?.role === 'recruiter';
  
  page.innerHTML = `
    <div class="topbar">
      <div class="topbar-title">Interviews</div>
      ${isRecruiter ? '<button class="btn btn-primary" onclick="toast(\'Go to Candidates page and use Actions > Schedule Interview\', \'info\')">+ Schedule Interview</button>' : ''}
    </div>
    <div id="interviewsList"><div class="skeleton" style="height:300px;border-radius:16px"></div></div>
  `;
  try {
    const data = await get('/interviews');
    renderInterviews(data.interviews || [], isRecruiter);
  } catch { renderInterviews([], isRecruiter); }
}

function renderInterviews(interviews, isRecruiter = true) {
  const el = document.getElementById('interviewsList');
  if (!interviews.length) {
    el.innerHTML = `<div class="card" style="text-align:center;padding:60px"><div style="font-size:48px;margin-bottom:16px">📅</div><div class="text-muted">No interviews scheduled</div></div>`;
    return;
  }
  el.innerHTML = `
    <div class="timeline">
      ${interviews.map(i => `
        <div class="timeline-item">
          <div class="timeline-dot">📅</div>
          <div class="timeline-content card">
            <div class="flex-center gap-12">
              <div style="flex:1">
                <div class="timeline-title">${isRecruiter ? (i.candidate?.name||'Candidate') + ' — ' + (i.job?.title||'Role') : i.job?.title || 'Interview'}</div>
                <div class="timeline-time">${formatDate(i.scheduledAt)} at ${i.time||'TBD'} • ${i.type||'Video Call'}</div>
                ${i.meetLink ? `<a href="${i.meetLink}" class="text-accent" style="font-size:12px" target="_blank">🔗 Join Meeting</a>` : ''}
              </div>
              ${statusBadge(i.status||'scheduled')}
              ${isRecruiter ? '<button class="btn btn-danger btn-sm" style="margin-left:12px" onclick="deleteInterview(\'' + i._id + '\')">Delete</button>' : ''}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

async function deleteInterview(interviewId) {
  if (!confirm('Delete this interview?')) return;
  try {
    await del('/interviews/' + interviewId);
    toast('Interview deleted', 'success');
    reloadPage('interviews');
  } catch (e) { toast(e.message, 'error'); }
}

async function submitInterview(e) {
  e.preventDefault();
  const appId = document.getElementById('iAppId').value;
  if (!appId) {
    toast('Please select an application from the Candidates page first', 'error');
    return;
  }
  const body = {
    applicationId: appId,
    scheduledAt: document.getElementById('iDate').value,
    time: document.getElementById('iTime').value,
    type: document.getElementById('iType').value,
    meetLink: document.getElementById('iLink').value,
    notes: document.getElementById('iNotes').value,
  };
  try {
    await post('/interviews', body);
    toast('Interview scheduled!', 'success');
    closeModal('interviewModal');
    reloadPage('interviews');
  } catch (e) { toast(e.message, 'error'); }
}

// ── MESSAGES / CHAT ──
async function load_messages() {
  const page = document.getElementById('page-messages');
  page.innerHTML = `
    <div class="topbar"><div class="topbar-title">Messages</div></div>
    <div class="card" style="padding:0">
      <div class="chat-wrap">
        <div class="chat-list" id="chatList">
          <div class="skeleton" style="height:100%;border-radius:0"></div>
        </div>
        <div class="chat-main">
          <div class="chat-header" id="chatHeader">
            <div class="avatar">?</div>
            <div>
              <div style="font-weight:600">Select a conversation</div>
              <div class="text-muted" style="font-size:12px">Choose from the left panel</div>
            </div>
          </div>
          <div class="chat-messages" id="chatMessages">
            <div class="text-muted" style="text-align:center;padding:40px">No messages yet</div>
          </div>
          <div class="chat-input-bar">
            <input type="text" id="chatInput" placeholder="Type a message..." onkeydown="if(event.key==='Enter')sendMessage()">
            <button class="btn btn-primary btn-icon" onclick="sendMessage()">➤</button>
          </div>
        </div>
      </div>
    </div>
  `;
  await loadConversations();
}

let activeChatUserId = null;
async function loadConversations() {
  try {
    const data = await get('/messages/conversations');
    const list = document.getElementById('chatList');
    const convs = data.conversations || [];
    if (!convs.length) { list.innerHTML = `<div class="text-muted" style="padding:20px;text-align:center">No conversations yet</div>`; return; }
    list.innerHTML = convs.map(c => `
      <div class="chat-item" onclick="openConversation('${c.userId}','${c.name}')">
        <div class="avatar" style="width:36px;height:36px;font-size:14px">${c.name[0]}</div>
        <div class="chat-item-info">
          <div class="chat-item-name">${c.name}</div>
          <div class="chat-item-preview">${c.lastMessage || 'No messages'}</div>
        </div>
      </div>
    `).join('');
  } catch {}
}

async function openConversation(userId, name) {
  activeChatUserId = userId;
  document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
  document.getElementById('chatHeader').innerHTML = `<div class="avatar">${name[0]}</div><div><div style="font-weight:600">${name}</div><div class="text-muted" style="font-size:12px">Online</div></div>`;
  try {
    const data = await get(`/messages/${userId}`);
    renderMessages(data.messages || []);
  } catch { renderMessages([]); }
}

function renderMessages(msgs) {
  const el = document.getElementById('chatMessages');
  if (!msgs.length) { el.innerHTML = `<div class="text-muted" style="text-align:center;padding:40px">Start the conversation!</div>`; return; }
  el.innerHTML = msgs.map(m => `
    <div class="msg ${m.sender === state.user._id ? 'sent' : 'recv'}">${m.content}</div>
  `).join('');
  el.scrollTop = el.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const content = input.value.trim();
  if (!content || !activeChatUserId) return;
  input.value = '';
  try {
    await post('/messages', { receiverId: activeChatUserId, content });
    await openConversation(activeChatUserId, document.querySelector('.chat-header div div')?.textContent || '');
  } catch (e) { toast(e.message, 'error'); }
}

// ── ANALYTICS ──
async function load_analytics() {
  const page = document.getElementById('page-analytics');
  page.innerHTML = `
    <div class="topbar"><div class="topbar-title">Analytics</div></div>
    <div class="stat-grid mb-24" id="analyticsStats">
      ${[1,2,3,4].map(() => `<div class="stat-card skeleton" style="height:100px"></div>`).join('')}
    </div>
    <div class="grid-2">
      <div class="card"><div class="card-title">Applications Over Time</div><div class="chart-container"><canvas id="timeChart"></canvas></div></div>
      <div class="card"><div class="card-title">Top Job Performance</div><div id="topJobs"></div></div>
    </div>
  `;
  try {
    const data = await get('/recruiter/analytics');
    document.getElementById('analyticsStats').innerHTML = `
      <div class="stat-card blue fade-in"><div class="stat-icon">👁️</div><div class="card-title">Total Views</div><div class="card-value">${data.views||0}</div></div>
      <div class="stat-card purple fade-in"><div class="stat-icon">📝</div><div class="card-title">Applications</div><div class="card-value">${data.applications||0}</div></div>
      <div class="stat-card green fade-in"><div class="stat-icon">💰</div><div class="card-title">Conversion</div><div class="card-value">${data.conversion||0}%</div></div>
      <div class="stat-card red fade-in"><div class="stat-icon">⏱️</div><div class="card-title">Avg. Time to Hire</div><div class="card-value">${data.avgHire||0}d</div></div>
    `;
    // Render top jobs
    const jobs = data.topJobs || [];
    document.getElementById('topJobs').innerHTML = jobs.map(j => `
      <div style="margin-bottom:16px">
        <div class="flex-center gap-8 mb-8"><span style="font-size:13px;font-weight:600">${j.title}</span><span class="ml-auto text-muted">${j.count} apps</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(j.count * 5, 100)}%"></div></div>
      </div>
    `).join('') || '<div class="text-muted" style="padding:20px;text-align:center">No data yet</div>';

    new Chart(document.getElementById('timeChart'), {
      type: 'bar',
      data: {
        labels: data.trend?.map(t=>t.label) || ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        datasets: [{ label: 'Applications', data: data.trend?.map(t=>t.count) || [3,7,5,9,6,4,8], backgroundColor: 'rgba(108,99,255,0.6)', borderRadius: 8 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#888' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' } } } }
    });
  } catch {}
}

function scheduleInterview(appId, candidateName) {
  document.getElementById('iAppId').value = appId;
  document.getElementById('iAppIdDisplay').value = appId + ' - ' + (candidateName || '');
  openModal('interviewModal');
}