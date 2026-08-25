let site = null;
const tokenKey = 'berugram_admin_token';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const val = (s='') => String(s ?? '');

async function api(url, opts = {}) {
  opts.headers = { ...(opts.headers || {}), Authorization: 'Bearer ' + localStorage.getItem(tokenKey) };
  if (!(opts.body instanceof FormData)) opts.headers['Content-Type'] = 'application/json';
  const r = await fetch(url, opts);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Request failed');
  return d;
}
function pretty(x){ return JSON.stringify(x, null, 2); }
function flash(t){ $('#saveStatus').textContent = '✓ ' + t; setTimeout(() => $('#saveStatus').textContent = '', 3000); }
function go(tab){ const b = $(`.nav[data-tab="${tab}"]`); if(b) b.click(); }
function showLogin(){ $('#loginView').classList.remove('hidden'); $('#app').classList.add('hidden'); }
function showApp(){ $('#loginView').classList.add('hidden'); $('#app').classList.remove('hidden'); }

async function boot(){
  try { const me = await api('/api/admin/me'); $('#adminName').textContent = '👤 ' + me.username; showApp(); await load(); }
  catch { localStorage.removeItem(tokenKey); showLogin(); }
}

async function load(){
  site = await api('/api/site');
  $('#heroCount').textContent = site.hero.length;
  $('#teacherCount').textContent = site.teachers.length;
  $('#noticeCount').textContent = site.notices.length;
  $('#galleryCount').textContent = site.gallery.length;
  renderSettings(); renderHome(); renderAbout(); renderAcademics(); renderFacilities(); renderTeachers(); renderNotices(); renderEvents(); renderGallery(); $('#allJson').value = pretty(site);
}

function renderSettings(){
  const s = site.settings || {};
  const fields = [
    ['title','School Title','text'],['title_bn','Bengali Title','text'],['subtitle','Subtitle','text'],
    ['phone','Phone','text'],['phone2','Secondary Phone','text'],['email','Email','email'],
    ['address','School Address','textarea'],['facebook','Facebook URL','url'],['youtube','YouTube URL','url'],
    ['mapQuery','Google Maps Search / Location','text'],['institutionCode','Institution Code','text'],['udiseCode','UDISE Code','text'],['hsCode','H.S. Code','text'],
    ['footer','Footer Description','textarea']
  ];
  $('#settingsForm').innerHTML = fields.map(([k,l,type]) => type === 'textarea'
    ? `<label class="full">${l}<textarea data-key="${k}">${esc(s[k])}</textarea></label>`
    : `<label>${l}<input type="${type}" data-key="${k}" value="${esc(s[k])}"></label>`).join('');
}
async function saveSettings(){
  $('#settingsForm [data-key]') && $$('#settingsForm [data-key]').forEach(i => site.settings[i.dataset.key] = i.value);
  await saveSite(); flash('Settings saved');
}

