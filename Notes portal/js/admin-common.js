// js/admin-common.js
// Updated admin script: dropdowns for course/branch/semester/subject + existing save handlers
import { auth, db, ADMIN_UID } from './firebase.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { doc, setDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ---------------------------
   Project configuration (defaults)
   You can edit these lists below.
----------------------------*/
const COURSES = ["B.Tech"]; // you said "no" additional courses — keep B.Tech only

const BRANCHES = ["CSE","IT","AIML","AIDS","VLSI"]; // user requested list

// Subjects: sem1 & sem2 (same for every branch)
// Sem3 & Sem4: branch-specific reasonable defaults (you can edit them later)
const COMMON_SEM12 = [
  "Applied Chemistry",
  "Applied Mathematics I",
  "Applied Physics I",
  "Communication Skills",
  "Engineering Graphics",
  "Engineering Mechanics",
  "Electrical Science",
  "Environmental Science",
  "Human Values and Professional Ethics",
  "Indian Constitution",
  "Manufacturing Processes",
  "Programming in C",
  "Workshop Practice"
];

const SUBJECTS_BY_BRANCH = {
  // For Sem 1 & 2 we will use COMMON_SEM12; for Sem 3/4 we use these:
  "CSE": {
    3: [
      "Digital Logic Design",
      "Discrete Mathematics",
      "Data Structures",
      "Object Oriented Programming",
      "Probability, Statistics & Linear Algebra",
      "Foundation of Data Science",
      "Principles of Artificial Intelligence",
      "Computational Methods",
      "Universal Human Values II"
    ],
    4: [
      "Design and Analysis of Algorithms",
      "Database Management Systems",
      "Computer Organization",
      "Operating Systems",
      "Computer Networks",
      "Software Engineering",
      "Numerical Methods"
    ]
  },
  "IT": {
    3: [
      "Digital Logic Design",
      "Discrete Mathematics",
      "Data Structures",
      "Object Oriented Programming",
      "Probability, Statistics & Linear Algebra",
      "Foundation of Data Science",
      "Principles of Artificial Intelligence",
      "Computational Methods",
      "Universal Human Values II"
    ],
    4: [
      "Database Management Systems",
      "Operating Systems",
      "Computer Networks",
      "Web Technologies",
      "Software Engineering",
      "Internet of Things (Intro)"
    ]
  },
  "AIML": {
    3: [
      "Data Structures",
      "Discrete Mathematics",
      "Probability, Statistics & Linear Algebra",
      "Object Oriented Programming",
      "Foundation of Data Science",
      "Principles of Artificial Intelligence",
      "Machine Learning Basics",
      "Universal Human Values II"
    ],
    4: [
      "Machine Learning I",
      "Data Mining",
      "Linear Algebra for ML",
      "Statistics for ML",
      "Python for Data Science"
    ]
  },
  "AIDS": {
    3: [
      "Data Structures",
      "Discrete Mathematics",
      "Probability, Statistics & Linear Algebra",
      "Object Oriented Programming",
      "Foundation of Data Science",
      "Principles of Artificial Intelligence",
      "Data Analysis Basics",
      "Universal Human Values II"
    ],
    4: [
      "Machine Learning I",
      "Data Visualization",
      "APIs & Data Engineering Basics",
      "Intro to Neural Networks"
    ]
  },
  "VLSI": {
    3: [
      "Digital Logic Design",
      "Electronic Devices and Circuits",
      "Signals and Systems (intro)",
      "Fundamentals of VLSI",
      "Discrete Mathematics",
      "Computational Methods"
    ],
    4: [
      "VLSI Design Basics",
      "CMOS Technology",
      "Microprocessors and Interfacing",
      "Analog Circuits"
    ]
  }
};

/* ---------------------------
   DOM references
----------------------------*/
const selCourse = document.getElementById('selCourse');
const selBranch = document.getElementById('selBranch');
const selSemester = document.getElementById('selSemester');
const selSubject = document.getElementById('selSubject');
const addSubjectBtn = document.getElementById('addSubjectBtn');
const newSubjectInput = document.getElementById('newSubject');
const currentPath = document.getElementById('currentPath');

