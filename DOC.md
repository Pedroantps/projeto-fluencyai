# 📄 Documento de Planejamento e Requisitos: FluencyAI
## 1. Visão Geral
O FluencyAI é uma plataforma web full-stack de uso pessoal focada no aprendizado imersivo da língua inglesa. O sistema integra Inteligência Artificial (LLMs) para simular conversações naturais, gerar cronogramas de estudo e alimentar um motor de repetição espaçada (SRS) para fixação de vocabulário.

## 2. Regras de Negócio (RN)
As regras de negócio definem como o "coração" do sistema deve se comportar de forma lógica, independente da tecnologia.

RN01 - Lógica de Repetição Espaçada (SRS): O algoritmo de flashcards deve seguir intervalos crescentes baseados no feedback do usuário. Se o usuário marcar "Fácil", o cartão demora dias para voltar. Se marcar "Difícil", o cartão volta na próxima sessão ou no dia seguinte.

RN02 - Cálculo de Ofensiva (Streak): A ofensiva diária do usuário só deve ser incrementada se ele concluir pelo menos uma atividade principal no dia (revisar todos os flashcards pendentes OU interagir no chat por pelo menos X minutos/mensagens).

RN03 - Comportamento Restrito da IA (Persona): A IA do chat deve ser instruída (via System Prompt) a atuar estritamente como um tutor de inglês. Ela deve desencorajar o uso do português, focando na manutenção do idioma alvo e fornecendo correções gramaticais após cada interação, sem quebrar o fluxo da conversa.

RN04 - Limite de Sessão: Para evitar fadiga (e otimizar o uso da API gratuita), o sistema de cronograma gerado deve limitar as sessões de estudo ao tempo diário definido pelo usuário nas configurações.

## 3. Requisitos Funcionais (RF)
O que o sistema deve fazer (ações e funcionalidades disponíveis para o usuário).

RF01 - Chat por Texto e Voz: O sistema deve permitir que o usuário converse com a IA através de digitação ou captura de áudio via microfone.

RF02 - Transcrição de Áudio: O sistema deve converter a fala do usuário em texto em tempo real (Speech-to-Text).

RF03 - Síntese de Voz (TTS): O sistema deve ler as respostas da IA em voz alta com sotaque americano ou britânico.

RF04 - Feedback Gramatical: O chat deve separar a resposta natural da IA de uma "Nota do Professor" contendo correções de sintaxe ou sugestões de vocabulário melhor.

RF05 - Geração de Cronogramas: O sistema deve receber o nível do usuário e dias disponíveis, gerando um plano semanal de tópicos estruturados.

RF06 - Gestão de Flashcards: O usuário deve poder adicionar novos termos ao baralho, e o sistema deve consultar o banco de dados para listar apenas os cartões que precisam ser revisados no dia atual (nextReviewDate <= hoje).

RF07 - Dashboard de Progresso: O sistema deve exibir visualmente a ofensiva, a quantidade de palavras aprendidas e o tempo estudado na semana.

## 4. Requisitos Não Funcionais (RNF)
Como o sistema deve se comportar (performance, tecnologias e arquitetura).

RNF01 - Stack Tecnológica Front-end: A interface deve ser desenvolvida em Next.js (React) utilizando TypeScript, Tailwind CSS e a biblioteca de componentes shadcn/ui.

RNF02 - Stack Tecnológica Back-end: A API deve ser desenvolvida em Node.js utilizando o framework Express e tipagem estrita com TypeScript.

RNF03 - Performance do Chat: A resposta em texto da IA deve iniciar sua exibição na tela em menos de 2 segundos após o envio do usuário, utilizando a API ultrarrápida do Groq.

RNF04 - Responsividade: A interface deve seguir a abordagem Mobile-First, garantindo que o chat e os flashcards sejam perfeitamente utilizáveis em telas de smartphones.

RNF05 - Persistência de Dados: Em sua versão final, os dados devem ser salvos de forma relacional utilizando PostgreSQL (com Prisma ORM). (Nota: MVP pode usar LocalStorage ou memória em JSON).

5. Normas de Segurança (SEG)
Mesmo sendo um projeto para uso pessoal, a aplicação de práticas de segurança de mercado é fundamental.

SEG01 - Proteção de Chaves de API: As chaves de serviços externos (Groq API) jamais devem ser expostas no front-end. Toda comunicação com a IA deve ser feita através de rotas seguras no back-end.

SEG02 - Gerenciamento de Segredos: Todas as variáveis sensíveis devem estar isoladas em arquivos .env e estritamente listadas no .gitignore.

SEG03 - Política de CORS: O back-end (Express) deve ser configurado para aceitar requisições de origem cruzada (CORS) apenas do domínio/porta onde o front-end está rodando (ex: http://localhost:3000).

SEG04 - Sanitização de Inputs: Mesmo o usuário sendo o próprio desenvolvedor, todos os textos enviados para o back-end (chat, criação de flashcards) devem ser validados (ex: usando a biblioteca Zod) para evitar injeção de scripts maliciosos ou travamentos no banco de dados.

SEG05 - Rate Limiting (Opcional p/ MVP): Implementar um limite de requisições na rota /api/chat para evitar loops infinitos no front-end que poderiam esgotar a cota gratuita do Groq.

## 6. Boas Práticas de Desenvolvimento (BP)
BP01 - Arquitetura de Monorepo: Front-end e Back-end devem conviver no mesmo repositório sob pastas distintas (fluencyai-frontend e fluencyai-backend), facilitando a sincronização de commits.

BP02 - Padronização de Commits: Utilizar o padrão Conventional Commits (ex: feat: add microphone support, fix: correct flashcard routing) para manter o histórico limpo.

BP03 - Componentização: No front-end, arquivos extensos devem ser evitados. Elementos visuais repetitivos (cards, botões, balões de chat) devem ser componentes isolados.

BP04 - Tratamento de Erros: O back-end não deve retornar o "stack trace" (log de erro cru do Node) para o front-end. Utilizar um middleware global de tratamento de erros no Express para retornar mensagens JSON padronizadas (ex: { error: "Falha na comunicação com a IA" }).