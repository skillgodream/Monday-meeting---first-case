import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Lesson } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || 'anonymous_user',
      email: auth.currentUser?.email || 'unauthenticated',
    },
    operationType,
    path
  };
  console.error('[Firestore Error]:', JSON.stringify(errInfo));
  return errInfo;
}

export interface AuditLogEntry {
  id?: string;
  action: string;
  details: string;
  timestamp: string;
  userId: string;
  userName: string;
  organizationId?: string;
}

// ---------------------------------------------------------------------------
// 1. AUDIT LOGS (Tamper-Proof Immutable Audit Trail)
// ---------------------------------------------------------------------------

/**
 * Records an immutable audit event in Firestore.
 */
export async function logAuditEvent(
  action: string,
  details: string,
  userId: string = 'system_user',
  userName: string = 'System Operational Tech',
  organizationId: string = 'org_default'
): Promise<string> {
  const path = 'audit_logs';
  try {
    const docRef = await addDoc(collection(db, path), {
      action,
      details,
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp(),
      userId,
      userName,
      organizationId
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return '';
  }
}

/**
 * Fetches all audit logs ordered by creation timestamp.
 */
export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  const path = 'audit_logs';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    })) as AuditLogEntry[];
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

// ---------------------------------------------------------------------------
// 2. SOPS / LESSONS (Persistent Training Modules & Source Documents)
// ---------------------------------------------------------------------------

/**
 * Saves or updates a complete SOP training module in Firestore.
 */
export async function saveSopToFirestore(lesson: Lesson): Promise<boolean> {
  const path = 'sops';
  try {
    const docRef = doc(db, path, lesson.id);
    await setDoc(docRef, {
      ...lesson,
      updatedAt: new Date().toISOString(),
      savedAt: new Date().toISOString()
    }, { merge: true });

    await logAuditEvent(
      'SOP_MODULE_SAVED',
      `Saved complete SOP training module "${lesson.title}" (ID: ${lesson.id})`
    );
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${lesson.id}`);
    return false;
  }
}

/**
 * Fetches all persistent SOP training modules from Firestore.
 */
export async function getAllSopsFromFirestore(): Promise<Lesson[]> {
  const path = 'sops';
  try {
    const snapshot = await getDocs(collection(db, path));
    if (snapshot.empty) return [];
    return snapshot.docs.map(docSnap => docSnap.data() as Lesson);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

/**
 * Deletes an SOP training module from Firestore.
 */
export async function deleteSopFromFirestore(sopId: string): Promise<boolean> {
  const path = `sops/${sopId}`;
  try {
    await deleteDoc(doc(db, 'sops', sopId));
    await logAuditEvent('SOP_MODULE_DELETED', `Deleted SOP module with ID: ${sopId}`);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    return false;
  }
}

// ---------------------------------------------------------------------------
// 3. QUIZZES & STANDALONE DRILLS
// ---------------------------------------------------------------------------

export interface StoredQuiz {
  id: string;
  title: string;
  sopId: string;
  questions: any[];
  questionType?: string;
  passingScore?: number;
  createdDate?: string;
  savedAt?: string;
}

/**
 * Saves a generated or standalone quiz assessment to Firestore.
 */
export async function saveQuizToFirestore(quiz: StoredQuiz): Promise<boolean> {
  const path = 'quizzes';
  try {
    const docRef = doc(db, path, quiz.id);
    await setDoc(docRef, {
      ...quiz,
      savedAt: new Date().toISOString()
    }, { merge: true });

    await logAuditEvent(
      'QUIZ_CREATED',
      `Created assessment quiz "${quiz.title}" for SOP ID: ${quiz.sopId}`
    );
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${quiz.id}`);
    return false;
  }
}

/**
 * Fetches all persistent quizzes from Firestore.
 */
