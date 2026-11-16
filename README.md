# PULSE — Performance & Transformation

Protótipo navegável para apresentação executiva: login corporativo, boas-vindas animadas, Home Executiva e Math Tree Cost (Etapas 01 a 04).

## Executar localmente

Requer Node.js 20.19+ ou 22.12+ e npm.

```sh
npm install
npm run dev
```

Abra http://localhost:5173/login e clique em **Acessar demonstração** para testar o fluxo completo. As rotas da plataforma, incluindo `/home` e `/welcome`, exigem essa entrada demonstrativa; sem ela, retornam ao login. Se a porta estiver ocupada, utilize o endereço informado pelo Vite no terminal.

No PowerShell com execução de scripts bloqueada, use `npm.cmd install` e `npm.cmd run dev`.

## Verificações

```sh
npm run typecheck
npm run test:data
npm run test:math-tree
npm run test:logistics
npm run build
npm run preview
```

O build gera `dist/`. O preview serve esse build em http://localhost:4173.
Ao hospedar em servidor estático, configure o fallback de rotas para `index.html`, permitindo abrir `/login`, `/welcome` e `/home` diretamente.

## Estrutura

- `src/components/branding/`: marca, linha de pulso do login e `PulseWaves`, com dez ondas SVG animadas.
- `src/components/ui/LoadingSpinner.tsx`: anel SVG segmentado, com rotação de 1,5 segundo.
- `src/hooks/useWelcomeCountdown.ts`: contador de dez segundos, saída de 500 ms e limpeza dos temporizadores.
- `src/pages/LoginPage.tsx`: layout responsivo, formulário e validação local.
- `src/pages/WelcomePage.tsx`: boas-vindas com fotografia original, painel diagonal, animações e botão Pular.
- `src/pages/HomePage.tsx`: composição do Overview, estado dos filtros e seleção dos detalhes.
- `src/pages/ModulePlaceholderPage.tsx`: página temporária dos sete módulos ainda não desenvolvidos.
- `src/layouts/DashboardLayout.tsx`: estrutura com menu fixo, cabeçalho e conteúdo rolável.
- `src/components/layout/`: `Sidebar.tsx`, `Header.tsx` e `navigation.ts`, com os oito módulos e seus ícones.
- `src/components/dashboard/`: componentes dos indicadores, filtros, gráficos, pipeline, alertas e painéis laterais.
- `src/data/demoData.ts`: base central de dados, registros fictícios, consolidação das unidades e séries financeiras.
- `src/App.tsx`: rotas React Router; `/` e caminhos desconhecidos redirecionam para `/login`.
- `src/styles/global.css`: identidade visual e adaptação para desktop, notebook, tablet e celular.
- `src/styles/welcome.css`: estilos aprovados das boas-vindas, preservados.
- `src/styles/dashboard.css`: identidade visual da Home, isolada das telas anteriores.
- `public/images/pulse-landscape.png`: fotografia original PULSE utilizada sem alterações.
- `src/main.tsx`: inicialização, roteador e fonte Inter servida localmente.

- `tests/demoData.test.mjs`: dez testes de consistência financeira, contagem dos registros e separação entre realizado e forecast.

React, TypeScript e Vite, com Tailwind CSS, React Router, ícones Lucide React e gráficos Recharts. Sem backend, banco de dados, autenticação real ou integrações externas. A Home é carregada sob demanda para manter a biblioteca de gráficos fora do carregamento inicial do login.

## Dados e filtros da Home

A unidade altera todos os KPIs, as séries, as áreas, o pipeline e os registros dos painéis. Os totais consolidados correspondem à soma das unidades, e o índice de captura é recalculado sobre os valores totais.

Os dados são uma simulação com corte em setembro de 2026, independentemente da data do computador:

- **YTD 2026:** carteira constituída até setembro. A projeção de fechamento considera essa carteira.
- **FY 2026:** carteira anual completa, incluindo 18 iniciativas planejadas para o quarto trimestre. Aumentam o potencial, o forecast e a quantidade de registros; não geram captura realizada futura.
- O gráfico mostra janeiro a dezembro para permitir visualizar o fechamento anual. A linha de realizado termina em setembro. De outubro a dezembro, os valores de forecast permanecem separados e tracejados.