function renderHome(){
  $('#heroEditor').innerHTML = site.hero.map((h,i)=>heroCard(h,i)).join('');
  $('#statsEditor').innerHTML = site.stats.map((s,i)=>statCard(s,i)).join('');
  $('#tickerEditor').innerHTML = `<div class="repeat-card"><label>Ticker messages<textarea id="tickerText" class="list-text">${esc(site.ticker.join('\n'))}</textarea></label><small class="hint">One message per line.</small></div>`;
}
function heroCard(h,i){
  return `<div class="hero-card" data-index="${i}"><div class="hero-head"><h3>Hero Slide ${i+1}</h3><button class="danger remove-hero" onclick="removeHero(${i})">Remove</button></div><div class="two-col"><div><label>Hero Image</label><div class="preview"><img id="heroPreview${i}" src="../${esc(h.image)}" onerror="this.style.display='none'"></div><div class="file-row"><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onchange="uploadInto('image',this,'heroImage${i}','heroPreview${i}')"><button class="secondary" onclick="triggerFile('heroFile${i}')">Upload JPG</button><input id="heroFile${i}" type="file" accept="image/*" hidden onchange="uploadInto('image',this,'heroImage${i}','heroPreview${i}')"></div><div class="file-path" id="heroImage${i}">${esc(h.image)}</div></div><div><label>Established / Badge<input data-k="established" value="${esc(h.established)}"></label><label>Title<input data-k="title" value="${esc(h.title)}"></label><label>Subtitle<input data-k="subtitle" value="${esc(h.subtitle)}"></label><label>Description<textarea data-k="text">${esc(h.text)}</textarea></label></div></div></div>`;
}
function statCard(s,i){ return `<div class="repeat-card" data-index="${i}"><button class="danger remove" onclick="removeStat(${i})">Remove</button><label>Icon<input data-k="icon" value="${esc(s.icon)}" placeholder="fa-school"></label><label>Value<input data-k="value" value="${esc(s.value)}"></label><label>Label<input data-k="label" value="${esc(s.label)}"></label></div>`; }
function collectHero(){ return $$('#heroEditor .hero-card').map(card => { const i=+card.dataset.index,h=site.hero[i]; const o={...h}; card.querySelectorAll('[data-k]').forEach(x=>o[x.dataset.k]=x.value); o.image=$(`#heroImage${i}`).textContent.trim(); return o; }); }
function collectStats(){ return $$('#statsEditor .repeat-card').map(card => { const i=+card.dataset.index,s=site.stats[i],o={...s}; card.querySelectorAll('[data-k]').forEach(x=>o[x.dataset.k]=x.value); return o; }); }
async function saveHome(){ site.hero=collectHero(); site.stats=collectStats(); site.ticker=$('#tickerText').value.split('\n').map(x=>x.trim()).filter(Boolean); await saveSite(); flash('Home page saved'); await load(); }
function addStat(){ site.stats.push({icon:'fa-school',value:'',label:'New Statistic'}); renderHome(); }
function removeStat(i){ if(confirm('Remove this statistic?')){site.stats.splice(i,1);renderHome();} }
function removeHero(i){ if(confirm('Remove this hero slide?')){site.hero.splice(i,1);renderHome();} }
function addHero(){ site.hero.push({image:'images/hero1.jpg',established:'ESTABLISHED • 1951',title:'NEW SLIDE',subtitle:'',text:''}); renderHome(); }

function renderAbout(){
  const a=site.about||{}; const t=site.tic||{};
  $('#aboutEditor').innerHTML=`<div class="two-col"><div><label>About Image</label><div class="preview"><img id="aboutPreview" src="../${esc(a.image)}"></div><input type="file" accept="image/*" onchange="uploadInto('image',this,'aboutImagePath','aboutPreview')"><div class="file-path" id="aboutImagePath">${esc(a.image)}</div></div><div><label>Section Label<input id="aboutLabel" value="${esc(a.label)}"></label><label>Heading<textarea id="aboutHeading">${esc(a.heading)}</textarea></label><div class="inline-fields"><label>Badge Number<input id="aboutBadge" value="${esc(a.badge)}"></label><label>Badge Text<input id="aboutBadgeText" value="${esc(a.badgeText)}"></label></div></div></div><label>Paragraphs<textarea id="aboutParagraphs" class="list-text">${esc((a.paragraphs||[]).join('\n\n'))}</textarea><small class="hint">Separate paragraphs with a blank line.</small></label><label>Key Points<textarea id="aboutPoints" class="list-text">${esc((a.points||[]).join('\n'))}</textarea><small class="hint">One point per line.</small></label>`;
  $('#ticEditor').innerHTML=`<div class="two-col"><div><label>TIC / Headmaster Photo</label><div class="preview"><img id="ticPreview" src="../${esc(t.image)}"></div><input type="file" accept="image/*" onchange="uploadInto('image',this,'ticImagePath','ticPreview')"><div class="file-path" id="ticImagePath">${esc(t.image)}</div></div><div><label>Name<input id="ticName" value="${esc(t.name)}"></label><label>Role / Designation<input id="ticRole" value="${esc(t.role)}"></label><label>Faculty / Qualification<input id="ticDegree" value="${esc(t.degree)}"></label><label>Message Heading<input id="ticHeading" value="${esc(t.heading)}"></label></div></div><label>Message Paragraphs<textarea id="ticParagraphs" class="list-text">${esc((t.paragraphs||[]).join('\n\n'))}</textarea><small class="hint">Separate paragraphs with a blank line.</small></label>`;
}
async function saveAbout(){
  site.about={...site.about,label:$('#aboutLabel').value,heading:$('#aboutHeading').value,paragraphs:$('#aboutParagraphs').value.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean),points:$('#aboutPoints').value.split('\n').map(x=>x.trim()).filter(Boolean),image:$('#aboutImagePath').textContent.trim(),badge:$('#aboutBadge').value,badgeText:$('#aboutBadgeText').value};
  site.tic={...site.tic,image:$('#ticImagePath').textContent.trim(),name:$('#ticName').value,role:$('#ticRole').value,degree:$('#ticDegree').value,heading:$('#ticHeading').value,paragraphs:$('#ticParagraphs').value.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean)};
  await saveSite(); flash('About & TIC saved'); await load();
}

