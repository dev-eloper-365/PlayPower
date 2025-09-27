import { QUIZ_CONFIG } from '../constants/index.js';

class QuestionGenerator {
  constructor() {
    this.difficultyLevels = QUIZ_CONFIG.DIFFICULTY_LEVELS;
    this.gradeRanges = QUIZ_CONFIG.GRADE_RANGES;
    this.streamRequiredGrades = QUIZ_CONFIG.STREAM_REQUIRED_GRADES;
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  generateRandomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  createQuestionOptions(correctAnswer, distractors) {
    const allOptions = this.shuffleArray([correctAnswer, ...distractors]).slice(0, 4);
    const labelOptions = ['A', 'B', 'C', 'D'];
    
    return allOptions.map((text, index) => ({
      id: labelOptions[index],
      text: String(text)
    }));
  }

  findCorrectLabel(options, correctAnswer) {
    const correctOption = options.find(option => option.text === String(correctAnswer));
    return correctOption?.id || 'A';
  }

  generateMathematicsQuestion(seed) {
    const a = 2 + ((seed * 3) % 13);
    const b = 1 + ((seed * 5) % 11);
    const answer = a + b;
    const distractors = [answer - 1, answer + 1, answer + 2];
    
    const options = this.createQuestionOptions(answer, distractors);
    const correctLabel = this.findCorrectLabel(options, answer);
    
    return {
      prompt: `${a} + ${b} = ?`,
      options,
      correct: correctLabel,
      difficulty: 'easy'
    };
  }

  generateScienceQuestion(seed) {
    const concepts = [
      'Photosynthesis', 'Gravity', 'Water Cycle', 'Solar System', 
      'Human Body', 'Plants', 'Animals', 'Weather'
    ];
    
    const concept = concepts[seed % concepts.length];
    const questions = [
      `What is the main function of ${concept}?`,
      `Which of the following is related to ${concept}?`,
      `How does ${concept} work?`,
      `What are the characteristics of ${concept}?`
    ];
    
    const question = questions[seed % questions.length];
    const baseOptions = [
      `Key idea about ${concept}`,
      `Alternative explanation for ${concept}`,
      `Common misconception about ${concept}`,
      `Related concept to ${concept}`
    ];
    
    const options = this.createQuestionOptions(baseOptions[0], baseOptions.slice(1));
    
    return {
      prompt: question,
      options,
      correct: 'A',
      difficulty: 'medium'
    };
  }

  generateSubjectSpecificQuestion(subject, seed) {
    const subjectGenerators = {
      'Mathematics': () => this.generateMathematicsQuestion(seed),
      'Science': () => this.generateScienceQuestion(seed),
      // Add more subject generators as needed
    };

    const generator = subjectGenerators[subject];
    if (generator) {
      return generator();
    }

    // Default fallback question
    return this.generateDefaultQuestion(subject, seed);
  }

  generateDefaultQuestion(subject, seed) {
    const question = `What is the main topic in ${subject}?`;
    const options = this.createQuestionOptions(
      `Main concept of ${subject}`,
      [`Alternative ${subject} concept`, `Related ${subject} topic`, `Advanced ${subject} idea`]
    );

    return {
      prompt: question,
      options,
      correct: 'A',
      difficulty: 'easy'
    };
  }

  generateSyntheticQuestion(subject, difficulty, grade, seed = 0) {
    return this.generateSubjectSpecificQuestion(subject, seed);
  }
}

export default new QuestionGenerator();