| Visão | Potencial (R$ mi) | Realizado (R$ mi) | Forecast (R$ mi) | Iniciativas | Em risco |
| --- | ---: | ---: | ---: | ---: | ---: |
| YTD · Consolidado | 48,2 | 31,5 | 43,7 | 126 | 14 |
| YTD · Unidade A | 22,4 | 15,8 | 20,1 | 58 | 6 |
| YTD · Unidade B | 25,8 | 15,7 | 23,6 | 68 | 8 |
| FY · Consolidado | 56,0 | 31,5 | 50,8 | 144 | 18 |
| FY · Unidade A | 26,0 | 15,8 | 23,5 | 66 | 8 |
| FY · Unidade B | 30,0 | 15,7 | 27,3 | 78 | 10 |

A distribuição inicial L0–L5 é 18 / 21 / 29 / 26 / 19 / 13. Cada painel lista todos os registros correspondentes, sem amostras que contradigam as quantidades dos indicadores. Nomes e responsáveis são fictícios. Os gráficos também oferecem tabelas em **Ver dados**.

## Comportamento e validação manual

1. Em `/login`, envie o formulário vazio ou com e-mail inválido: os campos exibem mensagens e o primeiro campo inválido recebe foco.
2. Digite qualquer e-mail válido e uma senha não vazia. Teste mostrar/ocultar senha e envie: a aplicação abre `/welcome`.
3. Clique em **Acessar demonstração** sem preencher campos: a aplicação abre `/welcome`.
4. Em `/welcome`, confira a fotografia, as dez ondas e o anel giratório. O texto começa em dez segundos e acompanha a contagem regressiva.
5. Após dez segundos, a tela faz fade-out de 500 ms e navega para `/home`, que apresenta o Executive Overview.
6. Abra `/welcome` novamente e clique em **Pular**: a contagem é cancelada e a mesma transição leva à Home.
7. Ative a preferência de movimento reduzido no sistema/navegador: ondas e spinner ficam estáticos; fade-in e fade-out são desativados, preservando o contador.
8. Saia de `/welcome` antes do fim da contagem: os temporizadores são limpos, sem navegação posterior inesperada.
9. Teste navegação por Tab, envio por Enter e checkbox por Espaço, além das resoluções 1920×1080, 1366×768, tablet e celular.
10. Na Home, alterne as seis combinações de unidade e período: compare os KPIs, as tabelas dos gráficos, o pipeline e os alertas com a tabela acima.
11. Clique nos seis KPIs. Confira valores, composição por unidade e descrições. Nos cartões Iniciativas e Em Risco, confira as listas completas.
12. Clique em cada estágio L0–L5 e confira a quantidade e o estágio de todos os registros.
13. Use **Consultar pendências** e confira nome, unidade, responsável fictício, estágio, motivo e status de cada iniciativa crítica.
14. Feche os painéis pelo botão ou por Escape. O foco deve retornar ao elemento que abriu o painel; Tab deve permanecer dentro do painel enquanto ele estiver aberto.
15. Passe o ponteiro sobre os gráficos e confira os tooltips; teste também **Ver dados**.
16. Recolha e expanda o menu no desktop. No celular, abra o menu pelo botão no cabeçalho. Navegue pelos sete módulos provisórios e volte ao Overview.

A senha fica apenas no estado temporário do formulário, é limpa ao navegar e não é enviada, registrada em logs ou persistida. O checkbox de manter sessão é apenas visual e não mantém uma sessão real. A fonte e os recursos visuais são locais; os botões não fazem requisições externas.

O perfil no cabeçalho abre um menu com identificação e **Sair do aplicativo**. A saída encerra somente o acesso demonstrativo: remove o marcador `pulse.demo-access` do `sessionStorage`, atualiza o estado em memória e retorna ao login. As rotas verificam esse estado também ao usar Voltar/Avançar, impedindo reabrir as telas após sair. Sem armazenamento disponível, o fluxo funciona em memória durante a visita. O menu suporta teclado, Escape, clique fora e dispositivos móveis.

Esse controle de navegação do protótipo não é autenticação nem autorização de segurança. Uma integração futura deve usar o provedor de identidade para login/logout, revogação de tokens e autorização no backend. O código em `src/context/DemoSession.tsx` explicita essa limitação; não há credenciais ou tokens reais armazenados pelo protótipo.

O login, as boas-vindas, os componentes da marca, os estilos anteriores e a fotografia foram preservados integralmente, com hashes conferidos. As animações aprovadas continuam usando SVG e CSS; a contagem usa o tempo decorrido e limpa seus temporizadores também no React StrictMode.

## Arquivos da Etapa 03

Criados:

