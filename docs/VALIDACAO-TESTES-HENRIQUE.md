# Validação dos testes do Henrique (TC-CM-01 a 12 e 31 a 35)

Num repositório "somente testes", falhar pelo motivo certo não prova que o teste está **certo**: um resultado esperado errado também falha. Esta validação prova os dois lados, sem colocar código do jogo no repositório.

## Método

1. O repositório foi copiado para um diretório temporário **fora do clone**. Nada desse diretório foi commitado, e ele foi apagado no fim.
2. Lá, foi escrita uma **implementação de referência mínima** do jogo em `js/main.js`, seguindo só o PLANEJAMENTO.md: seções 1 e 3, parâmetro `minas`, `data-testid`, `data-estado`, contagem com as 8 vizinhas, cascata, primeiro clique seguro só no sorteio, bandeiras, duplo clique, fim de jogo, nova partida e cronômetro com limite de 999. A implementação não é entregável e não está neste repositório.
3. Rodamos só `tests/tabuleiro.spec.js` e `tests/cronometro.spec.js` contra ela. **Todos os 24 testes passaram** (17 TCs; os parametrizados contam um teste por caso).
4. **Mutação manual:** um defeito por vez na referência. Cada mutante precisa ser "morto" por pelo menos um teste, ou seja, algum teste tem que falhar.
5. **Aleatoriedade:** os TCs com sorteio foram repetidos 50 vezes.
6. **Teste intermitente:** a suíte inteira rodou 3 vezes seguidas em cada variante do cronômetro.

## Duas variantes do cronômetro

| Variante | Como conta o tempo | Resultado (3 rodadas) |
|---|---|---|
| A | `setInterval` de 1 s somando 1 | 24/24 passaram, 3 de 3 |
| B | `Date.now()` desde o 1º clique, tela atualizada a cada 250 ms | 24/24 passaram, 3 de 3 |

Isso prova que os testes do cronômetro não dependem de um jeito específico de implementar. Eles funcionam nos dois casos porque o relógio falso moderno do Jest controla tanto os timers quanto o `Date`.

## Testes com sorteio (sem parâmetro `minas`)

`TC-CM-02`, `TC-CM-09` e `TC-CM-35`, rodados **50 vezes** contra a referência: **50/50 passaram**. Todo laço desses testes tem limite: no máximo 252 cliques por partida e 10 partidas no TC-CM-09.

## Mutantes

| # | Defeito na referência | Morto por |
|---|---|---|
| 1 | Tabuleiro 14 colunas × 18 linhas (invertido) | 01, 02, 03, 04, 05, 06, 07, 08, 09, 31, 32, 34, 35 |
| 2 | Sorteio com 39 minas | 02, 35 |
| 3 | Primeiro clique pode cair em mina | 09 (probabilístico, ver abaixo) |
| 4 | Primeiro clique seguro apaga a mina em vez de realocar (39 no fim) | 02, 35 |
| 5 | Parâmetro `minas` ignorado no 1º clique (aplica o clique seguro mesmo assim) | 03 |
| 6 | Contagem ignora as diagonais | 04, 05, 06, 07, 08, 31, 32 |
| 7 | Contagem inclui a própria célula | **nenhum** (mutante equivalente, ver abaixo) |
| 8 | Cascata não se propaga (abre só as 8 vizinhas) | 07, 08, 32, 34 |
| 9 | Cascata revela as minas vizinhas dos números da borda | 07, 08, 32 |
| 10 | Cascata não para nos números | 02, 04, 05, 06, 31, 35 |
| 11 | Clicar numa revelada alterna para `oculta` | 06 |
| 12 | Cronômetro começa ao abrir a página | 10, 33 |
| 13 | Cronômetro começa com a bandeira | 33 |
| 14 | Cronômetro não para no fim do jogo | 11, 34 |
| 15 | Cronômetro sem limite (passa de 999) | 12 |
| 16 | Cronômetro começa em 1 no primeiro clique | 10, 11, 33, 34 |

**Resultado: 15 de 16 mutantes mortos.** O único que sobreviveu é equivalente.

- **Mutante 7 é equivalente.** O número só aparece em célula **sem mina**, e aí incluir a própria célula na contagem soma 0. Nenhum teste pela interface consegue distinguir os dois comportamentos, então não há o que corrigir nos testes.
- **Mutante 3 é morto por probabilidade.** O TC-CM-09 joga 10 partidas sorteadas; o mutante só aparece quando o sorteio põe mina em `7-9` (40/252 ≈ 16% por partida). A chance de matar numa rodada é 1 − (212/252)^10 ≈ 82%. Medido: **14 de 20 rodadas** mataram. Não dá para melhorar isso sem fixar o sorteio, o que a seção 2 proíbe para este TC. O número de partidas é o da seção 5.

## Ambiguidades da especificação (decisão pendente da dupla)

Nenhuma regra foi inventada; os testes seguem o texto atual.

1. **Parâmetro `minas` com menos ou mais de 40 minas:** a seção 1 fixa 40, mas não diz o que acontece com outra quantidade. Por isso o TC-CM-31 sempre usa 40.
2. **Valor do cronômetro no instante do 1º clique:** a seção 1 diz "começa em 0 e soma 1 por segundo"; os testes leem 0 no clique e N depois de N s (TC-CM-10).
3. **Formato do cronômetro e do contador:** a seção 3 diz "número". Os testes usam número sem zeros à esquerda (`3`, não `003`).
4. **Contador com mais de 40 bandeiras (pode ficar negativo?):** não especificado. É área do Felipe; só registramos.
5. **Duplo clique ou clique do meio numa célula oculta:** não especificado.
6. **Primeiro clique seguro protege também as vizinhas?** A spec só garante a própria célula; os testes não assumem mais que isso (TC-CM-09 e 35 clicam `7-9` e não conferem as vizinhas).
7. **Prazo:** o desafios.md diz "22/11/2026 às 23:99", que não é um horário válido. Consideramos 23:59.
