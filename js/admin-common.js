// js/admin-common.js
// Updated admin script: dropdowns for course/branch/semester/subject + save handlers + manage/delete
import { auth, db, ADMIN_UID } from './firebase.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
  doc, setDoc, collection, addDoc, serverTimestamp,
  query, getDocs, orderBy, deleteDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ---------------------------
   Config / defaults
----------------------------*/
const COURSES = ["B.Tech"];
const BRANCHES = ["CSE","IT","AIML","AIDS","VLSI"];

const COMMON_SEM12 = [
  "Applied Chemistry","Applied Mathematics I","Applied Physics I",
  "Communication Skills","Engineering Graphics","Engineering Mechanics",
  "Electrical Science","Environmental Science","Human Values and Professional Ethics",
  "Indian Constitution","Manufacturing Processes","Programming in C","Workshop Practice"
];

const SUBJECTS_BY_BRANCH = {
  CSE: {
    3: ["Digital Logic Design","Discrete Mathematics","Data Structures","Object Oriented Programming","Probability, Statistics & Linear Algebra","Foundation of Data Science","Principles of Artificial Intelligence","Computational Methods","Universal Human Values II"],
    4: ["Design and Analysis of Algorithms","Database Management Systems","Computer Organization","Operating Systems","Computer Networks","Software Engineering","Numerical Methods"]
  },
  IT: {
    3: ["Digital Logic Design","Discrete Mathematics","Data Structures","Object Oriented Programming","Probability, Statistics & Linear Algebra","Foundation of Data Science","Principles of Artificial Intelligence","Computational Methods","Universal Human Values II"],
    4: ["Database Management Systems","Operating Systems","Computer Networks","Web Technologies","Software Engineering","Internet of Things (Intro)"]
  },
  AIML: {
    3: ["Data Structures","Discrete Mathematics","Probability, Statistics & Linear Algebra","Object Oriented Programming","Foundation of Data Science","Principles of Artificial Intelligence","Machine Learning Basics","Universal Human Values II"],
    4: ["Machine Learning I","Data Mining","Linear Algebra for ML","Statistics for ML","Python for Data Science"]
  },
  AIDS: {
    3: ["Data Structures","Discrete Mathematics","Probability, Statistics & Linear Algebra","Object Oriented Programming","Foundation of Data Science","Principles of Artificial Intelligence","Data Analysis Basics","Universal Human Values II"],
    4: ["Machine Learning I","Data Visualization","APIs & Data Engineering Basics","Intro to Neural Networks"]
  },
  VLSI: {
    3: ["Digital Logic Design","Electronic Devices and Circuits","Signals and Systems (intro)","Fundamentals of VLSI","Discrete Mathematics","Computational Methods"],
    4: ["VLSI Design Basics","CMOS Technology","Microprocessors and Interfacing","Analog Circuits"]
  }
};

/* ---------------------------
   DOM refs (expect these IDs in admin.html)
----------------------------*/
const selCourse = document.getElementById('selCourse');
const selBranch = document.getElementById('selBranch');
const selSemester = document.getElementById('selSemester');
const selSubject = document.getElementById('selSubject');
const addSubjectBtn = document.getElementById('addSubjectBtn');
const newSubjectInput = document.getElementById('newSubject');
const currentPath = document.getElementById('currentPath');

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const signedAs = document.getElementById('signedAs');
const manageBtn = document.getElementById('manageBtn'); // make sure admin.html has this

/* small helper: create element safely */
function $create(tag, attrs = {}, text = '') {
  const el = document.createElement(tag);
  Object.keys(attrs).forEach(k => el.setAttribute(k, attrs[k]));
  if (text) el.textContent = text;
  return el;
}