- `src/data/demoData.ts`
- `src/layouts/DashboardLayout.tsx`
- `src/components/layout/Sidebar.tsx`, `Header.tsx`, `navigation.ts`
- `src/components/dashboard/DashboardFilters.tsx`, `KPICard.tsx`, `ValueCaptureChart.tsx`, `ValueByAreaChart.tsx`, `InitiativePipeline.tsx`, `ManagementAttention.tsx`, `DetailDrawer.tsx`, `InitiativeList.tsx`, `MetricDetails.tsx`
- `src/pages/ModulePlaceholderPage.tsx`
- `src/styles/dashboard.css`
- `tests/demoData.test.mjs`

Alterados: `src/pages/HomePage.tsx`, `src/App.tsx`, `package.json`, `package-lock.json` e `README.md`.

As funcionalidades definitivas dos demais módulos ficam para as próximas etapas, após aprovação visual da Etapa 03.

## Etapa 04 — Math Tree Cost / Trefilarias

Acesso: http://localhost:5173/math-tree/cost, ou pelo item **Math Tree Cost**, logo abaixo de Value Tree no menu. Os demais módulos e as telas anteriores permanecem preservados.

Foi instalada apenas a dependência `@xyflow/react`. Os nós, tabelas, conectores e controles são elementos reais da interface. O layout determinístico da hierarquia fixa dispensa uma biblioteca adicional de layout.

### Navegação e controles

- O cenário disponível é Trefilarias / MRF04. O filtro de unidade permite Todas as unidades, JF, SP, Sa e Re; atualiza as linhas, os percentuais e o ranking de desvios.
- A árvore abre com todos os ramos expandidos. Os botões +/− de cada ramo preservam o estado dos outros ramos, inclusive dos descendentes temporariamente ocultos.
- **Recolher tudo** mantém Produção, Custo Total, Custos Diretos e Custos Indiretos. **Expandir tudo** restaura os nove nós.
- Arraste o canvas para movimentar a árvore. Use a roda do mouse, gestos de pinça ou os botões para zoom. O indicador percentual restaura 100%, permitindo ler as tabelas em escala natural.
- **Ajustar à tela** oferece a visão geral. No celular, a abertura automática prioriza a leitura do nó raiz; explore os ramos com pan e zoom, sem reduzir a fonte das tabelas.
- O painel **Maiores Desvios** pode ser recolhido. Classifica os cinco componentes finais pela magnitude absoluta da variação, sem duplicar pais e filhos.
- Clique no título de qualquer nó ou em um desvio para abrir o drawer reutilizado da Home. Escape ou Fechar encerram o painel e restauram o foco.
- **Atualizar** restaura os ramos e a visualização do cenário de referência, mantendo a unidade selecionada. Não gera valores novos nem faz requisições externas.
- Tela cheia utiliza a API do navegador quando permitida. No Chrome isolado desta sessão, a solicitação foi recusada; a mensagem alternativa foi testada. A entrada e a saída efetivas em tela cheia não puderam ser validadas nesse ambiente.

### Origem dos valores e pendências de validação

**A imagem da árvore original citada no briefing não foi anexada.** Os valores legíveis foram transcritos exclusivamente da proposta visual PULSE fornecida. A base inteira está marcada como pendente de validação com a origem em `src/data/mathTreeTrefilarias.ts`. Valores ilegíveis ou ausentes devem permanecer `null`, exibidos como “—”; não devem ser estimados.

As entradas de custo absoluto, produção e unitários de referência são separadas dos cálculos. Os percentuais mostrados nos badges da imagem não são copiados: a interface calcula `(MRF / BDG − 1) × 100` a partir dos absolutos selecionados. Por isso, os desvios calculados podem diferir dos percentuais ilustrativos da proposta. Reduções de custo são favoráveis; a produção recebe apenas indicação de variação de volume.

Pendências registradas no arquivo de dados e nos detalhes:

- **Custo Total / JF / BDG:** a imagem informa **610 R$/t**, mas `103.003.146 / 201.961` é aproximadamente **510 R$/t**. O valor 610 foi preservado e sinalizado.
- **Custos Diretos:** Administração/Logística + Operacionais já correspondem ao subtotal; a inclusão adicional de GENDT não reconcilia com o pai. A hierarquia pedida foi mantida, sem recalcular nem sobrescrever o subtotal. A regra de alocação precisa de confirmação.
- **Totais:** diferença de R$ 1 em SP/MRF04 e Sa/BDG ao comparar o pai com a soma dos filhos; também há diferenças de R$ 1 em algumas linhas dos indiretos. Entradas preservadas.
- Bases de alocação dos componentes não confirmadas. A razão custo/produção é apresentada apenas como diagnóstico nos detalhes. Não é um motor financeiro e não substitui automaticamente o unitário informado.

### Arquivos da Etapa 04

