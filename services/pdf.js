import prisma from '../config/prisma.js';

export async function relatorioUsuario(id) {
  // Aqui chamamos a função do banco
  const rows = await prisma.$queryRawUnsafe("SELECT * FROM relatorio_usuario($1)", Number(id));

  console.log("🔍 Result do banco:", JSON.stringify(rows, null, 2));

  if (rows.length === 0) {
    return null;
  }
  
  const row = rows[0];

  // Processar dados do usuário
  const dadosUsuario = {
    nome: row.usuario_nome,
    email: row.usuario_email,
    nascimento: row.usuario_data_nascimento,
  };

  // Processar diários - converter para array de objetos
  const diariosProcessados = processarDiarios(row.diarios);
  
  // Processar questionários - converter para array de objetos com médias
  const questionariosProcessados = processarQuestionarios(row.questionarios);
  
  // Processar questionário inicial
  const questionarioInicialProcessado = processarQuestionarioInicial(row.questionario_inicial);
  
  // Processar diagnósticos
  const diagnosticosProcessados = processarDiagnosticos(row.diagnosticos);

  // Retornar dados no formato correto para o PDF
  return {
    dadosUsuario,
    relatorio: {
      diarios: diariosProcessados,
      questionarios: questionariosProcessados,
      questionario_inicial: questionarioInicialProcessado,
      diagnosticos: diagnosticosProcessados
    }
  };
}

// Função para processar diários
// services/pdf.js - FUNÇÃO CORRIGIDA
function processarDiarios(diarios) {
  if (!Array.isArray(diarios) || diarios.length === 0) {
    return [];
  }

  return diarios.map((diario, index) => {
    console.log(`📖 Diário ${index + 1} cru:`, JSON.stringify(diario));

    // Se o diário já é um objeto com propriedades
    if (typeof diario === 'object' && diario !== null) {
      // USAR O CAMPO CORRETO: data_hora
      const dataDiario = diario.data_hora || 'Data não disponível';

      return {
        id: diario.id || index + 1,
        data: dataDiario, // ← AGORA VAI PEGAR A DATA CORRETA!
        conteudo: diario.texto || diario.conteudo || diario.descricao || JSON.stringify(diario),
        tipo: diario.tipo || 'Diario'
      };
    }
    
    // Se o diário é uma string (JSON stringificado)
    if (typeof diario === 'string') {
      try {
        const diarioParsed = JSON.parse(diario);
        const dataDiario = diarioParsed.data_hora || 'Data não disponível';

        return {
          id: index + 1,
          data: dataDiario,
          conteudo: diarioParsed.texto || diarioParsed.conteudo || diario,
          tipo: 'Diario'
        };
      } catch {
        // Se não for JSON válido
        return {
          id: index + 1,
          data: 'Data não disponível',
          conteudo: diario,
          tipo: 'Diario'
        };
      }
    }
    
    // Fallback
    return {
      id: index + 1,
      data: 'Data não disponível',
      conteudo: String(diario),
      tipo: 'Diario'
    };
  });
}

// Função para processar questionários com cálculo de médias
function processarQuestionarios(questionarios) {
  if (!Array.isArray(questionarios) || questionarios.length === 0) {
    return [];
  }

  return questionarios.map((questionario, index) => {
    let questObj = questionario;
    
    // Se for string, tentar converter para objeto
    if (typeof questionario === 'string') {
      try {
        questObj = JSON.parse(questionario);
      } catch {
        questObj = { texto: questionario };
      }
    }

    // Calcular média baseada no objeto
    const media = calcularMediaQuestionario(questObj);
    
    return {
      id: questObj.id || index + 1,
      data: questObj.data || questObj.created_at || `2024-01-${15 + index}`,
      tipo: questObj.tipo || 'Questionario',
      nota: questObj.nota || media,
      media: media,
      respostas: questObj.respostas || extrairRespostas(questObj),
      texto: questObj.texto || questObj.conteudo || JSON.stringify(questObj)
    };
  });
}

// Função para calcular média do questionário
function calcularMediaQuestionario(questionario) {
  // Se já tiver média calculada
  if (questionario.media !== undefined && questionario.media !== null) {
    return Number(questionario.media);
  }
  
  // Se tiver nota direta
  if (questionario.nota !== undefined && questionario.nota !== null) {
    return Number(questionario.nota);
  }
  
  // Se tiver respostas numéricas
  if (questionario.respostas && typeof questionario.respostas === 'object') {
    const valores = Object.values(questionario.respostas)
      .filter(val => typeof val === 'number' && !isNaN(val))
      .map(val => Number(val));
    
    if (valores.length > 0) {
      return valores.reduce((a, b) => a + b, 0) / valores.length;
    }
  }
  
  // Tentar extrair nota do texto
  if (questionario.texto || questionario.conteudo) {
    const texto = questionario.texto || questionario.conteudo;
    const match = texto.match(/nota[\s:]*(\d+)/i) || texto.match(/(\d+)\/10/i);
    if (match) {
      return Number(match[1]);
    }
  }
  
  return 5; // Média padrão
}

// Função para extrair respostas do questionário
function extrairRespostas(questionario) {
  if (questionario.respostas) {
    return questionario.respostas;
  }
  
  // Tentar extrair respostas de outras propriedades
  const respostas = {};
  
  if (questionario.perguntas) {
    Object.entries(questionario.perguntas).forEach(([pergunta, resposta]) => {
      respostas[pergunta] = resposta;
    });
  }
  
  return Object.keys(respostas).length > 0 ? respostas : null;
}

// Função para processar questionário inicial
function processarQuestionarioInicial(questionarioInicial) {
  return Array.isArray(questionarioInicial) && questionarioInicial.length > 0;
}

// Função para processar diagnósticos
function processarDiagnosticos(diagnosticos) {
  if (!Array.isArray(diagnosticos) || diagnosticos.length === 0) {
    return [];
  }

  return diagnosticos.map((diagnostico, index) => {
    if (typeof diagnostico === 'object' && diagnostico !== null) {
      return diagnostico.descricao || diagnostico.texto || diagnostico.diagnostico || JSON.stringify(diagnostico);
    }
    return String(diagnostico);
  });
}
