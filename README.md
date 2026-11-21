# desafio_teste_campo_minado

Desafio de testes: casos de teste para testar o **campo minado** em tabuleiro **18 × 14 com 40 bombas**, com **casos de teste em JavaScript para testar JavaScript** (Jest + Testing Library).

## Especificação do desafio

- Tabuleiro de 18 colunas × 14 linhas (252 células) com 40 minas.
- Clique esquerdo revela; o número mostra quantas minas há nas 8 vizinhas; célula vazia abre em cascata.
- Clique direito põe/tira bandeira; contador de minas = 40 − bandeiras.
- Duplo clique num número abre as vizinhas quando as bandeiras em volta batem com o número.
- Primeiro clique sempre seguro; derrota ao revelar uma mina; vitória ao revelar as 212 células sem mina.
- Cronômetro de 0 a 999, do primeiro clique até o fim do jogo; botão de nova partida.

Regras completas, contrato da tela e divisão das tarefas: [PLANEJAMENTO.md](PLANEJAMENTO.md).

## Colaboradores

| Nome | RA | GitHub | Parte no trabalho |
|---|---|---|---|
| Henrique | SEU_RA | [Henrique-ikeda](https://github.com/Henrique-ikeda) | Tarefas A1–A5: estrutura do projeto e 12 casos de teste (tabuleiro, revelar, cascata, cronômetro) |
| Felipe | RA_FELIPE | [GITHUB_FELIPE](https://github.com/GITHUB_FELIPE) | Tarefas F1–F5: CI, README e 13 casos de teste (bandeiras, derrota, vitória, nova partida, abrir vizinhos) |

As contribuições de cada um aparecem em **Insights → Contributors** e nos commits.

## Como rodar

Requisitos: Node.js 18 ou superior.

```bash
npm install
npm test                    # roda todos os casos de teste (Jest)
npm run verificar           # confere o motivo de cada falha e o ID de cada teste
npm run verificar:completo  # idem + confere que todo caso do plano tem teste
npx jest tests/<arquivo>.spec.js -t "TC-CM-NN"   # um caso só
```

## Funcionamento dos casos de teste

**Situação:** somente os casos de teste. O jogo não está implementado, então **todos os testes falham de propósito**, pelo motivo certo (o comportamento ainda não existe). O `npm run verificar` confere isso.

- **Ferramentas:** [Jest](https://jestjs.io) roda os testes; [Testing Library](https://testing-library.com) (`@testing-library/dom`, `user-event` e `jest-dom`) simula o jogador; o [jsdom](https://github.com/jsdom/jsdom) faz o papel do navegador, sem precisar abrir um.
- **Testes de interface:** cada teste abre o `index.html` do jogo pela função `abrirJogo(params)` de `tests/helpers.js`, clica como um jogador (clique, clique direito, duplo clique) e confere o que aparece na tela. Os testes não chamam funções internas do jogo.
- **Elementos da tela:** encontrados pelo atributo `data-testid` (`celula-<linha>-<coluna>`, `contador-minas`, `cronometro`, `mensagem`, `btn-nova-partida`). O estado de cada célula fica em `data-estado` (`oculta`, `revelada`, `bandeira`, `mina`, `explodida`, `bandeira-errada`).
- **Sem depender de sorte:** a posição das minas é passada pelo parâmetro de URL `minas`. Quase todos os testes usam o campo fixo `MINAS_PADRAO` (colunas 10 e 18 inteiras e coluna 17 das linhas 1–12), em que os resultados são conhecidos: clicar `1-1` abre 126 células, `1-13` abre 86, e as duas juntas dão a vitória. O tempo usa relógio falso (`jest.useFakeTimers()`).
- **Rastreabilidade:** cada teste tem no título o ID do caso (`TC-CM-NN`), o mesmo da tabela abaixo e da seção 5 do PLANEJAMENTO.md. A [matriz de cobertura](docs/MATRIZ-COBERTURA.md) liga cada regra do jogo aos seus casos.
- **Metodologia:** TDD, um caso de teste por vez: escrever, rodar, ver falhar pelo motivo certo e fazer o commit `test:`. Uso de IA documentado em [docs/TDD-COM-IA.md](docs/TDD-COM-IA.md).
- **Integração contínua:** o GitHub Actions roda `npm ci` e `npm run verificar` em todo push e Pull Request.

## Casos de teste (30)

| ID | Cenário | Arquivo | Resultado esperado | Autor |
|---|---|---|---|---|
| TC-CM-01 | Tabuleiro 18 × 14 | `tests/tabuleiro.spec.js` | 252 células `oculta`; `contador-minas` = 40; `cronometro` = 0 | Henrique |
| TC-CM-02 | Sorteio tem 40 minas | `tests/tabuleiro.spec.js` | Ao perder: `explodida` + `mina` = 40 | Henrique |
| TC-CM-03 | Parâmetro `minas` | `tests/tabuleiro.spec.js` | Perde ao clicar `1-10`; minas mostradas = exatamente `MINAS_PADRAO` | Henrique |
| TC-CM-04 | Revelar célula com número | `tests/tabuleiro.spec.js` | `1-9` = `revelada` com "2"; outras 251 ocultas | Henrique |
| TC-CM-05 | Número de minas vizinhas (parametrizado) | `tests/tabuleiro.spec.js` | `13-16` = 1, `1-9` = 2, `7-9` = 3, `13-17` = 4 | Henrique |
| TC-CM-06 | Clicar de novo numa revelada | `tests/tabuleiro.spec.js` | Nada muda | Henrique |
| TC-CM-07 | Cascata | `tests/tabuleiro.spec.js` | `1-1` abre 126 células (colunas 1–9) | Henrique |
| TC-CM-08 | Cascata para nos números e nunca revela mina | `tests/tabuleiro.spec.js` | `1-13` abre 86 células; minas continuam ocultas | Henrique |
| TC-CM-09 | Primeiro clique seguro | `tests/tabuleiro.spec.js` | Em 10 jogos sorteados, o 1º clique nunca perde | Henrique |
| TC-CM-10 | Cronômetro começa no 1º clique | `tests/cronometro.spec.js` | 0 antes do clique; 3 após 3 s | Henrique |
| TC-CM-11 | Cronômetro para no fim | `tests/cronometro.spec.js` | Continua 5 depois da derrota | Henrique |
| TC-CM-12 | Cronômetro não passa de 999 | `tests/cronometro.spec.js` | 999 após 1200 s | Henrique |
| TC-CM-13 | Pôr bandeira | `tests/bandeiras.spec.js` | `bandeira`; contador 39 | Felipe |
| TC-CM-14 | Tirar bandeira | `tests/bandeiras.spec.js` | `oculta`; contador 40 | Felipe |
| TC-CM-15 | Bandeira protege a célula | `tests/bandeiras.spec.js` | Clique esquerdo na bandeira não revela nem perde | Felipe |
| TC-CM-16 | Sem bandeira em célula revelada | `tests/bandeiras.spec.js` | Continua `revelada`; contador 40 | Felipe |
| TC-CM-17 | Derrota | `tests/fim-de-jogo.spec.js` | `explodida`; 39 `mina`; "Você perdeu!" | Felipe |
| TC-CM-18 | Bandeira errada na derrota | `tests/fim-de-jogo.spec.js` | Bandeira sem mina = `bandeira-errada`; bandeira certa continua | Felipe |
| TC-CM-19 | Tabuleiro bloqueado após derrota | `tests/fim-de-jogo.spec.js` | Cliques não mudam nada | Felipe |
| TC-CM-20 | Vitória | `tests/fim-de-jogo.spec.js` | "Você venceu!"; 212 reveladas; 40 bandeiras; contador 0 | Felipe |
| TC-CM-21 | Tabuleiro bloqueado após vitória | `tests/fim-de-jogo.spec.js` | Clique direito não tira bandeira | Felipe |
| TC-CM-22 | Nova partida | `tests/fim-de-jogo.spec.js` | Tudo zerado; o jogo novo funciona com as mesmas minas | Felipe |
| TC-CM-23 | Abrir vizinhos com bandeiras certas | `tests/abrir-vizinhos.spec.js` | Vizinhas abertas + cascata (126 reveladas) | Felipe |
| TC-CM-24 | Abrir vizinhos com bandeiras de menos | `tests/abrir-vizinhos.spec.js` | Nada abre | Felipe |
| TC-CM-25 | Abrir vizinhos com bandeira errada | `tests/abrir-vizinhos.spec.js` | `2-10` explode; "Você perdeu!" | Felipe |
| TC-CM-31 | Número de minas vizinhas de 5 a 8 (parametrizado; adicional) | `tests/tabuleiro.spec.js` | `2-2` mostra "8", "7", "6", "5" conforme as minas em volta; só ela revelada | Henrique |
| TC-CM-32 | Cascata a partir do meio e de outro canto (parametrizado; adicional) | `tests/tabuleiro.spec.js` | `7-5` e `14-1` abrem as mesmas 126 células (colunas 1–9) | Henrique |
| TC-CM-35 | Primeiro clique seguro mantém 40 minas (adicional) | `tests/tabuleiro.spec.js` | 1º clique em `7-9` revela; ao perder: `explodida` + `mina` = 40 | Henrique |
| TC-CM-33 | Cronômetro não começa com bandeira (adicional) | `tests/cronometro.spec.js` | 0 depois da bandeira + 3 s; 2 após clicar `1-9` e esperar 2 s | Henrique |
| TC-CM-34 | Cronômetro para na vitória (adicional) | `tests/cronometro.spec.js` | "Você venceu!"; continua 4 depois de mais 10 s | Henrique |

## Estrutura

```
index.html                    esqueleto da tela (elementos da seção 3)
js/main.js                    ponto de entrada do jogo (vazio)
tests/helpers.js              abrirJogo(), MINAS_PADRAO e atalhos
tests/*.spec.js               casos de teste
scripts/verificar-testes.mjs  verificador (npm run verificar e CI)
PLANEJAMENTO.md               regras, contrato, tarefas e casos de teste
docs/                         matriz de cobertura e TDD com IA
```