Criados:

- `src/data/mathTreeTrefilarias.ts`: referências e pendências de validação.
- `src/utils/mathTreeCalculations.ts`: totais, desvios, diagnósticos, ranking e layout da hierarquia visível.
- `src/pages/MathTreeCostPage.tsx`: estado da tela, filtros, restauração, painel e tela cheia.
- `src/components/math-tree/MathTreeCanvas.tsx`, `CostNode.tsx`, `ProductionNode.tsx`, `ExpandCollapseButton.tsx`, `MathTreeToolbar.tsx`, `VariancePanel.tsx`, `VarianceBadge.tsx`, `CostDetailDrawer.tsx`.
- `src/styles/math-tree.css`: estilos exclusivos do módulo.
- `tests/mathTree.test.mjs`: 11 testes de dados, cálculos, origem, reconciliação e expansão independente.

Alterados: `src/App.tsx`, `src/components/layout/navigation.ts`, `package.json`, `package-lock.json` e `README.md`.

### Verificações executadas

- TypeScript e build de produção.
- 11 testes da árvore e 11 testes de regressão dos dados da Home.
- Chrome: nove nós, oito ligações, 36 linhas iniciais, cinco seleções de unidade, desvios e ranking, expansão individual, preservação do estado de ramos, expandir/recolher tudo, drawers e retorno do foco, zoom por botões e roda, pan, ajuste à tela, recolhimento do painel e restauração do cenário.
- Layouts 1920×1080, 1366×768, 768×1024, 390×844 e 320×568, sem rolagem horizontal da página. Em telas estreitas, verificada a escala inicial de leitura.
- Rotas anteriores: Home com os sete KPIs e resumo financeiro preservados; login, boas-vindas e Pular até a Home.
- Tela cheia: testada a solicitação e a mensagem de recusa do navegador; funcionamento efetivo pendente em navegador que permita a operação.

Nenhum backend, banco de dados, SAP ou recurso de IA foi implementado. A próxima etapa depende da aprovação visual e funcional da Etapa 04.

## Composição de Custos Administrativos / Logística

Na Math Tree, clique no card **Custos Administrativos | Logística** (ou no seu título). A composição abre no mesmo Workspace, com breadcrumb **Math Tree > Custos Administrativos > Logística** e retorno à árvore principal.

Link direto: http://localhost:5173/math-tree/cost?view=logistics. A URL mantém unidade, cenário e o período de contexto quando informado. Exemplo: `?view=logistics&unit=SP&scenario=MRF04`.

- Quatro ramificações: Transporte Interno, Gerência Trefilaria, Planejamento e Programação e Expedição de Trefilados.
- Setas expandem/recolhem as tabelas das unidades individualmente. Os controles globais atuam nas quatro ramificações; os rateios têm expansão independente e começam recolhidos.
- O filtro permite todas as unidades, JF, SP, SB e Re. SB — Sabará corresponde ao código `Sa` da árvore de origem, que foi preservado. São Paulo e Resende permanecem explicitamente pendentes de validação cadastral.
- O retorno preserva o filtro, os ramos recolhidos, o painel e o viewport da árvore principal. A reabertura da composição preserva suas expansões, rateios abertos e viewport durante a mesma sessão do Workspace. Voltar/Avançar do navegador também funcionam.
- BDG, MRF e R$/t têm explicações por tooltip, acessíveis também por teclado. Zoom, pan, ajuste à tela e preferência de movimento reduzido são suportados.

### Disponibilidade dos dados

O nó principal reutiliza os valores da referência de Logística existente; não há cópia manual de números nem distribuição proporcional inventada. **Não foram fornecidos valores para as quatro ramificações, centros de custo, regras ou percentuais de rateio.** Esses campos são `null` ou listas vazias na base e aparecem como “—” / “Não informado”, sem conversão para zero.

A origem atual também não informa um período. Quando houver um período explícito no contexto, ele é preservado na navegação; valores sem período não são automaticamente associados a ele. Nesse caso, a composição informa que não há dados cadastrados para a seleção. O cenário disponível continua sendo MRF04.

O modelo de rateio suporta múltiplos registros por componente, unidade, período e cenário, cada um com centro de custo, regra, percentual, origem e destino. Não são presumidas regras de rateio nem bases de produção. Os cálculos de variação reutilizam os utilitários existentes, protegendo divisões por zero e dados ausentes; totais incompletos não são apresentados como valores conhecidos.

### Arquivos desta ampliação

Criados:

