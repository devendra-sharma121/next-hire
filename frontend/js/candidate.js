// // ── CANDIDATE DASHBOARD ──
// async function loadCandidateDashboard() {
//   const page = document.getElementById('page-dashboard');
//   page.innerHTML = `
//     <div class="topbar">
//       <div>
//         <div class="topbar-title">Hey, <span>${state.user.name.split(' ')[0]}</span> 👋</div>
//         <div class="text-muted">Your job search at a glance</div>
//       </div>
//       <button class="btn btn-primary" onclick="navigate('profile')">Complete Profile</button>
//     </div>
//     <div class="stat-grid mb-24">
//       <div class="stat-card blue fade-in"><div class="stat-icon">📝</div><div class="card-title">Applied</div><div class="card-value" id="cApplied">—</div></div>
//       <div class="stat-card green fade-in"><div class="stat-icon">⭐</div><div class="card-title">Shortlisted</div><div class="card-value" id="cShortlisted">—</div></div>
//       <div class="stat-card purple fade-in"><div class="stat-icon">📅</div><div class="card-title">Interviews</div><div class="card-value" id="cInterviews">—</div></div>
//       <div class="stat-card red fade-in"><div class="stat-icon">❤️</div><div class="card-title">Saved Jobs</div><div class="card-value" id="cSaved">—</div></div>
//     </div>
//     <div class="grid-2">
//       <div class="card">
//         <div class="flex-center gap-12 mb-16">
//           <div style="font-weight:700;font-size:16px">Recommended Jobs</div>
//           <button class="btn btn-glass btn-sm ml-auto" onclick="navigate('jobs')">Browse All →</button>
//         </div>
//         <div id="recJobs"><div class="skeleton" style="height:200px;border-radius:12px"></div></div>
//       </div>
//       <div class="card">
//         <div style="font-weight:700;font-size:16px;margin-bottom:16px">Application Status</div>
//         <div id="appStatus"><div class="skeleton" style="height:200px;border-radius:12px"></div></div>
//       </div>
//     </div>
//   `;

//   try {
//     const [stats, jobs, apps] = await Promise.all([
//       get('/candidate/stats'),
//       get('/jobs?limit=3'),
//       get('/candidate/applications'),
//     ]);
//     document.getElementById('cApplied').textContent = stats.applied || 0;
//     document.getElementById('cShortlisted').textContent = stats.shortlisted || 0;
//     document.getElementById('cInterviews').textContent = stats.interviews || 0;
//     document.getElementById('cSaved').textContent = stats.saved || 0;
//     renderRecommendedJobs(jobs.jobs || []);
//     renderAppStatus(apps.applications || []);
//   } catch {
//     document.getElementById('cApplied').textContent = '0';
//     document.getElementById('cShortlisted').textContent = '0';
//     document.getElementById('cInterviews').textContent = '0';
//     document.getElementById('cSaved').textContent = '0';
//     renderRecommendedJobs([]);
//     renderAppStatus([]);
//   }
// }

// function renderRecommendedJobs(jobs) {
//   const el = document.getElementById('recJobs');
//   if (!jobs.length) { el.innerHTML = `<div class="text-muted" style="text-align:center;padding:20px">Complete your profile to get recommendations</div>`; return; }
//   el.innerHTML = `<div style="display:flex;flex-direction:column;gap:10px">
//     ${jobs.map(j => `
//       <div class="job-card" onclick="viewJobDetail('${j._id}')">
//         <div class="job-company">${j.company || 'Company'}</div>
//         <div class="job-title">${j.title}</div>
//         <div class="job-meta">
//           <span>📍 ${j.location}</span>
//           <span>💰 ${j.salary || 'Not disclosed'}</span>
//           <span class="ml-auto">${timeAgo(j.createdAt)}</span>
//         </div>
//       </div>
//     `).join('')}
//   </div>`;
// }

// function renderAppStatus(apps) {
//   const el = document.getElementById('appStatus');
//   if (!apps.length) { el.innerHTML = `<div class="text-muted" style="text-align:center;padding:20px">No applications yet</div>`; return; }
//   el.innerHTML = apps.slice(0,4).map(a => `
//     <div class="flex-center gap-12" style="padding:10px 0;border-bottom:1px solid var(--border)">
//       <div style="flex:1">
//         <div style="font-size:13px;font-weight:600">${a.job?.title||'—'}</div>
//         <div class="text-muted" style="font-size:11px">${timeAgo(a.createdAt)}</div>
//       </div>
//       ${statusBadge(a.status)}
//     </div>
//   `).join('');
// }

