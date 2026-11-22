# Matriz regra → casos de teste — Campo minado

Cada regra da seção 1 do PLANEJAMENTO.md tem pelo menos um caso de teste que obriga o jogo a cumpri-la.

| # | Regra (seção 1) | TCs |
|---|---|---|
| 1 | Tabuleiro 18 × 14 = 252 células, todas ocultas no início | 01 |
| 2 | 40 minas (sorteadas ou pelo parâmetro `minas`) | 02, 03, 35 |
| 3 | Revelar mostra o número de minas vizinhas (1 a 8) | 04, 05, 31, 43 |
| 4 | Clicar numa célula já revelada não muda nada | 06 |
| 5 | Célula vazia abre em cascata, que para nos números e nunca revela mina nem célula com bandeira | 07, 08, 23, 26, 32, 44, 45 |
| 6 | Primeiro clique seguro (só no sorteio) | 09, 03, 35, 40 |
| 7 | Cronômetro: começa no 1º clique, para no fim, máximo 999 | 10, 11, 12, 22, 33, 34, 36, 37 |
| 8 | Bandeira com clique direito; tirar com outro clique; contador = 40 − bandeiras | 13, 14, 22 |
| 9 | Bandeira protege a célula (do clique e da cascata); não pode em célula revelada | 15, 16, 26, 39, 44 |
| 10 | Derrota: explodida, minas mostradas, bandeiras erradas, mensagem | 17, 18, 25 |
| 11 | Tabuleiro bloqueado no fim (clique esquerdo, direito e duplo) | 19, 21, 38 |
| 12 | Vitória: 212 reveladas, minas com bandeira, contador 0, mensagem | 20, 27, 28 |
| 13 | Nova partida volta ao começo (no meio do jogo, depois da derrota e depois da vitória) | 22, 30, 36, 41, 46 |
| 14 | Abrir vizinhos (duplo clique): só com bandeiras = número (nem a menos, nem a mais); bandeira errada explode | 23, 24, 25, 27, 29, 37, 38, 42 |

**Para que serve:** se alguém fosse implementar o jogo só a partir destes testes, toda regra do jogo teria um teste exigindo que ela exista.