function renderAcademics(){ $('#academicsEditor').innerHTML=site.academics.map((a,i)=>`<div class="repeat-card" data-index="${i}"><button class="danger remove" onclick="removeAcademic(${i})">Remove</button><div class="inline-fields"><label>Title<input data-k="title" value="${esc(a.title)}"></label><label>Classes<input data-k="classes" value="${esc(a.classes)}"></label></div><div class="inline-fields"><label>Icon<input data-k="icon" value="${esc(a.icon)}"></label><label>Stream<input data-k="stream" value="${esc(a.stream||'')}"></label></div><label>Subjects<textarea data-k="subjects" class="list-text">${esc((a.subjects||[]).join('\n'))}</textarea><label>Description<textarea data-k="description">${esc(a.description||'')}</textarea></label></div>`).join(''); }
function collectAcademics(){return $$('#academicsEditor .repeat-card').map(c=>{const i=+c.dataset.index,a={...site.academics[i]};c.querySelectorAll('[data-k]').forEach(x=>a[x.dataset.k]=x.value);a.subjects=c.querySelector('[data-k="subjects"]').value.split('\n').map(x=>x.trim()).filter(Boolean);return a;});}
async function saveAcademics(){site.academics=collectAcademics();await saveSite();flash('Academics saved');await load();}
function addAcademic(){site.academics.push({icon:'fa-book-open',title:'New Programme',classes:'Classes',stream:'',subjects:[],description:''});renderAcademics();}
function removeAcademic(i){if(confirm('Remove this programme?')){site.academics.splice(i,1);renderAcademics();}}

function renderFacilities(){ $('#facilitiesEditor').innerHTML=site.facilities.map((f,i)=>`<div class="repeat-card" data-index="${i}"><button class="danger remove" onclick="removeFacility(${i})">Remove</button><label>Icon<input data-k="icon" value="${esc(f.icon)}"></label><label>Title<input data-k="title" value="${esc(f.title)}"></label><label>Description<input data-k="description" value="${esc(f.description)}"></label><label>Value<input data-k="value" value="${esc(f.value)}"></label></div>`).join(''); }
function collectFacilities(){return $$('#facilitiesEditor .repeat-card').map(c=>{const i=+c.dataset.index,f={...site.facilities[i]};c.querySelectorAll('[data-k]').forEach(x=>f[x.dataset.k]=x.value);return f;});}
async function saveFacilities(){site.facilities=collectFacilities();await saveSite();flash('Facilities saved');await load();}
function addFacility(){site.facilities.push({icon:'fa-school',title:'New Facility',description:'',value:''});renderFacilities();}
function removeFacility(i){if(confirm('Remove this facility?')){site.facilities.splice(i,1);renderFacilities();}}

function renderTeachers(){
  $('#teachersEditor').innerHTML=site.teachers.map((t,i)=>`<div class="item-card teacher-row" data-index="${i}"><div><img class="avatar" id="teacherPreview${i}" src="../${esc(t.image||'images/logo.png')}" onerror="this.src='../images/logo.png'"></div><div class="teacher-fields"><label>Name<input data-k="name" value="${esc(t.name)}"></label><label>Faculty / Subject<input data-k="faculty" value="${esc(t.faculty||'')}" placeholder="e.g. Bengali / Mathematics"></label><label>Qualification / Degree<input data-k="degree" value="${esc(t.degree)}"></label><label>Staff Group<input data-k="group" value="${esc(t.group)}"></label><label class="full">Photo <input type="file" accept="image/*" onchange="uploadInto('image',this,'teacherImage${i}','teacherPreview${i}')"><div class="file-path" id="teacherImage${i}">${esc(t.image||'images/logo.png')}</div></label></div><button class="danger remove" onclick="removeTeacher(${i})">Delete</button></div>`).join('');
}
function collectTeachers(){return $$('#teachersEditor .item-card').map(c=>{const i=+c.dataset.index,t={...site.teachers[i]};c.querySelectorAll('[data-k]').forEach(x=>t[x.dataset.k]=x.value);t.image=$(`#teacherImage${i}`).textContent.trim();if(!t.faculty) delete t.faculty;return t;});}
async function saveTeachers(){site.teachers=collectTeachers();await saveSite();flash('Teachers saved');await load();}
function addTeacher(){site.teachers.push({group:'Assistant Teachers / Teaching Staff',name:'New Teacher',faculty:'',degree:'',image:'images/logo.png'});renderTeachers();}
function removeTeacher(i){if(confirm('Delete this teacher/staff member?')){site.teachers.splice(i,1);renderTeachers();}}

