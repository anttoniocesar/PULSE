# Alinhamento Estratégico do Portfólio

Seção exclusiva do Overview, entre Maturidade das Iniciativas e Evolução da Captura de Valor. Não substitui componentes ou altera outras páginas, rotas, autenticação, menu ou cálculos anteriores.

## Dados disponíveis e pendentes

A base preexistente possui iniciativas demonstrativas com identificador, nome, unidade, área, responsável, estágio e status. Benefícios existem de forma agregada no Overview. Não há cadastro de projetos, vínculo projeto/iniciativa, priorização, tipo Transformacional/Incremental, pilares, categorias estratégicas ou benefícios financeiros por projeto.

`src/data/strategicAlignment.ts` define o contrato de integração e a configuração dos rótulos. `strategicSource.projects` inicia como `null`, significando **cadastro não carregado**. A interface mostra “Dados não disponíveis” em vez de zero. Um array vazio significa que a fonte foi efetivamente carregada e confirmou um portfólio vazio; nesse caso zero é válido.

Nenhum projeto é inferido das iniciativas, áreas, nomes, estágios ou valores dos KPIs. Nenhum projeto ou número do painel histórico foi importado. Os únicos valores de projetos fornecidos nesta etapa são fixtures isoladas dos testes, fora dos dados de produção.

## Configuração e integração

`strategicConfiguration` contém a raiz, os direcionadores, as categorias finais e os pilares. IDs devem ser únicos dentro da hierarquia; categorias e pilares podem ser alterados pela configuração, sem duplicar componentes.

Cada registro tem ID canônico, escopo YTD/FY, unidade A/B, área, nome, responsável, status, priorização, tipo, IDs de pilares/categorias, IDs das iniciativas vinculadas e valores financeiros em **R$ milhões** para aquele escopo. Valores desconhecidos são `null`. Campos de tipo ou associação não são deduzidos de outros campos. Projetos compartilhados entre unidades exigem normalização e atribuição oficial na integração; o componente não inventa rateios.

A fonte deve fornecer um registro canônico por projeto e escopo. Em revisões repetidas, o último registro da fonte prevalece. A deduplicação acontece depois da seleção do escopo e antes da exclusão de registros cancelados/inativos.

## Contagens e benefícios

- O portfólio e cada nó contam IDs únicos. Um projeto pode participar de várias categorias e vários pilares.
- Um direcionador usa a união dos projetos de suas categorias; não soma contagens ou benefícios dos filhos.
- O total geral agrega cada projeto uma única vez. Benefícios de diferentes pilares podem se sobrepor e **não devem ser somados**. Essa observação também é apresentada na interface.
- Percentuais por pilar usam o total único selecionado. Sua soma pode ultrapassar 100% devido às associações múltiplas.
- Campos financeiros só são agregados quando todos os membros e valores necessários estão disponíveis. Cobertura incompleta não produz um suposto total financeiro completo.
- Tipos e priorização têm cobertura própria. Sem classificação conhecida, a quantidade não é apresentada como zero. Registros conhecidos ainda sem categoria ou pilar aparecem na indicação de cobertura.
- Contagens positivas com cobertura incompleta são apresentadas com `≥`, indicando o mínimo conhecido. Um zero não é mostrado se registros desconhecidos ainda puderem pertencer à classificação.
- Desempenho financeiro é o desvio `(realizado / previsto − 1) × 100`; requer base prevista positiva e completa. Não há limites de semáforo arbitrários.

## Interatividade e filtros

Os filtros de unidade e período vêm do Overview. Quando existem áreas no cadastro de projetos, um filtro local atualiza árvore, pilares e detalhamento, claramente identificado como exclusivo desta seção. A área selecionada é mantida enquanto continuar disponível.

Os títulos e cards abrem o `DetailDrawer` existente. As setas controlam cada ramo e não abrem o painel. Recolher a raiz oculta descendentes e conectores sem perder o estado individual dos direcionadores. Expandir tudo e Recolher tudo atuam apenas nesta árvore. O nó ou pilar selecionado permanece destacado após fechar o painel.

O diagrama possui conectores CSS e rolagem horizontal própria, sem mudar o zoom ou a navegação da Math Tree. A raiz é centralizada quando o espaço horizontal é limitado. Descrições de classificação são acessíveis por mouse/teclado; os botões também têm rótulos de expansão.

## Arquivos

- Modificado: `src/pages/HomePage.tsx` — importa e posiciona a seção.
- Criados: `src/components/dashboard/StrategicAlignment.tsx`, `src/data/strategicAlignment.ts`, `src/utils/strategicAlignment.ts`, `src/styles/strategic-alignment.css`, `tests/strategicAlignment.test.mjs` e este documento.

`node --test tests/strategicAlignment.test.mjs` cobre cadastro ausente/vazio, filtros, categorias e pilares configuráveis, associações múltiplas, valores ausentes, deduplicação, revisões e exclusão de cancelados/inativos. Fixtures não são incluídas no cadastro de produção.