/* ---------------------------
   Populate UI selects
----------------------------*/
function populateCourses(){
  if(!selCourse) return;
  selCourse.innerHTML = COURSES.map(c => `<option value="${c}">${c}</option>`).join('');
}
function populateBranches(){
  if(!selBranch) return;
  selBranch.innerHTML = BRANCHES.map(b => `<option value="${b}">${b}</option>`).join('');
}
function populateSemesters(){
  if(!selSemester) return;
  selSemester.innerHTML = [1,2,3,4].map(n => `<option value="${n}">Semester ${n}</option>`).join('');
}
function populateSubjects(){
  if(!selSubject) return;
  const branch = selBranch.value || BRANCHES[0];
  const sem = Number(selSemester.value) || 1;
  selSubject.innerHTML = '';
  let arr = [];
  if(sem === 1 || sem === 2) arr = COMMON_SEM12.slice();
  else arr = (SUBJECTS_BY_BRANCH[branch] && SUBJECTS_BY_BRANCH[branch][sem]) ? SUBJECTS_BY_BRANCH[branch][sem].slice() : [];
  arr.forEach(s => {
    const opt = document.createElement('option'); opt.value = s; opt.textContent = s;
    selSubject.appendChild(opt);
  });
  // Add helper "Other" option
  const other = document.createElement('option'); other.value = '__other__'; other.textContent = '— Add / Choose other subject —';
  selSubject.appendChild(other);
  updatePath();
}

addSubjectBtn?.addEventListener('click', () => {
  const v = (newSubjectInput?.value || '').trim();
  if(!v) { alert('Enter subject name to add'); return; }
  const opt = document.createElement('option'); opt.value = v; opt.textContent = v;
  const otherOpt = Array.from(selSubject.options).find(o => o.value === '__other__');
  if(otherOpt) selSubject.insertBefore(opt, otherOpt);
  else selSubject.appendChild(opt);
  selSubject.value = v;
  newSubjectInput.value = '';
  updatePath();
});

/* ---------------------------
   Update path (display)
----------------------------*/
function updatePath(){
  if(!currentPath) return;
  const c = selCourse?.value || '';
  const b = selBranch?.value || '';
  const sem = selSemester?.value ? `Semester ${selSemester.value}` : '';
  const s = selSubject?.value && selSubject.value !== '__other__' ? selSubject.value : '(choose subject)';
  currentPath.innerText = `${c} • ${b} • ${sem} • ${s}`;
}
selCourse?.addEventListener('change', updatePath);
selBranch?.addEventListener('change', ()=>{ populateSubjects(); updatePath(); });
selSemester?.addEventListener('change', ()=>{ populateSubjects(); updatePath(); });
selSubject?.addEventListener('change', updatePath);

populateCourses();
populateBranches();
populateSemesters();
populateSubjects();

/* ---------------------------
   Tabs (existing UI)
----------------------------*/
document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.tabpanel').forEach(p=>p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

/* ---------------------------
   AUTH UI
----------------------------*/
loginBtn && (loginBtn.onclick = async () => {
  const email = document.getElementById('adminEmail').value.trim();
  const pass = document.getElementById('adminPass').value.trim();
  if(!email || !pass) { alert('Enter email and password'); return; }
  try { await signInWithEmailAndPassword(auth, email, pass); }
  catch(e){ alert('Login error: ' + e.message); }
});
logoutBtn && (logoutBtn.onclick = async ()=> { await signOut(auth); });

onAuthStateChanged(auth, user=>{
  if(user){
    signedAs && (signedAs.innerText = `${user.email} (${user.uid})`);
    loginBtn && (loginBtn.style.display = 'none');
    logoutBtn && (logoutBtn.style.display = 'inline-block');
    // show manage button only to admin uid
    if(user.uid === ADMIN_UID && manageBtn){
      manageBtn.style.display = 'inline-block';
      manageBtn.onclick = () => location.href = 'admin/manage.html';
    }
  } else {
    signedAs && (signedAs.innerText = 'Not signed in');
    loginBtn && (loginBtn.style.display = 'inline-block');
    logoutBtn && (logoutBtn.style.display = 'none');
    if(manageBtn) manageBtn.style.display = 'none';
  }
});

/* ---------------------------
   Utility: Normalize links
----------------------------*/
function normalizeDriveLink(url){
  if(!url) return '';
  try{
    const u = new URL(url);
    if(u.hostname.includes('drive.google.com')){
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if(match) return `https://drive.google.com/uc?export=download&id=${match[1]}`;
      const idParam = u.searchParams.get('id');
      if(idParam) return `https://drive.google.com/uc?export=download&id=${idParam}`;
    }
  }catch(e){}
  return url;
}
function normalizeYouTube(url){
  if(!url) return '';
  try{
    const u = new URL(url);
    if(u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) return url;
  }catch(e){}
  return url;
}

/* ---------------------------
   Helper: current doc id (same pattern used across site)
----------------------------*/
function currentDocId(){
  const course = selCourse?.value || 'B.Tech';
  const branch = selBranch?.value || '';
  const sem = selSemester?.value ? `Semester ${selSemester.value}` : '';
  const subj = selSubject?.value && selSubject.value !== '__other__' ? selSubject.value : '';
  return `${course}__${branch}__${sem}__${subj}`;
}

