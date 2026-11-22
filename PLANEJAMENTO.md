# Planejamento — desafio_teste_campo_minado

Campo minado em tabuleiro **18 × 14** com **40 minas**: **casos de teste de interface em JavaScript**. O jogo em si não é implementado (a entrega são só os testes); os testes ficam falhando pelo motivo certo.

| Integrante | GitHub | Papel neste repositório |
|---|---|---|
| Henrique Kendi Ikeda (RA 24039456-2) | Henrique-ikeda | Setup do projeto e testes de: tabuleiro, revelar células, números, cascata e cronômetro (tarefas A1–A5) |
| Felipe Galeti Gôngora (RA 24036480-2) | FGaleti | CI, README e testes de: bandeiras, derrota, vitória, nova partida e abrir vizinhos (tarefas F1–F5) |

---

## 1. Regras do jogo (o que os testes verificam)

- Tabuleiro de **18 colunas × 14 linhas = 252 células**, com **40 minas**. Cada célula é identificada por `linha-coluna`, de `1-1` (canto superior esquerdo) a `14-18` (canto inferior direito).
- **Vizinhas** de uma célula: as até 8 células em volta (horizontal, vertical e diagonal).
- **Clique esquerdo** numa célula oculta **revela** a célula:
  - se for **mina**: o jogador perde;
  - se tiver minas vizinhas: mostra o **número** de minas vizinhas (1 a 8);
  - se não tiver nenhuma mina vizinha (célula **vazia**): não mostra número e revela sozinha todas as vizinhas, em **cascata**, até chegar nas células com número. A cascata nunca revela mina nem célula com bandeira (a bandeira continua lá e a cascata segue pelas outras vizinhas).
- Clicar numa célula já revelada não muda nada.
- **Clique direito** numa célula oculta põe uma **bandeira**; outro clique direito tira. Célula com bandeira não é revelada pelo clique esquerdo. Não dá para pôr bandeira em célula revelada.
- **Contador de minas** = 40 − número de bandeiras colocadas.
- **Duplo clique** num número revelado ("abrir vizinhos"): se o número de bandeiras em volta for **igual** ao número da célula, revela todas as vizinhas ocultas sem bandeira (como se cada uma fosse clicada). Se for diferente, não faz nada. Se uma bandeira estava errada, a vizinha revelada pode ser mina e o jogador perde.
- **Primeiro clique seguro:** com as minas sorteadas, o primeiro clique nunca é numa mina (o sorteio evita a célula clicada).
- **Derrota:** a mina clicada fica **explodida**, todas as outras minas são **mostradas**, bandeiras em células sem mina ficam marcadas como **erradas**, e a mensagem é "Você perdeu!". O tabuleiro fica bloqueado.
- **Vitória:** quando as **212** células sem mina estão reveladas. A mensagem é "Você venceu!", todas as minas recebem bandeira e o contador vai a 0. O tabuleiro fica bloqueado.
- **Cronômetro:** começa em 0, começa a contar no primeiro clique que revela uma célula, soma 1 por segundo, para no fim do jogo e não passa de **999**.
- **Nova partida:** volta tudo ao começo (252 células ocultas, contador 40, cronômetro 0, mensagem vazia).

## 2. Stack, comandos e estrutura