/* populate selects */
function populateCourses(){
  selCourse.innerHTML = COURSES.map(c => `<option value="${c}">${c}</option>`).join('');
}
function populateBranches(){
  selBranch.innerHTML = BRANCHES.map(b => `<option value="${b}">${b}</option>`).join('');
}
function populateSemesters(){
  // 1..4 as requested (future: we can append more programmatically)
  selSemester.innerHTML = [1,2,3,4].map(n => `<option value="${n}">Semester ${n}</option>`).join('');
}
function populateSubjects(){
  const branch = selBranch.value;
  const sem = Number(selSemester.value);
  selSubject.innerHTML = ''; // reset
  let arr = [];
  if(sem === 1 || sem === 2){
    arr = COMMON_SEM12.slice();
  } else {
    arr = (SUBJECTS_BY_BRANCH[branch] && SUBJECTS_BY_BRANCH[branch][sem]) ? SUBJECTS_BY_BRANCH[branch][sem].slice() : [];
  }
  // create options
  arr.forEach(s => {
    const opt = document.createElement('option'); opt.value = s; opt.textContent = s;
    selSubject.appendChild(opt);
  });
  // keep 'Other...' option so admin can quickly add new subject
  const other = document.createElement('option'); other.value = '__other__'; other.textContent = '— Add / Choose other subject —';
  selSubject.appendChild(other);
  // update visible path
  updatePath();
}

/* add subject button */
addSubjectBtn.addEventListener('click', () => {
  const v = (newSubjectInput.value || '').trim();
  if(!v) return alert('Enter subject name to add');
  // add to current dropdown and select
  const opt = document.createElement('option'); opt.value = v; opt.textContent = v;
  // insert before the __other__ option (if present)
  const otherOpt = Array.from(selSubject.options).find(o => o.value === '__other__');
  if(otherOpt) selSubject.insertBefore(opt, otherOpt);
  else selSubject.appendChild(opt);
  selSubject.value = v;
  newSubjectInput.value = '';
  updatePath();
});

/* keep path up to date */
function updatePath(){
  const c = selCourse.value || '';
  const b = selBranch.value || '';
  const sem = selSemester.value ? `Semester ${selSemester.value}` : '';
  const s = selSubject.value && selSubject.value !== '__other__' ? selSubject.value : '(choose subject)';
  currentPath.innerText = `${c} • ${b} • ${sem} • ${s}`;
}

/* wire change events */
selCourse.addEventListener('change', updatePath);
selBranch.addEventListener('change', ()=>{ populateSubjects(); updatePath(); });
selSemester.addEventListener('change', ()=>{ populateSubjects(); updatePath(); });
selSubject.addEventListener('change', updatePath);

/* initial population */
populateCourses();
populateBranches();
populateSemesters();
populateSubjects();

