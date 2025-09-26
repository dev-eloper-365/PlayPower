import Groq from 'groq-sdk';
import NodeCache from 'node-cache';
import config from '../config/index.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('ai');
const cache = new NodeCache({ stdTTL: 60 * 10 });

const groq = config.groqApiKey ? new Groq({ apiKey: config.groqApiKey }) : null;

const fallbackRandomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

function shuffleInPlace(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generateSyntheticQuestion(subject, difficulty, grade, seed = 0) {
  // Simple synthetic generation to guarantee uniqueness and fill counts
  if (subject === 'Mathematics') {
    const a = 2 + ((seed * 3) % 13);
    const b = 1 + ((seed * 5) % 11);
    const answer = a + b;
    const distractors = [answer - 1, answer + 1, answer + 2].map((n) => String(n));
    const all = shuffleInPlace([String(answer), ...distractors]).slice(0, 4);
    const labelOptions = ['A', 'B', 'C', 'D'];
    const mapped = all.map((t, idx) => ({ id: labelOptions[idx], text: t }));
    const correctLabel = mapped.find((o) => o.text === String(answer))?.id || 'A';
    return {
      prompt: `${a} + ${b} = ?`,
      options: mapped,
      correct: correctLabel,
      difficulty: difficulty || 'easy',
    };
  }
  if (subject === 'Science') {
    const concepts = ['Photosynthesis', 'Gravity', 'Water Cycle', 'Solar System', 'Human Body', 'Plants', 'Animals', 'Weather'];
    const concept = concepts[seed % concepts.length];
    const questions = [
      `What is the main function of ${concept}?`,
      `Which of the following is related to ${concept}?`,
      `How does ${concept} work?`,
      `What are the characteristics of ${concept}?`,
    ];
    const question = questions[seed % questions.length];
    const baseOptions = [
      `Key idea about ${concept}`,
      `Alternative detail about ${concept}`,
      `Unrelated statement`,
      `Another unrelated statement`
    ];
    // Randomize correct answer position (assume index 0 is correct before shuffle)
    const labelOptions = ['A', 'B', 'C', 'D'];
    const correctText = baseOptions[0];
    const randomized = shuffleInPlace(baseOptions.slice());
    const mapped = randomized.map((t, idx) => ({ id: labelOptions[idx], text: t }));
    const correctIdx = randomized.findIndex((t) => t === correctText);
    const correctLabel = labelOptions[Math.max(0, correctIdx)];
    return { prompt: question, options: mapped, correct: correctLabel, difficulty: difficulty || 'easy' };
  }
  // Subject-specific fallback for other subjects
  const subjectQuestions = {
    'Gujarati': [
      'ગુજરાતી ભાષામાં કેટલા વ્યંજનો છે?',
      '"આમ" શબ્દનો અર્થ શું છે?',
      'ગુજરાતી વર્ણમાળામાં કયો અક્ષર પહેલો આવે છે?',
      '"ઘર" શબ્દનો બહુવચન શું છે?',
      'ગુજરાતી ભાષાના કવિ નર્મદાશંકર દવે કયા નામથી પ્રખ્યાત છે?',
      'નવરાત્રી ઉત્સવમાં ગરબા નૃત્ય કયા રાજ્યની પરંપરા છે?',
      'મહાત્મા ગાંધીજીનો જન્મ કયા શહેરમાં થયો હતો?',
      'ગુજરાતી ભાષામાં "ધન્યવાદ" શબ્દનો અર્થ શું છે?'
    ],
    'Hindi': [
      'हिंदी वर्णमाला में कितने स्वर हैं?',
      '"पुस्तक" शब्द का बहुवचन क्या है?',
      'हिंदी में कितने व्यंजन हैं?',
      '"स्कूल" शब्द का हिंदी अनुवाद क्या है?',
      'हिंदी भाषा की लिपि कौन सी है?'
    ],
    'English': [
      'What is the plural of "child"?',
      'Which word is a noun: "run", "quickly", "book", "beautiful"?',
      'What is the past tense of "go"?',
      'Which sentence is correct: "I am go" or "I am going"?',
      'What is the opposite of "hot"?'
    ],
    'Social Science': [
      'Who was the first President of India?',
      'Which is the largest state in India by area?',
      'What is the capital of Gujarat?',
      'Which river is known as the "Ganga of the South"?',
      'In which year did India gain independence?'
    ],
    'Environmental Studies': [
      'What should we do to save water?',
      'Which gas is essential for breathing?',
      'What happens when we cut down too many trees?',
      'Which is a renewable source of energy?',
      'What is the main cause of air pollution?'
    ],
    'Computer': [
      'What does CPU stand for?',
      'Which key is used to delete text to the right of cursor?',
      'What is the full form of RAM?',
      'Which software is used to create presentations?',
      'What does WWW stand for?'
    ],
    'Physics': [
      'What is the unit of force?',
      'Which law states that every action has an equal and opposite reaction?',
      'What is the speed of light in vacuum?',
      'Which type of energy is stored in a stretched spring?',
      'What is the SI unit of electric current?'
    ],
    'Chemistry': [
      'What is the chemical formula of table salt?',
      'Which gas makes up most of Earth\'s atmosphere?',
      'What is the pH of pure water?',
      'Which element has the symbol \'O\'?',
      'What is the process of converting liquid to gas called?'
    ],
    'Biology': [
      'What is the powerhouse of the cell?',
      'Which organ pumps blood throughout the body?',
      'What is the process by which plants make their food?',
      'Which system is responsible for breathing?',
      'What is the smallest unit of life?',
      'Which national park in Gujarat is famous for Asiatic lions?',
      'What type of ecosystem is found in the Rann of Kutch?',
      'Which bird is the state bird of Gujarat?'
    ],
    'Art': [
      'Which traditional Gujarati art form involves creating intricate patterns with colored powders during festivals?',
      'What is the traditional folk dance of Gujarat performed during Navratri that celebrates the victory of good over evil?',
      'Which famous artist from Gujarat is known for his paintings depicting rural life and cultural traditions?',
      'What is the traditional craft of making decorative items from clay that has been practiced in Gujarat for centuries?',
      'Which festival in Gujarat is famous for its colorful kite flying and marks the transition from winter to summer?',
      'What is the traditional embroidery work of Kutch that uses mirrors and colorful threads?',
      'Which art form involves creating beautiful designs on fabric using wax and dye, popular in Gujarat?',
      'What is the traditional musical instrument commonly used in Gujarati folk music and Garba?',
      'Which traditional art form from Saurashtra involves creating paintings on cloth depicting local legends?',
      'What is the name of the traditional wood carving art form practiced in Gujarat?',
      'Which art form involves creating decorative patterns on walls using natural colors and stencils?',
      'What is the traditional craft of making beautiful jewelry using silver and precious stones in Gujarat?'
    ],
    'Arts': [
      'Which traditional Gujarati art form involves creating intricate patterns with colored powders during festivals?',
      'What is the traditional folk dance of Gujarat performed during Navratri that celebrates the victory of good over evil?',
      'Which famous artist from Gujarat is known for his paintings depicting rural life and cultural traditions?',
      'What is the traditional craft of making decorative items from clay that has been practiced in Gujarat for centuries?',
      'Which festival in Gujarat is famous for its colorful kite flying and marks the transition from winter to summer?',
      'What is the traditional embroidery work of Kutch that uses mirrors and colorful threads?',
      'Which art form involves creating beautiful designs on fabric using wax and dye, popular in Gujarat?',
      'What is the traditional musical instrument commonly used in Gujarati folk music and Garba?',
      'Which traditional art form from Saurashtra involves creating paintings on cloth depicting local legends?',
      'What is the name of the traditional wood carving art form practiced in Gujarat?',
      'Which art form involves creating decorative patterns on walls using natural colors and stencils?',
      'What is the traditional craft of making beautiful jewelry using silver and precious stones in Gujarat?'
    ],
    'Moral Education': [
      'What is the most important value taught by Mahatma Gandhi that forms the foundation of moral education?',
      'How should we treat our elders according to Indian culture and Gandhian principles?',
      'What does "Ahimsa" mean in Gandhian philosophy and how does it apply to daily life?',
      'Why is it important to help others in need, as demonstrated by Gujarat\'s tradition of community service?',
      'What is the significance of saying "Thank you" and "Please" in building good character?',
      'How can we show respect to our teachers and parents following the values taught by our great leaders?',
      'What does "Truth" mean in moral education and how did Gandhi practice it?',
      'Why is it important to be honest in our daily life, especially in academic work?',
      'What is the meaning of "Satyamev Jayate" and how does it guide our moral decisions?',
      'How should we behave when we make a mistake, following the principle of accepting responsibility?',
      'What does "Seva" mean in the context of serving our community and nation?',
      'Why is it important to respect all religions and communities, as taught by Gandhi?'
    ],
    'Physical Education': [
      'How many players are there in a cricket team, the most popular sport in Gujarat?',
      'What is the national sport of India that requires great physical fitness and skill?',
      'Which exercise helps in building strong muscles and is practiced in traditional Indian physical training?',
      'What is the importance of warming up before exercise to prevent injuries?',
      'How many minutes of physical activity should children do daily for healthy development?',
      'What is the traditional martial art form of India that combines physical and mental discipline?',
      'Which sport is played with a shuttlecock and requires quick reflexes and agility?',
      'What is the benefit of regular physical exercise for both body and mind?',
      'Which traditional Gujarati dance form provides excellent cardiovascular exercise?',
      'What is the importance of proper nutrition, especially traditional Gujarati foods, for physical fitness?',
      'Which ancient practice from India combines physical postures, breathing, and meditation?',
      'What is the role of mental health in overall physical well-being and academic performance?'
    ],
    'Sanskrit': [
      'What is the meaning of "Namaste" in Sanskrit, the traditional greeting that shows respect?',
      'Which is the oldest language in the world that forms the foundation of many Indian languages?',
      'What does "Dharma" mean in Sanskrit and how does it guide righteous living?',
      'How do you say "Thank you" in Sanskrit, showing gratitude and good manners?',
      'What is the Sanskrit word for "Peace" that represents harmony and tranquility?',
      'Which ancient text is written in Sanskrit and contains India\'s spiritual wisdom?',
      'What does "Vidya" mean in Sanskrit and why is education considered sacred?',
      'How do you say "Good morning" in Sanskrit, the language of ancient wisdom?',
      'What is the meaning of "Vasudhaiva Kutumbakam" and how does it promote world unity?',
      'Which Sanskrit verse emphasizes the importance of truth and how does it relate to Gandhi\'s teachings?',
      'What does "Guru" mean in Sanskrit and why is the teacher-student relationship sacred?',
      'How does Sanskrit connect us to India\'s ancient scientific and mathematical knowledge?'
    ],
    'Computer Science': [
      'What does CPU stand for in computer science and why is it called the brain of the computer?',
      'Which programming language is used for web development and is essential for Gujarat\'s IT industry?',
      'What is the full form of HTML and how does it help create websites?',
      'Which device is used to input data into a computer and is essential for digital work?',
      'What is the purpose of RAM in a computer and how does it affect performance?',
      'Which software is used to create presentations and is important for business communication?',
      'What does WWW stand for and how has it revolutionized information sharing?',
      'Which key is used to delete text to the right of the cursor in word processing?',
      'How does computer science help solve real-world problems in Gujarat\'s development?',
      'What is the importance of cybersecurity in protecting personal and business information?',
      'How can programming skills help students contribute to Digital India initiatives?',
      'What is the role of artificial intelligence in modern technology and future careers?'
    ],
    'Accountancy': [
      'What is the basic equation of accounting that every business in Gujarat must follow?',
      'Which account shows the financial position of a business and helps in decision making?',
      'What is the difference between assets and liabilities in a business balance sheet?',
      'Which principle states that expenses should be matched with revenues for accurate reporting?',
      'What is the purpose of a trial balance in ensuring accounting accuracy?',
      'Which account records the owner\'s investment in the business and shows ownership?',
      'What is the meaning of "Debit" in accounting and how does it affect account balances?',
      'Which financial statement shows the profit or loss of a business over a period?',
      'How does proper accounting help Gujarat\'s textile and diamond industries maintain financial health?',
      'What is the importance of maintaining accurate books of accounts for tax compliance?',
      'How can accounting principles help students manage their personal finances effectively?',
      'What role does accounting play in attracting investors to Gujarat\'s growing businesses?'
    ],
    'Business Studies': [
      'What is the main objective of any business and how does it contribute to Gujarat\'s economy?',
      'Which type of business organization has limited liability and is popular among Gujarati entrepreneurs?',
      'What is the role of marketing in business and how do Gujarat\'s handicrafts reach global markets?',
      'Which function of management involves planning and organizing business activities effectively?',
      'What is the importance of customer service in business success and building reputation?',
      'Which type of business is owned by a single person and is common in Gujarat\'s traditional sectors?',
      'What is the role of finance in business operations and expansion?',
      'Which principle of management emphasizes unity of command and clear reporting relationships?',
      'How do successful Gujarati entrepreneurs like Dhirubhai Ambani inspire business students?',
      'What is the importance of ethical business practices in building long-term success?',
      'How can students apply business principles to their family enterprises and future careers?',
      'What role does innovation play in modern business and Gujarat\'s industrial development?'
    ],
    'Economics': [
      'What is the study of how societies use scarce resources called and why is it important for Gujarat\'s development?',
      'Which economic system is based on supply and demand and how does it work in Gujarat\'s markets?',
      'What is the difference between microeconomics and macroeconomics in understanding economic behavior?',
      'Which factor determines the price of a product in the market and how does it affect consumers?',
      'What is the role of government in a mixed economy like India\'s?',
      'Which economic indicator measures the total value of goods and services produced in Gujarat?',
      'What is the meaning of "Inflation" in economics and how does it affect people\'s purchasing power?',
      'Which type of economy is found in most countries today and balances market forces with government intervention?',
      'How does Gujarat\'s agricultural sector contribute to the state\'s economic growth?',
      'What is the importance of industrial development in creating employment opportunities in Gujarat?',
      'How do economic policies affect the lives of common people in Gujarat?',
      'What role does Gujarat play in India\'s overall economic development and growth?'
    ],
    'Statistics': [
      'What is the average of a set of numbers called and how is it useful in analyzing Gujarat\'s development data?',
      'Which measure shows the middle value in a data set and helps understand typical performance?',
      'What is the difference between mean and median and when should each be used?',
      'Which type of graph is used to show trends over time, like Gujarat\'s economic growth?',
      'What is the purpose of collecting data in statistics and how does it help in decision making?',
      'Which measure shows how spread out the data is and indicates consistency?',
      'What is the meaning of "Mode" in statistics and how does it identify the most common value?',
      'Which type of sampling gives every member an equal chance and ensures fair representation?',
      'How can statistical analysis help understand Gujarat\'s educational performance across districts?',
      'What is the importance of data interpretation in making informed business decisions?',
      'How do statistics help in understanding population trends and planning for the future?',
      'What role does statistical analysis play in evaluating government policies and programs?'
    ],
    'History': [
      'Who founded the Sabarmati Ashram and what was its role in India\'s freedom struggle?',
      'In which year did India gain independence and how did Gujarat contribute to the movement?',
      'Who is known as the Iron Man of India and what was his contribution to national integration?',
      'Which movement led by Gandhi promoted the use of khadi and self-reliance?',
      'What was the significance of the Dandi March and where did it begin in Gujarat?',
      'Which ancient port in Gujarat is known for its role in maritime trade?',
      'Who was the first Deputy Prime Minister of India from Gujarat?',
      'Which leader from Gujarat advocated for non-violence and truth as core principles?',
      'What is the historical importance of Lothal in the Indus Valley Civilization?',
      'Which medieval dynasty ruled parts of Gujarat and developed important architecture?',
      'What was the objective of the Quit India Movement and how did people in Gujarat participate?',
      'Which social reformer from Gujarat worked for women\'s education and social upliftment?'
    ],
    'Geography': [
      'Which is the largest state in India by area and how does its size affect its development?',
      'What is the capital of Gujarat and why was it chosen as the administrative center?',
      'Which river flows through Gujarat and is considered sacred by the people?',
      'What type of climate does Gujarat have and how does it affect agriculture?',
      'Which is the highest peak in India and how does it influence the country\'s geography?',
      'What is the importance of the Tropic of Cancer and how does it affect Gujarat\'s climate?',
      'Which ocean lies to the west of India and how does it benefit Gujarat\'s economy?',
      'What is the difference between weather and climate and how do they affect daily life?',
      'How does Gujarat\'s diverse geography from Kutch to South Gujarat influence its culture?',
      'What is the significance of the Rann of Kutch and how does it affect the local ecosystem?',
      'How do the Western Ghats influence Gujarat\'s rainfall patterns and agriculture?',
      'What role does Gujarat\'s coastal location play in its trade and economic development?'
    ],
    'Political Science': [
      'What is the form of government in India and how does it ensure people\'s participation?',
      'Who is the head of the state in India and what are their constitutional powers?',
      'What is the role of the Parliament in democracy and how does it represent the people?',
      'Which fundamental right ensures freedom of speech and why is it important for democracy?',
      'What is the importance of elections in democracy and how do they ensure accountability?',
      'Which body makes laws in India and how does it reflect the will of the people?',
      'What is the role of the judiciary in democracy and how does it protect citizens\' rights?',
      'Which principle ensures separation of powers and prevents concentration of authority?',
      'How does Gujarat\'s political system work within India\'s federal structure?',
      'What is the importance of local self-government in Gujarat\'s democratic development?',
      'How do political parties contribute to democratic governance in India?',
      'What role do citizens play in strengthening democracy through their participation?'
    ],
    'Sociology': [
      'What is the study of human society called and how does it help understand Gujarat\'s social structure?',
      'Which institution plays a major role in socialization and shapes individual behavior?',
      'What is the difference between culture and society and how do they influence each other?',
      'Which factor influences social behavior and helps maintain social order?',
      'What is the role of family in society and how does it contribute to social stability?',
      'Which concept refers to the unequal distribution of resources and opportunities in society?',
      'What is the importance of social norms and how do they guide behavior in Gujarat?',
      'Which institution provides education to children and prepares them for social roles?',
      'How does Gujarat\'s diverse social fabric contribute to its cultural richness?',
      'What is the role of religion and community in maintaining social harmony in Gujarat?',
      'How is social change affecting traditional practices and values in modern Gujarat?',
      'What role do social institutions play in addressing social problems and development?'
    ],
    'Psychology': [
      'What is the study of human mind and behavior called and how does it help students understand themselves?',
      'Which part of the brain controls memory and how can students improve their learning?',
      'What is the difference between nature and nurture and how do they shape personality?',
      'Which theory explains human development stages and helps understand student growth?',
      'What is the role of motivation in learning and how can students stay motivated?',
      'Which factor influences personality development and helps students build confidence?',
      'What is the meaning of "Stress" in psychology and how can students manage exam pressure?',
      'Which method is used to study human behavior and understand social interactions?',
      'How can psychological principles help students improve their academic performance?',
      'What is the importance of emotional intelligence in personal and academic success?',
      'How do cultural factors influence behavior and thinking patterns in Gujarat?',
      'What role does psychology play in understanding and addressing mental health issues?'
    ]
  };

  const subjectOptions = {
    'Gujarati': [
      ['33', '32', '34', '35'],
      ['આમ', 'આજ', 'આશ', 'આય'],
      ['અ', 'આ', 'ઇ', 'ઈ'],
      ['ઘરો', 'ઘરે', 'ઘરની', 'ઘરને'],
      ['નર્મદ', 'દલપતરામ', 'ઝવેરચંદ', 'ગુનવંતરાય']
    ],
    'Hindi': [
      ['11', '12', '13', '14'],
      ['पुस्तकें', 'पुस्तकों', 'पुस्तक', 'पुस्तका'],
      ['33', '34', '35', '36'],
      ['विद्यालय', 'शिक्षालय', 'पाठशाला', 'स्कूल'],
      ['देवनागरी', 'ब्राह्मी', 'खरोष्ठी', 'गुरुमुखी']
    ],
    'English': [
      ['children', 'childs', 'childrens', 'child'],
      ['book', 'run', 'quickly', 'beautiful'],
      ['went', 'gone', 'goed', 'go'],
      ['I am going', 'I am go', 'I going', 'I go'],
      ['cold', 'warm', 'cool', 'freezing']
    ],
    'Social Science': [
      ['Dr. Rajendra Prasad', 'Jawaharlal Nehru', 'Sardar Patel', 'Dr. Ambedkar'],
      ['Rajasthan', 'Madhya Pradesh', 'Maharashtra', 'Uttar Pradesh'],
      ['Gandhinagar', 'Ahmedabad', 'Vadodara', 'Surat'],
      ['Kaveri', 'Godavari', 'Krishna', 'Tungabhadra'],
      ['1947', '1948', '1946', '1949']
    ],
    'Environmental Studies': [
      ['Turn off taps when not in use', 'Waste water', 'Leave taps running', 'Use more water'],
      ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'],
      ['Soil erosion', 'More oxygen', 'Better climate', 'Cleaner air'],
      ['Solar energy', 'Coal', 'Petroleum', 'Natural gas'],
      ['Vehicle emissions', 'Trees', 'Rain', 'Wind']
    ],
    'Computer': [
      ['Central Processing Unit', 'Computer Processing Unit', 'Central Program Unit', 'Computer Program Unit'],
      ['Delete', 'Backspace', 'Enter', 'Shift'],
      ['Random Access Memory', 'Read Access Memory', 'Random Available Memory', 'Read Available Memory'],
      ['PowerPoint', 'Word', 'Excel', 'Paint'],
      ['World Wide Web', 'World Web Wide', 'Wide World Web', 'Web World Wide']
    ],
    'Physics': [
      ['Newton', 'Joule', 'Watt', 'Pascal'],
      ['Newton\'s Third Law', 'Newton\'s First Law', 'Newton\'s Second Law', 'Law of Gravity'],
      ['3 × 10⁸ m/s', '3 × 10⁶ m/s', '3 × 10⁹ m/s', '3 × 10⁷ m/s'],
      ['Potential energy', 'Kinetic energy', 'Thermal energy', 'Chemical energy'],
      ['Ampere', 'Volt', 'Ohm', 'Watt']
    ],
    'Chemistry': [
      ['NaCl', 'NaCl₂', 'Na₂Cl', 'NaCl₃'],
      ['Nitrogen', 'Oxygen', 'Carbon Dioxide', 'Argon'],
      ['7', '6', '8', '9'],
      ['Oxygen', 'Osmium', 'Oganesson', 'Osmium'],
      ['Evaporation', 'Condensation', 'Sublimation', 'Deposition']
    ],
    'Biology': [
      ['Mitochondria', 'Nucleus', 'Ribosome', 'Chloroplast'],
      ['Heart', 'Lungs', 'Liver', 'Kidney'],
      ['Photosynthesis', 'Respiration', 'Digestion', 'Circulation'],
      ['Respiratory system', 'Circulatory system', 'Digestive system', 'Nervous system'],
      ['Cell', 'Tissue', 'Organ', 'Organism'],
      ['Gir National Park', 'Kaziranga', 'Jim Corbett', 'Bandipur'],
      ['Desert', 'Forest', 'Wetland', 'Grassland'],
      ['Greater Flamingo', 'Peacock', 'Eagle', 'Parrot']
    ],
    'Art': [
      ['Rangoli', 'Painting', 'Sculpture', 'Pottery'],
      ['Garba', 'Bharatanatyam', 'Kathak', 'Odissi'],
      ['Nandalal Bose', 'Raja Ravi Varma', 'Amrita Sher-Gil', 'MF Husain'],
      ['Pottery', 'Weaving', 'Embroidery', 'Carpentry'],
      ['Uttarayan', 'Diwali', 'Holi', 'Dussehra'],
      ['Kutch embroidery', 'Phulkari', 'Chikankari', 'Zardozi'],
      ['Batik', 'Tie-dye', 'Block printing', 'Screen printing'],
      ['Dhol', 'Tabla', 'Sitar', 'Flute'],
      ['Pichwai', 'Madhubani', 'Warli', 'Gond'],
      ['Wood carving', 'Stone carving', 'Metal work', 'Glass work'],
      ['Wall painting', 'Canvas painting', 'Digital art', 'Mixed media'],
      ['Silver jewelry', 'Gold jewelry', 'Pearl jewelry', 'Diamond jewelry']
    ],
    'Arts': [
      ['Rangoli', 'Painting', 'Sculpture', 'Pottery'],
      ['Garba', 'Bharatanatyam', 'Kathak', 'Odissi'],
      ['Nandalal Bose', 'Raja Ravi Varma', 'Amrita Sher-Gil', 'MF Husain'],
      ['Pottery', 'Weaving', 'Embroidery', 'Carpentry'],
      ['Uttarayan', 'Diwali', 'Holi', 'Dussehra'],
      ['Kutch embroidery', 'Phulkari', 'Chikankari', 'Zardozi'],
      ['Batik', 'Tie-dye', 'Block printing', 'Screen printing'],
      ['Dhol', 'Tabla', 'Sitar', 'Flute'],
      ['Pichwai', 'Madhubani', 'Warli', 'Gond'],
      ['Wood carving', 'Stone carving', 'Metal work', 'Glass work'],
      ['Wall painting', 'Canvas painting', 'Digital art', 'Mixed media'],
      ['Silver jewelry', 'Gold jewelry', 'Pearl jewelry', 'Diamond jewelry']
    ],
    'Moral Education': [
      ['Truth and Non-violence', 'Wealth', 'Power', 'Fame'],
      ['With respect and care', 'Casually', 'Indifferently', 'Rudely'],
      ['Non-violence', 'Truth', 'Peace', 'Love'],
      ['It shows compassion', 'It wastes time', 'It is unnecessary', 'It is difficult'],
      ['Shows good manners', 'Wastes time', 'Is unnecessary', 'Is old-fashioned'],
      ['By listening and following', 'By arguing', 'By ignoring', 'By disobeying'],
      ['Honesty and integrity', 'Wealth', 'Power', 'Fame'],
      ['Builds trust', 'Saves time', 'Is easy', 'Is convenient'],
      ['Truth alone triumphs', 'Money is power', 'Success matters most', 'Popularity counts'],
      ['Accept and learn', 'Blame others', 'Make excuses', 'Ignore the mistake'],
      ['Service to others', 'Personal gain', 'Self-interest', 'Individual success'],
      ['Promotes unity', 'Creates division', 'Is unnecessary', 'Causes confusion']
    ],
    'Physical Education': [
      ['11', '9', '13', '15'],
      ['Hockey', 'Cricket', 'Football', 'Tennis'],
      ['Weight lifting', 'Reading', 'Sleeping', 'Eating'],
      ['Prevents injuries', 'Wastes time', 'Is unnecessary', 'Is boring'],
      ['60 minutes', '30 minutes', '120 minutes', '15 minutes'],
      ['Kalaripayattu', 'Karate', 'Taekwondo', 'Judo'],
      ['Badminton', 'Tennis', 'Table tennis', 'Volleyball'],
      ['Keeps body healthy', 'Wastes time', 'Is boring', 'Is difficult'],
      ['Garba', 'Bharatanatyam', 'Kathak', 'Odissi'],
      ['Provides energy', 'Causes laziness', 'Is expensive', 'Is difficult'],
      ['Yoga', 'Meditation', 'Prayer', 'Sleep'],
      ['Improves focus', 'Wastes time', 'Is boring', 'Is difficult']
    ],
    'Sanskrit': [
      ['I bow to you', 'Good morning', 'Thank you', 'Goodbye'],
      ['Sanskrit', 'Latin', 'Greek', 'Hebrew'],
      ['Righteousness', 'Wealth', 'Power', 'Fame'],
      ['Dhanyavadam', 'Namaste', 'Swagatam', 'Pranam'],
      ['Shanti', 'Sukha', 'Dukha', 'Karma'],
      ['Vedas', 'Bible', 'Quran', 'Torah'],
      ['Knowledge', 'Wealth', 'Power', 'Fame'],
      ['Suprabhatam', 'Namaste', 'Dhanyavadam', 'Swagatam'],
      ['World is one family', 'India is great', 'Unity in diversity', 'Peace for all'],
      ['Satyamev Jayate', 'Vasudhaiva Kutumbakam', 'Sarve Bhavantu Sukhinah', 'Lokah Samastah Sukhino Bhavantu'],
      ['Teacher', 'Student', 'Parent', 'Friend'],
      ['Ancient wisdom', 'Modern science', 'Religious texts', 'Historical records']
    ],
    'Computer Science': [
      ['Central Processing Unit', 'Computer Processing Unit', 'Central Program Unit', 'Computer Program Unit'],
      ['JavaScript', 'English', 'Mathematics', 'History'],
      ['HyperText Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlink Text Markup Language'],
      ['Keyboard', 'Monitor', 'Speaker', 'Printer'],
      ['Temporary storage', 'Permanent storage', 'Display', 'Input'],
      ['PowerPoint', 'Calculator', 'Notepad', 'Paint'],
      ['World Wide Web', 'World Web Wide', 'Wide World Web', 'Web World Wide'],
      ['Delete', 'Backspace', 'Enter', 'Shift'],
      ['Digital solutions', 'Traditional methods', 'Manual processes', 'Paper-based systems'],
      ['Data protection', 'Data sharing', 'Data collection', 'Data analysis'],
      ['Technology skills', 'Artistic skills', 'Musical skills', 'Athletic skills'],
      ['Machine learning', 'Manual learning', 'Traditional learning', 'Classroom learning']
    ],
    'Accountancy': [
      ['Assets = Liabilities + Capital', 'Assets = Liabilities - Capital', 'Assets = Capital - Liabilities', 'Assets = Liabilities × Capital'],
      ['Balance Sheet', 'Income Statement', 'Cash Flow', 'Trial Balance'],
      ['Assets are owned, Liabilities are owed', 'Assets are owed, Liabilities are owned', 'Both are same', 'No difference'],
      ['Matching Principle', 'Going Concern', 'Consistency', 'Materiality'],
      ['Check accuracy', 'Show profit', 'Calculate tax', 'Prepare budget'],
      ['Capital Account', 'Revenue Account', 'Expense Account', 'Asset Account'],
      ['Left side', 'Right side', 'Top', 'Bottom'],
      ['Income Statement', 'Balance Sheet', 'Cash Flow', 'Trial Balance'],
      ['Financial health', 'Physical health', 'Mental health', 'Social health'],
      ['Legal compliance', 'Personal preference', 'Social pressure', 'Peer influence'],
      ['Personal budgeting', 'Social networking', 'Entertainment', 'Sports'],
      ['Investment attraction', 'Social status', 'Personal satisfaction', 'Family pressure']
    ],
    'Business Studies': [
      ['Profit maximization', 'Social service', 'Entertainment', 'Competition'],
      ['Company', 'Partnership', 'Sole proprietorship', 'Cooperative'],
      ['Promote products', 'Manufacture goods', 'Provide services', 'Manage finances'],
      ['Management', 'Marketing', 'Finance', 'Human Resources'],
      ['Builds customer loyalty', 'Increases costs', 'Wastes time', 'Is unnecessary'],
      ['Sole proprietorship', 'Partnership', 'Company', 'Cooperative'],
      ['Manage money', 'Manufacture goods', 'Market products', 'Provide services'],
      ['Unity of Command', 'Division of Work', 'Scalar Chain', 'Esprit de Corps'],
      ['Dhirubhai Ambani', 'Bill Gates', 'Steve Jobs', 'Elon Musk'],
      ['Long-term success', 'Quick profits', 'Personal gain', 'Social status'],
      ['Family enterprises', 'Government jobs', 'Sports', 'Entertainment'],
      ['Industrial development', 'Agricultural development', 'Social development', 'Cultural development']
    ],
    'Economics': [
      ['Economics', 'Sociology', 'Psychology', 'Political Science'],
      ['Market economy', 'Command economy', 'Traditional economy', 'Mixed economy'],
      ['Micro studies individuals, Macro studies economy', 'No difference', 'Macro is bigger', 'Micro is smaller'],
      ['Supply and demand', 'Government', 'Weather', 'Luck'],
      ['Regulate and support', 'Control everything', 'Do nothing', 'Only tax'],
      ['GDP', 'CPI', 'GNP', 'NNP'],
      ['Rise in prices', 'Fall in prices', 'No change', 'Economic growth'],
      ['Mixed economy', 'Market economy', 'Command economy', 'Traditional economy'],
      ['Agricultural growth', 'Industrial growth', 'Service growth', 'All sectors'],
      ['Employment creation', 'Profit maximization', 'Social welfare', 'Personal gain'],
      ['Policy impact', 'Weather impact', 'Social impact', 'Cultural impact'],
      ['Economic growth', 'Social development', 'Cultural development', 'Political development']
    ],
    'Statistics': [
      ['Mean', 'Median', 'Mode', 'Range'],
      ['Median', 'Mean', 'Mode', 'Range'],
      ['Mean is average, Median is middle', 'No difference', 'Mean is bigger', 'Median is bigger'],
      ['Line graph', 'Bar graph', 'Pie chart', 'Histogram'],
      ['Make decisions', 'Waste time', 'Confuse people', 'Show off'],
      ['Standard deviation', 'Mean', 'Median', 'Mode'],
      ['Most frequent value', 'Average value', 'Middle value', 'Highest value'],
      ['Random sampling', 'Convenience sampling', 'Stratified sampling', 'Systematic sampling'],
      ['Educational performance', 'Economic performance', 'Social performance', 'Cultural performance'],
      ['Data analysis', 'Data collection', 'Data storage', 'Data sharing'],
      ['Population trends', 'Weather trends', 'Social trends', 'Cultural trends'],
      ['Policy evaluation', 'Social evaluation', 'Cultural evaluation', 'Personal evaluation']
    ],
    'Geography': [
      ['Rajasthan', 'Madhya Pradesh', 'Maharashtra', 'Uttar Pradesh'],
      ['Gandhinagar', 'Ahmedabad', 'Vadodara', 'Surat'],
      ['Narmada', 'Ganga', 'Yamuna', 'Krishna'],
      ['Tropical', 'Temperate', 'Polar', 'Desert'],
      ['Mount Everest', 'K2', 'Kangchenjunga', 'Lhotse'],
      ['Divides India into two parts', 'Shows time zones', 'Indicates seasons', 'Marks boundaries'],
      ['Arabian Sea', 'Bay of Bengal', 'Indian Ocean', 'Pacific Ocean'],
      ['Weather is short-term, Climate is long-term', 'No difference', 'Weather is bigger', 'Climate is bigger'],
      ['Cultural diversity', 'Economic diversity', 'Social diversity', 'Political diversity'],
      ['Unique ecosystem', 'Common ecosystem', 'Urban ecosystem', 'Rural ecosystem'],
      ['Rainfall patterns', 'Temperature patterns', 'Wind patterns', 'Pressure patterns'],
      ['Trade and commerce', 'Agriculture', 'Tourism', 'All of these']
    ],
    'History': [
      ['Mahatma Gandhi', 'Sardar Patel', 'Jawaharlal Nehru', 'Subhas Chandra Bose'],
      ['1947', '1942', '1950', '1930'],
      ['Sardar Vallabhbhai Patel', 'Jawaharlal Nehru', 'B. R. Ambedkar', 'Mahatma Gandhi'],
      ['Swadeshi Movement', 'Non-Cooperation Movement', 'Civil Disobedience', 'Quit India Movement'],
      ['Salt Satyagraha from Sabarmati to Dandi', 'Non-cooperation in Ahmedabad', 'Champaran Satyagraha', 'Kheda Satyagraha'],
      ['Lothal', 'Dwarka', 'Surat', 'Bhavnagar'],
      ['Sardar Vallabhbhai Patel', 'Morarji Desai', 'Vallabhbhai Jhaverbhai', 'Baldevdas Patel'],
      ['Mahatma Gandhi', 'Bal Gangadhar Tilak', 'Bhagat Singh', 'Rabindranath Tagore'],
      ['Dockyard and trade center', 'Royal palace', 'Fortified capital', 'Religious site'],
      ['Sultanate of Gujarat', 'Maurya dynasty', 'Gupta dynasty', 'Pala dynasty'],
      ['End British rule and establish self-rule', 'Support British war efforts', 'Introduce new taxes', 'Create new princely states'],
      ['Savitribai Phule', 'Annie Besant', 'Hansa Mehta', 'Sarojini Naidu']
    ],
    'Political Science': [
      ['Democracy', 'Monarchy', 'Dictatorship', 'Oligarchy'],
      ['President', 'Prime Minister', 'Governor', 'Chief Minister'],
      ['Make laws', 'Enforce laws', 'Interpret laws', 'Execute laws'],
      ['Right to Freedom', 'Right to Equality', 'Right to Education', 'Right to Religion'],
      ['Choose representatives', 'Show power', 'Waste time', 'Create confusion'],
      ['Parliament', 'Supreme Court', 'President', 'Prime Minister'],
      ['Interpret laws', 'Make laws', 'Enforce laws', 'Execute laws'],
      ['Separation of Powers', 'Unity of Command', 'Division of Work', 'Centralization'],
      ['Federal structure', 'Unitary structure', 'Confederal structure', 'Authoritarian structure'],
      ['Local governance', 'Central governance', 'State governance', 'Regional governance'],
      ['Democratic governance', 'Authoritarian governance', 'Monarchical governance', 'Military governance'],
      ['Active participation', 'Passive observation', 'Indifferent attitude', 'Opposition only']
    ],
    'Sociology': [
      ['Sociology', 'Psychology', 'Anthropology', 'Political Science'],
      ['Family', 'School', 'Media', 'Government'],
      ['Culture is shared, Society is group', 'No difference', 'Culture is bigger', 'Society is bigger'],
      ['Environment', 'Genetics', 'Education', 'All of these'],
      ['Socialization', 'Education', 'Entertainment', 'Competition'],
      ['Social inequality', 'Social mobility', 'Social change', 'Social control'],
      ['Maintain order', 'Create chaos', 'Waste time', 'Show power'],
      ['School', 'Family', 'Media', 'Government'],
      ['Cultural richness', 'Economic richness', 'Political richness', 'Social richness'],
      ['Social harmony', 'Social conflict', 'Social isolation', 'Social competition'],
      ['Modernization', 'Traditionalization', 'Westernization', 'Globalization'],
      ['Social development', 'Economic development', 'Political development', 'Cultural development']
    ],
    'Psychology': [
      ['Psychology', 'Sociology', 'Anthropology', 'Philosophy'],
      ['Hippocampus', 'Cerebellum', 'Medulla', 'Pons'],
      ['Nature is genetic, Nurture is environmental', 'No difference', 'Nature is bigger', 'Nurture is bigger'],
      ['Piaget\'s theory', 'Freud\'s theory', 'Erikson\'s theory', 'Maslow\'s theory'],
      ['Drives behavior', 'Wastes time', 'Is unnecessary', 'Is confusing'],
      ['Environment', 'Genetics', 'Education', 'All of these'],
      ['Mental pressure', 'Physical pain', 'Happiness', 'Excitement'],
      ['Observation', 'Guessing', 'Dreaming', 'Imagining'],
      ['Academic performance', 'Social performance', 'Physical performance', 'Cultural performance'],
      ['Emotional intelligence', 'Physical intelligence', 'Social intelligence', 'Cultural intelligence'],
      ['Cultural factors', 'Economic factors', 'Political factors', 'Geographic factors'],
      ['Mental health', 'Physical health', 'Social health', 'Economic health']
    ]
  };

  // Get subject-specific question and options
  const questions = subjectQuestions[subject] || [`What is the main topic in ${subject}?`];
  const options = subjectOptions[subject] || [
    ['Option A', 'Option B', 'Option C', 'Option D']
  ];

  const question = questions[seed % questions.length];
  const optionSet = options[seed % options.length];
  const labelOptions = ['A', 'B', 'C', 'D'];
  // Assume first option is correct; randomize its position
  const correctText = optionSet[0];
  const randomized = shuffleInPlace(optionSet.slice());
  const mapped = randomized.map((t, idx) => ({ id: labelOptions[idx], text: t }));
  const correctIdx = randomized.findIndex((t) => t === correctText);
  const correctLabel = labelOptions[Math.max(0, correctIdx)];
  
  return { prompt: question, options: mapped, correct: correctLabel, difficulty: difficulty || 'easy' };
}

// Gujarat Board Curriculum Subjects by Grade
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

// Stream-based subjects for grades 11-12
const streamSubjects = {
  'Science Stream': ['Gujarati', 'English', 'Hindi', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Physical Education'],
  'Commerce Stream': ['Gujarati', 'English', 'Hindi', 'Accountancy', 'Business Studies', 'Economics', 'Statistics', 'Mathematics', 'Computer Science', 'Physical Education'],
  'Arts / Humanities Stream': ['Gujarati', 'English', 'Hindi', 'History', 'Geography', 'Political Science', 'Sociology', 'Economics', 'Psychology', 'Sanskrit', 'Statistics', 'Computer Science', 'Physical Education'],
};

// Optimized prompts for exam-style question generation
const questionPrompts = {
  Mathematics: {
    easy: 'Create a basic arithmetic problem suitable for grade {grade} students. Include 4 multiple choice options with one correct answer.',
    medium: 'Create an intermediate mathematics problem involving algebra, geometry, or word problems for grade {grade}. Include 4 multiple choice options with one correct answer.',
    hard: 'Create an advanced mathematics problem involving complex calculations, proofs, or multi-step problems for grade {grade}. Include 4 multiple choice options with one correct answer.',
  },
  Science: {
    easy: 'Create a basic science question about fundamental concepts in physics, chemistry, or biology for grade {grade}. Include 4 multiple choice options with one correct answer.',
    medium: 'Create an intermediate science question involving scientific principles, experiments, or applications for grade {grade}. Include 4 multiple choice options with one correct answer.',
    hard: 'Create an advanced science question involving complex scientific theories, calculations, or analysis for grade {grade}. Include 4 multiple choice options with one correct answer.',
  },
  Gujarati: {
    easy: 'Create a basic Gujarati language question about grammar, vocabulary, or simple comprehension for grade {grade}. Include 4 multiple choice options with one correct answer.',
    medium: 'Create an intermediate Gujarati language question involving literature, advanced grammar, or reading comprehension for grade {grade}. Include 4 multiple choice options with one correct answer.',
    hard: 'Create an advanced Gujarati language question involving complex literature analysis, advanced grammar, or creative writing concepts for grade {grade}. Include 4 multiple choice options with one correct answer.',
  },
  English: {
    easy: 'Create a basic English language question about grammar, vocabulary, or simple comprehension for grade {grade}. Include 4 multiple choice options with one correct answer.',
    medium: 'Create an intermediate English language question involving literature, advanced grammar, or reading comprehension for grade {grade}. Include 4 multiple choice options with one correct answer.',
    hard: 'Create an advanced English language question involving complex literature analysis, advanced grammar, or creative writing concepts for grade {grade}. Include 4 multiple choice options with one correct answer.',
  },
  Hindi: {
    easy: 'Create a basic Hindi language question about grammar, vocabulary, or simple comprehension for grade {grade}. Include 4 multiple choice options with one correct answer.',
    medium: 'Create an intermediate Hindi language question involving literature, advanced grammar, or reading comprehension for grade {grade}. Include 4 multiple choice options with one correct answer.',
    hard: 'Create an advanced Hindi language question involving complex literature analysis, advanced grammar, or creative writing concepts for grade {grade}. Include 4 multiple choice options with one correct answer.',
  },
  'Social Science': {
    easy: 'Create a basic social science question about history, geography, civics, or economics for grade {grade}. Include 4 multiple choice options with one correct answer.',
    medium: 'Create an intermediate social science question involving historical events, geographical concepts, or civic knowledge for grade {grade}. Include 4 multiple choice options with one correct answer.',
    hard: 'Create an advanced social science question involving complex historical analysis, geographical reasoning, or economic principles for grade {grade}. Include 4 multiple choice options with one correct answer.',
  },
  'Environmental Studies': {
    easy: 'Create a basic environmental studies question about nature, environment, or basic science concepts for grade {grade}. Include 4 multiple choice options with one correct answer.',
    medium: 'Create an intermediate environmental studies question involving environmental issues, natural phenomena, or conservation for grade {grade}. Include 4 multiple choice options with one correct answer.',
    hard: 'Create an advanced environmental studies question involving complex environmental problems, sustainability, or ecological concepts for grade {grade}. Include 4 multiple choice options with one correct answer.',
  },
  default: {
    easy: 'Create a basic question about {subject} suitable for grade {grade} students. Include 4 multiple choice options with one correct answer.',
    medium: 'Create an intermediate question about {subject} for grade {grade} students. Include 4 multiple choice options with one correct answer.',
    hard: 'Create an advanced question about {subject} for grade {grade} students. Include 4 multiple choice options with one correct answer.',
  },
};

export async function generateQuestions({ userProfile, subject, grade, count = 5, difficulty, stream }) {
  const cacheKey = `gen:${subject}:${grade}:${stream || 'none'}:${userProfile?.bucket || 'new'}:${count}:${difficulty||'MIX'}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Validate subject for grade and stream
  let validSubjects;
  if (grade >= 11 && grade <= 12) {
    if (!stream || !streamSubjects[stream]) {
      throw new Error(`Stream is required for grades 11-12. Available streams: ${Object.keys(streamSubjects).join(', ')}`);
    }
    validSubjects = streamSubjects[stream];
  } else {
    validSubjects = subjectsByGrade[grade];
  }
  
  if (!validSubjects || !validSubjects.includes(subject)) {
    const available = grade >= 11 ? `Stream "${stream}" subjects: ${validSubjects?.join(', ')}` : `Grade ${grade} subjects: ${validSubjects?.join(', ')}`;
    throw new Error(`Subject "${subject}" not available for grade ${grade}${stream ? ` in ${stream}` : ''}. Available: ${available}`);
  }

  const bank = []; // Empty bank - we'll generate all questions synthetically
  const difficulties = ['easy', 'medium', 'hard'];
  const fromDiff = (difficulty === 'EASY' && { easy: count }) || (difficulty === 'MEDIUM' && { medium: count }) || (difficulty === 'HARD' && { hard: count }) || null;
  const distribution = fromDiff || (userProfile?.bucket === 'high'
    ? { easy: 1, medium: 3, hard: 1 }
    : userProfile?.bucket === 'low'
    ? { easy: 3, medium: 2, hard: 0 }
    : { easy: 2, medium: 2, hard: 1 });

  const questions = [];
  const usedPrompts = new Set();
  let syntheticSeed = Math.floor(Math.random() * 1000);
  for (const diff of difficulties) {
    const needed = distribution[diff] || 0;
    for (let i = 0; i < needed && questions.length < count; i++) {
      let q = generateSyntheticQuestion(subject, diff, grade, syntheticSeed++);
      if (usedPrompts.has(q.prompt)) {
        q = generateSyntheticQuestion(subject, diff, grade, syntheticSeed++);
      }
      usedPrompts.add(q.prompt);
      const labelOptions = ['A','B','C','D'];
      const opts = (q.options || []).slice(0,4);
      while (opts.length < 4) opts.push('Option ' + (opts.length + 1));
      const mapped = opts.slice(0,4).map((t, idx2) => typeof t === 'object' && t?.id && t?.text ? t : ({ id: labelOptions[idx2], text: String(t) }));
      const correctLabel = (q.correct && typeof q.correct === 'string' && ['A','B','C','D'].includes(q.correct))
        ? q.correct
        : mapped.find((o) => (o.text+'').toLowerCase() === (q.correct+'').toLowerCase())?.id || 'A';
      questions.push({ id: `${subject}-${diff}-${questions.length}-${Math.random().toString(36).slice(2,8)}`, prompt: q.prompt, options: mapped, correct: correctLabel, difficulty: q.difficulty || diff });
    }
  }
  while (questions.length < count) {
    const q = generateSyntheticQuestion(subject, 'easy', grade, syntheticSeed++);
    if (usedPrompts.has(q.prompt)) continue;
    usedPrompts.add(q.prompt);
    const labelOptions = ['A','B','C','D'];
    const opts = (q.options || []).slice(0,4);
    const mapped = opts.slice(0,4).map((t, idx) => typeof t === 'object' && t?.id && t?.text ? t : ({ id: labelOptions[idx], text: String(t) }));
    const correctLabel = (q.correct && typeof q.correct === 'string' && ['A','B','C','D'].includes(q.correct)) ? q.correct : 'A';
    questions.push({ id: `${subject}-fill-${questions.length}`, prompt: q.prompt, options: mapped, correct: correctLabel, difficulty: q.difficulty || 'easy' });
  }

  const result = { questions, difficultyProfile: distribution };
  cache.set(cacheKey, result);
  return result;
}

export async function evaluateAnswers({ questions, responses }) {
  const answerMap = new Map(responses.map((a) => [a.questionId, (a.userResponse || '').toString().trim().toUpperCase()]));
  let correctCount = 0;
  const details = questions.map((q) => {
    const userAns = (answerMap.get(q.id) || '').toUpperCase();
    const isCorrect = userAns && userAns === (q.correct || '').toUpperCase();
    if (isCorrect) correctCount += 1;
    return { questionId: q.id, correctAnswer: q.correct, userAnswer: userAns, isCorrect };
  });
  const score = Math.round((correctCount / Math.max(1, questions.length)) * 100);
  const suggestions = buildSuggestions(details);
  return { details, score, suggestions };
}

function buildSuggestions(details) {
  const wrong = details.filter((d) => !d.isCorrect);
  if (wrong.length === 0) return ['Great job! Consider trying a harder quiz next.', 'Keep practicing to maintain your performance.'];
  const topics = wrong.map((d) => d.questionId.split('-')[0]);
  const top = topics[0] || 'topic';
  return [
    `Review the fundamentals around ${top}. Identify why the correct answer fits.`,
    'Practice with 3-5 similar questions and check each step carefully.',
  ];
}

export async function generateHint({ question, context }) {
  // Basic heuristic hint to avoid revealing the answer
  if (question.prompt.toLowerCase().includes(' + ')) {
    return 'Break the expression into parts and add step by step.';
  }
  if (question.prompt.toLowerCase().includes('derivative')) {
    return 'Recall power rule: d/dx of x^n = n * x^(n-1).';
  }
  return 'Focus on the key terms in the question and eliminate unlikely options.';
}

export default { generateQuestions, evaluateAnswers, generateHint };