| Item | Escolha |
|---|---|
| Entrega | **Somente os casos de teste** (`tests/`). O código do jogo não é implementado |
| Executor dos testes | [Jest](https://jestjs.io) 29, com `babel-jest` (converte os ES Modules para CommonJS só nos testes) |
| Testes de interface | [Testing Library](https://testing-library.com) (`@testing-library/dom` + `@testing-library/user-event` + `@testing-library/jest-dom`), em JavaScript |
| "Navegador" dos testes | [jsdom](https://github.com/jsdom/jsdom) (`testEnvironment: 'jsdom'`). Não precisa baixar navegador |
| Esqueleto da tela | `index.html` com os elementos fixos da seção 3 **vazios** + `js/main.js` vazio. É só o "molde" que os testes abrem |
| Node | 18 ou superior |
| CI | GitHub Actions rodando `npm ci` e `npm run verificar` em todo push e Pull Request |

```bash
npm install                 # instala dependências (não baixa navegador)
npm test                    # roda os testes (jest) — TODOS falham, de propósito
npm run verificar           # confere se cada teste falha pelo motivo certo e tem um ID do plano
npm run verificar:completo  # idem + acusa TCs do plano que ainda não têm teste (usar na entrega)
```

### Por que os testes ficam falhando

O jogo não existe. Cada teste é escrito a partir da especificação (seções 1, 3 e 5) e precisa **falhar pelo motivo certo**:

- ✅ **Motivo certo:** a asserção não bate ou o elemento não existe, porque o jogo ainda não faz aquilo. Por exemplo, `Unable to find an element by: [data-testid="celula-1-1"]` ou `expect(element).toHaveTextContent()`.
- ❌ **Motivo errado:** erro no próprio teste, como `TypeError`, `ReferenceError`, import quebrado ou arquivo que não carrega.
- ❌ **Teste passando:** se passa com a tela vazia, ele não testa nada. Reescreva-o para conferir o comportamento da seção 5.

O `scripts/verificar-testes.mjs` faz essa conferência sozinho; o CI e o hook dos agentes usam ele.

### Esqueleto da tela (`index.html`)

- Tem os elementos **fixos** da seção 3, cada um com seu `data-testid`, **sem texto, sem valor e sem atributos de estado** (`data-estado`, `disabled`, `hidden`). Senão algum teste passaria sem o jogo existir.
- As células (`celula-L-C`) são criadas pelo jogo e **não** entram no esqueleto.
- Carrega `<script type="module" src="js/main.js"></script>`; `js/main.js` fica só com um comentário.

### Como um teste abre o jogo — `tests/helpers.js`

`abrirJogo(params)` põe os parâmetros na URL, carrega o `index.html`, importa o `js/main.js` de novo (cada teste começa um jogo novo) e devolve o `user` do user-event para clicar como um jogador.

```js
import { abrirJogo, celula, cliqueDireito, MINAS_PADRAO } from './helpers.js';
import { screen } from '@testing-library/dom';

test('TC-CM-04 revelar uma célula com número', async () => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await user.click(celula('1-9'));
  expect(celula('1-9')).toHaveAttribute('data-estado', 'revelada');
  expect(celula('1-9')).toHaveTextContent(/^2$/);
});
```

### Regras para os testes

- Os testes **só** acessam o jogo pelo que o usuário vê e clica: `screen.getByTestId(...)` e `user.click`, `user.dblClick`, `cliqueDireito(user, el)`. Nada de importar `js/*.js` ou chamar funções internas.
- Clique direito: `cliqueDireito(user, elemento)` do `helpers.js`. Duplo clique: `await user.dblClick(elemento)`.
- Tempo (cronômetro): `jest.useFakeTimers()` no teste, `abrirJogo(params, { advanceTimers: jest.advanceTimersByTime })` e `jest.advanceTimersByTime(3000)` para "esperar" 3 s sem esperar de verdade.
- Todo elemento que um teste usa tem `data-testid` (lista na seção 3). Se precisar de um novo, adicione na seção 3 no mesmo PR.
- A posição das minas é controlada pelo **parâmetro de URL `minas`** (seção 3). Um teste nunca depende de sorte; sem o parâmetro, o teste só pode conferir regras que valem para qualquer sorteio.
- Cada caso de teste da seção 5 vira um `test('TC-CM-NN ...')` com o **mesmo ID no título** (o verificador exige).
- Proibido `test.skip`, `test.todo` e `.only` (o verificador acusa).

### Arquivos para agentes de IA (ver [docs/TDD-COM-IA.md](docs/TDD-COM-IA.md))

```
AGENTS.md                        instruções para qualquer agente (Codex lê sozinho)
CLAUDE.md                        Claude Code: carrega o AGENTS.md + sub-agentes
.claude/skills/tdd/SKILL.md      skill tdd para o Claude Code  (/tdd A2)
.agents/skills/tdd/SKILL.md      skill tdd para o Codex        ($tdd A2) — cópia idêntica
.claude/agents/                  sub-agentes: escritor-de-testes, revisor-tdd
.claude/settings.json            hook do Claude Code
.codex/hooks.json                hook do Codex (aprovar uma vez com /hooks)
scripts/verificar-testes.mjs     verificador (npm run verificar, CI e hook)
scripts/hooks/rodar-testes.mjs   o hook: roda o verificador após editar tests/
docs/TDD-COM-IA.md               técnicas de TDD com IA usadas aqui e fontes
docs/MATRIZ-COBERTURA.md         cada regra da seção 1 → casos de teste que a cobrem
```

### Estrutura e dono de cada arquivo

```
desafio_teste_campo_minado/
├── index.html                    A1  esqueleto: elementos fixos da seção 3, vazios
├── js/main.js                    A1  vazio (o jogo não é implementado)
├── tests/helpers.js              A1  abrirJogo(), MINAS_PADRAO e atalhos
├── tests/tabuleiro.spec.js       Henrique  (A2–A4)
├── tests/cronometro.spec.js      Henrique  (A5)
├── tests/bandeiras.spec.js       Felipe    (F2)
├── tests/fim-de-jogo.spec.js     Felipe    (F3, F4)
├── tests/abrir-vizinhos.spec.js  Felipe    (F5)
├── .github/workflows/testes.yml  Felipe    (F1)
├── README.md                     Felipe    (F1; cada um atualiza a sua parte da tabela)
├── babel.config.cjs              A1  só para os testes (Jest): ESM → CommonJS
└── package.json                  A1
```

## 3. Contrato de interface (o que os testes usam)

### Elementos (`data-testid`)

| data-testid | O que é |
|---|---|
| `tabuleiro` | O tabuleiro (contém as 252 células) |
| `celula-1-1` … `celula-14-18` | Células, `celula-<linha>-<coluna>`. Atributo `data-estado` = `oculta` \| `revelada` \| `bandeira` \| `mina` \| `explodida` \| `bandeira-errada`. Célula `revelada` mostra o número de minas vizinhas (1–8) como texto, ou nenhum texto se for vazia |
| `contador-minas` | 40 − bandeiras (número) |
| `cronometro` | Segundos de jogo (número, de 0 a 999) |
| `mensagem` | Vazia durante o jogo; "Você venceu!" ou "Você perdeu!" no fim |
| `btn-nova-partida` | Começa uma partida nova |

Estados no fim do jogo: `explodida` = a mina que o jogador clicou; `mina` = as outras minas, mostradas na derrota; `bandeira-errada` = bandeira numa célula sem mina, mostrada na derrota.

### Parâmetros de URL

| Parâmetro | Exemplo | Efeito |
|---|---|---|
| `minas` | `?minas=1-10,2-10,3-10,…` | Posição fixa das 40 minas (lista de `linha-coluna`). Com ele, as minas ficam exatamente ali, **inclusive no primeiro clique** (a regra do primeiro clique seguro só vale para o sorteio). Continua o mesmo depois de "Nova partida" |

### Campo fixo usado nos testes: `MINAS_PADRAO`

40 minas: a **coluna 10** inteira (14), a **coluna 18** inteira (14) e a **coluna 17** das linhas 1 a 12 (12). A coluna 10 é uma "parede" que divide o campo em dois lados.

```
                  1 1 1 1 1 1 1 1 1
1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8   ← coluna
. . . . . . . . 2 * 2 . . . . 2 * *   linha 1
. . . . . . . . 3 * 3 . . . . 3 * *   linha 2
. . . . . . . . 3 * 3 . . . . 3 * *   …
. . . . . . . . 3 * 3 . . . . 3 * *
. . . . . . . . 3 * 3 . . . . 3 * *
. . . . . . . . 3 * 3 . . . . 3 * *
. . . . . . . . 3 * 3 . . . . 3 * *   linha 7
. . . . . . . . 3 * 3 . . . . 3 * *
. . . . . . . . 3 * 3 . . . . 3 * *
. . . . . . . . 3 * 3 . . . . 3 * *
. . . . . . . . 3 * 3 . . . . 3 * *
. . . . . . . . 3 * 3 . . . . 2 * *   linha 12
. . . . . . . . 3 * 3 . . . . 1 4 *   linha 13
. . . . . . . . 2 * 2 . . . . . 2 *   linha 14
```

`*` = mina, `.` = vazia (0), número = minas vizinhas. Fatos usados nos testes (conferidos por script):

- Clicar `1-1` abre em cascata **todo o lado esquerdo**: colunas 1–9, **126 células**.
- Clicar `1-13` abre em cascata **todo o lado direito**: colunas 11–16 e as células `13-17` e `14-17`, **86 células**.
- 126 + 86 = **212** = todas as células sem mina. Então `1-1` + `1-13` = vitória.
- Números: `13-16` = 1, `1-9` = 2, `7-9` = 3, `13-17` = 4, `1-11` = 2, `1-16` = 2, `14-17` = 2.
- Vizinhas de `1-9`: `1-8`, `2-8`, `2-9` (sem mina) e `1-10`, `2-10` (minas). `1-8` é vazia.

## 4. Divisão de tarefas

Cada tarefa segue o mesmo ciclo, **um caso de teste por vez**:

1. Escrever o teste do TC só a partir da especificação (seções 1, 3 e 5), sem código do jogo.
2. Rodar só ele (`npx jest tests/<arquivo>.spec.js -t "TC-CM-NN"`) e conferir que **falha pelo motivo certo**: asserção ou elemento não encontrado, e não erro do próprio teste.
3. `npm run verificar` sem problemas → commit `test: TC-CM-NN <cenário>`.
4. No fim da tarefa: revisão, atualizar a tabela de testes do README e abrir o Pull Request; o outro integrante revisa.

Cada integrante é **dono de arquivos de teste diferentes** (coluna "Arquivos"). Assim, depois da A1, os dois trabalham em paralelo sem conflito. `tests/helpers.js` é da A1: se precisar mudar, combinem antes e façam um commit pequeno e separado.

**Usando agentes de IA (Claude Code ou Codex):** os dois seguem a skill `tdd` (lida pelo [`AGENTS.md`](AGENTS.md)). Para começar uma tarefa: `/tdd A2` no Claude Code ou `$tdd A2` no Codex; depois, "go" escreve o próximo TC. Cada integrante roda o agente na própria máquina, com o próprio `git config`, para os commits saírem no nome de quem fez.

### Henrique (tarefas A)

| Tarefa | Branch | Arquivos | Casos de teste |
|---|---|---|---|
| **A1** Setup: `package.json`, `babel.config.cjs`, `js/main.js` vazio, `.gitignore`, `index.html` esqueleto, `tests/helpers.js`, verificador, skill, sub-agentes e hooks, PLANEJAMENTO e docs | `henrique/a1-setup` | tudo, menos `README.md` e `.github/` | — |
| **A2** Tabuleiro e minas | `henrique/a2-tabuleiro` | tests/tabuleiro.spec.js | TC-CM-01, 02, 03 |
| **A3** Revelar e números | `henrique/a3-revelar` | tests/tabuleiro.spec.js | TC-CM-04, 05, 06 |
| **A4** Cascata e primeiro clique | `henrique/a4-cascata` | tests/tabuleiro.spec.js | TC-CM-07, 08, 09 |
| **A5** Cronômetro | `henrique/a5-cronometro` | tests/cronometro.spec.js | TC-CM-10, 11, 12 |
| **A6** Lacunas de cobertura (casos adicionais da auditoria) | `henrique/a6-lacunas` | tests/lacunas.spec.js | TC-CM-36 em diante (faixa 36–55) |

### Felipe (tarefas F)

| Tarefa | Branch | Arquivos | Casos de teste |
|---|---|---|---|
| **F1** CI no GitHub Actions (`npm ci`, `npm run verificar`) + README | `felipe/f1-ci-readme` | .github/workflows, README.md | — |
| **F2** Bandeiras | `felipe/f2-bandeiras` | tests/bandeiras.spec.js | TC-CM-13, 14, 15, 16 |
| **F3** Derrota | `felipe/f3-derrota` | tests/fim-de-jogo.spec.js | TC-CM-17, 18, 19 |
| **F4** Vitória e nova partida | `felipe/f4-vitoria` | tests/fim-de-jogo.spec.js | TC-CM-20, 21, 22 |
| **F5** Abrir vizinhos (duplo clique) | `felipe/f5-abrir-vizinhos` | tests/abrir-vizinhos.spec.js | TC-CM-23, 24, 25 |

### IDs reservados para casos de teste adicionais

Para os dois poderem acrescentar casos sem colidir: **TC-CM-26 a TC-CM-30** ficam para o Felipe; **TC-CM-31 em diante** ficam para o Henrique. A faixa **TC-CM-36 a TC-CM-55** está reservada aos casos de lacunas da tarefa A6; se o Felipe precisar de IDs novos, usa **TC-CM-56 em diante** (combinar antes com o Henrique). Cada caso novo entra na seção 5 (commit `docs:` antes do `test:`), na [matriz de cobertura](docs/MATRIZ-COBERTURA.md) e na tabela do README, no mesmo PR da tarefa.

## 5. Casos de teste (interface)

Salvo quando dito outro, todos usam `?minas=MINAS_PADRAO`.

### Henrique — tabuleiro, revelar, cascata e cronômetro

| ID | Cenário | Parâmetros / passos | Resultado esperado |
|---|---|---|---|
| TC-CM-01 | Tabuleiro 18 × 14 | Sem parâmetros. Abrir a página | 252 células, de `celula-1-1` a `celula-14-18` (não existe `celula-15-1` nem `celula-1-19`); todas `oculta`; `contador-minas` = 40; `cronometro` = 0 |
| TC-CM-02 | Sorteio tem 40 minas | Sem parâmetros. Clicar as células ocultas em ordem (`1-1`, `1-2`, …) até perder | `mensagem` = "Você perdeu!"; células `explodida` + `mina` = **40**, com exatamente 1 `explodida` |
| TC-CM-03 | Parâmetro `minas` | Clicar `1-10` | Perde no primeiro clique (`1-10` = `explodida`, o parâmetro vale mesmo no 1º clique); as células `explodida` + `mina` são exatamente as 40 de `MINAS_PADRAO` |
| TC-CM-04 | Revelar célula com número | Clicar `1-9` | `1-9` = `revelada` com texto "2"; as outras 251 continuam `oculta`; `mensagem` vazia |
| TC-CM-05 | Número de minas vizinhas (parametrizado) | Em jogos separados, clicar `13-16`, `1-9`, `7-9`, `13-17` | Texto "1", "2", "3", "4", respectivamente; só a célula clicada é revelada |
| TC-CM-06 | Clicar de novo numa revelada | Clicar `1-9` duas vezes | Continua `revelada` com "2"; as outras 251 continuam `oculta` |
| TC-CM-07 | Cascata | Clicar `1-1` | 126 células `revelada` (colunas 1–9); `1-1` sem texto; `1-9` = "2"; `1-11` continua `oculta`; `mensagem` vazia (ainda não venceu) |
| TC-CM-08 | Cascata para nos números e nunca revela mina | Clicar `1-13` | 86 células `revelada`; `1-11` = "2", `1-16` = "2", `13-17` = "4", `14-17` = "2"; `1-10` e `1-17` (minas) continuam `oculta`; `1-9` continua `oculta` (outro lado da parede) |
| TC-CM-09 | Primeiro clique seguro | Sem parâmetros, 10 jogos: em cada um, clicar `7-9` | Nos 10: `7-9` = `revelada` e `mensagem` diferente de "Você perdeu!" |
| TC-CM-10 | Cronômetro começa no 1º clique | Relógio falso. Esperar 3 s; clicar `1-9`; esperar 3 s | Antes do clique, depois de 3 s: `cronometro` = 0. 3 s depois do clique: 3 |
| TC-CM-11 | Cronômetro para no fim | Relógio falso. Clicar `1-9`; esperar 5 s; clicar `1-10` (perde); esperar 10 s | `cronometro` = 5 no momento da derrota e continua 5 depois de mais 10 s |
| TC-CM-12 | Cronômetro não passa de 999 | Relógio falso. Clicar `1-9`; esperar 1200 s | `cronometro` = 999 |
| TC-CM-31 | Número de minas vizinhas de 5 a 8 (parametrizado; caso adicional) | 4 jogos, cada um com 40 minas no parâmetro `minas`: base de 32 (colunas 17 e 18 inteiras + coluna 16 das linhas 1–4) + as 8 vizinhas de `2-2` (`1-1`, `1-2`, `1-3`, `2-1`, `2-3`, `3-1`, `3-2`, `3-3`). Para "7", "6" e "5", tirar `3-3`; `3-3` e `3-2`; `3-3`, `3-2` e `3-1`, pondo no lugar `5-16`; `5-16` e `6-16`; `5-16`, `6-16` e `7-16`. Clicar `2-2` | Texto "8", "7", "6", "5", respectivamente; só `2-2` é revelada (251 `oculta`) |
| TC-CM-32 | Cascata a partir do meio e de outro canto (parametrizado; caso adicional) | Em jogos separados, clicar `7-5` e `14-1` | Em cada um: as mesmas 126 células `revelada` (colunas 1–9); `1-9` = "2"; a coluna 10 inteira continua `oculta`; `mensagem` vazia |
| TC-CM-35 | Primeiro clique seguro mantém 40 minas (caso adicional) | Sem parâmetros. Clicar `7-9`; depois clicar as células ocultas em ordem (`1-1`, `1-2`, …) até perder | Depois do 1º clique: `7-9` = `revelada`. No fim: `mensagem` = "Você perdeu!"; exatamente 1 `explodida` e `explodida` + `mina` = **40** (a mina foi realocada, não apagada) |
| TC-CM-33 | Cronômetro não começa com bandeira (caso adicional) | Relógio falso. Clique direito em `7-1`; esperar 3 s; clicar `1-9`; esperar 2 s | Depois da bandeira e dos 3 s: `7-1` = `bandeira` e `cronometro` = 0. No fim: `cronometro` = 2 |
| TC-CM-34 | Cronômetro para na vitória (caso adicional; encosta na vitória, área do Felipe) | Relógio falso. Clicar `1-1`; esperar 4 s; clicar `1-13` (vence); esperar 10 s | `mensagem` = "Você venceu!"; `cronometro` = 4 no momento da vitória e continua 4 depois de mais 10 s |
| TC-CM-36 | Nova partida zera, para e reinicia o cronômetro (caso adicional; tarefa A6) | Relógio falso. Clicar `1-9`; esperar 5 s; clicar `btn-nova-partida`; esperar 3 s; clicar `1-9`; esperar 2 s | Antes da nova partida: `cronometro` = 5. Logo depois: 0 e `1-9` `oculta`. Depois de 3 s sem clique: continua 0. 2 s depois do clique: 2 |
| TC-CM-37 | Cronômetro para na derrota por duplo clique (caso adicional; tarefa A6) | Relógio falso. Clicar `1-9`; clique direito em `1-10` e em `1-8` (sem mina); esperar 3 s; duplo clique em `1-9`; esperar 10 s | Antes do duplo clique: `cronometro` = 3. Depois: `2-10` = `explodida`, "Você perdeu!", `cronometro` = 3 e continua 3 depois de mais 10 s |
| TC-CM-38 | Duplo clique bloqueado após a derrota (caso adicional; tarefa A6) | Clicar `1-9`; clique direito em `1-10` e `2-10`; clicar `3-10` (perde); duplo clique em `1-9` | `1-8`, `2-8`, `2-9` continuam `oculta`; 211 `oculta`, 1 `revelada`, 2 `bandeira`, 37 `mina`, 1 `explodida`; `contador-minas` = 38; `mensagem` continua "Você perdeu!" |
| TC-CM-39 | Clique esquerdo numa bandeira sem mina (caso adicional; tarefa A6) | Clique direito em `7-1`; clicar `7-1` | `7-1` continua `bandeira`; `contador-minas` = 39; as outras 251 `oculta`; `mensagem` vazia |
| TC-CM-40 | Primeiro clique seguro em muitas partidas (parametrizado; caso adicional; tarefa A6) | Sem parâmetros. Para cada posição `7-9`, `1-1` e `14-18`: 150 jogos, cada um com o 1º clique nessa posição | Em todos os jogos: a célula clicada = `revelada` e `mensagem` diferente de "Você perdeu!" |
| TC-CM-41 | Nova partida depois da vitória (caso adicional; tarefa A6) | Clicar `1-1` e `1-13` (vence); clicar `btn-nova-partida`; clicar `1-9` | Logo após a nova partida: 252 `oculta`, `contador-minas` = 40, `cronometro` = 0, `mensagem` vazia. Depois: `1-9` = `revelada` com "2" e só ela revelada |
| TC-CM-42 | Abrir vizinhos num número 3 (parametrizado; caso adicional; tarefa A6) | Clicar `2-9` ("3"); clique direito em (a) `1-10`, `2-10`, `3-10` ou (b) só `1-10`, `2-10`; duplo clique em `2-9` | (a) abre as vizinhas e a cascata: 126 `revelada`, 3 `bandeira`, 123 `oculta`, `contador-minas` = 37. (b) nada abre: 1 `revelada`, 2 `bandeira`, 249 `oculta`, `contador-minas` = 38. Nos dois: `2-9` continua "3", `mensagem` vazia |
| TC-CM-43 | Número em canto e na borda (parametrizado; caso adicional; tarefa A6) | 4 jogos, cada um com 40 minas no parâmetro `minas`: base de 32 (colunas 17 e 18 inteiras + coluna 16 das linhas 1–4) + todas as vizinhas da célula + o resto em `5-16`, `6-16`, …. Células: `1-1` (vizinhas `1-2`, `2-1`, `2-2`), `14-1` (`13-1`, `13-2`, `14-2`), `7-1` (`6-1`, `6-2`, `7-2`, `8-1`, `8-2`), `14-9` (`13-8`, `13-9`, `13-10`, `14-8`, `14-10`). Clicar a célula | Texto "3", "3", "5", "5", respectivamente; só ela é revelada (251 `oculta`) |

### Felipe — bandeiras, fim de jogo e abrir vizinhos

| ID | Cenário | Parâmetros / passos | Resultado esperado |
|---|---|---|---|
| TC-CM-13 | Pôr bandeira | Clique direito em `7-1` | `7-1` = `bandeira`; `contador-minas` = 39 |
| TC-CM-14 | Tirar bandeira | Clique direito em `7-1` duas vezes | `7-1` = `oculta`; `contador-minas` = 40 |
| TC-CM-15 | Bandeira protege a célula | Clique direito em `1-10` (mina); clique esquerdo em `1-10` | `1-10` continua `bandeira`; `mensagem` vazia (não perdeu); `contador-minas` = 39 |
| TC-CM-16 | Sem bandeira em célula revelada | Clicar `1-9`; clique direito em `1-9` | `1-9` continua `revelada` com "2"; `contador-minas` = 40 |
| TC-CM-17 | Derrota | Clicar `1-10` | `1-10` = `explodida`; as outras 39 minas = `mina`; `mensagem` = "Você perdeu!"; `7-1` continua `oculta` |
| TC-CM-18 | Bandeira errada na derrota | Clique direito em `7-1` (sem mina) e em `2-10` (mina); clicar `1-10` | `7-1` = `bandeira-errada`; `2-10` continua `bandeira`; 38 células `mina`; 1 `explodida` |
| TC-CM-19 | Tabuleiro bloqueado após derrota | Clicar `1-10`; depois clicar `7-1` e clique direito em `7-2` | `7-1` e `7-2` continuam `oculta`; `contador-minas` = 40; `mensagem` continua "Você perdeu!" |
| TC-CM-20 | Vitória | Clicar `1-1` e `1-13` | `mensagem` = "Você venceu!"; 212 células `revelada`; as 40 minas = `bandeira`; `contador-minas` = 0 |
| TC-CM-21 | Tabuleiro bloqueado após vitória | Depois do TC-CM-20, clique direito em `1-10` | `1-10` continua `bandeira`; `contador-minas` continua 0; `mensagem` continua "Você venceu!" |
| TC-CM-22 | Nova partida | Clicar `1-1`, clique direito em `1-10`, clicar `btn-nova-partida`; depois clicar `1-9` | Logo após a nova partida: 252 `oculta`, `contador-minas` = 40, `cronometro` = 0, `mensagem` vazia. Depois: `1-9` = `revelada` com "2" e só ela revelada (mesmas minas do parâmetro) |
| TC-CM-23 | Abrir vizinhos com bandeiras certas | Clicar `1-9`; clique direito em `1-10` e `2-10`; duplo clique em `1-9` | `1-8`, `2-8`, `2-9` = `revelada`; como `1-8` é vazia, a cascata abre o lado esquerdo todo (126 `revelada`); `1-10` e `2-10` continuam `bandeira`; `mensagem` vazia |
| TC-CM-24 | Abrir vizinhos com bandeiras de menos | Clicar `1-9`; clique direito só em `1-10`; duplo clique em `1-9` | Nada abre: `1-8`, `2-8`, `2-9` continuam `oculta`; `1-9` continua "2"; `contador-minas` = 39; `mensagem` vazia |
| TC-CM-25 | Abrir vizinhos com bandeira errada | Clicar `1-9`; clique direito em `1-10` e em `1-8` (sem mina); duplo clique em `1-9` | `2-10` = `explodida`; `1-8` = `bandeira-errada`; `mensagem` = "Você perdeu!" |
| TC-CM-26 | Cascata não revela célula com bandeira (caso adicional) | Clique direito em `3-3` (sem mina); clicar `1-1` | `3-3` continua `bandeira`; 125 células `revelada` (o lado esquerdo menos `3-3`); `contador-minas` = 39; `mensagem` vazia |
| TC-CM-27 | Vitória pelo duplo clique (caso adicional) | Clicar `1-13`; clicar `1-9`; clique direito em `1-10` e `2-10`; duplo clique em `1-9` | `mensagem` = "Você venceu!"; 212 células `revelada`; as 40 minas = `bandeira` (exatamente as de `MINAS_PADRAO`); `contador-minas` = 0 |
| TC-CM-28 | Bandeira numa célula sem mina impede a vitória (fronteira 211 × 212; caso adicional) | Clique direito em `1-1`; clicar `1-2`; clicar `1-13` → conferir. Depois clique direito em `1-1` (tira a bandeira); clicar `1-1` → conferir | 1ª conferência: 211 células `revelada`; `1-1` = `bandeira`; `mensagem` vazia (ainda não venceu). 2ª conferência: `mensagem` = "Você venceu!"; 212 `revelada`; `contador-minas` = 0 |
| TC-CM-29 | Abrir vizinhos com bandeiras a mais (caso adicional) | Clicar `1-9`; clique direito em `1-10`, `2-10` e `1-8`; duplo clique em `1-9` | Nada abre: `2-8` e `2-9` continuam `oculta`; só `1-9` `revelada`; 3 células `bandeira`; `contador-minas` = 37; `mensagem` vazia |
| TC-CM-30 | Nova partida depois da derrota (caso adicional) | Clicar `1-10` (perde); clicar `btn-nova-partida`; clicar `1-9` | Logo após a nova partida: 252 `oculta`; `mensagem` vazia; `contador-minas` = 40. Depois do clique: `1-9` = `revelada` com "2" e só ela revelada (o tabuleiro foi desbloqueado) |

## 6. Fluxo de trabalho no Git

Para o professor enxergar a contribuição dos dois, **cada um commita da própria conta**:

1. **Henrique** cria o repositório e adiciona `FGaleti` como colaborador (Settings → Collaborators). **Felipe** aceita o convite.
2. Cada um configura o Git com o e-mail **cadastrado na própria conta do GitHub** (senão o commit não conta como contribuição):
   ```bash
   git config user.name "Seu Nome"
   git config user.email "email-da-sua-conta@exemplo.com"
   ```
3. Ninguém commita direto na `main`. Uma branch por tarefa: `henrique/a2-...`, `felipe/f2-...`, etc.
4. Mensagens no padrão Conventional Commits, em português: `test:`, `docs:`, `chore:`, `ci:`. Commits pequenos: um caso de teste por commit.
5. Pull Request para `main` → o **outro** integrante revisa e aprova → merge com **"Create a merge commit"** (não usar *squash*, para manter todos os commits de cada autor no histórico).
6. Antes de abrir o PR: `git pull origin main` e `npm run verificar` sem problemas. O CI precisa estar verde no PR.
7. Ordem: **A1 entra primeiro** (estrutura do projeto). Depois disso as tarefas A e F andam em paralelo.

Conferir no fim: aba **Insights → Contributors** do repositório deve mostrar os dois.

## 7. Definição de pronto

- [ ] Todos os casos de teste da seção 5 escritos em `tests/`, com o ID no título
- [ ] `npm run verificar:completo` sem problemas: todos os TCs têm teste, e todos **falham pelo motivo certo**
- [ ] Nenhum código do jogo em `js/` (só o `js/main.js` vazio)
- [ ] README com: especificação, colaboradores, como rodar, **funcionamento dos casos de teste** (tabela ID → arquivo → resultado esperado)
- [ ] CI (GitHub Actions rodando `npm run verificar`) verde na `main`
- [ ] Commits dos dois integrantes aparecendo em Insights → Contributors
- [ ] Nome do repositório exatamente `desafio_teste_campo_minado`
