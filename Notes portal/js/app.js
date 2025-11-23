// js/app.js
export function printPath(){
  return {
    course: localStorage.getItem('selectedCourse'),
    branch: localStorage.getItem('selectedBranch'),
    semester: localStorage.getItem('selectedSemester'),
    subject: localStorage.getItem('selectedSubject')
  };
}