// // ── CANDIDATE: FIND JOBS ──
// async function loadCandidateJobs() {
//   const page = document.getElementById('page-jobs');
//   page.innerHTML = `
//     <div class="topbar"><div class="topbar-title">Find Jobs</div></div>
//     <div class="flex gap-12 mb-24" style="flex-wrap:wrap">
//       <div class="search-bar" style="flex:1;min-width:200px">
//         <span>🔍</span>
//         <input type="text" placeholder="Job title, skills, company..." oninput="candidateSearchJobs(this.value)">
//       </div>
//       <select class="form-input" style="width:150px" onchange="candidateFilterJobs('type',this.value)">
//         <option value="">All Types</option>
//         <option>Full-time</option><option>Part-time</option><option>Remote</option><option>Contract</option>
//       </select>
//       <select class="form-input" style="width:150px" onchange="candidateFilterJobs('location',this.value)">
//         <option value="">All Locations</option>
//         <option>Remote</option><option>New York</option><option>San Francisco</option><option>London</option>
//       </select>
//     </div>
//     <div id="jobsGrid" class="grid-3"><div class="skeleton" style="height:300px;border-radius:16px"></div></div>
//   `;
//   await loadAllJobs();
// }

// let allPublicJobs = [];
// async function loadAllJobs() {
//   try {
//     const data = await get('/jobs');
//     allPublicJobs = data.jobs || [];
//     renderPublicJobs(allPublicJobs);
//   } catch { renderPublicJobs([]); }
// }

// function candidateSearchJobs(q) {
//   renderPublicJobs(allPublicJobs.filter(j =>
//     j.title?.toLowerCase().includes(q.toLowerCase()) ||
//     j.skills?.some(s => s.toLowerCase().includes(q.toLowerCase()))
//   ));
// }

// function candidateFilterJobs(key, val) {
//   if (!val) return renderPublicJobs(allPublicJobs);
//   renderPublicJobs(allPublicJobs.filter(j => j[key]?.toLowerCase().includes(val.toLowerCase())));
// }

// function renderPublicJobs(jobs) {
//   const el = document.getElementById('jobsGrid');
//   if (!jobs.length) { el.innerHTML = `<div class="card" style="text-align:center;padding:60px;grid-column:1/-1"><div style="font-size:48px;margin-bottom:16px">🔍</div><div class="text-muted">No jobs found</div></div>`; return; }
//   el.innerHTML = jobs.map(j => `
//     <div class="job-card" onclick="viewJobDetail('${j._id}')">
//       <div class="job-company">${j.company || (j.postedBy?.company) || 'Company'}</div>
//       <div class="job-title">${j.title}</div>
//       <div class="job-tags">${(j.skills||[]).slice(0,3).map(s=>`<span class="job-tag">${s}</span>`).join('')}</div>
//       <div class="job-meta">
//         <span>📍 ${j.location}</span>
//         <span>⏰ ${j.type||'Full-time'}</span>
//       </div>
//       <div class="divider"></div>
//       <div class="flex gap-8">
//         <span style="font-size:12px;color:var(--green)">💰 ${j.salary||'Not disclosed'}</span>
//         <button class="btn btn-primary btn-sm ml-auto" onclick="event.stopPropagation();applyToJob('${j._id}')">Apply Now</button>
//       </div>
//     </div>
//   `).join('');
// }

// async function viewJobDetail(jobId) {
//   try {
//     const data = await get(`/jobs/${jobId}`);
//     const j = data.job;
//     document.getElementById('jobDetailModal').innerHTML = `
//       <div class="modal-overlay open" id="jobDetailModal" onclick="this.classList.remove('open')">
//         <div class="modal" style="max-width:640px" onclick="event.stopPropagation()">
//           <div class="modal-header">
//             <div class="modal-title">${j.title}</div>
//             <button class="modal-close" onclick="document.getElementById('jobDetailModal').classList.remove('open')">✕</button>
//           </div>
//           <div class="flex-center gap-12 mb-16">
//             <span class="badge badge-blue">${j.type||'Full-time'}</span>
//             <span class="badge badge-purple">📍 ${j.location}</span>
//             <span class="badge badge-green">💰 ${j.salary||'Competitive'}</span>
//           </div>
//           <div style="font-size:14px;line-height:1.8;color:var(--muted);margin-bottom:20px">${j.description}</div>
//           <div class="form-label">Required Skills</div>
//           <div class="flex gap-8" style="flex-wrap:wrap;margin-bottom:20px">${(j.skills||[]).map(s=>`<span class="badge badge-purple">${s}</span>`).join('')}</div>
//           <div class="divider"></div>
//           <div class="flex gap-12">
//             <button class="btn btn-primary" style="flex:1;justify-content:center" onclick="applyToJob('${j._id}')">⚡ Apply Now</button>
//             <button class="btn btn-glass" onclick="saveJob('${j._id}')">❤️ Save</button>
//           </div>
//         </div>
//       </div>
//     `;
//   } catch (e) { toast(e.message, 'error'); }
// }

