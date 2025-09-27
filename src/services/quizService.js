import { insertQuiz, getQuizById } from '../models/quizModel.js';
import { insertSubmission } from '../models/submissionModel.js';
import { upsertPerformance, getPerformance } from '../models/performanceModel.js';
import { generateQuestions, evaluateAnswers, generateHint } from './aiService.js';
import { NotFound } from '../utils/errors.js';
import { sendEmail } from './emailService.js';

export async function generateQuizForUser({ userId, subject, grade, totalQuestions, difficulty, stream }) {
  const perf = getPerformance({ userId, subject, grade });
  const userProfile = perf
    ? { bucket: perf.rolling_accuracy >= 75 ? 'high' : perf.rolling_accuracy <= 40 ? 'low' : 'mid' }
    : { bucket: 'new' };
  const { questions, difficultyProfile } = await generateQuestions({ userProfile, subject, grade, count: totalQuestions, difficulty, stream });
  const quiz = insertQuiz({ userId, subject, grade, questions, difficultyProfile, stream });
  return { quiz: { ...quiz, questions }, difficultyProfile };
}

export async function submitAnswers({ userId, quizId, answers }) {
  const quiz = getQuizById(quizId);
  if (!quiz || quiz.user_id !== userId) throw new NotFound('Quiz not found');
  const questions = JSON.parse(quiz.questions_json);
  const evaluation = await evaluateAnswers({ questions, responses: answers });
  const score = evaluation.score;
  const submission = insertSubmission({ quizId, userId, answers, evaluation, score });
  // update rolling performance
  upsertPerformance({ userId, subject: quiz.subject, grade: quiz.grade, score });
  // fire-and-forget email (if configured)
  setImmediate(async () => {
    try {
      const subject = `AI Quizzer - Your ${quiz.subject} Quiz Results (Grade ${quiz.grade})`;
      const timestamp = new Date().toLocaleString('en-US', { 
        timeZone: 'UTC', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const text = `
AI Quizzer - Quiz Results

Dear Student,

Thank you for completing your ${quiz.subject} quiz for Grade ${quiz.grade}.

QUIZ RESULTS:
- Subject: ${quiz.subject}
- Grade Level: ${quiz.grade}
- Score: ${score}%
- Completion Date: ${timestamp}
- Submission ID: ${submission.id}

${score >= 80 ? 'Excellent work! You have a strong understanding of the material.' : 
  score >= 60 ? 'Good job! Consider reviewing the topics you missed.' : 
  'Keep studying! Practice more to improve your understanding.'}

This is an automated message from AI Quizzer. Please do not reply to this email.

Best regards,
AI Quizzer Team
      `.trim();
      
      const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Quizzer - Quiz Results</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { background: #ffffff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
        .score { font-size: 24px; font-weight: bold; color: ${score >= 80 ? '#28a745' : score >= 60 ? '#ffc107' : '#dc3545'}; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d; }
        .highlight { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎓 AI Quizzer - Quiz Results</h1>
        <p>Your educational assessment results</p>
    </div>
    
    <div class="content">
        <h2>Dear Student,</h2>
        <p>Thank you for completing your <strong>${quiz.subject}</strong> quiz for <strong>Grade ${quiz.grade}</strong>.</p>
        
        <div class="highlight">
            <h3>📊 Quiz Results</h3>
            <p><strong>Subject:</strong> ${quiz.subject}</p>
            <p><strong>Grade Level:</strong> ${quiz.grade}</p>
            <p><strong>Score:</strong> <span class="score">${score}%</span></p>
            <p><strong>Completion Date:</strong> ${timestamp}</p>
            <p><strong>Submission ID:</strong> <code>${submission.id}</code></p>
        </div>
        
        <div class="highlight">
            <h3>💡 Feedback</h3>
            <p>${score >= 80 ? '🎉 Excellent work! You have a strong understanding of the material.' : 
              score >= 60 ? '👍 Good job! Consider reviewing the topics you missed.' : 
              '📚 Keep studying! Practice more to improve your understanding.'}</p>
        </div>
        
        <p>Continue practicing with more quizzes to improve your knowledge and skills!</p>
    </div>
    
    <div class="footer">
        <p>This is an automated message from AI Quizzer Educational Platform.</p>
        <p>Please do not reply to this email. For support, contact your teacher or administrator.</p>
        <p>© ${new Date().getFullYear()} AI Quizzer. All rights reserved.</p>
    </div>
</body>
</html>
      `.trim();
      
      await sendEmail({ 
        to: `${userId}@example.local`, 
        subject, 
        text, 
        html,
        headers: {
          'X-Mailer': 'AI Quizzer Educational Platform',
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal',
          'Importance': 'Normal',
          'X-Auto-Response-Suppress': 'All',
          'Precedence': 'bulk'
        }
      });
    } catch {}
  });
  return { submission, score, suggestions: evaluation.suggestions };
}

export async function retryQuiz({ userId, quizId, answers }) {
  const quiz = getQuizById(quizId);
  if (!quiz || quiz.user_id !== userId) throw new NotFound('Quiz not found');
  const questions = JSON.parse(quiz.questions_json);
  const evaluation = await evaluateAnswers({ questions, responses: answers });
  const score = evaluation.score;
  const submission = insertSubmission({ quizId, userId, answers, evaluation, score });
  upsertPerformance({ userId, subject: quiz.subject, grade: quiz.grade, score });
  return { submission, score };
}

export async function getHint({ userId, quizId, questionId }) {
  const quiz = getQuizById(quizId);
  if (!quiz || quiz.user_id !== userId) throw new NotFound('Quiz not found');
  const questions = JSON.parse(quiz.questions_json);
  const question = questions.find((q) => q.id === questionId);
  if (!question) throw new NotFound('Question not found');
  const hint = await generateHint({ question, context: { subject: quiz.subject, grade: quiz.grade } });
  return { hint };
}

export default { generateQuizForUser, submitAnswers, retryQuiz, getHint };