function renderNotices(){
  $('#noticesEditor').innerHTML=site.notices.map((n,i)=>`<div class="item-card notice-row" data-index="${i}"><div><label>Notice Title<input data-k="title" value="${esc(n.title)}"></label><label>Description<input data-k="description" value="${esc(n.description)}"></label><div class="inline-fields"><label>Date / Label<input data-k="date" value="${esc(n.date)}"></label><label>PDF File<input type="file" accept="application/pdf" onchange="uploadInto('notice',this,'noticeFile${i}')"><div class="file-path" id="noticeFile${i}">${esc(n.file)}</div></label></div></div><button class="danger remove" onclick="removeNotice(${i})">Delete</button></div>`).join('');
}
function collectNotices(){return $$('#noticesEditor .item-card').map(c=>{const i=+c.dataset.index,n={...site.notices[i]};c.querySelectorAll('[data-k]').forEach(x=>n[x.dataset.k]=x.value);n.file=$(`#noticeFile${i}`).textContent.trim();return n;});}
async function saveNotices(){site.notices=collectNotices();await saveSite();flash('Notices saved');await load();}
function addNotice(){site.notices.push({title:'New Notice',description:'Important school notice.',date:'SCHOOL NOTICE',file:''});renderNotices();}
function removeNotice(i){if(confirm('Delete this notice?')){site.notices.splice(i,1);renderNotices();}}

function renderEvents(){ $('#eventsEditor').innerHTML=site.events.map((e,i)=>`<div class="repeat-card" data-index="${i}"><button class="danger remove" onclick="removeEvent(${i})">Remove</button><label>Icon<input data-k="icon" value="${esc(e.icon)}"></label><label>Event Title<input data-k="title" value="${esc(e.title)}"></label><label>Description<textarea data-k="description">${esc(e.description)}</textarea></label></div>`).join(''); }
function collectEvents(){return $$('#eventsEditor .repeat-card').map(c=>{const i=+c.dataset.index,e={...site.events[i]};c.querySelectorAll('[data-k]').forEach(x=>e[x.dataset.k]=x.value);return e;});}
async function saveEvents(){site.events=collectEvents();await saveSite();flash('Events saved');await load();}
function addEvent(){site.events.push({icon:'fa-star',title:'New Event',description:''});renderEvents();}
function removeEvent(i){if(confirm('Remove this event?')){site.events.splice(i,1);renderEvents();}}

function renderGallery(){
  $('#galleryEditor').innerHTML=site.gallery.map((g,i)=>`<div class="item-card gallery-row" data-index="${i}"><div><img class="gallery-preview" id="galleryPreview${i}" src="../${esc(g.image)}" onerror="this.style.display='none'"></div><div><div class="inline-fields"><label>Category<select data-k="category"><option ${g.category==='campus'?'selected':''}>campus</option><option ${g.category==='events'?'selected':''}>events</option><option ${g.category==='sports'?'selected':''}>sports</option><option ${g.category==='students'?'selected':''}>students</option><option ${g.category==='teachers'?'selected':''}>teachers</option></select></label><label>Alt / Caption<input data-k="alt" value="${esc(g.alt)}"></label></div><label>Upload New Photo <input type="file" accept="image/*" onchange="uploadInto('image',this,'galleryImage${i}','galleryPreview${i}')"><div class="file-path" id="galleryImage${i}">${esc(g.image)}</div></label></div><button class="danger remove" onclick="removeGallery(${i})">Delete</button></div>`).join('');
}
function collectGallery(){return $$('#galleryEditor .item-card').map(c=>{const i=+c.dataset.index,g={...site.gallery[i]};c.querySelectorAll('[data-k]').forEach(x=>g[x.dataset.k]=x.value);g.image=$(`#galleryImage${i}`).textContent.trim();return g;});}
async function saveGallery(){site.gallery=collectGallery();await saveSite();flash('Gallery saved');await load();}
function addGallery(){site.gallery.push({image:'images/logo.png',category:'events',alt:'School Event'});renderGallery();}
function removeGallery(i){if(confirm('Delete this gallery item?')){site.gallery.splice(i,1);renderGallery();}}