// async function applyToJob(jobId) {
//   try {
//     await post('/applications', { jobId });
//     toast('Application submitted! 🎉', 'success');
//     document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
//   } catch (e) { toast(e.message, 'error'); }
// }

// async function saveJob(jobId) {
//   try {
//     await post(`/jobs/${jobId}/save`);
//     toast('Job saved! ❤️', 'success');
//   } catch (e) { toast(e.message, 'error'); }
// }

// // ── CANDIDATE: MY APPLICATIONS ──
// async function load_applications() {
//   const page = document.getElementById('page-applications');
//   page.innerHTML = `
//     <div class="topbar"><div class="topbar-title">My Applications</div></div>
//     <div class="tabs mb-24">
//       <button class="tab active" onclick="filterMyApps('')">All</button>
//       <button class="tab" onclick="filterMyApps('applied')">Applied</button>
//       <button class="tab" onclick="filterMyApps('shortlisted')">Shortlisted</button>
//       <button class="tab" onclick="filterMyApps('rejected')">Rejected</button>
//     </div>
//     <div id="myApps"><div class="skeleton" style="height:300px;border-radius:16px"></div></div>
//   `;
//   await loadMyApplications();
// }

// let myApps = [];
// async function loadMyApplications() {
//   try {
//     const data = await get('/candidate/applications');
//     myApps = data.applications || [];
//     renderMyApps(myApps);
//   } catch { renderMyApps([]); }
// }

// function filterMyApps(status) {
//   document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
//   event.target.classList.add('active');
//   renderMyApps(status ? myApps.filter(a => a.status === status) : myApps);
// }

// function renderMyApps(apps) {
//   const el = document.getElementById('myApps');
//   if (!apps.length) { el.innerHTML = `<div class="card" style="text-align:center;padding:60px"><div style="font-size:48px;margin-bottom:16px">📝</div><div class="text-muted">No applications found</div><button class="btn btn-primary" style="margin-top:16px" onclick="navigate('jobs')">Find Jobs</button></div>`; return; }
//   el.innerHTML = `<div style="display:flex;flex-direction:column;gap:12px">
//     ${apps.map(a => `
//       <div class="card flex-center gap-16">
//         <div style="flex:1">
//           <div style="font-weight:700;font-size:16px">${a.job?.title||'—'}</div>
//           <div class="text-muted">${a.job?.company||''} • ${a.job?.location||''}</div>
//           <div class="text-muted" style="font-size:12px;margin-top:4px">Applied ${timeAgo(a.createdAt)}</div>
//         </div>
//         <div style="text-align:right">
//           ${statusBadge(a.status)}
//           ${a.interviewDate ? `<div style="font-size:12px;color:var(--accent);margin-top:4px">📅 ${formatDate(a.interviewDate)}</div>` : ''}
//         </div>
//       </div>
//     `).join('')}
//   </div>`;
// }

// // ── CANDIDATE: SAVED JOBS ──
// async function load_saved() {
//   const page = document.getElementById('page-saved');
//   page.innerHTML = `
//     <div class="topbar"><div class="topbar-title">Saved Jobs ❤️</div></div>
//     <div id="savedJobsList"><div class="skeleton" style="height:300px;border-radius:16px"></div></div>
//   `;
//   try {
//     const data = await get('/candidate/saved');
//     renderPublicJobsSaved(data.jobs || []);
//   } catch {}
// }

// function renderPublicJobsSaved(jobs) {
//   const el = document.getElementById('savedJobsList');
//   if (!jobs.length) { el.innerHTML = `<div class="card" style="text-align:center;padding:60px"><div style="font-size:48px;margin-bottom:16px">❤️</div><div class="text-muted">No saved jobs</div><button class="btn btn-primary" style="margin-top:16px" onclick="navigate('jobs')">Browse Jobs</button></div>`; return; }
//   el.innerHTML = `<div class="grid-3">${jobs.map(j => `
//     <div class="job-card">
//       <div class="job-company">${j.company||''}</div>
//       <div class="job-title">${j.title}</div>
//       <div class="job-meta"><span>📍 ${j.location}</span></div>
//       <div class="divider"></div>
//       <div class="flex gap-8">
//         <button class="btn btn-primary btn-sm" onclick="applyToJob('${j._id}')">Apply</button>
//         <button class="btn btn-danger btn-sm" onclick="saveJob('${j._id}')">Remove</button>
//       </div>
//     </div>
//   `).join('')}</div>`;
// }