/* ---------------------------
   Save handlers (Syllabus / Notes / PYQ / Videos / Practicals)
   Buttons in admin.html must have IDs: s_save, n_save, p_save, v_save, r_save
----------------------------*/
document.getElementById('s_save')?.addEventListener('click', async ()=>{
  const docId = currentDocId();
  if(docId.endsWith('__')) { document.getElementById('s_msg').innerText='Please select branch/sem/subject'; return; }
  try{
    await setDoc(doc(db,'syllabus',docId), {
      unit1: document.getElementById('s_u1')?.value || '',
      unit2: document.getElementById('s_u2')?.value || '',
      unit3: document.getElementById('s_u3')?.value || '',
      unit4: document.getElementById('s_u4')?.value || '',
      updatedBy: auth.currentUser?.email || null,
      updatedAt: serverTimestamp()
    });
    document.getElementById('s_msg').innerText='Saved';
  }catch(e){ document.getElementById('s_msg').innerText = 'Error: ' + e.message; }
});

document.getElementById('n_save')?.addEventListener('click', async ()=>{
  const title = (document.getElementById('n_title')?.value || '').trim();
  if(!title){ document.getElementById('n_msg').innerText='Enter title'; return; }
  const docId = currentDocId();
  if(docId.endsWith('__')) { document.getElementById('n_msg').innerText='Please select branch/sem/subject'; return; }
  const link = normalizeDriveLink(document.getElementById('n_link')?.value.trim() || '');
  try{
    await addDoc(collection(db,'notes',docId,'items'), {
      title,
      description: document.getElementById('n_desc')?.value.trim() || '',
      driveLink: link,
      uploaderName: auth.currentUser?.email || 'Admin',
      timestamp: serverTimestamp()
    });
    document.getElementById('n_msg').innerText='Saved';
    document.getElementById('n_title').value=''; document.getElementById('n_desc').value=''; document.getElementById('n_link').value='';
  }catch(e){ document.getElementById('n_msg').innerText = 'Error: ' + e.message; }
});

document.getElementById('p_save')?.addEventListener('click', async ()=>{
  const title = (document.getElementById('p_title')?.value || '').trim();
  if(!title){ document.getElementById('p_msg').innerText='Enter title'; return; }
  const docId = currentDocId();
  if(docId.endsWith('__')) { document.getElementById('p_msg').innerText='Please select branch/sem/subject'; return; }
  const link = normalizeDriveLink(document.getElementById('p_link')?.value.trim() || '');
  try{
    await addDoc(collection(db,'pyq',docId,'items'), {
      title,
      driveLink: link,
      uploaderName: auth.currentUser?.email || 'Admin',
      timestamp: serverTimestamp()
    });
    document.getElementById('p_msg').innerText='Saved';
    document.getElementById('p_title').value=''; document.getElementById('p_link').value='';
  }catch(e){ document.getElementById('p_msg').innerText = 'Error: ' + e.message; }
});

document.getElementById('v_save')?.addEventListener('click', async ()=>{
  const title = (document.getElementById('v_title')?.value || '').trim();
  if(!title){ document.getElementById('v_msg').innerText='Enter title'; return; }
  const docId = currentDocId();
  if(docId.endsWith('__')) { document.getElementById('v_msg').innerText='Please select branch/sem/subject'; return; }
  const link = normalizeYouTube(document.getElementById('v_link')?.value.trim() || '');
  try{
    await addDoc(collection(db,'videos',docId,'items'), {
      title,
      youtubeUrl: link,
      uploaderName: auth.currentUser?.email || 'Admin',
      timestamp: serverTimestamp()
    });
    document.getElementById('v_msg').innerText='Saved';
    document.getElementById('v_title').value=''; document.getElementById('v_link').value='';
  }catch(e){ document.getElementById('v_msg').innerText = 'Error: ' + e.message; }
});

