const mockQuestions = [
  {
    id: 1,
    round: 1,
    category: "पौराणिक साहित्य (Classical Literature)",
    question: "कालिदास की प्रसिद्ध रचनाएं (Famous works of Kalidasa)",
    answers: [
      { text: "अभिज्ञानशाकुन्तलम्", points: 38, revealed: false },
      { text: "मेघदूतम्", points: 29, revealed: false },
      { text: "रघुवंशम्", points: 18, revealed: false },
      { text: "कुमारसंभवम्", points: 12, revealed: false },
      { text: "ऋतुसंहारम्", points: 6, revealed: false },
      { text: "मालविकाग्निमित्रम्", points: 4, revealed: false }
    ]
  },
  {
    id: 2,
    round: 1,
    category: "व्याकरण (Grammar)",
    question: "पाणिनि के अष्टाध्यायी के प्रमुख अवधारणाएं (Concepts from Panini's Ashtadhyayi)",
    answers: [
      { text: "संधि नियम", points: 42, revealed: false },
      { text: "धातु (क्रिया मूल)", points: 31, revealed: false },
      { text: "विभक्ति", points: 19, revealed: false },
      { text: "प्रत्यय", points: 13, revealed: false },
      { text: "समास", points: 8, revealed: false },
      { text: "छन्द", points: 5, revealed: false }
    ]
  },
  {
    id: 3,
    round: 1,
    category: "दर्शन (Philosophy)",
    question: "प्रमुख दार्शनिक संप्रदाय (Major philosophical schools)",
    answers: [
      { text: "वेदान्त", points: 45, revealed: false },
      { text: "सांख्य", points: 35, revealed: false },
      { text: "योग", points: 28, revealed: false },
      { text: "न्याय", points: 20, revealed: false },
      { text: "वैशेषिक", points: 12, revealed: false },
      { text: "मीमांसा", points: 8, revealed: false }
    ]
  },
  {
    id: 4,
    round: 2,
    category: "महाकाव्य (Epics)",
    question: "महाभारत के प्रमुख पात्र (Main characters from Mahabharata)",
    answers: [
      { text: "अर्जुन", points: 48, revealed: false },
      { text: "कृष्ण", points: 40, revealed: false },
      { text: "भीम", points: 25, revealed: false },
      { text: "द्रौपदी", points: 18, revealed: false },
      { text: "कर्ण", points: 15, revealed: false },
      { text: "युधिष्ठिर", points: 10, revealed: false }
    ]
  },
  {
    id: 5,
    round: 2,
    category: "पवित्र ग्रंथ (Sacred Texts)",
    question: "प्रसिद्ध उपनिषद (Famous Upanishads)",
    answers: [
      { text: "ईश उपनिषद", points: 40, revealed: false },
      { text: "कठ उपनिषद", points: 32, revealed: false },
      { text: "छान्दोग्य उपनिषद", points: 25, revealed: false },
      { text: "बृहदारण्यक उपनिषद", points: 18, revealed: false },
      { text: "मुण्डक उपनिषद", points: 12, revealed: false },
      { text: "माण्डूक्य उपनिषद", points: 8, revealed: false }
    ]
  },
  {
    id: 6,
    round: 3,
    category: "वैदिक साहित्य (Vedic Literature)",
    question: "चार वेद और संबंधित ग्रंथ (Four Vedas and related texts)",
    answers: [
      { text: "ऋग्वेद", points: 50, revealed: false },
      { text: "सामवेद", points: 35, revealed: false },
      { text: "यजुर्वेद", points: 28, revealed: false },
      { text: "अथर्ववेद", points: 20, revealed: false },
      { text: "उपनिषद", points: 15, revealed: false },
      { text: "ब्राह्मण", points: 8, revealed: false }
    ]
  },
  {
    id: 7,
    round: 3,
    category: "योग शब्दावली (Yoga Terminology)",
    question: "योग अभ्यास में प्रयुक्त संस्कृत शब्द (Sanskrit words used in yoga practice)",
    answers: [
      { text: "आसन", points: 45, revealed: false },
      { text: "प्राणायाम", points: 38, revealed: false },
      { text: "ध्यान", points: 30, revealed: false },
      { text: "नमस्ते", points: 22, revealed: false },
      { text: "चक्र", points: 15, revealed: false },
      { text: "मंत्र", points: 10, revealed: false }
    ]
  },
  {
    id: 8,
    round: 3,
    category: "देवी-देवता (Deities)",
    question: "संस्कृत ग्रंथों में वर्णित प्रमुख देवता (Major deities mentioned in Sanskrit texts)",
    answers: [
      { text: "विष्णु", points: 50, revealed: false },
      { text: "शिव", points: 45, revealed: false },
      { text: "ब्रह्मा", points: 35, revealed: false },
      { text: "इन्द्र", points: 25, revealed: false },
      { text: "सरस्वती", points: 18, revealed: false },
      { text: "गणेश", points: 12, revealed: false }
    ]
  }
];

module.exports = mockQuestions;
