import { z } from 'zod';
import type { KanbanTask } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { generateJson } from '../../lib/ai/gemini';
import { addDaysUtc, startOfTodayUtc } from '../../lib/dates';
import { notFound } from '../../lib/errors';
import { recordActivity } from '../activity/activity.service';

interface ScheduleUser { id: string; level: string; studyTime: number }

const YOUTUBE_RE = /^https:\/\/(www\.)?youtube\.com\//;

// Valida a resposta da IA antes de gravar: tipo restrito, tamanhos limitados e link só do YouTube
const aiTask = z.object({
  type: z.enum(['video', 'flashcard', 'chat']),
  title: z.string().min(1).transform((s) => s.slice(0, 200)),
  duration: z.coerce.number().int().min(1).max(120),
  link: z.string().nullish().transform((l) => (l && YOUTUBE_RE.test(l) ? l : null)),
});
const aiSchedule = z.object({
  schedule: z.array(z.object({ tasks: z.array(aiTask).min(1).max(6) })).min(1).max(7),
});

function buildPrompt(user: ScheduleUser) {
  return `
Você é um professor de inglês montando um cronograma semanal (7 dias) para um aluno com nível ${user.level} (Quadro Europeu Comum de Referência).
Meta diária de estudo: aproximadamente ${user.studyTime} minutos por dia.

ADAPTE a dificuldade ao nível ${user.level}. A1/A2: temas básicos (rotina, cumprimentos, verbo to be). B1/B2: intermediários (viagens, opiniões, present perfect). C1/C2: avançados (negócios, debates, idioms complexos).

Retorne APENAS um objeto JSON com a estrutura:
{
  "schedule": [
    { "day": 1, "tasks": [
      { "type": "video", "title": "Gramática: Present Perfect", "duration": 15, "link": "https://www.youtube.com/results?search_query=learn+present+perfect+english" },
      { "type": "flashcard", "title": "Revisar: Vocabulário de Viagem", "duration": 10 },
      { "type": "chat", "title": "Simulação: Pedir comida num restaurante", "duration": 15 }
    ] }
  ]
}
Regras ESTRITAS:
- Gere 7 dias completos (day 1 até day 7).
- Cada dia DEVE ter exatamente 3 tarefas nesta ordem: 1 'video', 1 'flashcard', 1 'chat'.
- O 'link' é obrigatório na tarefa 'video' (links de pesquisa do YouTube, começando com https://www.youtube.com/).
- Varie os temas ao longo dos 7 dias.
- A SOMA das durações das 3 tarefas do dia deve ficar muito próxima de ${user.studyTime} minutos.
`;
}

async function generateWeekTasks(user: ScheduleUser) {
  const { schedule } = await generateJson(buildPrompt(user), aiSchedule);
  const today = startOfTodayUtc();
  return schedule.flatMap((day, dayIndex) =>
    day.tasks.map((task, order) => ({
      type: task.type,
      title: task.title,
      duration: task.duration,
      link: task.link,
      order,
      date: addDaysUtc(today, dayIndex),
      userId: user.id,
    })),
  );
}

const listTasks = (userId: string) =>
  prisma.kanbanTask.findMany({ where: { userId }, orderBy: [{ date: 'asc' }, { order: 'asc' }] });

// Agrupa as tarefas por dia (UTC) no formato esperado pelo front-end
export function formatSchedule(tasks: KanbanTask[]) {
  const byDay = new Map<string, { dayName: string; date: string; fullDate: string; tasks: KanbanTask[] }>();
  for (const task of tasks) {
    const fullDate = task.date.toISOString().split('T')[0];
    if (!byDay.has(fullDate)) {
      byDay.set(fullDate, {
        dayName: task.date.toLocaleDateString('pt-BR', { weekday: 'long', timeZone: 'UTC' }),
        date: task.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }),
        fullDate,
        tasks: [],
      });
    }
    byDay.get(fullDate)!.tasks.push(task);
  }
  return [...byDay.values()].sort((a, b) => a.fullDate.localeCompare(b.fullDate));
}

// Evita gerar (e pagar) duas vezes quando chegam requests simultâneos do mesmo usuário
const inflight = new Map<string, Promise<unknown>>();
async function once<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const p = fn().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

export async function getSchedule(user: ScheduleUser) {
  let tasks = await listTasks(user.id);
  if (tasks.length === 0) {
    await once(`gen:${user.id}`, async () => {
      const data = await generateWeekTasks(user);
      await prisma.$transaction(async (tx) => {
        if ((await tx.kanbanTask.count({ where: { userId: user.id } })) === 0) {
          await tx.kanbanTask.createMany({ data });
        }
      });
    });
    tasks = await listTasks(user.id);
  }
  return formatSchedule(tasks);
}

// Gera o novo cronograma ANTES de apagar o antigo; a troca é atômica
export async function resetSchedule(user: ScheduleUser) {
  const data = await once(`reset:${user.id}`, () => generateWeekTasks(user));
  await prisma.$transaction([
    prisma.kanbanTask.deleteMany({ where: { userId: user.id } }),
    prisma.kanbanTask.createMany({ data }),
  ]);
  return formatSchedule(await listTasks(user.id));
}

// Só atualiza tarefas que pertencem ao usuário (evita IDOR)
export async function updateTask(
  userId: string,
  id: string,
  data: { completed?: boolean; date?: Date; order?: number },
) {
  const before =
    data.completed === true
      ? await prisma.kanbanTask.findFirst({ where: { id, userId }, select: { completed: true, type: true, duration: true } })
      : null;
  const { count } = await prisma.kanbanTask.updateMany({ where: { id, userId }, data });
  if (count === 0) throw notFound('Tarefa não encontrada.');
  if (before && before.type === 'video' && !before.completed) {
    await recordActivity(userId, 'video', before.duration * 60);
  }
  return prisma.kanbanTask.findFirstOrThrow({ where: { id, userId } });
}
