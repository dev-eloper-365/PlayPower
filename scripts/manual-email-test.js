// Usage: node scripts/manual-email-test.js you@example.com http://localhost:3000
const [,, toArg, baseArg] = process.argv;
const to = toArg || process.env.TEST_TO || 'you@example.com';
const base = (baseArg || process.env.TEST_BASE || 'http://localhost:3000').replace(/\/$/, '');

async function main() {
  const username = 'testuser@example.com';
  const password = 'password';
  const loginRes = await fetch(base + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  }).then(r => r.json());
  if (!loginRes.ok) throw new Error('Login failed: ' + JSON.stringify(loginRes));
  const token = loginRes.token;
  const auth = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };

  const genRes = await fetch(base + '/api/quiz/generate', {
    method: 'POST', headers: auth,
    body: JSON.stringify({ grade: 6, Subject: 'Science', TotalQuestions: 5, MaxScore: 10, Difficulty: 'MEDIUM' })
  }).then(r => r.json());
  if (!genRes.ok) throw new Error('Generate failed: ' + JSON.stringify(genRes));
  const quizId = genRes.quiz.id;
  const responses = (genRes.quiz.questions || []).map(q => ({ questionId: q.id, userResponse: 'A' }));

  const submitRes = await fetch(base + '/api/quiz/submit', {
    method: 'POST', headers: auth,
    body: JSON.stringify({ quizId, responses })
  }).then(r => r.json());
  if (!submitRes.ok) throw new Error('Submit failed: ' + JSON.stringify(submitRes));
  console.log('Submitted:', submitRes);

  const sendRes = await fetch(base + `/api/quiz/${encodeURIComponent(quizId)}/send-result`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({ to })
  }).then(r => r.json());
  console.log('Send-result:', sendRes);
}

main().catch((e) => { console.error(e); process.exit(1); }); 