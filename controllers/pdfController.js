// pdfController.js - Versão Simplificada
import { relatorioUsuario } from '../services/pdf.js';
import { gerarPDF } from '../utils/pdfGenerator.js';

export async function gerarRelatorio(req, res) {
  try {
    const { id } = req.params;
    console.log("📋 ID recebido:", id);

    const authedUserId = req.user?.id;
    if (parseInt(id, 10) !== authedUserId) {
      return res.status(403).json({ success: false, message: "Acesso negado. Você só pode exportar seu próprio relatório." });
    }

    const dados = await relatorioUsuario(id);
    
    if (!dados) {
      return res.status(404).json({ message: "Paciente não encontrado" });
    }

    const { dadosUsuario, relatorio } = dados;
    
    // Logs para debug
    console.log("👤 DadosUsuario:", dadosUsuario);
    console.log("📝 Quantidade de diários:", relatorio.diarios?.length);
    console.log("📝 Quantidade de diagnósticos:", relatorio.diagnosticos?.length);

    // Gerar PDF
    const caminhoPDF = gerarPDF(dadosUsuario, relatorio);

    // Configurar resposta para download
    const nomeArquivo = `Relatorio-${dadosUsuario.nome || 'Usuario'}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);

    // Enviar arquivo
    return res.download(caminhoPDF, nomeArquivo, (err) => {
      if (err) {
        console.error('❌ Erro no download:', err);
        // Tentar fallback: enviar como JSON com caminho
        return res.json({ 
          success: false, 
          message: 'Erro no download, arquivo gerado em:', 
          caminho: caminhoPDF 
        });
      }
    });

  } catch (err) {
    console.error("❌ ERRO NO CONTROLLER:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Erro interno do servidor",
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  }
}