- `src/data/logisticsTree.ts`: hierarquia, catálogo das unidades, entradas financeiras e modelo de múltiplos rateios.
- `src/utils/logisticsCalculations.ts`: seleção dos dados por contexto, totais, rateios e layout.
- `src/components/math-tree/AllocationDetails.tsx`, `LogisticsCostNode.tsx`, `LogisticsTreeCanvas.tsx`.
- `src/pages/LogisticsTreePage.tsx`.
- `src/styles/logistics-tree.css`.
- `tests/logisticsTree.test.mjs`.

Alterados: `src/pages/MathTreeCostPage.tsx`, `src/components/math-tree/MathTreeCanvas.tsx`, `src/components/math-tree/CostNode.tsx`, `package.json` e `README.md`. Nenhuma dependência nova foi instalada; menu, rotas de outros módulos, Home, login e boas-vindas foram preservados.

Testes executados: dez testes de dados/cálculos de Logística, regressão da árvore principal, TypeScript e build. No Chrome: clique real no card, breadcrumb, retorno e histórico do navegador, estado dos dois canvases, quatro expansões independentes, controles globais, campos de rateio, cinco seleções de unidade, contexto de período, tooltip por teclado, zoom, pan e movimento reduzido. Revisadas as resoluções 1920×1080, 1366×768, 768×1024, 390×844 e 320×568, sem rolagem horizontal da página.

## Transporte Interno — composição progressiva

Na visão de Logística, a seta de **Transporte Interno** abre dois novos componentes no mesmo canvas, da esquerda para a direita:

- **Máquinas de Apoio** = Quantidade de Máquinas × Preço por Máquina.
  - Um card final com uma tabela de Unidade, Indicador, BDG e MRF04; Quantidade de máquinas e Preço por máquina agrupados em duas linhas por unidade.
- **Transporte de Bobinas** = Quantidade de Caminhões × Preço por Caminhão.
  - Um card final com a mesma tabela; Quantidade de caminhões e Preço por caminhão agrupados em duas linhas por unidade.

Os dois novos cards começam ocultos e não possuem descendentes. Cada tabela agrupa JF, SP, SB e Re; o filtro mostra somente a unidade selecionada. A fórmula aparece abaixo de cada tabela. Recolher Transporte Interno oculta os dois cards, preservando os demais ramos e a tabela oficial de Transporte Interno.

**Expandir tudo** abre os sete nós e suas tabelas. **Recolher tudo** retorna aos cinco nós principais, com os detalhes recolhidos. **Ajustar à tela**, zoom e pan continuam disponíveis.

### Regras financeiras

Os fatores são separados dos custos oficiais em `src/data/transportComposition.ts`. Não foram fornecidas quantidades ou preços: as oito combinações de componente/unidade possuem fatores `null`, exibidos como “—”. Quantidades ou preços não são inferidos dividindo custos, nem preenchidos com exemplos.

Os cálculos são independentes para BDG e MRF04, respeitando unidade e período:

1. Multiplicar quantidade pelo preço somente quando ambos forem conhecidos e válidos.
2. Somar Máquinas de Apoio e Transporte de Bobinas somente quando os dois custos estiverem disponíveis; não mostrar uma soma parcial como total.
3. Sempre priorizar o custo oficial quando informado, sem sobrescrever ou alterar a base. O custo calculado e a diferença de conciliação permanecem separados.
4. Sinalizar detalhamento pendente quando faltarem fatores ou existir diferença em relação ao oficial. A mesma sinalização se propaga para Transporte Interno quando a composição ainda precisa de validação.
5. Quantidades zero ou preços zero informados são válidos; valores ausentes continuam ausentes. A variação percentual não divide por orçamento zero. A comparação de unitários R$/t existentes permanece baseada nos valores de referência, sem recalculá-los a partir desses fatores.

### Correção dos nós finais

`GroupedIndicatorTable.tsx` reutiliza o modelo de indicadores agrupados por unidade. `TransportCompositionContent.tsx` fornece as linhas de Quantidade e Preço. A hierarquia em `transportComposition.ts` encerra nos dois componentes; `LogisticsCostNode.tsx`, `logisticsCalculations.ts` e `logistics-tree.css` preservam conectores e espaçamento. Os cálculos financeiros e os valores de origem permanecem inalterados.

Validação: 16 testes de Logística, TypeScript e build. No Chrome: um card e uma tabela por componente, quatro colunas, duas linhas agrupadas por unidade, ausência de descendentes, filtros, expansão/recolhimento, controles globais e valores superiores preservados. Sem sobreposição ou rolagem horizontal da página nas resoluções 1920×1080, 1366×768, 768×1024, 390×844 e 320×568.
