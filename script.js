const STORAGE_KEY = "academicResultPortal_v1";

const demoData = {
  students: [
    {id:"1001", name:"আরিফ হাসান", className:"১০ম", group:"বিজ্ঞান", year:"2026"},
    {id:"1002", name:"সুমাইয়া আক্তার", className:"১০ম", group:"বিজ্ঞান", year:"2026"},
    {id:"1003", name:"নাফিস রহমান", className:"১০ম", group:"মানবিক", year:"2026"}
  ],
  exams: [
    {id:"EX-2026-1", name:"বার্ষিক পরীক্ষা", year:"2026", published:true}
  ],
  results: [
    {studentId:"1001", examId:"EX-2026-1", subjects:[{name:"বাংলা",mark:86},{name:"ইংরেজি",mark:78},{name:"গণিত",mark:92},{name:"বিজ্ঞান",mark:88}]},
    {studentId:"1002", examId:"EX-2026-1", subjects:[{name:"বাংলা",mark:90},{name:"ইংরেজি",mark:85},{name:"গণিত",mark:94},{name:"বিজ্ঞান",mark:91}]},
    {studentId:"1003", examId:"EX-2026-1", subjects:[{name:"বাংলা",mark:75},{name:"ইংরেজি",mark:72},{name:"গণিত",mark:68},{name:"ইতিহাস",mark:81}]}
  ]
};

let db = loadData();
let pendingSubjects = [];

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : structuredClone(demoData);
  } catch {
    return JSON.parse(JSON.stringify(demoData));
  }
}
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  renderAll();
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function gradeFor(mark) {
  if (mark >= 80) return {grade:"A+", point:5};
  if (mark >= 70) return {grade:"A", point:4};
  if (mark >= 60) return {grade:"A-", point:3.5};
  if (mark >= 50) return {grade:"B", point:3};
  if (mark >= 40) return {grade:"C", point:2};
  if (mark >= 33) return {grade:"D", point:1};
  return {grade:"F", point:0};
}
function calculate(subjects) {
  if (!subjects.length) return {gpa:"0.00", total:0, failed:true};
  const total = subjects.reduce((sum, s) => sum + Number(s.mark), 0);
  const failed = subjects.some(s => Number(s.mark) < 33);
  const gpa = failed ? 0 : subjects.reduce((sum, s) => sum + gradeFor(Number(s.mark)).point, 0) / subjects.length;
  return {gpa:gpa.toFixed(2), total, failed};
}
function getStudent(id) { return db.students.find(s => s.id === id); }
function getExam(id) { return db.exams.find(e => e.id === id); }
function resultFor(studentId, examId) {
  return db.results.find(r => r.studentId === studentId && r.examId === examId);
}
function showView(view) {
  document.querySelectorAll(".view").forEach(el => el.classList.add("hidden"));
  document.getElementById(view === "admin" ? "adminView" : "resultsView").classList.remove("hidden");
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.view === view));
}
document.querySelectorAll(".nav-btn").forEach(btn => btn.addEventListener("click", () => showView(btn.dataset.view)));

