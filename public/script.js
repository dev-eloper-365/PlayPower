const $ = (sel) => document.querySelector(sel);
const api = {
  base: '',
  token() { return sessionStorage.getItem('token') || ''; },
  setToken(t) { sessionStorage.setItem('token', t); $('#token').value = t; },
  headers(auth = true) {
    const heads = { 'Content-Type': 'application/json' };
    if (auth && this.token()) heads['Authorization'] = 'Bearer ' + this.token();
    return heads;
  },
  async post(path, body, auth = true) {
    const res = await fetch(this.base + path, { method: 'POST', headers: this.headers(auth), body: JSON.stringify(body) });
    return res.json();
  },
  async get(path, auth = true) {
    const res = await fetch(this.base + path, { headers: this.headers(auth) });
    return res.json();
  }
};

// Auth
$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = $('#username').value.trim();
  const password = $('#password').value;
  const out = await api.post('/api/auth/login', { username, password }, false);
  if (out.ok) {
    api.setToken(out.token);
  } else {
    alert(out.error?.message || 'Login failed');
  }
});

// Subject options by grade and stream
const subjectsByGrade = {
  1: ['Gujarati', 'Hindi', 'English', 'Mathematics', 'Environmental Studies', 'Art', 'Moral Education', 'Physical Education'],
  2: ['Gujarati', 'Hindi', 'English', 'Mathematics', 'Environmental Studies', 'Art', 'Moral Education', 'Physical Education'],
  3: ['Gujarati', 'Hindi', 'English', 'Mathematics', 'Environmental Studies', 'Art', 'Moral Education', 'Physical Education'],
  4: ['Gujarati', 'Hindi', 'English', 'Mathematics', 'Environmental Studies', 'Art', 'Moral Education', 'Physical Education'],
  5: ['Gujarati', 'Hindi', 'English', 'Mathematics', 'Environmental Studies', 'Art', 'Moral Education', 'Physical Education'],
  6: ['Gujarati', 'Hindi', 'Sanskrit', 'English', 'Mathematics', 'Science', 'Social Science', 'Computer', 'Art', 'Physical Education'],
  7: ['Gujarati', 'Hindi', 'Sanskrit', 'English', 'Mathematics', 'Science', 'Social Science', 'Computer', 'Art', 'Physical Education'],
  8: ['Gujarati', 'Hindi', 'Sanskrit', 'English', 'Mathematics', 'Science', 'Social Science', 'Computer', 'Art', 'Physical Education'],
  9: ['Gujarati', 'Hindi', 'Sanskrit', 'English', 'Mathematics', 'Science', 'Social Science', 'Computer', 'Art', 'Physical Education'],
  10: ['Gujarati', 'Hindi', 'Sanskrit', 'English', 'Mathematics', 'Science', 'Social Science', 'Computer', 'Art', 'Physical Education'],
};

const streamSubjects = {
  'Science Stream': ['Gujarati', 'English', 'Hindi', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Physical Education'],
  'Commerce Stream': ['Gujarati', 'English', 'Hindi', 'Accountancy', 'Business Studies', 'Economics', 'Statistics', 'Mathematics', 'Computer Science', 'Physical Education'],
  'Arts / Humanities Stream': ['Gujarati', 'English', 'Hindi', 'History', 'Geography', 'Political Science', 'Sociology', 'Economics', 'Psychology', 'Sanskrit', 'Statistics', 'Computer Science', 'Physical Education'],
};

function updateSubjectOptions() {
  const grade = Number($('#grade').value);
  const stream = $('#Stream').value;
  const subjectSelect = $('#Subject');
  const streamSelect = $('#Stream');
  
  // Show/hide stream field based on grade
  if (grade >= 11 && grade <= 12) {
    streamSelect.style.display = 'block';
    streamSelect.closest('label').style.display = 'block';
  } else {
    streamSelect.style.display = 'none';
    streamSelect.closest('label').style.display = 'none';
    streamSelect.value = ''; // Clear stream value for grades 1-10
  }
  
  subjectSelect.innerHTML = '<option value="">Select Subject</option>';
  
  let subjects = [];
  if (grade >= 11 && grade <= 12) {
    if (stream) {
      subjects = streamSubjects[stream] || [];
    }
  } else {
    subjects = subjectsByGrade[grade] || [];
  }
  
  subjects.forEach(subject => {
    const option = document.createElement('option');
    option.value = subject;
    option.textContent = subject;
    subjectSelect.appendChild(option);
  });
}

// Update subjects when grade or stream changes
$('#grade').addEventListener('change', updateSubjectOptions);
$('#Stream').addEventListener('change', updateSubjectOptions);

// Generate
$('#genForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const grade = Number($('#grade').value);
  const Subject = $('#Subject').value;
  const TotalQuestions = Number($('#TotalQuestions').value);
  const MaxScore = Number($('#MaxScore').value);
  const Difficulty = $('#Difficulty').value;
  const Stream = grade >= 11 ? $('#Stream').value : undefined;
  const res = await api.post('/api/quiz/generate', { grade, Subject, TotalQuestions, MaxScore, Difficulty, Stream });
  $('#genResult').textContent = JSON.stringify(res, null, 2);
  if (res.ok) {
    const quiz = res.quiz;
    $('#quizId').value = quiz.id;
    const answersDiv = $('#answers');
    answersDiv.innerHTML = '';
    quiz.questions.forEach((q, idx) => {
      const wrap = document.createElement('div');
      wrap.className = 'answer';
      const label = document.createElement('label');
      label.textContent = `Q${idx + 1}: ${q.prompt}`;
      const select = document.createElement('select');
      select.dataset.qid = q.id;
      q.options.forEach(opt => {
        const o = document.createElement('option');
        o.value = opt.id;
        o.textContent = `${opt.id}) ${opt.text}`;
        select.appendChild(o);
      });
      wrap.appendChild(label);
      wrap.appendChild(select);
      answersDiv.appendChild(wrap);
    });
  }
});