export async function getAllQuizzesFromFirestore(): Promise<StoredQuiz[]> {
  const path = 'quizzes';
  try {
    const snapshot = await getDocs(collection(db, path));
    if (snapshot.empty) return [];
    return snapshot.docs.map(docSnap => docSnap.data() as StoredQuiz);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

// ---------------------------------------------------------------------------
// 4. LEARNER PROGRESS & MILESTONES
// ---------------------------------------------------------------------------

export interface UserProgressData {
  userId: string;
  userName?: string;
  role?: string;
  completedMilestones: string[];
  phase1Progress?: number;
  phase2Progress?: number;
  phase3Progress?: number;
  lastActiveAt: string;
}

/**
 * Saves or updates learner milestone progress in Firestore.
 */
export async function saveProgressToFirestore(progress: UserProgressData): Promise<boolean> {
  const path = 'progress';
  try {
    const docRef = doc(db, path, progress.userId);
    await setDoc(docRef, {
      ...progress,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    await logAuditEvent(
      'PROGRESS_UPDATED',
      `Updated milestone progress for user ${progress.userName || progress.userId}`,
      progress.userId,
      progress.userName || 'Learner'
    );
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${progress.userId}`);
    return false;
  }
}

/**
 * Fetches user progress record from Firestore.
 */
export async function getProgressFromFirestore(userId: string): Promise<UserProgressData | null> {
  const path = `progress/${userId}`;
  try {
    const docRef = doc(db, 'progress', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProgressData;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 5. TRAINING ASSIGNMENTS & PILOT TEAM RECORDS
// ---------------------------------------------------------------------------

export interface TrainingAssignmentData {
  id: string;
  title: string;
  sopId: string;
  sopTitle: string;
  targetCohort: string;
  department: string;
  location: string;
  assignedBy: string;
  assignedAt: string;
  status: 'Active' | 'Completed' | 'Archived';
}

/**
 * Saves a training campaign assignment to Firestore.
 */
export async function saveAssignmentToFirestore(assignment: TrainingAssignmentData): Promise<boolean> {
  const path = 'assignments';
  try {
    const docRef = doc(db, path, assignment.id);
    await setDoc(docRef, {
      ...assignment,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    await logAuditEvent(
      'TRAINING_ASSIGNED',
      `Assigned training campaign "${assignment.title}" (${assignment.sopTitle}) to ${assignment.targetCohort}`
    );
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${assignment.id}`);
    return false;
  }
}

/**
 * Fetches all training campaign assignments from Firestore.
 */
export async function getAllAssignmentsFromFirestore(): Promise<TrainingAssignmentData[]> {
  const path = 'assignments';
  try {
    const snapshot = await getDocs(collection(db, path));
    if (snapshot.empty) return [];
    return snapshot.docs.map(docSnap => docSnap.data() as TrainingAssignmentData);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

// ---------------------------------------------------------------------------
// 6. PILOT LEARNERS & SUPERVISOR OBSERVATIONS
// ---------------------------------------------------------------------------

/**
 * Saves or updates a pilot learner profile in Firestore.
 */
export async function saveLearnerToFirestore(learner: any): Promise<boolean> {
  const path = 'learners';
  try {
    const docRef = doc(db, path, learner.id);
    await setDoc(docRef, {
      ...learner,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    await logAuditEvent(
      'LEARNER_PROFILE_SAVED',
      `Saved learner profile and readiness state for "${learner.name}" (${learner.role})`,
      learner.id,
      learner.name
    );
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${learner.id}`);
    return false;
  }
}

/**
 * Fetches all pilot learners from Firestore.
 */
export async function getAllLearnersFromFirestore(): Promise<any[]> {
  const path = 'learners';
  try {
    const snapshot = await getDocs(collection(db, path));
    if (snapshot.empty) return [];
    return snapshot.docs.map(docSnap => docSnap.data());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

// ---------------------------------------------------------------------------
// 7. ASSESSMENT ATTEMPTS & SCORES
// ---------------------------------------------------------------------------

export interface AttemptData {
  id: string;
  userId: string;
  userName: string;
  quizId: string;
  sopId: string;
  sopTitle?: string;
  score: number;
  passed: boolean;
  completedAt: string;
  answers?: any;
}

/**
 * Saves an assessment attempt record to Firestore.
 */
export async function saveAttemptToFirestore(attempt: AttemptData): Promise<boolean> {
  const path = 'attempts';
  try {
    const docRef = doc(db, path, attempt.id);
    await setDoc(docRef, {
      ...attempt,
      savedAt: new Date().toISOString()
    }, { merge: true });

    await logAuditEvent(
      'ASSESSMENT_COMPLETED',
      `Learner ${attempt.userName} (${attempt.userId}) completed quiz ${attempt.quizId} with score ${attempt.score}% (${attempt.passed ? 'PASSED' : 'FAILED'})`,
      attempt.userId,
      attempt.userName
    );
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${attempt.id}`);
    return false;
  }
}

/**
 * Fetches all assessment attempts from Firestore.
 */
export async function getAllAttemptsFromFirestore(): Promise<AttemptData[]> {
  const path = 'attempts';
  try {
    const snapshot = await getDocs(collection(db, path));
    if (snapshot.empty) return [];
    return snapshot.docs.map(docSnap => docSnap.data() as AttemptData);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