// // ── CANDIDATE: PROFILE ──
// async function load_profile() {
//   const page = document.getElementById('page-profile');
//   page.innerHTML = `
//     <div class="topbar"><div class="topbar-title">My Profile</div><button class="btn btn-primary" onclick="openModal('editProfileModal')">✏️ Edit Profile</button></div>
//     <div class="profile-header">
//       <div class="avatar lg">${state.user.name[0]}</div>
//       <div>
//         <div style="font-size:24px;font-weight:800">${state.user.name}</div>
//         <div class="text-muted" id="profileTitle">Loading...</div>
//         <div class="text-muted" style="font-size:12px">${state.user.email}</div>
//       </div>
//       <div class="profile-stats" id="profileStats"></div>
//     </div>
//     <div class="grid-2">
//       <div class="card">
//         <div class="form-label mb-16">Skills</div>
//         <div id="profileSkills" class="flex gap-8" style="flex-wrap:wrap"></div>
//         <div class="divider"></div>
//         <div class="form-label mb-8">About</div>
//         <div id="profileBio" class="text-muted" style="font-size:14px;line-height:1.7"></div>
//       </div>
//       <div class="card">
//         <div class="form-label mb-16">Education & Experience</div>
//         <div id="profileExp"></div>
//         <div class="divider"></div>
//         <div class="form-label mb-8">Resume</div>
//         <div id="profileResume"></div>
//       </div>
//     </div>
//   `;
//   try {
//     const data = await get('/candidate/profile');
//     const p = data.profile || {};
//     document.getElementById('profileTitle').textContent = p.title || 'Job Seeker';
//     document.getElementById('profileBio').textContent = p.bio || 'No bio added yet.';
//     document.getElementById('profileSkills').innerHTML = (p.skills||[]).map(s => `<span class="badge badge-purple">${s}</span>`).join('') || '<span class="text-muted">No skills added</span>';
//     document.getElementById('profileExp').innerHTML = `
//       <div style="margin-bottom:12px"><div style="font-weight:600;font-size:13px">Experience</div><div class="text-muted">${p.experience||'Not specified'}</div></div>
//       <div><div style="font-weight:600;font-size:13px">Education</div><div class="text-muted">${p.education||'Not specified'}</div></div>
//     `;
//     document.getElementById('profileResume').innerHTML = p.resume
//       ? `<a href="${p.resume}" target="_blank" class="btn btn-primary btn-sm">📄 View Resume</a>`
//       : `<button class="btn btn-glass btn-sm" onclick="openModal('uploadResumeModal')">📤 Upload Resume</button>`;
//     document.getElementById('profileStats').innerHTML = `
//       <div class="profile-stat"><div class="profile-stat-value">${data.stats?.applied||0}</div><div class="profile-stat-label">Applied</div></div>
//       <div class="profile-stat"><div class="profile-stat-value">${data.stats?.shortlisted||0}</div><div class="profile-stat-label">Shortlisted</div></div>
//       <div class="profile-stat"><div class="profile-stat-value">${data.stats?.interviews||0}</div><div class="profile-stat-label">Interviews</div></div>
//     `;
//   } catch {}
// }

// async function submitProfile(e) {
//   e.preventDefault();
//   const body = {
//     title: document.getElementById('pTitle').value,
//     bio: document.getElementById('pBio').value,
//     skills: document.getElementById('pSkills').value.split(',').map(s=>s.trim()),
//     experience: document.getElementById('pExp').value,
//     education: document.getElementById('pEdu').value,
//     linkedin: document.getElementById('pLinkedin').value,
//     github: document.getElementById('pGithub').value,
//   };
//   try {
//     await put('/candidate/profile', body);
//     toast('Profile updated!', 'success');
//     closeModal('editProfileModal');
//     reloadPage('profile');
//   } catch (e) { toast(e.message, 'error'); }
// }

