# Math Tree — controles para validação visual

Abra [a galeria](index.html) e clique nas imagens para visualizar a resolução original. Esta entrega aguarda validação visual do usuário.

## Causa identificada

O botão anterior tinha 21 px no espaço da árvore. A 40% de zoom, sua dimensão visível caía para aproximadamente 8,4 px. O intervalo de apenas 38 px entre colunas e a borda mais clara também prejudicavam o destaque. Como era um elemento em `EdgeLabelRenderer`, o controle não fazia parte dos nós considerados pelo enquadramento do React Flow.

## Correção implementada

- Cada ponto de expansão agora é um nó real do tipo `branchControl`, com ID único, `parentId`, estado e posição no layout.
- Conexões explícitas: card pai → nó de controle → cards filhos. Os handles coincidem com o centro do controle.
- O espaçamento entre colunas passou para 112 px; os cards mantêm 360 px de largura e suas posições verticais anteriores.
- O botão tem fundo branco, borda `#2785BD`, cantos de 5 px, sombra e símbolos `+`/`−`.
- O tamanho visual permanece em 26 × 26 px a 40%, 80% e 120%, compensando somente a escala do botão. A posição continua sendo a do nó no React Flow. Em zooms inferiores a aproximadamente 30%, a compensação é limitada para evitar sobreposição com cards.
- Os controles participam do enquadramento e acompanham pan, zoom e a altura medida dos cards ao filtrar unidades.

## Capturas

Todas as imagens foram capturadas no Chrome, em canvas de 1916 × 1114 px dentro de uma janela de 2560 × 1440 px. O percentual real de zoom aparece no controle inferior esquerdo.

| Estado | 40% | 80% | 120% |
|---|---|---|---|
| Totalmente expandida | [PNG](01-expandida-40.png) | [PNG](01-expandida-80.png) | [PNG](01-expandida-120.png) |
| Custos Diretos recolhidos | [PNG](02-diretos-recolhidos-40.png) | [PNG](02-diretos-recolhidos-80.png) | [PNG](02-diretos-recolhidos-120.png) |
| Custos Indiretos recolhidos | [PNG](03-indiretos-recolhidos-40.png) | [PNG](03-indiretos-recolhidos-80.png) | [PNG](03-indiretos-recolhidos-120.png) |
| Ambos recolhidos | [PNG](04-ambos-recolhidos-40.png) | [PNG](04-ambos-recolhidos-80.png) | [PNG](04-ambos-recolhidos-120.png) |
| Expandida novamente | [PNG](05-reexpandida-40.png) | [PNG](05-reexpandida-80.png) | [PNG](05-reexpandida-120.png) |

`measurements.json` registra os tamanhos medidos, conexão dos paths ao centro, visibilidade e verificação de que cada botão recebe o clique. Essas medições complementam as capturas; não substituem a aprovação visual.

## Testes executados

- Inspeção visual das 15 capturas acima.
- Expansão independente de Diretos, Indiretos e Total; estados dos descendentes preservados ao recolher e reabrir a raiz.
- Altura e alinhamento após filtros JF, SP, Sa, Re e todas as unidades.
- Cliques e pressionamento dos controles sem iniciar pan ou arraste de nós.
- Enquadramento e responsividade em 1920×1080, 1366×768, 768×1024, 390×844 e 320×568.
- Entrada em Logística e retorno à árvore principal.
- Tabelas e cores verde/vermelho conferidas antes e depois dos estados.
- 84 testes automatizados aprovados, incluindo os seis testes atualizados de geometria dos nós reais.
- `npm.cmd run build`: TypeScript e build concluídos sem erros.
- Nenhum erro ou aviso no console durante a verificação final do Chrome.

## Arquivos da implementação

Criado: `src/components/math-tree/BranchControlNode.tsx`.

Alterados: `src/components/math-tree/MathTreeCanvas.tsx`, `src/components/math-tree/ExpandCollapseButton.tsx`, `src/utils/treeBranchGeometry.ts`, `src/pages/MathTreeCostPage.tsx`, `src/styles/math-tree.css` e `tests/treeBranchGeometry.test.mjs`.

Removido: `src/components/math-tree/TreeBranchControl.tsx`, substituído pela implementação de nós reais.

Dados financeiros, tabelas, cálculos, login, welcome, Overview, menu e demais módulos permanecem inalterados.