function renderAll() {
  renderSearchOptions();
  renderAdminOptions();
  renderStats();
  renderStudents();
  renderExams();
  renderMarksPreview();
}
function renderSearchOptions() {
  const select = document.getElementById("examSearch");
  const available = db.exams.filter(e => e.published);
  select.innerHTML = available.length
    ? available.map(e => `<option value="${escapeHTML(e.id)}">${escapeHTML(e.name)} (${escapeHTML(e.year)})</option>`).join("")
    : `<option value="">কোনো প্রকাশিত পরীক্ষা নেই</option>`;
}
function renderAdminOptions() {
  document.getElementById("marksStudent").innerHTML = db.students.length
    ? db.students.map(s => `<option value="${escapeHTML(s.id)}">${escapeHTML(s.id)} — ${escapeHTML(s.name)}</option>`).join("")
    : `<option value="">শিক্ষার্থী নেই</option>`;
  document.getElementById("marksExam").innerHTML = db.exams.length
    ? db.exams.map(e => `<option value="${escapeHTML(e.id)}">${escapeHTML(e.name)} (${escapeHTML(e.year)})</option>`).join("")
    : `<option value="">পরীক্ষা নেই</option>`;
}
function renderStats() {
  document.getElementById("studentCount").textContent = db.students.length;
  document.getElementById("examCount").textContent = db.exams.length;
  document.getElementById("publishedCount").textContent = db.exams.filter(e => e.published).length;
}
function renderStudents() {
  const filter = (document.getElementById("studentFilter").value || "").toLowerCase();
  const rows = db.students.filter(s => `${s.id} ${s.name}`.toLowerCase().includes(filter));
  document.getElementById("studentsTable").innerHTML = rows.length ? rows.map(s => `
    <tr><td>${escapeHTML(s.id)}</td><td>${escapeHTML(s.name)}</td><td>${escapeHTML(s.className)}</td><td>${escapeHTML(s.group)}</td>
    <td><button class="small-btn" data-edit="${escapeHTML(s.id)}">Edit</button><button class="small-btn delete" data-delete="${escapeHTML(s.id)}">Delete</button></td></tr>`).join("")
    : `<tr><td colspan="5" class="empty">কোনো শিক্ষার্থী পাওয়া যায়নি</td></tr>`;
}
function renderExams() {
  document.getElementById("examList").innerHTML = db.exams.length ? db.exams.map(e => `
    <div class="exam-row"><div><strong>${escapeHTML(e.name)}</strong><div class="muted">${escapeHTML(e.year)} · ${escapeHTML(e.id)}</div></div>
    <div><span class="status ${e.published ? "published" : ""}">${e.published ? "প্রকাশিত" : "অপ্রকাশিত"}</span>
    <button class="small-btn" data-toggle-exam="${escapeHTML(e.id)}">${e.published ? "আড়াল করুন" : "প্রকাশ করুন"}</button>
    <button class="small-btn delete" data-delete-exam="${escapeHTML(e.id)}">Delete</button></div></div>`).join("")
    : `<p class="empty">এখনো কোনো পরীক্ষা যোগ করা হয়নি।</p>`;
}
function renderMarksPreview() {
  document.getElementById("marksPreview").innerHTML = pendingSubjects.length
    ? pendingSubjects.map((s,i) => `<span class="preview-chip">${escapeHTML(s.name)}: ${s.mark}<button class="small-btn delete" data-remove-subject="${i}">×</button></span>`).join("")
    : `<p class="muted">এখনো কোনো বিষয় যোগ করা হয়নি।</p>`;
  document.getElementById("saveResult").disabled = pendingSubjects.length === 0;
}

document.getElementById("searchForm").addEventListener("submit", e => {
  e.preventDefault();
  const examId = document.getElementById("examSearch").value;
  const roll = document.getElementById("rollSearch").value.trim();
  const area = document.getElementById("resultArea");
  const exam = getExam(examId);
  const student = getStudent(roll);
  if (!exam || !exam.published) {
    area.innerHTML = `<div class="notice">এই পরীক্ষার ফলাফল এখনো প্রকাশ করা হয়নি।</div>`; return;
  }
  if (!student) {
    area.innerHTML = `<div class="notice">এই রোল নম্বরের কোনো শিক্ষার্থী পাওয়া যায়নি।</div>`; return;
  }
  const result = resultFor(student.id, exam.id);
  if (!result || !result.subjects.length) {
    area.innerHTML = `<div class="notice">এই শিক্ষার্থীর ফলাফল এখনো এন্ট্রি করা হয়নি।</div>`; return;
  }
  const summary = calculate(result.subjects);
  const rows = result.subjects.map(s => {
    const g = gradeFor(Number(s.mark));
    return `<tr><td>${escapeHTML(s.name)}</td><td>${s.mark}</td><td>${g.grade}</td><td>${g.point.toFixed(2)}</td></tr>`;
  }).join("");
  area.innerHTML = `<article class="result-card">
    <div class="result-top"><div><h3>পরীক্ষার ফলাফল</h3><p>${escapeHTML(exam.name)} · ${escapeHTML(exam.year)}</p></div><div class="grade-pill">${summary.failed ? "ফেল" : "GPA " + summary.gpa}</div></div>
    <div class="student-meta">
      <div class="meta-item"><span>শিক্ষার্থীর নাম</span><strong>${escapeHTML(student.name)}</strong></div>
      <div class="meta-item"><span>রোল / আইডি</span><strong>${escapeHTML(student.id)}</strong></div>
      <div class="meta-item"><span>শ্রেণি / সেমিস্টার</span><strong>${escapeHTML(student.className)}</strong></div>
      <div class="meta-item"><span>বিভাগ</span><strong>${escapeHTML(student.group || "—")}</strong></div>
      <div class="meta-item"><span>শিক্ষাবর্ষ</span><strong>${escapeHTML(student.year || "—")}</strong></div>
      <div class="meta-item"><span>মোট নম্বর</span><strong>${summary.total}</strong></div>
    </div>
    <div class="table-wrap"><table><thead><tr><th>বিষয়</th><th>প্রাপ্ত নম্বর</th><th>গ্রেড</th><th>গ্রেড পয়েন্ট</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="result-summary"><span>ফলাফল: ${summary.failed ? "অকৃতকার্য" : "কৃতকার্য"}</span><span>মোট বিষয়: ${result.subjects.length}</span></div>
    <div style="padding:0 22px 20px;text-align:right"><button class="primary" onclick="window.print()">Print / PDF</button></div>
  </article>`;
});

