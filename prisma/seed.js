import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o seed de perguntas e alternativas...');

  // Limpar dados existentes antes do seed para evitar duplicados
  await prisma.resposta.deleteMany({});
  await prisma.alternativa.deleteMany({});
  await prisma.pergunta.deleteMany({});

  const perguntasIniciais = [
    {
      id: 1,
      texto: 'Como você avalia a qualidade do seu sono nos últimos dias?',
      alternativas: [
        { texto: 'Muito ruim', pontuacao: 1 },
        { texto: 'Ruim', pontuacao: 2 },
        { texto: 'Boa', pontuacao: 3 },
        { texto: 'Excelente', pontuacao: 4 },
      ],
    },
    {
      id: 2,
      texto: 'Com que frequência você se sentiu ansioso ou estressado nesta semana?',
      alternativas: [
        { texto: 'Constantemente', pontuacao: 1 },
        { texto: 'Frequentemente', pontuacao: 2 },
        { texto: 'Raramente', pontuacao: 3 },
        { texto: 'Quase nunca', pontuacao: 4 },
      ],
    },
    {
      id: 3,
      texto: 'Como está seu nível de energia e disposição para realizar suas tarefas diárias?',
      alternativas: [
        { texto: 'Muito baixo', pontuacao: 1 },
        { texto: 'Baixo', pontuacao: 2 },
        { texto: 'Moderado', pontuacao: 3 },
        { texto: 'Alto', pontuacao: 4 },
      ],
    },
    {
      id: 4,
      texto: 'Você sente dificuldade em se concentrar no trabalho ou estudos?',
      alternativas: [
        { texto: 'Sempre', pontuacao: 1 },
        { texto: 'Frequentemente', pontuacao: 2 },
        { texto: 'Às vezes', pontuacao: 3 },
        { texto: 'Nunca', pontuacao: 4 },
      ],
    },
    {
      id: 5,
      texto: 'Como você definiria o seu apetite ou hábitos alimentares recentemente?',
      alternativas: [
        { texto: 'Muito desregulados', pontuacao: 1 },
        { texto: 'Desregulados', pontuacao: 2 },
        { texto: 'Moderadamente saudáveis', pontuacao: 3 },
        { texto: 'Muito saudáveis', pontuacao: 4 },
      ],
    },
    {
      id: 6,
      texto: 'Com que frequência você tem momentos de lazer e descontração?',
      alternativas: [
        { texto: 'Nunca', pontuacao: 1 },
        { texto: 'Raramente', pontuacao: 2 },
        { texto: 'Às vezes', pontuacao: 3 },
        { texto: 'Frequentemente', pontuacao: 4 },
      ],
    },
    {
      id: 7,
      texto: 'Como você avalia suas relações com amigos e familiares ultimamente?',
      alternativas: [
        { texto: 'Conflituosas ou distantes', pontuacao: 1 },
        { texto: 'Instáveis', pontuacao: 2 },
        { texto: 'Harmoniosas', pontuacao: 3 },
        { texto: 'Muito apoiadoras', pontuacao: 4 },
      ],
    },
    {
      id: 8,
      texto: 'Você tem se sentido desanimado ou sem interesse pelas coisas que costumava gostar?',
      alternativas: [
        { texto: 'Constantemente', pontuacao: 1 },
        { texto: 'Frequentemente', pontuacao: 2 },
        { texto: 'Raramente', pontuacao: 3 },
        { texto: 'Quase nunca', pontuacao: 4 },
      ],
    },
    {
      id: 9,
      texto: 'Como você lida com frustrações ou imprevistos no seu dia a dia?',
      alternativas: [
        { texto: 'Com muita irritação ou desespero', pontuacao: 1 },
        { texto: 'Com dificuldade', pontuacao: 2 },
        { texto: 'Com alguma calma', pontuacao: 3 },
        { texto: 'Com bastante resiliência', pontuacao: 4 },
      ],
    },
    {
      id: 10,
      texto: 'Você sente que tem controle sobre o rumo da sua vida atual?',
      alternativas: [
        { texto: 'Nenhum controle', pontuacao: 1 },
        { texto: 'Pouco controle', pontuacao: 2 },
        { texto: 'Algum controle', pontuacao: 3 },
        { texto: 'Controle total', pontuacao: 4 },
      ],
    },
  ];

  const perguntasDiarias = [
    {
      id: 11,
      texto: 'Como você acordou hoje em termos de humor?',
      alternativas: [
        { texto: 'Irritado ou triste', pontuacao: 1 },
        { texto: 'Cansado ou neutro', pontuacao: 2 },
        { texto: 'Disposto e calmo', pontuacao: 3 },
        { texto: 'Muito feliz e animado', pontuacao: 4 },
      ],
    },
    {
      id: 12,
      texto: 'Qual é a sua sensação geral de estresse neste momento do dia?',
      alternativas: [
        { texto: 'Extremamente estressado', pontuacao: 1 },
        { texto: 'Moderadamente estressado', pontuacao: 2 },
        { texto: 'Pouco estressado', pontuacao: 3 },
        { texto: 'Totalmente relaxado', pontuacao: 4 },
      ],
    },
    {
      id: 13,
      texto: 'Como você avalia sua produtividade até agora hoje?',
      alternativas: [
        { texto: 'Muito abaixo do esperado', pontuacao: 1 },
        { texto: 'Razoável', pontuacao: 2 },
        { texto: 'Boa', pontuacao: 3 },
        { texto: 'Excelente', pontuacao: 4 },
      ],
    },
    {
      id: 14,
      texto: 'Você praticou alguma atividade física ou autocuidado hoje?',
      alternativas: [
        { texto: 'Não, e não pretendo', pontuacao: 1 },
        { texto: 'Não consegui tempo', pontuacao: 2 },
        { texto: 'Sim, uma atividade curta', pontuacao: 3 },
        { texto: 'Sim, dediquei um bom tempo', pontuacao: 4 },
      ],
    },
    {
      id: 15,
      texto: 'Como está sendo a qualidade das suas interações sociais hoje?',
      alternativas: [
        { texto: 'Desgastantes ou inexistentes', pontuacao: 1 },
        { texto: 'Neutras', pontuacao: 2 },
        { texto: 'Positivas e agradáveis', pontuacao: 3 },
        { texto: 'Muito enriquecedoras', pontuacao: 4 },
      ],
    },
    {
      id: 16,
      texto: 'Você tirou algum momento para descansar ou respirar fundo hoje?',
      alternativas: [
        { texto: 'Não', pontuacao: 1 },
        { texto: 'Apenas poucos minutos', pontuacao: 2 },
        { texto: 'Sim, algumas vezes', pontuacao: 3 },
        { texto: 'Sim, pratiquei meditação/pausa consciente', pontuacao: 4 },
      ],
    },
    {
      id: 17,
      texto: 'Como está sua paciência com as pessoas e tarefas hoje?',
      alternativas: [
        { texto: 'Muito baixa / Sem paciência', pontuacao: 1 },
        { texto: 'Moderada', pontuacao: 2 },
        { texto: 'Boa', pontuacao: 3 },
        { texto: 'Muito alta', pontuacao: 4 },
      ],
    },
    {
      id: 18,
      texto: 'Como está a sua alimentação no dia de hoje?',
      alternativas: [
        { texto: 'Comi apenas ultraprocessados ou pulei refeições', pontuacao: 1 },
        { texto: 'Comi de forma desequilibrada', pontuacao: 2 },
        { texto: 'Comi de forma razoavelmente saudável', pontuacao: 3 },
        { texto: 'Comi de forma muito equilibrada e saudável', pontuacao: 4 },
      ],
    },
    {
      id: 19,
      texto: 'Como está se sentindo fisicamente hoje?',
      alternativas: [
        { texto: 'Com dores ou muito mal', pontuacao: 1 },
        { texto: 'Desconfortável ou cansado', pontuacao: 2 },
        { texto: 'Bem', pontuacao: 3 },
        { texto: 'Ótimo e cheio de energia', pontuacao: 4 },
      ],
    },
    {
      id: 20,
      texto: 'Você sentiu clareza mental para tomar decisões hoje?',
      alternativas: [
        { texto: 'Muito confuso', pontuacao: 1 },
        { texto: 'Com alguma dificuldade', pontuacao: 2 },
        { texto: 'Razoavelmente claro', pontuacao: 3 },
        { texto: 'Muito focado e decidido', pontuacao: 4 },
      ],
    },
    {
      id: 21,
      texto: 'Como você descreveria o seu nível de otimismo hoje?',
      alternativas: [
        { texto: 'Muito pessimista', pontuacao: 1 },
        { texto: 'Neutro ou desconfiado', pontuacao: 2 },
        { texto: 'Razoavelmente otimista', pontuacao: 3 },
        { texto: 'Muito esperançoso e positivo', pontuacao: 4 },
      ],
    },
    {
      id: 22,
      texto: 'Você conseguiu expressar seus sentimentos ou pensamentos hoje?',
      alternativas: [
        { texto: 'Guardei tudo para mim', pontuacao: 1 },
        { texto: 'Tive dificuldade em me expressar', pontuacao: 2 },
        { texto: 'Consegui conversar um pouco', pontuacao: 3 },
        { texto: 'Me expressei de forma aberta e clara', pontuacao: 4 },
      ],
    },
  ];

  const todasPerguntas = [...perguntasIniciais, ...perguntasDiarias];

  for (const p of todasPerguntas) {
    await prisma.pergunta.create({
      data: {
        id: p.id,
        texto: p.texto,
        alternativas: {
          create: p.alternativas,
        },
      },
    });
  }

  console.log(`Seed concluído com sucesso! Cadastradas ${todasPerguntas.length} perguntas e suas alternativas.`);
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
