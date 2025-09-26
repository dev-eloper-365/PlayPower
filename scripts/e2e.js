/* eslint-disable no-console */
const base = process.env.BASE_URL || 'http://localhost:3000';

async function json(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text, status: res.status }; }
}

async function main() {
  const out = {};
  // Unauthorized
  let res = await fetch(base + '/api/quiz/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grade: 6, subject: 'math' }) });
  out.unauth_generate = { status: res.status };

  // Login
  res = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'student1', password: 'password' }) });
  const login = await json(res);
  out.login = { status: res.status, ok: login.ok };
  const token = login.token;
  const auth = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // Bad generate - test stream forbidden for grade 6
  res = await fetch(base + '/api/quiz/generate', { method: 'POST', headers: auth, body: JSON.stringify({ grade: 6, Subject: 'Mathematics', TotalQuestions: 5, MaxScore: 10, Difficulty: 'MEDIUM', Stream: 'Science Stream' }) });
  out.bad_generate_stream = { status: res.status };

  // Generate OK
  res = await fetch(base + '/api/quiz/generate', { method: 'POST', headers: auth, body: JSON.stringify({ grade: 6, Subject: 'Mathematics', TotalQuestions: 5, MaxScore: 10, Difficulty: 'MEDIUM' }) });
  const gen = await json(res);
  out.generate = { status: res.status, quizId: gen.quiz?.id, qCount: gen.quiz?.questions?.length };
  const quizId = gen.quiz?.id;

  // Submit invalid
  res = await fetch(base + '/api/quiz/submit', { method: 'POST', headers: auth, body: JSON.stringify({ quizId, answers: [] }) });
  out.submit_empty = { status: res.status };

  // Build answers & submit OK
  const answers = (gen.quiz?.questions || []).map((q) => ({ questionId: q.id, userResponse: (q.options && q.options[0]?.id) || 'A' }));
  res = await fetch(base + '/api/quiz/submit', { method: 'POST', headers: auth, body: JSON.stringify({ quizId, responses: answers }) });
  const submitOk = await json(res);
  out.submit_ok = { status: res.status, body: submitOk };

  // History dd/mm/yyyy
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const ddmmyyyy = `${dd}/${mm}/${yyyy}`;
  res = await fetch(base + `/api/quiz/history?subject=${encodeURIComponent('Mathematics')}&from=${encodeURIComponent(ddmmyyyy)}&to=${encodeURIComponent(ddmmyyyy)}&page=1&pageSize=5`, { headers: { Authorization: `Bearer ${token}` } });
  const hist1 = await json(res);
  out.history_ddmmyyyy = { status: res.status, body: hist1 };

  // History ISO
  const iso = `${yyyy}-${mm}-${dd}`;
  res = await fetch(base + `/api/quiz/history?subject=${encodeURIComponent('Mathematics')}&from=${encodeURIComponent(iso)}&to=${encodeURIComponent(iso)}&page=1&pageSize=5`, { headers: { Authorization: `Bearer ${token}` } });
  const hist2 = await json(res);
  out.history_iso = { status: res.status, body: hist2 };

  // Retry
  res = await fetch(base + `/api/quiz/${encodeURIComponent(quizId)}/retry`, { method: 'POST', headers: auth, body: JSON.stringify({ responses: answers }) });
  out.retry = { status: res.status, body: await json(res) };

  // Hint bad
  res = await fetch(base + `/api/quiz/${encodeURIComponent(quizId)}/hint`, { method: 'POST', headers: auth, body: JSON.stringify({ questionId: 'nope' }) });
  out.hint_bad = { status: res.status };

  // Hint ok
  const firstQ = gen.quiz?.questions?.[0]?.id;
  res = await fetch(base + `/api/quiz/${encodeURIComponent(quizId)}/hint`, { method: 'POST', headers: auth, body: JSON.stringify({ questionId: firstQ }) });
  const hintOk = await json(res);
  out.hint_ok = { status: res.status, hasHint: !!hintOk.hint };

  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error('E2E failed', e);
  process.exit(1);
});


