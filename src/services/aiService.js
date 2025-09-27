import Groq from 'groq-sdk';
import NodeCache from 'node-cache';
import config from '../config/index.js';
import { createLogger } from '../utils/logger.js';
import { CACHE_KEYS, QUIZ_CONFIG, ERROR_MESSAGES } from '../constants/index.js';
import questionGenerator from './questionGenerator.js';

const log = createLogger('ai');
const cache = new NodeCache({ stdTTL: 60 * 10 }); // 10 minutes

const groq = config.groqApiKey ? new Groq({ apiKey: config.groqApiKey }) : null;

class AIService {
  constructor() {
    this.difficultyLevels = QUIZ_CONFIG.DIFFICULTY_LEVELS;
    this.gradeRanges = QUIZ_CONFIG.GRADE_RANGES;
    this.streamRequiredGrades = QUIZ_CONFIG.STREAM_REQUIRED_GRADES;
  }

  generateCacheKey(subject, grade, stream, bucket, count, difficulty) {
    return CACHE_KEYS.QUESTION_GENERATION(subject, grade, stream, bucket, count, difficulty);
  }

  validateSubjectForGrade(subject, grade, stream) {
    if (grade >= 11 && grade <= 12) {
      if (!stream) {
        throw new Error(ERROR_MESSAGES.STREAM_REQUIRED);
      }
      // Add stream validation logic here
    }
    // Add grade-specific subject validation
    return true;
  }

  determineDifficultyDistribution(userProfile, difficulty) {
    if (difficulty && difficulty !== 'MIX') {
      return { [difficulty.toLowerCase()]: 1 };
    }

    const bucket = userProfile?.bucket || 'new';
    const distributions = {
      high: { easy: 1, medium: 3, hard: 1 },
      low: { easy: 3, medium: 2, hard: 0 },
      mid: { easy: 2, medium: 2, hard: 1 },
      new: { easy: 2, medium: 2, hard: 1 }
    };

    return distributions[bucket] || distributions.new;
  }

  generateQuestionsForDifficulty(difficulty, count, subject, grade, seed) {
    const questions = [];
    for (let i = 0; i < count; i++) {
      const question = questionGenerator.generateSyntheticQuestion(
        subject, 
        difficulty, 
        grade, 
        seed + i
      );
      questions.push({
        id: `${subject}-${difficulty}-${questions.length}-${Math.random().toString(36).slice(2, 8)}`,
        ...question
      });
    }
    return questions;
  }

  async generateQuestions({ userProfile, subject, grade, count = 5, difficulty, stream }) {
    const cacheKey = this.generateCacheKey(subject, grade, stream, userProfile?.bucket, count, difficulty);
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    this.validateSubjectForGrade(subject, grade, stream);

    const distribution = this.determineDifficultyDistribution(userProfile, difficulty);
    const questions = [];
    const usedPrompts = new Set();
    let syntheticSeed = Math.floor(Math.random() * 1000);

    for (const [diff, needed] of Object.entries(distribution)) {
      if (needed > 0) {
        const newQuestions = this.generateQuestionsForDifficulty(
          diff, 
          needed, 
          subject, 
          grade, 
          syntheticSeed
        );
        
        newQuestions.forEach(q => {
          if (!usedPrompts.has(q.prompt)) {
            questions.push(q);
            usedPrompts.add(q.prompt);
          }
        });
        
        syntheticSeed += needed;
      }
    }

    // Fill remaining questions if needed
    while (questions.length < count) {
      const q = questionGenerator.generateSyntheticQuestion(
        subject, 
        'easy', 
        grade, 
        syntheticSeed++
      );
      
      if (!usedPrompts.has(q.prompt)) {
        questions.push({
          id: `${subject}-fill-${questions.length}`,
          ...q
        });
        usedPrompts.add(q.prompt);
      }
    }

    const result = { 
      questions: questions.slice(0, count), 
      difficultyProfile: distribution 
    };
    
    cache.set(cacheKey, result);
    return result;
  }

  evaluateAnswers({ questions, responses }) {
    const answerMap = new Map(
      responses.map((a) => [a.questionId, (a.userResponse || '').toString().trim().toUpperCase()])
    );
    
    let correctCount = 0;
    const details = questions.map((q) => {
      const userAnswer = (answerMap.get(q.id) || '').toUpperCase();
      const isCorrect = userAnswer && userAnswer === (q.correct || '').toUpperCase();
      if (isCorrect) correctCount += 1;
      
      return { 
        questionId: q.id, 
        correctAnswer: q.correct, 
        userAnswer, 
        isCorrect 
      };
    });
    
    const score = Math.round((correctCount / Math.max(1, questions.length)) * 100);
    const suggestions = this.buildSuggestions(details);
    
    return { details, score, suggestions };
  }

  buildSuggestions(details) {
    const wrongAnswers = details.filter((d) => !d.isCorrect);
    if (wrongAnswers.length === 0) {
      return ['Excellent work! You got all questions correct.'];
    }
    
    return [
      `You got ${wrongAnswers.length} question(s) wrong. Review the topics and try again.`,
      'Focus on understanding the concepts rather than memorizing.',
      'Take your time to read each question carefully.'
    ];
  }

  async generateHint({ question, context }) {
    if (!groq) {
      return 'Hint: Review the question carefully and think about the key concepts involved.';
    }

    try {
      const prompt = `Generate a helpful hint for this ${context.subject} question for grade ${context.grade}: ${question.prompt}`;
      const response = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-8b-8192',
        max_tokens: 100
      });
      
      return response.choices[0]?.message?.content || 'Hint: Review the question carefully.';
    } catch (error) {
      log.error('Hint generation failed:', error.message);
      return 'Hint: Review the question carefully and think about the key concepts involved.';
    }
  }
}

const aiService = new AIService();

export const generateQuestions = (params) => aiService.generateQuestions(params);
export const evaluateAnswers = (params) => aiService.evaluateAnswers(params);
export const generateHint = (params) => aiService.generateHint(params);

export default { generateQuestions, evaluateAnswers, generateHint };
