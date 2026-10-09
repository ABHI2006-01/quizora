const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const seededQuizId = "quizora-development-sample-quiz";

const questions = [
  {
    id: "quizora-sample-mcq-single",
    type: "MCQ_SINGLE",
    text: "Which data structure follows the first-in, first-out principle?",
    marks: 2,
    difficulty: "EASY",
    cognitiveLevel: "REMEMBER",
    topicTag: "Data structures",
    explanation: "A queue processes items in the order they were added.",
    options: [
      { text: "Stack", isCorrect: false },
      { text: "Queue", isCorrect: true },
      { text: "Tree", isCorrect: false },
      { text: "Graph", isCorrect: false },
    ],
  },
  {
    id: "quizora-sample-mcq-multiple",
    type: "MCQ_MULTIPLE",
    text: "Which of these are comparison-based sorting algorithms?",
    marks: 2,
    difficulty: "MEDIUM",
    cognitiveLevel: "UNDERSTAND",
    topicTag: "Algorithms",
    explanation:
      "Merge sort and insertion sort compare elements to determine order.",
    options: [
      { text: "Merge sort", isCorrect: true },
      { text: "Counting sort", isCorrect: false },
      { text: "Insertion sort", isCorrect: true },
      { text: "Radix sort", isCorrect: false },
    ],
  },
  {
    id: "quizora-sample-true-false",
    type: "TRUE_FALSE",
    text: "Binary search requires the input collection to be sorted.",
    marks: 2,
    difficulty: "EASY",
    cognitiveLevel: "UNDERSTAND",
    topicTag: "Algorithms",
    explanation:
      "Binary search uses ordering to discard half of the remaining range at each step.",
    options: [
      { text: "True", isCorrect: true },
      { text: "False", isCorrect: false },
    ],
  },
  {
    id: "quizora-sample-numerical",
    type: "NUMERICAL",
    text: "A queue contains 7 items. If 3 items are removed, how many remain?",
    marks: 2,
    difficulty: "MEDIUM",
    cognitiveLevel: "APPLY",
    topicTag: "Queue operations",
    explanation: "Removing 3 items from 7 leaves 4 items.",
    meta: { correctAnswer: "4", tolerance: 0 },
  },
  {
    id: "quizora-sample-short-answer",
    type: "SHORT_ANSWER",
    text: "In one sentence, describe why a hash table can provide fast average lookup.",
    marks: 2,
    difficulty: "MEDIUM",
    cognitiveLevel: "UNDERSTAND",
    topicTag: "Data structures",
    explanation: "A hash function maps keys to buckets for direct access.",
    meta: {
      modelAnswer:
        "A hash function maps a key to a bucket, allowing average constant-time lookup when collisions are limited.",
    },
  },
  {
    id: "quizora-sample-descriptive",
    type: "DESCRIPTIVE",
    text: "Compare breadth-first search and depth-first search, including one use case for each.",
    marks: 2,
    difficulty: "HARD",
    cognitiveLevel: "ANALYZE",
    topicTag: "Graph algorithms",
    explanation:
      "BFS explores by distance from the start; DFS explores one path deeply before backtracking.",
    meta: {
      modelAnswer:
        "Breadth-first search explores neighbors level by level and can find shortest paths in unweighted graphs. Depth-first search follows a path as far as possible before backtracking and is useful for tasks such as cycle detection.",
      rubric:
        "Award credit for distinguishing level-order exploration from deep path exploration and giving a relevant use case for each.",
    },
  },
];

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The development seed cannot run in production.");
  }

  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error(
      "Set SEED_PASSWORD to a value of at least 8 characters before seeding.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const teacher = await prisma.user.upsert({
    where: { email: "teacher.seed@quizora.local" },
    create: {
      name: "Quizora Seed Teacher",
      email: "teacher.seed@quizora.local",
      passwordHash,
      role: "TEACHER",
    },
    update: { name: "Quizora Seed Teacher", role: "TEACHER" },
  });

  await prisma.teacherProfile.upsert({
    where: { userId: teacher.id },
    create: {
      userId: teacher.id,
      institution: "Quizora Development",
      designation: "Instructor",
    },
    update: {
      institution: "Quizora Development",
      designation: "Instructor",
    },
  });

  const students = await Promise.all(
    ["001", "002", "003"].map(async (number) => {
      const student = await prisma.user.upsert({
        where: { email: `student${number}.seed@quizora.local` },
        create: {
          name: `Quizora Seed Student ${number}`,
          email: `student${number}.seed@quizora.local`,
          passwordHash,
          role: "STUDENT",
        },
        update: {
          name: `Quizora Seed Student ${number}`,
          role: "STUDENT",
        },
      });

      await prisma.studentProfile.upsert({
        where: { userId: student.id },
        create: {
          userId: student.id,
          rollNumber: `QUIZORA-SEED-${number}`,
          department: "Computer Science",
          year: "1",
          className: "Development",
        },
        update: {
          rollNumber: `QUIZORA-SEED-${number}`,
          department: "Computer Science",
          year: "1",
          className: "Development",
        },
      });

      return student;
    }),
  );

  await prisma.quiz.upsert({
    where: { id: seededQuizId },
    create: {
      id: seededQuizId,
      teacherId: teacher.id,
      title: "Sample Algorithms Quiz",
      subject: "Computer Science",
      topic: "Data structures and algorithms",
      description:
        "Development-only sample quiz covering every supported question type.",
      totalMarks: 12,
      durationMinutes: 30,
      status: "DRAFT",
    },
    update: {
      teacherId: teacher.id,
      title: "Sample Algorithms Quiz",
      subject: "Computer Science",
      topic: "Data structures and algorithms",
      description:
        "Development-only sample quiz covering every supported question type.",
      totalMarks: 12,
      durationMinutes: 30,
      status: "DRAFT",
    },
  });

  for (const [orderIndex, question] of questions.entries()) {
    const { options, meta, ...questionData } = question;
    await prisma.question.upsert({
      where: { id: question.id },
      create: {
        ...questionData,
        quizId: seededQuizId,
        orderIndex,
        isApproved: false,
        ...(options ? { options: { create: options } } : {}),
        ...(meta ? { meta: { create: meta } } : {}),
      },
      update: {
        ...questionData,
        quizId: seededQuizId,
        orderIndex,
        isApproved: false,
        ...(options ? { options: { deleteMany: {}, create: options } } : {}),
        ...(meta ? { meta: { upsert: { create: meta, update: meta } } } : {}),
      },
    });
  }

  console.info(
    `Seeded one teacher, ${students.length} students, and a draft quiz with ${questions.length} questions.`,
  );
  console.info(
    "Seed login password is the value supplied through SEED_PASSWORD.",
  );
}

main()
  .catch((error) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