document.getElementById('r_save')?.addEventListener('click', async ()=>{
  const title = (document.getElementById('r_title')?.value || '').trim();
  if(!title){ document.getElementById('r_msg').innerText='Enter title'; return; }
  const docId = currentDocId();
  if(docId.endsWith('__')) { document.getElementById('r_msg').innerText='Please select branch/sem/subject'; return; }
  const link = normalizeDriveLink(document.getElementById('r_link')?.value.trim() || '');
  try{
    await addDoc(collection(db,'practicals',docId,'items'), {
      title,
      description: document.getElementById('r_desc')?.value.trim() || '',
      driveLink: link,
      uploaderName: auth.currentUser?.email || 'Admin',
      timestamp: serverTimestamp()
    });
    document.getElementById('r_msg').innerText='Saved';
    document.getElementById('r_title').value=''; document.getElementById('r_desc').value=''; document.getElementById('r_link').value='';
  }catch(e){ document.getElementById('r_msg').innerText = 'Error: ' + e.message; }
});

/* ---------------------------
   Manage page helpers (manage.html)
   - list items across collections for a docId
   - open link in new tab
   - delete item
   manage.html should import this same file and place an element with id "manageList"
----------------------------*/
export async function listUploadsFor(docId, containerId = 'manageList') {
  const container = document.getElementById(containerId);
  if(!container) return;
  container.innerHTML = '';
  if(!docId) { container.innerHTML = '<div class="card"><p class="card-desc">No docId provided.</p></div>'; return; }

  // collections we maintain
  const collectionsToCheck = ['notes', 'pyq', 'videos', 'practicals', 'syllabus'];

  for(const col of collectionsToCheck){
    try{
      // For top-level doc (e.g. syllabus) we get doc; for items collections we query items
      if(col === 'syllabus'){
        // syllabus stored as doc under collection 'syllabus' with ID docId
        const qDocRef = doc(db, 'syllabus', docId);
        // We can't getDoc without import getDoc; so instead show a friendly card linking to syllabus.
        container.appendChild(renderCard(`${col}`, `Syllabus (stored as single doc) — check admin console`, null, null));
      } else {
        const q = query(collection(db, col, docId, 'items'), orderBy('timestamp','desc'));
        const snap = await getDocs(q);
        if(snap.empty) continue;
        snap.forEach(dSnap => {
          const data = dSnap.data();
          const id = dSnap.id;
          const title = data.title || '(no title)';
          const uploader = data.uploaderName || 'Admin';
          const link = data.driveLink || data.youtubeUrl || '';
          const el = renderCard(col.toUpperCase(), title, uploader, link, ()=> deleteItem(col, docId, id));
          container.appendChild(el);
        });
      }
    }catch(e){
      container.appendChild(renderCard('Error','Loading error: ' + e.message,'',''));
    }
  }

  if(container.children.length === 0){
    container.innerHTML = '<div class="card"><p class="card-desc">No uploads found for this subject.</p></div>';
  }
}

/* small card renderer used by manage page */
function renderCard(type, title, uploader, link, onDelete){
  const wrap = document.createElement('div'); wrap.className = 'card';
  const left = document.createElement('div');
  const h = document.createElement('div'); h.className = 'card-title'; h.textContent = title;
  const p = document.createElement('div'); p.className = 'card-desc'; p.textContent = uploader || '';
  left.appendChild(h); left.appendChild(p);
  const right = document.createElement('div'); right.className = 'card-footer';
  if(link){
    const a = document.createElement('a'); a.className = 'glow-btn'; a.href = link; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Open';
    right.appendChild(a);
  }
  const del = document.createElement('button'); del.className = 'glow-btn'; del.style.background = '#ff6b6b'; del.textContent = 'Delete';
  del.onclick = (e)=>{
    e.stopPropagation();
    if(onDelete) onDelete();
  };
  right.appendChild(del);
  wrap.appendChild(left); wrap.appendChild(right);
  return wrap;
}

/* delete doc helper */
async function deleteItem(collectionName, docId, itemId){
  if(!confirm('Delete this item? This cannot be undone.')) return;
  try{
    await deleteDoc(doc(db, collectionName, docId, 'items', itemId));
    alert('Deleted');
    // If manage page is present, refresh list (assumes input id "manageDocId")
    const manageDocId = document.getElementById('manageDocId')?.value;
    if(manageDocId) listUploadsFor(manageDocId, 'manageList');
  }catch(e){
    alert('Delete error: ' + e.message);
  }
}

/* ---------------------------
   Small convenience: expose helpers to window (so manage.html can call)
----------------------------*/
window.adminHelpers = {
  listUploadsFor,
  deleteItem,
  normalizeDriveLink,
  currentDocId
};