// async function uploadResume(e) {
//   e.preventDefault();
//   const fileInput = document.getElementById('resumeFile');
//   const file = fileInput.files[0];
//   if (!file) { toast('Select a file', 'error'); return; }
//   const formData = new FormData();
//   formData.append('resume', file);
//   const token = store.get('token');
//   try {
//     const res = await fetch(`${API}/candidate/resume`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
//     const data = await res.json();
//     if (!res.ok) throw new Error(data.message);
//     toast('Resume uploaded!', 'success');
//     closeModal('uploadResumeModal');
//     reloadPage('profile');
//   } catch (e) { toast(e.message, 'error'); }
// }

// function openChatWith(userId, name) {
//   document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
//   reloadPage('messages');
//   setTimeout(() => { activeChatUserId = userId; openConversation(userId, name); }, 300);
// }




// ── CANDIDATE DASHBOARD ──
async function loadCandidateDashboard() {
  const page = document.getElementById('page-dashboard');
  page.innerHTML = `
    <div class="topbar">
      <div>
        <div class="topbar-title">Hey, <span>${state.user.name.split(' ')[0]}</span> 👋</div>
        <div class="text-muted">Your job search at a glance</div>
      </div>
      <button class="btn btn-primary" onclick="navigate('profile')">Complete Profile</button>
    </div>
    <div class="stat-grid mb-24">
      <div class="stat-card blue fade-in"><div class="stat-icon">📝</div><div class="card-title">Applied</div><div class="card-value" id="cApplied">—</div></div>
      <div class="stat-card green fade-in"><div class="stat-icon">⭐</div><div class="card-title">Shortlisted</div><div class="card-value" id="cShortlisted">—</div></div>
      <div class="stat-card purple fade-in"><div class="stat-icon">📅</div><div class="card-title">Interviews</div><div class="card-value" id="cInterviews">—</div></div>
      <div class="stat-card red fade-in"><div class="stat-icon">❤️</div><div class="card-title">Saved Jobs</div><div class="card-value" id="cSaved">—</div></div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="flex-center gap-12 mb-16">
          <div style="font-weight:700;font-size:16px">Recommended Jobs</div>
          <button class="btn btn-glass btn-sm ml-auto" onclick="navigate('jobs')">Browse All →</button>
        </div>
        <div id="recJobs"><div class="skeleton" style="height:200px;border-radius:12px"></div></div>
      </div>
      <div class="card">
        <div style="font-weight:700;font-size:16px;margin-bottom:16px">Application Status</div>
        <div id="appStatus"><div class="skeleton" style="height:200px;border-radius:12px"></div></div>
      </div>
    </div>
  `;

  try {
    const [stats, jobs, apps] = await Promise.all([
      get('/candidate/stats'),
      get('/jobs?limit=3'),
      get('/candidate/applications'),
    ]);
    document.getElementById('cApplied').textContent = stats.applied || 0;
    document.getElementById('cShortlisted').textContent = stats.shortlisted || 0;
    document.getElementById('cInterviews').textContent = stats.interviews || 0;
    document.getElementById('cSaved').textContent = stats.saved || 0;
    renderRecommendedJobs(jobs.jobs || []);
    renderAppStatus(apps.applications || []);
  } catch {
    document.getElementById('cApplied').textContent = '0';
    document.getElementById('cShortlisted').textContent = '0';
    document.getElementById('cInterviews').textContent = '0';
    document.getElementById('cSaved').textContent = '0';
    renderRecommendedJobs([]);
    renderAppStatus([]);
  }
}

function renderRecommendedJobs(jobs) {
  const el = document.getElementById('recJobs');
  if (!jobs.length) { el.innerHTML = `<div class="text-muted" style="text-align:center;padding:20px">Complete your profile to get recommendations</div>`; return; }
  el.innerHTML = `<div style="display:flex;flex-direction:column;gap:10px">
    ${jobs.map(j => `
      <div class="job-card" onclick="viewJobDetail('${j._id}')">
        <div class="job-company">${j.company || 'Company'}</div>
        <div class="job-title">${j.title}</div>
        <div class="job-meta">
          <span>📍 ${j.location}</span>
          <span>💰 ${j.salary || 'Not disclosed'}</span>
          <span class="ml-auto">${timeAgo(j.createdAt)}</span>
        </div>
      </div>
    `).join('')}
  </div>`;
}

function renderAppStatus(apps) {
  const el = document.getElementById('appStatus');
  if (!apps.length) { el.innerHTML = `<div class="text-muted" style="text-align:center;padding:20px">No applications yet</div>`; return; }
  el.innerHTML = apps.slice(0,4).map(a => `
    <div class="flex-center gap-12" style="padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="flex:1">
        <div style="font-size:13px;font-weight:600">${a.job?.title||'—'}</div>
        <div class="text-muted" style="font-size:11px">${timeAgo(a.createdAt)}</div>
      </div>
      ${statusBadge(a.status)}
    </div>
  `).join('');
}

