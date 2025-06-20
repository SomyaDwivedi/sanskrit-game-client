const mockQuestions = [
  {
    id: 1,
    round: 1,
    category: "Classical Literature",
    question: "Name a famous work by Kalidasa",
    answers: [
      { text: "Abhijnanasakuntalam", points: 38, revealed: false },
      { text: "Meghaduta", points: 29, revealed: false },
      { text: "Raghuvamsha", points: 18, revealed: false },
      { text: "Kumarasambhava", points: 12, revealed: false },
      { text: "Ritusamhara", points: 6, revealed: false },
      { text: "Malavikagnimitram", points: 4, revealed: false }
    ]
  },
  {
    id: 2,
    round: 1,
    category: "Grammar",
    question: "Name a concept from Panini's Ashtadhyayi",
    answers: [
      { text: "Sandhi Rules", points: 42, revealed: false },
      { text: "Dhatu (Verb Roots)", points: 31, revealed: false },
      { text: "Vibhakti (Case Endings)", points: 19, revealed: false },
      { text: "Pratyaya (Suffixes)", points: 13, revealed: false },
      { text: "Samasa (Compounds)", points: 8, revealed: false },
      { text: "Chandas (Meter)", points: 5, revealed: false }
    ]
  },
  {
    id: 3,
    round: 1,
    category: "Philosophy",
    question: "Name a major Darshana (philosophical school)",
    answers: [
      { text: "Vedanta", points: 45, revealed: false },
      { text: "Samkhya", points: 35, revealed: false },
      { text: "Yoga", points: 28, revealed: false },
      { text: "Nyaya", points: 20, revealed: false },
      { text: "Vaisheshika", points: 12, revealed: false },
      { text: "Mimamsa", points: 8, revealed: false }
    ]
  },
  {
    id: 4,
    round: 2,
    category: "Epics",
    question: "Name a character from Mahabharata",
    answers: [
      { text: "Arjuna", points: 48, revealed: false },
      { text: "Krishna", points: 40, revealed: false },
      { text: "Bhima", points: 25, revealed: false },
      { text: "Draupadi", points: 18, revealed: false },
      { text: "Karna", points: 15, revealed: false },
      { text: "Yudhishthira", points: 10, revealed: false }
    ]
  },
  {
    id: 5,
    round: 2,
    category: "Sacred Texts",
    question: "Name a Upanishad",
    answers: [
      { text: "Isha Upanishad", points: 40, revealed: false },
      { text: "Katha Upanishad", points: 32, revealed: false },
      { text: "Chandogya Upanishad", points: 25, revealed: false },
      { text: "Brihadaranyaka Upanishad", points: 18, revealed: false },
      { text: "Mundaka Upanishad", points: 12, revealed: false },
      { text: "Mandukya Upanishad", points: 8, revealed: false }
    ]
  },
  {
    id: 6,
    round: 3,
    category: "Vedic Literature",
    question: "Name a Veda or Vedic text",
    answers: [
      { text: "Rigveda", points: 50, revealed: false },
      { text: "Samaveda", points: 35, revealed: false },
      { text: "Yajurveda", points: 28, revealed: false },
      { text: "Atharvaveda", points: 20, revealed: false },
      { text: "Upanishads", points: 15, revealed: false },
      { text: "Brahmanas", points: 8, revealed: false }
    ]
  },
  {
    id: 7,
    round: 3,
    category: "Sanskrit Terms",
    question: "Name a Sanskrit word used in yoga practice",
    answers: [
      { text: "Asana", points: 45, revealed: false },
      { text: "Pranayama", points: 38, revealed: false },
      { text: "Meditation (Dhyana)", points: 30, revealed: false },
      { text: "Namaste", points: 22, revealed: false },
      { text: "Chakra", points: 15, revealed: false },
      { text: "Mantra", points: 10, revealed: false }
    ]
  },
  {
    id: 8,
    round: 3,
    category: "Mythology",
    question: "Name a Hindu deity mentioned in Sanskrit texts",
    answers: [
      { text: "Vishnu", points: 50, revealed: false },
      { text: "Shiva", points: 45, revealed: false },
      { text: "Brahma", points: 35, revealed: false },
      { text: "Indra", points: 25, revealed: false },
      { text: "Saraswati", points: 18, revealed: false },
      { text: "Ganesha", points: 12, revealed: false }
    ]
  }
];

module.exports = mockQuestions;