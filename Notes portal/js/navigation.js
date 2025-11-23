// js/navigation.js
export function setCourse(name){
  localStorage.setItem('selectedCourse', name);
  location.href = 'course.html';
}
export function setBranch(name){
  localStorage.setItem('selectedBranch', name);
  location.href = 'semester.html';
}
export function setSemester(name){
  localStorage.setItem('selectedSemester', name);
  location.href = 'subject.html';
}
export function setSubject(name){
  localStorage.setItem('selectedSubject', name);
  location.href = 'subject-options.html';
}
export function goTo(path){ location.href = path; }