// ── CANDIDATE: FIND JOBS ──
async function loadCandidateJobs() {
  const page = document.getElementById('page-jobs');
  page.innerHTML = `
    <div class="topbar"><div class="topbar-title">Find Jobs</div></div>
    <div class="flex gap-12 mb-24" style="flex-wrap:wrap">
      <div class="search-bar" style="flex:1;min-width:200px">
        <span>🔍</span>
        <input type="text" placeholder="Job title, skills, company..." oninput="candidateSearchJobs(this.value)">
      </div>
      <select class="form-input" style="width:150px" onchange="candidateFilterJobs('type',this.value)">
        <option value="">All Types</option>
        <option>Full-time</option><option>Part-time</option><option>Remote</option><option>Contract</option>
      </select>
    </div>
    <div id="jobsGrid" class="grid-3"><div class="skeleton" style="height:300px;border-radius:16px"></div></div>
  `;
  await loadAllJobs();
}

let allPublicJobs = [];
async function loadAllJobs() {
  try {
    const data = await get('/jobs');
    allPublicJobs = data.jobs || [];
    renderPublicJobs(allPublicJobs);
  } catch { renderPublicJobs([]); }
}

function candidateSearchJobs(q) {
  renderPublicJobs(allPublicJobs.filter(j =>
    j.title?.toLowerCase().includes(q.toLowerCase()) ||
    j.skills?.some(s => s.toLowerCase().includes(q.toLowerCase()))
  ));
}

function candidateFilterJobs(key, val) {
  if (!val) return renderPublicJobs(allPublicJobs);
  renderPublicJobs(allPublicJobs.filter(j => j[key]?.toLowerCase().includes(val.toLowerCase())));
}

function renderPublicJobs(jobs) {
  const el = document.getElementById('jobsGrid');
  if (!jobs.length) { el.innerHTML = `<div class="card" style="text-align:center;padding:60px;grid-column:1/-1"><div style="font-size:48px;margin-bottom:16px">🔍</div><div class="text-muted">No jobs found</div></div>`; return; }
  el.innerHTML = jobs.map(j => `
    <div class="job-card" onclick="viewJobDetail('${j._id}')">
      <div class="job-company">${j.company || (j.postedBy?.company) || 'Company'}</div>
      <div class="job-title">${j.title}</div>
      <div class="job-tags">${(j.skills||[]).slice(0,3).map(s=>`<span class="job-tag">${s}</span>`).join('')}</div>
      <div class="job-meta">
        <span>📍 ${j.location}</span>
        <span>⏰ ${j.type||'Full-time'}</span>
      </div>
      <div class="divider"></div>
      <div class="flex gap-8">
        <span style="font-size:12px;color:var(--green)">💰 ${j.salary||'Not disclosed'}</span>
        <button class="btn btn-primary btn-sm ml-auto" onclick="event.stopPropagation();applyToJob('${j._id}')">Apply Now</button>
      </div>
    </div>
  `).join('');
}

async function viewJobDetail(jobId) {
  try {
    const data = await get(`/jobs/${jobId}`);
    const j = data.job;
    document.getElementById('jobDetailModal').innerHTML = `
      <div class="modal-overlay open" id="jobDetailModal" onclick="this.classList.remove('open')">
        <div class="modal" style="max-width:640px" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title">${j.title}</div>
            <button class="modal-close" onclick="this.closest('.modal-overlay').classList.remove('open')">✕</button>
          </div>
          <div class="flex-center gap-12 mb-16">
            <span class="badge badge-blue">${j.type||'Full-time'}</span>
            <span class="badge badge-purple">📍 ${j.location}</span>
            <span class="badge badge-green">💰 ${j.salary||'Competitive'}</span>
          </div>
          <div style="font-size:14px;line-height:1.8;color:var(--muted);margin-bottom:20px">${j.description}</div>
          <div class="form-label">Required Skills</div>
          <div class="flex gap-8" style="flex-wrap:wrap;margin-bottom:20px">${(j.skills||[]).map(s=>`<span class="badge badge-purple">${s}</span>`).join('')}</div>
          <div class="divider"></div>
          <div class="flex gap-12">
            <button class="btn btn-primary" style="flex:1;justify-content:center" onclick="applyToJob('${j._id}')">⚡ Apply Now</button>
            <button class="btn btn-glass" onclick="saveJob('${j._id}')">❤️ Save</button>
          </div>
        </div>
      </div>
    `;
  } catch (e) { toast(e.message, 'error'); }
}