/* ---------------------------
   tabs handling
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
const loginBtn = document.getElementById('loginBtn'), logoutBtn = document.getElementById('logoutBtn'), signedAs = document.getElementById('signedAs');

loginBtn.onclick = async () => {
  const email = document.getElementById('adminEmail').value.trim();
  const pass = document.getElementById('adminPass').value.trim();
  if(!email || !pass) { alert('Enter email and password'); return; }
  try { await signInWithEmailAndPassword(auth, email, pass); }
  catch(e){ alert('Login error: ' + e.message); }
};
logoutBtn.onclick = async ()=> { await signOut(auth); };

onAuthStateChanged(auth, user=>{
  if(user){
    signedAs.innerText = `${user.email} (${user.uid})`;
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
  } else {
    signedAs.innerText = 'Not signed in';
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
  }
});

/* ---------------------------
   Utilities: normalize Drive links (share->download) & youtube cleaning
----------------------------*/
function normalizeDriveLink(url){
  if(!url) return '';
  try{
    const u = new URL(url);
    if(u.hostname.includes('drive.google.com')){
      // /file/d/ID or /d/ID
      const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if(m) return `https://drive.google.com/uc?export=download&id=${m[1]}`;
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
    if(u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')){
      // return the URL as provided (we store it)
      return url;
    }
  }catch(e){}
  return url;
}

/* ---------------------------
   Save handlers (use dropdown values)
----------------------------*/
function currentDocId(){
  const course = selCourse.value || 'B.Tech';
  const branch = selBranch.value || '';
  const sem = selSemester.value ? `Semester ${selSemester.value}` : '';
  const subj = selSubject.value && selSubject.value !== '__other__' ? selSubject.value : '';
  return `${course}__${branch}__${sem}__${subj}`;
}

/* SYLLABUS */
document.getElementById('s_save').onclick = async function(){
  const docId = currentDocId();
  if(docId.endsWith('__')) { document.getElementById('s_msg').innerText='Please select branch/sem/subject'; return; }

  try{
    await setDoc(doc(db,'syllabus',docId), {
      unit1: document.getElementById('s_u1').value,
      unit2: document.getElementById('s_u2').value,
      unit3: document.getElementById('s_u3').value,
      unit4: document.getElementById('s_u4').value,
      updatedBy: auth.currentUser?.email || null,
      updatedAt: serverTimestamp()
    });
    document.getElementById('s_msg').innerText='Saved';
  }catch(e){ document.getElementById('s_msg').innerText = 'Error: ' + e.message; }
};

/* NOTES */
document.getElementById('n_save').onclick = async function(){
  const title = document.getElementById('n_title').value.trim();
  if(!title){ document.getElementById('n_msg').innerText='Enter title'; return; }
  const docId = currentDocId();
  if(docId.endsWith('__')) { document.getElementById('n_msg').innerText='Please select branch/sem/subject'; return; }
  const link = normalizeDriveLink(document.getElementById('n_link').value.trim());
  try{
    await addDoc(collection(db,'notes',docId,'items'), {
      title,
      description: document.getElementById('n_desc').value.trim(),
      driveLink: link,
      uploaderName: auth.currentUser?.email || 'Admin',
      timestamp: serverTimestamp()
    });
    document.getElementById('n_msg').innerText='Saved';
    document.getElementById('n_title').value=''; document.getElementById('n_desc').value=''; document.getElementById('n_link').value='';
  }catch(e){ document.getElementById('n_msg').innerText = 'Error: ' + e.message; }
};

/* PYQ */
document.getElementById('p_save').onclick = async function(){
  const title = document.getElementById('p_title').value.trim();
  if(!title){ document.getElementById('p_msg').innerText='Enter title'; return; }
  const docId = currentDocId();
  if(docId.endsWith('__')) { document.getElementById('p_msg').innerText='Please select branch/sem/subject'; return; }
  const link = normalizeDriveLink(document.getElementById('p_link').value.trim());
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
};

/* VIDEOS */
document.getElementById('v_save').onclick = async function(){
  const title = document.getElementById('v_title').value.trim();
  if(!title){ document.getElementById('v_msg').innerText='Enter title'; return; }
  const docId = currentDocId();
  if(docId.endsWith('__')) { document.getElementById('v_msg').innerText='Please select branch/sem/subject'; return; }
  const link = normalizeYouTube(document.getElementById('v_link').value.trim());
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
};

/* PRACTICALS */
document.getElementById('r_save').onclick = async function(){
  const title = document.getElementById('r_title').value.trim();
  if(!title){ document.getElementById('r_msg').innerText='Enter title'; return; }
  const docId = currentDocId();
  if(docId.endsWith('__')) { document.getElementById('r_msg').innerText='Please select branch/sem/subject'; return; }
  const link = normalizeDriveLink(document.getElementById('r_link').value.trim());
  try{
    await addDoc(collection(db,'practicals',docId,'items'), {
      title,
      description: document.getElementById('r_desc').value.trim(),
      driveLink: link,
      uploaderName: auth.currentUser?.email || 'Admin',
      timestamp: serverTimestamp()
    });
    document.getElementById('r_msg').innerText='Saved';
    document.getElementById('r_title').value=''; document.getElementById('r_desc').value=''; document.getElementById('r_link').value='';
  }catch(e){ document.getElementById('r_msg').innerText = 'Error: ' + e.message; }
};
const manageBtn = document.getElementById("manageBtn");

onAuthStateChanged(auth, user=>{
  if(user && user.uid === ADMIN_UID){
    manageBtn.style.display = "inline-block";
    manageBtn.onclick = () => location.href = "manage.html";
  } else {
    manageBtn.style.display = "none";
  }
});