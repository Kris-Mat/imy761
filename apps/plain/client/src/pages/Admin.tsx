import { useEffect, useMemo, useState } from 'react';
import {
  Accordion, Badge, Button, Divider, Group, Loader, Paper, SimpleGrid, Stack, Table, Text, Title
} from '@mantine/core';
import type { StudentAnalytics, StudentQuestionStat } from '@shared/api/models/admin.model';
import { authApi } from '@shared/api/services/auth.api';
import { userApi } from '@shared/api/services/users.api';
import { categoryLabels } from '../lib/questionCategory';
import SectionCard from '../components/SectionCard';

// Research-instrument page: shows raw interaction data (retries, time on
// task, correctness) so the gamified vs plain conditions can be compared
// statistically. Deliberately unlinked from student navigation. Same
// layout/data/interactions as the gamified app's Admin.tsx.

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder}s`;
}

function studentDisplayName(student: StudentAnalytics): string {
  const fullName = `${student.firstName} ${student.lastName}`.trim();
  return fullName || student.username;
}

interface Summary {
  totalStudents: number;
  totalAttempts: number;
  retryRatePercent: number;
}

function summarise(students: StudentAnalytics[]): Summary {
  const questions = students.flatMap((student) => student.questions);
  const totalAttempts = questions.reduce((sum, question) => sum + question.attempts, 0);
  const totalRetries = questions.reduce((sum, question) => sum + question.retryCount, 0);
  return {
    totalStudents: students.length,
    totalAttempts,
    retryRatePercent: totalAttempts > 0 ? Math.round((totalRetries / totalAttempts) * 100) : 0
  };
}

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function studentsToCsv(students: StudentAnalytics[]): string {
  const header = ['student', 'email', 'question', 'category', 'attempts', 'retries', 'correct', 'timeTakenSeconds'];
  const rows = students.flatMap((student) => student.questions.map((question) => [
    studentDisplayName(student),
    student.email,
    question.prompt,
    categoryLabels[question.category],
    String(question.attempts),
    String(question.retryCount),
    question.correct ? 'true' : 'false',
    question.timeTakenSeconds === null ? '' : String(question.timeTakenSeconds)
  ]));
  return [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
}

function downloadCsv(students: StudentAnalytics[]) {
  const csv = studentsToCsv(students);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `student-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function StatTile({ label, value }: { label: string; value: string | number; }) {
  return (
    <Paper
      radius="md"
      p="md"
      bg="moss.0"
      style={{ border: '1px solid var(--mantine-color-moss-2)' }}
    >
      <Text
        fz="sm"
        c="charcoal.6"
      >{label}
      </Text>
      <Text
        fz="xl"
        fw={700}
        c="charcoal.9"
      >{value}
      </Text>
    </Paper>
  );
}

function StudentQuestionRow({ stat }: { stat: StudentQuestionStat; }) {
  return (
    <Table.Tr>
      <Table.Td>{stat.prompt}</Table.Td>
      <Table.Td>{categoryLabels[stat.category]}</Table.Td>
      <Table.Td>{stat.attempts}</Table.Td>
      <Table.Td>{stat.retryCount}</Table.Td>
      <Table.Td>
        <Badge
          color={stat.correct ? 'moss' : 'terracotta'}
          variant="light"
        >
          {stat.correct ? 'Correct' : 'Incorrect'}
        </Badge>
      </Table.Td>
      <Table.Td>{formatDuration(stat.timeTakenSeconds)}</Table.Td>
    </Table.Tr>
  );
}

function Admin() {
  const [students, setStudents] = useState<StudentAnalytics[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    authApi.getSession().then((session) => {
      if (!session) {
        if (!cancelled) setError('Not authenticated.');
        return;
      }
      userApi.getStudentAnalytics(session.access_token)
        .then((result) => {
          if (!cancelled) setStudents(result);
        })
        .catch((fetchError: unknown) => {
          console.error('Failed to load student analytics', fetchError);
          if (!cancelled) setError('Failed to load student analytics.');
        });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => (students ? summarise(students) : null), [students]);

  return (
    <Stack
      maw={1100}
      mx="auto"
    >
      <SectionCard p="xl">
        <Group
          justify="space-between"
          mb="lg"
        >
          <Title
            order={1}
            c="charcoal.9"
          >
            Student Analytics
          </Title>
          <Button
            variant="light"
            color="terracotta"
            radius="xl"
            disabled={!students || students.length === 0}
            onClick={() => students && downloadCsv(students)}
          >
            Export CSV
          </Button>
        </Group>

        {error && <Text c="red.7">{error}</Text>}
        {!error && !students && <Loader color="terracotta" />}

        {summary && (
          <>
            <SimpleGrid
              cols={{
                base: 1, sm: 3
              }}
              mb="lg"
            >
              <StatTile
                label="Students"
                value={summary.totalStudents}
              />
              <StatTile
                label="Total attempts"
                value={summary.totalAttempts}
              />
              <StatTile
                label="Overall retry rate"
                value={`${summary.retryRatePercent}%`}
              />
            </SimpleGrid>
            <Divider mb="lg" />
          </>
        )}

        {students && (
          <Accordion
            variant="separated"
            radius="md"
          >
            {students.map((student) => (
              <Accordion.Item
                key={student.userId}
                value={String(student.userId)}
              >
                <Accordion.Control>
                  <Group
                    justify="space-between"
                    pr="md"
                  >
                    <Text
                      fw={700}
                      c="charcoal.9"
                    >{studentDisplayName(student)}
                    </Text>
                    <Text
                      c="charcoal.6"
                      fz="sm"
                    >{student.email}
                    </Text>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  {student.questions.length === 0 ? (
                    <Text
                      c="charcoal.5"
                      fz="sm"
                    >
                      No attempts recorded yet.
                    </Text>
                  ) : (
                    <Table
                      striped
                      stripedColor="terracotta.0"
                      withRowBorders={false}
                    >
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Question</Table.Th>
                          <Table.Th>Category</Table.Th>
                          <Table.Th>Attempts</Table.Th>
                          <Table.Th>Retries</Table.Th>
                          <Table.Th>Result</Table.Th>
                          <Table.Th>Time taken</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {student.questions.map((stat) => (
                          <StudentQuestionRow
                            key={stat.questionId}
                            stat={stat}
                          />
                        ))}
                      </Table.Tbody>
                    </Table>
                  )}
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        )}
      </SectionCard>
    </Stack>
  );
}

export default Admin;