document.getElementById("studentForm").addEventListener("submit", e => {
  e.preventDefault();
  const id = document.getElementById("studentRoll").value.trim();
  const student = {
    id, name:document.getElementById("studentName").value.trim(),
    className:document.getElementById("studentClass").value.trim(),
    group:document.getElementById("studentGroup").value.trim(),
    year:document.getElementById("studentYear").value.trim()
  };
  const editing = document.getElementById("editStudentId").value;
  if (!id || !student.name) return;
  if (!editing && getStudent(id)) { alert("এই রোল/আইডি আগে থেকেই আছে।"); return; }
  if (editing && editing !== id && getStudent(id)) { alert("এই রোল/আইডি অন্য শিক্ষার্থীর আছে।"); return; }
  if (editing) {
    const old = getStudent(editing);
    Object.assign(old, student);
    db.results.forEach(r => { if (r.studentId === editing) r.studentId = id; });
  } else db.students.push(student);
  clearStudentForm(); saveData();
});
function clearStudentForm() {
  document.getElementById("studentForm").reset();
  document.getElementById("editStudentId").value = "";
}
document.getElementById("clearStudentForm").addEventListener("click", clearStudentForm);
document.getElementById("studentFilter").addEventListener("input", renderStudents);

document.getElementById("examForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("examName").value.trim();
  const year = document.getElementById("examYear").value.trim();
  if (!name || !year) return;
  db.exams.push({id:"EX-" + Date.now(), name, year, published:document.getElementById("examPublished").checked});
  e.target.reset(); document.getElementById("examYear").value = "2026"; saveData();
});

document.getElementById("marksForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("subjectName").value.trim();
  const mark = Number(document.getElementById("subjectMark").value);
  if (!name || !Number.isFinite(mark) || mark < 0 || mark > 100) { alert("নম্বর ০ থেকে ১০০-এর মধ্যে দিন।"); return; }
  if (pendingSubjects.some(s => s.name.toLowerCase() === name.toLowerCase())) { alert("এই বিষয়টি ইতিমধ্যে যোগ করা হয়েছে।"); return; }
  pendingSubjects.push({name, mark});
  document.getElementById("subjectName").value = "";
  document.getElementById("subjectMark").value = "";
  renderMarksPreview();
});
document.getElementById("saveResult").addEventListener("click", () => {
  const studentId = document.getElementById("marksStudent").value;
  const examId = document.getElementById("marksExam").value;
  if (!studentId || !examId || !pendingSubjects.length) return;
  let record = resultFor(studentId, examId);
  if (record) record.subjects = [...pendingSubjects];
  else db.results.push({studentId, examId, subjects:[...pendingSubjects]});
  pendingSubjects = []; saveData();
  alert("ফলাফল সংরক্ষণ করা হয়েছে।");
});

document.addEventListener("click", e => {
  const editId = e.target.dataset.edit;
  if (editId) {
    const s = getStudent(editId); if (!s) return;
    document.getElementById("editStudentId").value = s.id;
    document.getElementById("studentRoll").value = s.id;
    document.getElementById("studentName").value = s.name;
    document.getElementById("studentClass").value = s.className;
    document.getElementById("studentGroup").value = s.group;
    document.getElementById("studentYear").value = s.year;
    document.getElementById("studentForm").scrollIntoView({behavior:"smooth"});
  }
  const deleteId = e.target.dataset.delete;
  if (deleteId && confirm("এই শিক্ষার্থী ও তার ফলাফল মুছে ফেলবেন?")) {
    db.students = db.students.filter(s => s.id !== deleteId);
    db.results = db.results.filter(r => r.studentId !== deleteId); saveData();
  }
  const toggleId = e.target.dataset.toggleExam;
  if (toggleId) { const ex = getExam(toggleId); ex.published = !ex.published; saveData(); }
  const deleteExamId = e.target.dataset.deleteExam;
  if (deleteExamId && confirm("এই পরীক্ষা ও সংশ্লিষ্ট ফলাফল মুছে ফেলবেন?")) {
    db.exams = db.exams.filter(ex => ex.id !== deleteExamId);
    db.results = db.results.filter(r => r.examId !== deleteExamId); saveData();
  }
  if (e.target.dataset.removeSubject !== undefined) {
    pendingSubjects.splice(Number(e.target.dataset.removeSubject), 1); renderMarksPreview();
  }
});
document.getElementById("resetDemo").addEventListener("click", () => {
  if (confirm("সব ডেটা মুছে ডেমো ডেটা ফিরিয়ে আনবেন?")) {
    db = JSON.parse(JSON.stringify(demoData)); pendingSubjects = [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); renderAll();
    document.getElementById("resultArea").innerHTML = "";
  }
});

renderAll();
