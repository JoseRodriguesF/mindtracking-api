import prisma from '../config/prisma.js';

export async function relatorioUsuario(id) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: Number(id) },
    include: {
      diarios: {
        orderBy: { data_hora: 'desc' }
      },
      diagnosticos: {
        orderBy: { data_hora: 'desc' }
      }
    }
  });

  if (!usuario) {
    return null;
  }

  const dadosUsuario = {
    nome: usuario.nome,
    email: usuario.email,
    nascimento: usuario.data_nascimento,
  };

  const diariosProcessados = (usuario.diarios || []).map((diario, index) => {
    return {
      id: diario.id,
      data: diario.data_hora || 'Data não disponível',
      conteudo: diario.texto || '',
      tipo: 'Diario'
    };
  });

  const diagnosticosProcessados = (usuario.diagnosticos || []).map((diag) => {
    return diag.texto || '';
  });

  return {
    dadosUsuario,
    relatorio: {
      diarios: diariosProcessados,
      diagnosticos: diagnosticosProcessados
    }
  };
}


