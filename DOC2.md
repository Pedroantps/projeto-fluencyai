# Estratégia de Inteligência Artificial e Otimização de Tokens
## 1. Arquitetura de Roteamento de Modelos (Model Routing)
Para otimizar o consumo de tokens e garantir a melhor experiência (baixa latência vs. alto raciocínio), o sistema utilizará diferentes provedores de IA dependendo da carga de trabalho exigida pelo módulo.

Motor de Raciocínio Lógico (Google Gemini 2.0 Flash): Excelente janela de contexto (aguenta ler muito histórico) e perfeito para retornar dados estruturados em JSON de forma previsível. Será usado para tarefas pesadas que rodam em "background" e não exigem resposta em milissegundos.

Motor de Baixa Latência (Groq + Llama 3): Focado em velocidade extrema. Ideal para o streaming de texto no chat, garantindo que a resposta de voz pareça uma conversa humana real, sem engasgos.

## 2. Módulos e Estratégias de Execução
### Módulo A: O Cronograma Adaptativo (Estilo Kanban/Trello)
A Interface: Um quadro Kanban horizontal. As colunas são os dias da semana. Os cards são as tarefas diárias.

A IA Responsável: Gemini 2.0 Flash.

Como funciona a requisição: No domingo à noite (ou quando o usuário solicitar), o Back-end envia um pacote de dados para a IA contendo:

O nível atual do usuário (ex: B1).

Os tópicos que o usuário mais errou no chat na semana anterior.

O tempo disponível por dia.

O Retorno: A IA é forçada (via Structured Outputs) a devolver um arquivo JSON rígido, que o Front-end lê e transforma nos cartões do Trello.

Exemplo de Cards: "Assistir vídeo de 5 min sobre Present Perfect no YouTube" (Link externo), "Revisar 15 Flashcards" (Link interno), "Sessão de Chat de 10 min: Pedindo comida" (Link interno).

### Módulo B: Geração Inteligente de Flashcards
A IA Responsável: Gemini 2.0 Flash.

Como funciona a requisição: Em vez de gerar flashcards aleatórios, a IA atua como um "Extrator". Quando o usuário termina uma sessão de chat, o Back-end envia a transcrição da conversa para a IA com o prompt: "Extraia 3 palavras ou expressões que o usuário não conhecia ou usou errado nesta conversa e gere flashcards para elas".

Economia de Tokens: O baralho cresce organicamente baseado nos erros reais do usuário, sem precisar de prompts gigantescos e abstratos.

### Módulo C: Conversação em Tempo Real (O Core)
A IA Responsável: Groq (Llama 3 8B ou 70B).

A Execução (Streaming): É aqui que a mágica acontece. O sistema usará Server-Sent Events (SSE). Em vez de esperar a IA gerar toda a resposta para depois mostrar na tela, o texto vai aparecendo letra por letra, e o sintetizador de voz (Web Speech API) já começa a falar a primeira frase enquanto a IA ainda está "pensando" na segunda.

Feedback e Correção (O Pulo do Gato): O System Prompt instrui a IA a sempre responder no formato:
[RESPOSTA NATURAL DA CONVERSA] | [CORREÇÃO GRAMATICAL]
O front-end pega esse texto, divide na barra vertical (|), lê a primeira parte em voz alta e coloca a segunda parte silenciosamente na caixinha de "Dica do Professor" na tela.

## 3. Gestão de Custos e Limites (Free Tier Strategy)
Cache de Cronograma: O cronograma é gerado apenas uma vez por semana e salvo no banco de dados (PostgreSQL). Quando o usuário abre o painel (Dashboard), o sistema lê do banco de dados, sem gastar nenhum token da IA.

Limite de Contexto no Chat: Para o Groq não estourar o limite de tokens enviando o histórico inteiro a cada nova mensagem enviada, o back-end enviará apenas as últimas 10 mensagens (5 pares de pergunta/resposta) como contexto imediato.