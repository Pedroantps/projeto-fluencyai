/**
 * Busca no YouTube aulas do tema da tarefa, em português (traz professores brasileiros).
 * "Gramática: Present Perfect" vira "aula de inglês Present Perfect".
 */
export function youtubeLessonUrl(title: string) {
  const [prefix, ...rest] = title.split(":")
  const topic = (rest.length && prefix.trim().length <= 20 ? rest.join(":") : title).trim()
  const query = `aula de inglês ${topic}`
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&gl=BR`
}
