import { insertQuiz, getQuizById } from '../models/quizModel.js';
import { insertSubmission } from '../models/submissionModel.js';
import { upsertPerformance, getPerformance } from '../models/performanceModel.js';
import { generateQuestions, evaluateAnswers, generateHint } from './aiService.js';
import { NotFound } from '../utils/errors.js';
import { sendEmail } from './emailService.js';
import { ERROR_MESSAGES, QUIZ_CONFIG } from '../constants/index.js';

class QuizService {
  constructor() {
    this.performanceThresholds = {
      HIGH: 75,
      LOW: 40
    };
  }

  determineUserProfile(performance) {
    if (!performance) {
      return { bucket: 'new' };
    }

    const { rolling_accuracy } = performance;
    if (rolling_accuracy >= this.performanceThresholds.HIGH) {
      return { bucket: 'high' };
    }
    if (rolling_accuracy <= this.performanceThresholds.LOW) {
      return { bucket: 'low' };
    }
    return { bucket: 'mid' };
  }

  async generateQuizForUser({ userId, subject, grade, totalQuestions, difficulty, stream }) {
    const performance = getPerformance({ userId, subject, grade });
    const userProfile = this.determineUserProfile(performance);
    
    const { questions, difficultyProfile } = await generateQuestions({ 
      userProfile, 
      subject, 
      grade, 
      count: totalQuestions, 
      difficulty, 
      stream 
    });
    
    const quiz = insertQuiz({ 
      userId, 
      subject, 
      grade, 
      questions, 
      difficultyProfile, 
      stream 
    });
    
    return { 
      quiz: { ...quiz, questions }, 
      difficultyProfile 
    };
  }

  validateQuizAccess(quiz, userId) {
    if (!quiz || quiz.user_id !== userId) {
      throw new NotFound(ERROR_MESSAGES.QUIZ_NOT_FOUND);
    }
  }

  parseQuizQuestions(quiz) {
    return JSON.parse(quiz.questions_json);
  }

  createEmailContent(quiz, score, submissionId) {
    const subject = `AI Quizzer - Your ${quiz.subject} Quiz Results (Grade ${quiz.grade})`;
    const text = `Thank you for completing your quiz!\n\nScore: ${score}%\nSubmission ID: ${submissionId}\n\nKeep learning with AI Quizzer!`;
    const html = this.createEmailHtml(quiz, score, submissionId);
    
    return { subject, text, html };
  }

  createEmailHtml(quiz, score, submissionId) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">🎉 Quiz Results</h2>
        <p>Thank you for completing your <strong>${quiz.subject}</strong> quiz!</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Score:</strong> ${score}%</p>
          <p><strong>Submission ID:</strong> ${submissionId}</p>
        </div>
        <p>Keep learning with AI Quizzer! 🚀</p>
      </div>
    `;
  }

  sendResultEmail(userId, quiz, score, submissionId) {
    setImmediate(async () => {
      try {
        const { subject, text, html } = this.createEmailContent(quiz, score, submissionId);
        
        await sendEmail({ 
          to: `${userId}@example.local`, 
          subject, 
          text, 
          html
        });
      } catch (error) {
        console.log('Email send skipped or failed:', error.message);
      }
    });
  }

  async submitAnswers({ userId, quizId, answers }) {
    const quiz = getQuizById(quizId);
    this.validateQuizAccess(quiz, userId);
    
    const questions = this.parseQuizQuestions(quiz);
    const evaluation = await evaluateAnswers({ questions, responses: answers });
    const score = evaluation.score;
    
    const submission = insertSubmission({ 
      quizId, 
      userId, 
      answers, 
      evaluation, 
      score 
    });
    
    upsertPerformance({ 
      userId, 
      subject: quiz.subject, 
      grade: quiz.grade, 
      score 
    });
    
    this.sendResultEmail(userId, quiz, score, submission.id);
    
    return { 
      submission, 
      score, 
      suggestions: evaluation.suggestions 
    };
  }

  async retryQuiz({ userId, quizId, answers }) {
    const quiz = getQuizById(quizId);
    this.validateQuizAccess(quiz, userId);
    
    const questions = this.parseQuizQuestions(quiz);
    const evaluation = await evaluateAnswers({ questions, responses: answers });
    const score = evaluation.score;
    
    const submission = insertSubmission({ 
      quizId, 
      userId, 
      answers, 
      evaluation, 
      score 
    });
    
    upsertPerformance({ 
      userId, 
      subject: quiz.subject, 
      grade: quiz.grade, 
      score 
    });
    
    return { submission, score };
  }

  async getHint({ userId, quizId, questionId }) {
    const quiz = getQuizById(quizId);
    this.validateQuizAccess(quiz, userId);
    
    const questions = this.parseQuizQuestions(quiz);
    const question = questions.find((q) => q.id === questionId);
    
    if (!question) {
      throw new NotFound(ERROR_MESSAGES.QUESTION_NOT_FOUND);
    }
    
    const hint = await generateHint({ 
      question, 
      context: { subject: quiz.subject, grade: quiz.grade } 
    });
    
    return { hint };
  }
}

const quizService = new QuizService();

export const generateQuizForUser = (params) => quizService.generateQuizForUser(params);
export const submitAnswers = (params) => quizService.submitAnswers(params);
export const retryQuiz = (params) => quizService.retryQuiz(params);
export const getHint = (params) => quizService.getHint(params);

export default { generateQuizForUser, submitAnswers, retryQuiz, getHint };


