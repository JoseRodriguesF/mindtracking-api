-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "data_nascimento" DATE NOT NULL,
    "telefone" VARCHAR(50),
    "genero" VARCHAR(50),
    "questionario_inicial" BOOLEAN NOT NULL DEFAULT false,
    "email_verificado" BOOLEAN NOT NULL DEFAULT false,
    "codigo_verificacao" VARCHAR(50),
    "codigo_recuperacao" VARCHAR(50),
    "tentativas_recuperacao" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnosticos" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "data_hora" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnosticos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diario" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "data_hora" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "titulo" VARCHAR(255) NOT NULL,
    "texto" TEXT NOT NULL,
    "emocao_predominante" VARCHAR(255),
    "intensidade_emocional" VARCHAR(255),
    "comentario_athena" TEXT,

    CONSTRAINT "diario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionarios" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "data" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" VARCHAR(50) NOT NULL,

    CONSTRAINT "questionarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perguntas" (
    "id" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,

    CONSTRAINT "perguntas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alternativas" (
    "id" SERIAL NOT NULL,
    "pergunta_id" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "pontuacao" INTEGER NOT NULL,

    CONSTRAINT "alternativas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "respostas" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "pergunta_id" INTEGER NOT NULL,
    "alternativa_id" INTEGER NOT NULL,
    "questionario_id" INTEGER NOT NULL,

    CONSTRAINT "respostas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- AddForeignKey
ALTER TABLE "diagnosticos" ADD CONSTRAINT "diagnosticos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diario" ADD CONSTRAINT "diario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionarios" ADD CONSTRAINT "questionarios_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alternativas" ADD CONSTRAINT "alternativas_pergunta_id_fkey" FOREIGN KEY ("pergunta_id") REFERENCES "perguntas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respostas" ADD CONSTRAINT "respostas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respostas" ADD CONSTRAINT "respostas_pergunta_id_fkey" FOREIGN KEY ("pergunta_id") REFERENCES "perguntas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respostas" ADD CONSTRAINT "respostas_alternativa_id_fkey" FOREIGN KEY ("alternativa_id") REFERENCES "alternativas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respostas" ADD CONSTRAINT "respostas_questionario_id_fkey" FOREIGN KEY ("questionario_id") REFERENCES "questionarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create Stored Procedure analisar_tendencias_separadas
CREATE OR REPLACE FUNCTION analisar_tendencias_separadas(p_usuario_id INTEGER)
RETURNS TABLE (
    total_ocorrencias BIGINT,
    classificacao VARCHAR,
    texto_alternativa TEXT,
    texto_pergunta TEXT,
    pontuacao INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(r.id) AS total_ocorrencias,
        CASE 
            WHEN a.pontuacao <= 2 THEN 'Ruim'::VARCHAR
            ELSE 'Bom'::VARCHAR
        END AS classificacao,
        a.texto::TEXT AS texto_alternativa,
        p.texto::TEXT AS texto_pergunta,
        a.pontuacao::INTEGER
    FROM respostas r
    JOIN perguntas p ON r.pergunta_id = p.id
    JOIN alternativas a ON r.alternativa_id = a.id
    WHERE r.usuario_id = p_usuario_id
    GROUP BY p.id, p.texto, a.id, a.texto, a.pontuacao
    ORDER BY total_ocorrencias DESC;
END;
$$ LANGUAGE plpgsql;