// Submit
$('#submitForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const quizId = $('#quizId').value.trim();
  const responses = Array.from(document.querySelectorAll('#answers select')).map((i) => ({ questionId: i.dataset.qid, userResponse: i.value }));
  const res = await api.post('/api/quiz/submit', { quizId, responses });
  $('#submitResult').textContent = JSON.stringify(res, null, 2);
});

// Populate history subjects dropdown based on selected grade/stream
function updateHistorySubjectOptions() {
  const grade = Number($('#hGrade').value || 0);
  const stream = $('#hStream').value;
  const sel = $('#hSubject');
  sel.innerHTML = '<option value="">(any subject)</option>';
  let subjects = [];
  if (grade >= 11 && grade <= 12) {
    if (stream) subjects = streamSubjects[stream] || [];
  } else if (grade >= 1 && grade <= 10) {
    subjects = subjectsByGrade[grade] || [];
  } else {
    // If no grade, show a union of common subjects
    subjects = Array.from(new Set(Object.values(subjectsByGrade).flat())).slice(0, 20);
  }
  subjects.forEach((s) => {
    const o = document.createElement('option');
    o.value = s;
    o.textContent = s;
    sel.appendChild(o);
  });
}

$('#hGrade').addEventListener('change', updateHistorySubjectOptions);
$('#hStream').addEventListener('change', updateHistorySubjectOptions);

// History
$('#historyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const params = new URLSearchParams();
  const add = (k, v) => { if (v !== '' && v != null) params.append(k, v); };
  add('grade', $('#hGrade').value);
  add('stream', $('#hStream').value);
  add('subject', $('#hSubject').value);
  add('minMarks', $('#minMarks').value);
  add('maxMarks', $('#maxMarks').value);
  // Normalize date range: default to same day if only one provided; swap if from > to
  let fromVal = $('#from').value;
  let toVal = $('#to').value;
  if (fromVal && !toVal) toVal = fromVal;
  if (toVal && !fromVal) fromVal = toVal;
  if (fromVal && toVal && fromVal > toVal) {
    const tmp = fromVal; fromVal = toVal; toVal = tmp;
  }
  add('from', fromVal);
  add('to', toVal);
  add('page', $('#page').value || 1);
  add('pageSize', $('#pageSize').value || 10);
  const res = await api.get('/api/quiz/history?' + params.toString());
  $('#historyResult').textContent = JSON.stringify(res, null, 2);
});

// Retry
$('#retryForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const quizId = $('#retryQuizId').value.trim();
  const responses = Array.from(document.querySelectorAll('#answers select')).map((i) => ({ questionId: i.dataset.qid, userResponse: i.value }));
  const res = await api.post(`/api/quiz/${encodeURIComponent(quizId)}/retry`, { responses });
  $('#retryResult').textContent = JSON.stringify(res, null, 2);
});

// Hint
$('#hintForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const quizId = $('#hintQuizId').value.trim();
  const questionId = $('#questionId').value.trim();
  const res = await api.post(`/api/quiz/${encodeURIComponent(quizId)}/hint`, { questionId });
  $('#hintResult').textContent = JSON.stringify(res, null, 2);
});

// Init
(() => {
  const t = sessionStorage.getItem('token');
  if (t) $('#token').value = t;
  updateSubjectOptions(); // Initialize subject options
  updateHistorySubjectOptions();
})();

// Clear
$('#clear').addEventListener('click', () => { sessionStorage.clear(); location.reload(); });