async function applyToJob(jobId) {
  try {
    const profileRes = await get('/candidate/profile');
    if (!profileRes.profile?.hasResume) {
      toast('Please upload your resume before applying', 'error');
      openModal('uploadResumeModal');
      return;
    }
    await post('/applications', { jobId });
    toast('Application submitted! 🎉', 'success');
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
  } catch (e) { toast(e.message, 'error'); }
}

async function saveJob(jobId) {
  try {
    const res = await post(`/jobs/${jobId}/save`);
    const savedList = document.getElementById('savedJobsList');
    if (!res.saved) {
      toast('Job removed from saved', 'success');
      if (savedList) {
        const data = await get('/candidate/saved');
        renderPublicJobsSaved(data.jobs || []);
      }
    } else {
      toast('Job saved! ❤️', 'success');
    }
  } catch (e) { toast(e.message, 'error'); }
}

// ── CANDIDATE: MY APPLICATIONS ──
async function load_applications() {
  const page = document.getElementById('page-applications');
  page.innerHTML = `
    <div class="topbar"><div class="topbar-title">My Applications</div></div>
    <div class="tabs mb-24">
      <button class="tab active" onclick="filterMyApps('')">All</button>
      <button class="tab" onclick="filterMyApps('applied')">Applied</button>
      <button class="tab" onclick="filterMyApps('shortlisted')">Shortlisted</button>
      <button class="tab" onclick="filterMyApps('rejected')">Rejected</button>
    </div>
    <div id="myApps"><div class="skeleton" style="height:300px;border-radius:16px"></div></div>
  `;
  await loadMyApplications();
}

let myApps = [];
async function loadMyApplications() {
  try {
    const data = await get('/candidate/applications');
    myApps = data.applications || [];
    renderMyApps(myApps);
  } catch { renderMyApps([]); }
}

function filterMyApps(status) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  renderMyApps(status ? myApps.filter(a => a.status === status) : myApps);
}

function renderMyApps(apps) {
  const el = document.getElementById('myApps');
  if (!apps.length) { el.innerHTML = `<div class="card" style="text-align:center;padding:60px"><div style="font-size:48px;margin-bottom:16px">📝</div><div class="text-muted">No applications found</div><button class="btn btn-primary" style="margin-top:16px" onclick="navigate('jobs')">Find Jobs</button></div>`; return; }
  el.innerHTML = `<div style="display:flex;flex-direction:column;gap:12px">
    ${apps.map(a => `
      <div class="card flex-center gap-16">
        <div style="flex:1">
          <div style="font-weight:700;font-size:16px">${a.job?.title||'—'}</div>
          <div class="text-muted">${a.job?.company||''} • ${a.job?.location||''}</div>
          <div class="text-muted" style="font-size:12px;margin-top:4px">Applied ${timeAgo(a.createdAt)}</div>
        </div>
        <div style="text-align:right">
          ${statusBadge(a.status)}
          ${a.interviewDate ? `<div style="font-size:12px;color:var(--accent);margin-top:4px">📅 ${formatDate(a.interviewDate)}</div>` : ''}
        </div>
      </div>
    `).join('')}
  </div>`;
}

// ── CANDIDATE: SAVED JOBS ──
async function load_saved() {
  const page = document.getElementById('page-saved');
  page.innerHTML = `
    <div class="topbar"><div class="topbar-title">Saved Jobs ❤️</div></div>
    <div id="savedJobsList"><div class="skeleton" style="height:300px;border-radius:16px"></div></div>
  `;
  try {
    const data = await get('/candidate/saved');
    renderPublicJobsSaved(data.jobs || []);
  } catch {}
}

function renderPublicJobsSaved(jobs) {
  const el = document.getElementById('savedJobsList');
  if (!jobs.length) { el.innerHTML = `<div class="card" style="text-align:center;padding:60px"><div style="font-size:48px;margin-bottom:16px">❤️</div><div class="text-muted">No saved jobs</div><button class="btn btn-primary" style="margin-top:16px" onclick="navigate('jobs')">Browse Jobs</button></div>`; return; }
  el.innerHTML = `<div class="grid-3">${jobs.map(j => `
    <div class="job-card">
      <div class="job-company">${j.company||''}</div>
      <div class="job-title">${j.title}</div>
      <div class="job-meta"><span>📍 ${j.location}</span></div>
      <div class="divider"></div>
      <div class="flex gap-8">
        <button class="btn btn-primary btn-sm" onclick="applyToJob('${j._id}')">Apply</button>
        <button class="btn btn-danger btn-sm" onclick="saveJob('${j._id}')">Remove</button>
      </div>
    </div>
  `).join('')}</div>`;
}

