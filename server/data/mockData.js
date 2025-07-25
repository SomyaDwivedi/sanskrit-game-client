// mockData.js - 18 questions for turn-based gameplay (3 rounds, 3 questions per team per round)
// Updated to have only 3 answers per question instead of 6
import { v4 as uuidv4 } from "uuid";

const tossUpQuestion = {
  id: uuidv4(),
  round: 0,
  questionNumber: 1,
  question: "Toss-up: Name something people do when they wake up.",
  answers: [
    { text: "Brush teeth", points: 30, revealed: false },
    { text: "Stretch", points: 20, revealed: false },
    { text: "Check phone", points: 50, revealed: false }
  ],
  teamAssignment: "shared" // or just leave undefined
};

const mockQuestions = [
  
  // ROUND 1 - TEAM A QUESTIONS (1-3)
  {
    id: 1,
    round: 1,
    teamAssignment: "team1", // Team A
    questionNumber: 1,
    category: "Literature",
    question: "Name a famous Shakespeare play",
    answers: [
      { text: "Romeo and Juliet", points: 50, revealed: false },
      { text: "Hamlet", points: 40, revealed: false },
      { text: "Macbeth", points: 30, revealed: false },
    ],
  },
  {
    id: 2,
    round: 1,
    teamAssignment: "team1",
    questionNumber: 2,
    category: "Geography",
    question: "Name a country in Europe",
    answers: [
      { text: "France", points: 50, revealed: false },
      { text: "Germany", points: 40, revealed: false },
      { text: "Italy", points: 30, revealed: false },
    ],
  },
  {
    id: 3,
    round: 1,
    teamAssignment: "team1",
    questionNumber: 3,
    category: "Food & Drinks",
    question: "Name a popular breakfast food",
    answers: [
      { text: "Eggs", points: 50, revealed: false },
      { text: "Bacon", points: 40, revealed: false },
      { text: "Cereal", points: 30, revealed: false },
    ],
  },

  // ROUND 1 - TEAM B QUESTIONS (4-6)
  {
    id: 4,
    round: 1,
    teamAssignment: "team2", // Team B
    questionNumber: 1,
    category: "Movies",
    question: "Name a superhero from Marvel or DC",
    answers: [
      { text: "Spider-Man", points: 50, revealed: false },
      { text: "Batman", points: 40, revealed: false },
      { text: "Superman", points: 30, revealed: false },
    ],
  },
  {
    id: 5,
    round: 1,
    teamAssignment: "team2",
    questionNumber: 2,
    category: "Science",
    question: "Name a planet in our solar system",
    answers: [
      { text: "Earth", points: 50, revealed: false },
      { text: "Mars", points: 40, revealed: false },
      { text: "Jupiter", points: 30, revealed: false },
    ],
  },
  {
    id: 6,
    round: 1,
    teamAssignment: "team2",
    questionNumber: 3,
    category: "Sports",
    question: "Name a popular sport played worldwide",
    answers: [
      { text: "Soccer/Football", points: 50, revealed: false },
      { text: "Basketball", points: 40, revealed: false },
      { text: "Tennis", points: 30, revealed: false },
    ],
  },

  // ROUND 2 - TEAM A QUESTIONS (7-9)
  {
    id: 7,
    round: 2,
    teamAssignment: "team1",
    questionNumber: 1,
    category: "Animals",
    question: "Name a type of wild cat",
    answers: [
      { text: "Lion", points: 50, revealed: false },
      { text: "Tiger", points: 40, revealed: false },
      { text: "Leopard", points: 30, revealed: false },
    ],
  },
  {
    id: 8,
    round: 2,
    teamAssignment: "team1",
    questionNumber: 2,
    category: "Technology",
    question: "Name a popular social media platform",
    answers: [
      { text: "Facebook", points: 50, revealed: false },
      { text: "Instagram", points: 40, revealed: false },
      { text: "Twitter/X", points: 30, revealed: false },
    ],
  },
  {
    id: 9,
    round: 2,
    teamAssignment: "team1",
    questionNumber: 3,
    category: "History",
    question: "Name a famous historical monument",
    answers: [
      { text: "Taj Mahal", points: 50, revealed: false },
      { text: "Great Wall of China", points: 40, revealed: false },
      { text: "Eiffel Tower", points: 30, revealed: false },
    ],
  },

  // ROUND 2 - TEAM B QUESTIONS (10-12)
  {
    id: 10,
    round: 2,
    teamAssignment: "team2",
    questionNumber: 1,
    category: "Music",
    question: "Name a popular music genre",
    answers: [
      { text: "Pop", points: 50, revealed: false },
      { text: "Rock", points: 40, revealed: false },
      { text: "Hip Hop", points: 30, revealed: false },
    ],
  },
  {
    id: 11,
    round: 2,
    teamAssignment: "team2",
    questionNumber: 2,
    category: "Transportation",
    question: "Name a mode of transportation",
    answers: [
      { text: "Car", points: 50, revealed: false },
      { text: "Bus", points: 40, revealed: false },
      { text: "Train", points: 30, revealed: false },
    ],
  },
  {
    id: 12,
    round: 2,
    teamAssignment: "team2",
    questionNumber: 3,
    category: "Colors",
    question: "Name a primary or secondary color",
    answers: [
      { text: "Red", points: 50, revealed: false },
      { text: "Blue", points: 40, revealed: false },
      { text: "Yellow", points: 30, revealed: false },
    ],
  },

  // ROUND 3 - TEAM A QUESTIONS (13-15)
  {
    id: 13,
    round: 3,
    teamAssignment: "team1",
    questionNumber: 1,
    category: "Professions",
    question: "Name a common profession or job",
    answers: [
      { text: "Teacher", points: 50, revealed: false },
      { text: "Doctor", points: 40, revealed: false },
      { text: "Engineer", points: 30, revealed: false },
    ],
  },
  {
    id: 14,
    round: 3,
    teamAssignment: "team1",
    questionNumber: 2,
    category: "Weather",
    question: "Name a type of weather condition",
    answers: [
      { text: "Sunny", points: 50, revealed: false },
      { text: "Rainy", points: 40, revealed: false },
      { text: "Cloudy", points: 30, revealed: false },
    ],
  },
  {
    id: 15,
    round: 3,
    teamAssignment: "team1",
    questionNumber: 3,
    category: "Household Items",
    question: "Name a common household appliance",
    answers: [
      { text: "Refrigerator", points: 50, revealed: false },
      { text: "Washing Machine", points: 40, revealed: false },
      { text: "Microwave", points: 30, revealed: false },
    ],
  },

  // ROUND 3 - TEAM B QUESTIONS (16-18)
  {
    id: 16,
    round: 3,
    teamAssignment: "team2",
    questionNumber: 1,
    category: "Board Games",
    question: "Name a popular board game",
    answers: [
      { text: "Monopoly", points: 50, revealed: false },
      { text: "Scrabble", points: 40, revealed: false },
      { text: "Chess", points: 30, revealed: false },
    ],
  },
  {
    id: 17,
    round: 3,
    teamAssignment: "team2",
    questionNumber: 2,
    category: "Fruits",
    question: "Name a popular fruit",
    answers: [
      { text: "Apple", points: 50, revealed: false },
      { text: "Banana", points: 40, revealed: false },
      { text: "Orange", points: 30, revealed: false },
    ],
  },
  {
    id: 18,
    round: 3,
    teamAssignment: "team2",
    questionNumber: 3,
    category: "School Subjects",
    question: "Name a common school subject",
    answers: [
      { text: "Mathematics", points: 50, revealed: false },
      { text: "English", points: 40, revealed: false },
      { text: "Science", points: 30, revealed: false },
    ],
  },
];

mockQuestions.unshift(tossUpQuestion);


module.exports = mockQuestions;