async function saveSite(){await api('/api/site',{method:'PUT',body:JSON.stringify(site)});$('#allJson').value=pretty(site);}
function triggerFile(id){$('#'+id).click();}
async function uploadInto(kind,input,pathId,previewId){
  const file=input.files[0]; if(!file)return;
  const fd=new FormData();fd.append('file',file);fd.append('kind',kind);
  try{const d=await api('/api/admin/upload',{method:'POST',body:fd});$('#'+pathId).textContent=d.path;if(previewId)$('#'+previewId).src='../'+d.path;flash('File uploaded');}
  catch(e){alert(e.message)}
}

async function loadMedia(){
  try{const d=await api('/api/admin/media');const items=[...d.images.map(x=>({...x,type:'image'})),...d.notices.map(x=>({...x,type:'notice'}))].sort((a,b)=>b.modified.localeCompare(a.modified));
    $('#mediaList').innerHTML=items.map(x=>x.type==='image'?`<div class="media-item"><img src="../${esc(x.path)}"><div class="media-info"><div class="name">${esc(x.name)}</div><div class="meta">${formatBytes(x.size)} · ${new Date(x.modified).toLocaleString()}</div><button class="danger" onclick="deleteMedia('${esc(x.path)}')">Delete</button></div></div>`:`<div class="media-item"><div style="height:150px;display:grid;place-items:center;background:#f0f4fa;font-size:45px">📄</div><div class="media-info"><div class="name">${esc(x.name)}</div><div class="meta">${formatBytes(x.size)} · ${new Date(x.modified).toLocaleString()}</div><a class="secondary" style="display:inline-block;text-decoration:none" href="../${esc(x.path)}" target="_blank">Open PDF</a> <button class="danger" onclick="deleteMedia('${esc(x.path)}')">Delete</button></div></div>`).join('') || '<p class="hint">No media found.</p>';
  }catch(e){alert(e.message)}
}
function formatBytes(n){if(n<1024)return n+' B';if(n<1024*1024)return (n/1024).toFixed(1)+' KB';return (n/1024/1024).toFixed(1)+' MB';}
async function deleteMedia(path){if(!confirm('Delete this file? If the website uses it, that image/PDF will stop working.'))return;try{await api('/api/admin/media',{method:'DELETE',body:JSON.stringify({path})});await loadMedia();}catch(e){alert(e.message)}}

function downloadBackup(){const blob=new Blob([pretty(site)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='berugram-website-backup.json';a.click();URL.revokeObjectURL(a.href);}
async function restoreBackup(){try{const d=JSON.parse($('#allJson').value);if(!confirm('Restore the complete website data from this JSON?'))return;site=d;await saveSite();flash('Backup restored');await load();}catch(e){alert('Invalid JSON backup: '+e.message)}}

$('#loginForm').onsubmit=async e=>{e.preventDefault();$('#loginError').textContent='';try{const r=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:$('#username').value,password:$('#password').value})});const d=await r.json();if(!r.ok)throw new Error(d.error);localStorage.setItem(tokenKey,d.token);$('#adminName').textContent='👤 '+d.username;showApp();await load();}catch(err){$('#loginError').textContent=err.message}};

$$('.nav').forEach(b=>b.onclick=async()=>{ $$('.nav').forEach(x=>x.classList.remove('active'));b.classList.add('active');$$('.tab').forEach(x=>x.classList.add('hidden'));$('#'+b.dataset.tab).classList.remove('hidden');$('#pageTitle').textContent=b.querySelector('span')?.textContent||b.textContent.trim();if(b.dataset.tab==='media')await loadMedia();});
$('#logout').onclick=()=>{localStorage.removeItem(tokenKey);showLogin()};
$('#securityForm').onsubmit=async e=>{e.preventDefault();$('#securityMsg').textContent='';if($('#newPassword').value!==$('#confirmPassword').value)return $('#securityMsg').textContent='New passwords do not match.';try{const d=await api('/api/admin/change-credentials',{method:'POST',body:JSON.stringify({currentPassword:$('#currentPassword').value,newUsername:$('#newUsername').value,newPassword:$('#newPassword').value})});alert(d.message);localStorage.removeItem(tokenKey);showLogin();$('#securityForm').reset();}catch(err){$('#securityMsg').textContent=err.message}};

boot();
