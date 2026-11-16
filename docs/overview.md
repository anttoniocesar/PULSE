# Executive Overview

Esta evolução está restrita ao Overview e seus componentes internos. Não altera a base existente, outras páginas, rotas, autenticação, logout ou Math Tree.

## Fonte e filtros

Não há dados operacionais reais conectados. Os sete KPIs, iniciativas, estágios, responsáveis e riscos reutilizam exclusivamente a base demonstrativa preexistente em `src/data/demoData.ts`. Nenhum novo registro ou número financeiro foi acrescentado à produção.

Unidade A/B e período YTD/FY são compartilhados pelas cinco seções e detalhamentos, com os cortes de 2026 existentes. Área, status e responsável estão nos registros, mas faltam valores financeiros por iniciativa para aplicar esses filtros com coerência em todos os KPIs. Esses filtros adicionais dependem dessa integração; não são apresentados controles sem funcionamento.

## Seções

1. **Captura de Valor:** mantém Capturas e Iniciativas, os sete KPIs e composições. O gráfico de potencial por área segue disponível em área expansível.
2. **Saúde do Portfólio:** exige prazo, resultado financeiro e risco válidos. A classificação geral é a pior dimensão. Cards contam somente avaliações completas e a cobertura identifica iniciativas não classificáveis. Zero avaliações completas não significa carteira saudável. Detalhes mostram responsável, motivo, dimensões e atualização quando fornecidos.
3. **Maturidade das Iniciativas:** L0 Ideia, L1 Identificada, L2 Validada, L3 Planejada, L4 Implementada e L5 Estabilizada. Reutiliza os códigos existentes sem inferir estágios ausentes. Cada iniciativa entra uma vez; percentuais usam o total selecionado, incluindo registros sem estágio. O funil horizontal tem descrição por mouse/teclado e rolagem em telas menores.
4. **Evolução da Captura de Valor:** aguarda fechamentos acumulados da fonte. Não distribui valores anuais nem gera séries. A simulação anterior continua consultável, identificada como simulação. O mesmo renderizador atende ambas as fontes. Fechamentos operacionais permitem esperado, realizado, forecast disponível, desvio absoluto/percentual e pontos desfavoráveis.
5. **Pontos de Atenção da Liderança:** iniciativas críticas, marcos vencidos, decisões pendentes e registros desatualizados. Ausência de fonte/critério resulta em “Não informado”, não em zero ocorrências. Cobertura parcial é identificada. O risco demonstrativo preexistente segue acessível e não substitui a avaliação geral de saúde.

## Integração pendente

`src/data/overviewData.ts` define interfaces de registros executivos, avaliações, marcos, decisões e fechamentos acumulados. `overviewIntegration` inicia sem registros novos, fechamentos ou data de referência. O HTML metodológico não estava disponível no workspace; nenhum dado foi importado dele.

- Registros executivos são associados pelo identificador e escopo YTD/FY. Podem informar avaliações validadas ou dados para cálculo, ciclo de vida, atualização, marcos e decisões.
- Datas de relatório usam `YYYY-MM-DD`; timestamps devem ser normalizados pela integração. A data de referência deve vir da fonte. O relógio do navegador não substitui o corte do relatório.
- `overviewRules` inicia sem limites numéricos. Limites de atraso, desvio financeiro, pontuação de risco e atualização dependem de critérios aprovados. Não existe regra automática de sete dias.
- Fechamentos contêm unidade, escopo, mês e valores **acumulados em R$ milhões**. Totais exigem todas as unidades selecionadas para cada série/mês. Não há preenchimento de meses ou soma de dados parciais. Revisões conflitantes na mesma unidade/mês ficam indisponíveis.
- Dados financeiros por iniciativa, fonte temporal operacional e critérios aprovados permanecem pendentes. Os resumos anuais existentes continuam identificados como demonstrativos e exigem integração apropriada para se tornarem operacionais.

`src/utils/overviewCalculations.ts` centraliza saúde e cobertura, maturidade, captura acumulada, marcos, decisões e atualização. Trata dados desconhecidos, datas inválidas, divisão por zero, duplicidades e exclusão de iniciativas canceladas/inativas. Ausência de dados não gera alertas automaticamente.

## Validação

`node --test tests/overview.test.mjs` valida os seis escopos dos filtros, KPIs preservados, avaliações parciais, critérios configurados, fontes ausentes, duplicidades, datas, divisão por zero e lacunas temporais. Fixtures são exclusivas dos testes.

No Chrome: sete KPIs e seus painéis, seis estágios e listas, saúde e cobertura, quatro categorias de alerta, riscos existentes, filtros sincronizados e gráficos anteriores. Layout em 1920×1080, 1366×768, 768×1024, 390×844 e 320×568. Fechamentos futuros validados com fixture isolada, sem gravar dados no aplicativo.
