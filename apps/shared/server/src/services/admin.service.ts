import { userRepository } from '../repositories/user.repository';
import { attemptRepository, type StudentAttemptRow } from '../repositories/attempt.repository';
import type { StudentAnalytics, StudentQuestionStat } from '@shared/api/models/admin.model';

function toQuestionStat(attemptsForQuestion: StudentAttemptRow[]): StudentQuestionStat {
  // Rows arrive oldest-first (see attemptRepository.findAllForStudents), so
  // the last entry is this student's most recent answer on the question.
  const latest = attemptsForQuestion[attemptsForQuestion.length - 1];
  const timeTakenSeconds = latest.completedAt
    ? Math.max(0, Math.round((latest.completedAt.getTime() - latest.startedAt.getTime()) / 1000))
    : null;

  return {
    questionId: latest.questionId,
    category: latest.question.category,
    prompt: latest.question.prompt,
    attempts: attemptsForQuestion.length,
    retryCount: attemptsForQuestion.length - 1,
    correct: latest.isCorrect,
    timeTakenSeconds
  };
}

export class AdminService {

  public async getStudentAnalytics(): Promise<StudentAnalytics[]> {
    const [students, attempts] = await Promise.all([
      userRepository.findAll({ role: 'USER' }),
      attemptRepository.findAllForStudents()
    ]);

    const attemptsByUser = new Map<number, StudentAttemptRow[]>();
    for (const attempt of attempts) {
      const forUser = attemptsByUser.get(attempt.userId);
      if (forUser) {
        forUser.push(attempt);
      } else {
        attemptsByUser.set(attempt.userId, [attempt]);
      }
    }

    return students.map((student): StudentAnalytics => {
      const studentAttempts = attemptsByUser.get(student.id) ?? [];

      const attemptsByQuestion = new Map<number, StudentAttemptRow[]>();
      for (const attempt of studentAttempts) {
        const forQuestion = attemptsByQuestion.get(attempt.questionId);
        if (forQuestion) {
          forQuestion.push(attempt);
        } else {
          attemptsByQuestion.set(attempt.questionId, [attempt]);
        }
      }

      return {
        userId: student.id,
        username: student.username,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        questions: Array.from(attemptsByQuestion.values()).map(toQuestionStat)
      };
    });
  }

}

export const adminService = new AdminService();