// ── CANDIDATE: PROFILE ──
async function load_profile() {
  const page = document.getElementById('page-profile');
  page.innerHTML = `
    <div class="topbar"><div class="topbar-title">My Profile</div><button class="btn btn-primary" onclick="openModal('editProfileModal')">✏️ Edit Profile</button></div>
    <div class="profile-header">
      <div class="avatar lg">${state.user.name[0]}</div>
      <div>
        <div style="font-size:24px;font-weight:800">${state.user.name}</div>
        <div class="text-muted" id="profileTitle">Loading...</div>
        <div class="text-muted" style="font-size:12px">${state.user.email}</div>
      </div>
      <div class="profile-stats" id="profileStats"></div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="form-label mb-16">Skills</div>
        <div id="profileSkills" class="flex gap-8" style="flex-wrap:wrap"></div>
        <div class="divider"></div>
        <div class="form-label mb-8">About</div>
        <div id="profileBio" class="text-muted" style="font-size:14px;line-height:1.7"></div>
      </div>
      <div class="card">
        <div class="form-label mb-16">Education & Experience</div>
        <div id="profileExp"></div>
        <div class="divider"></div>
        <div class="form-label mb-8">Resume</div>
        <div id="profileResume"></div>
      </div>
    </div>
  `;
  try {
    const data = await get('/candidate/profile');
    const p = data.profile || {};
    document.getElementById('profileTitle').textContent = p.title || 'Job Seeker';
    document.getElementById('profileBio').textContent = p.bio || 'No bio added yet.';
    document.getElementById('profileSkills').innerHTML = (p.skills||[]).map(s => `<span class="badge badge-purple">${s}</span>`).join('') || '<span class="text-muted">No skills added</span>';
    document.getElementById('profileExp').innerHTML = `
      <div style="margin-bottom:12px"><div style="font-weight:600;font-size:13px">Experience</div><div class="text-muted">${p.experience||'Not specified'}</div></div>
      <div><div style="font-weight:600;font-size:13px">Education</div><div class="text-muted">${p.education||'Not specified'}</div></div>
    `;
    document.getElementById('profileResume').innerHTML = p.hasResume
      ? `<a href="http://localhost:5002/api/candidate/resume?token=${state.token}" target="_blank" class="btn btn-primary btn-sm">📄 View Resume</a>`
      : `<button class="btn btn-glass btn-sm" onclick="openModal('uploadResumeModal')">📤 Upload Resume</button>`;
    document.getElementById('profileStats').innerHTML = `
      <div class="profile-stat"><div class="profile-stat-value">${data.stats?.applied||0}</div><div class="profile-stat-label">Applied</div></div>
      <div class="profile-stat"><div class="profile-stat-value">${data.stats?.shortlisted||0}</div><div class="profile-stat-label">Shortlisted</div></div>
      <div class="profile-stat"><div class="profile-stat-value">${data.stats?.interviews||0}</div><div class="profile-stat-label">Interviews</div></div>
    `;
  } catch {}
}

async function submitProfile(e) {
  e.preventDefault();
  const body = {
    title: document.getElementById('pTitle').value,
    bio: document.getElementById('pBio').value,
    skills: document.getElementById('pSkills').value.split(',').map(s=>s.trim()),
    experience: document.getElementById('pExp').value,
    education: document.getElementById('pEdu').value,
    linkedin: document.getElementById('pLinkedin').value,
    github: document.getElementById('pGithub').value,
  };
  try {
    await put('/candidate/profile', body);
    toast('Profile updated!', 'success');
    closeModal('editProfileModal');
    reloadPage('profile');
  } catch (e) { toast(e.message, 'error'); }
}

async function uploadResume(e) {
  e.preventDefault();
  const fileInput = document.getElementById('resumeFile');
  const file = fileInput.files[0];
  if (!file) { toast('Select a file', 'error'); return; }
  const formData = new FormData();
  formData.append('resume', file);
  const token = store.get('token');
  try {
    const res = await fetch(`${API}/candidate/resume`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    toast('Resume uploaded!', 'success');
    closeModal('uploadResumeModal');
    reloadPage('profile');
  } catch (e) { toast(e.message, 'error'); }
}

function openChatWith(userId, name) {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
  reloadPage('messages');
  setTimeout(() => { activeChatUserId = userId; openConversation(userId, name); }, 300);
}