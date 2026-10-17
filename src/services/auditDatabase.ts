import {
  logAuditEvent,
  getAuditLogs,
  saveSopToFirestore,
  saveQuizToFirestore,
  getAllSopsFromFirestore,
  getAllQuizzesFromFirestore,
  deleteSopFromFirestore,
  saveProgressToFirestore,
  getProgressFromFirestore,
  saveAssignmentToFirestore,
  getAllAssignmentsFromFirestore,
  saveLearnerToFirestore,
  getAllLearnersFromFirestore,
  saveAttemptToFirestore,
  getAllAttemptsFromFirestore,
  AuditLogEntry,
  StoredQuiz,
  UserProgressData,
  TrainingAssignmentData,
  AttemptData
} from './firestorePersistence';
import { CategoryType } from '../types';

export type { AuditLogEntry, StoredQuiz, UserProgressData, TrainingAssignmentData, AttemptData };

export {
  logAuditEvent,
  getAuditLogs,
  saveSopToFirestore,
  saveQuizToFirestore,
  getAllSopsFromFirestore,
  getAllQuizzesFromFirestore,
  deleteSopFromFirestore,
  saveProgressToFirestore,
  getProgressFromFirestore,
  saveAssignmentToFirestore,
  getAllAssignmentsFromFirestore,
  saveLearnerToFirestore,
  getAllLearnersFromFirestore,
  saveAttemptToFirestore,
  getAllAttemptsFromFirestore
};

/**
 * Backward compatible wrapper for saving SOPs to Firestore with audit logging.
 */
export async function saveSopToDatabase(sop: {
  id: string;
  title: string;
  category?: CategoryType;
  content: string;
}) {
  await saveSopToFirestore({
    id: sop.id,
    title: sop.title,
    subtitle: 'Standard Operating Procedure',
    category: (sop.category as CategoryType) || 'Safety',
    color: 'sky',
    accentColor: '#38bdf8',
    stepsCount: 5,
    durationMinutes: 10,
    level: 'Intermediate',
    progress: 0,
    masteryPercentage: 0,
    artType: 'clipboard',
    description: sop.content.slice(0, 150),
    createdAt: new Date().toISOString()
  });
}

/**
 * Backward compatible wrapper for saving Quizzes to Firestore with audit logging.
 */
export async function saveQuizToDatabase(quiz: {
  id: string;
  title: string;
  sopId: string;
  questions: any[];
}) {
  await saveQuizToFirestore({
    id: quiz.id,
    title: quiz.title,
    sopId: quiz.sopId,
    questions: quiz.questions
  });
}
