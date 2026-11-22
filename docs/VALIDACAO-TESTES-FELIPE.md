# Validação dos testes do Felipe (TC-CM-13 a 30)

Num repositório "somente testes", falhar pelo motivo certo não prova que o teste está **certo**: um resultado esperado errado também falha. Esta validação prova os dois lados, sem colocar código do jogo no repositório. O método é o mesmo da [validação dos testes do Henrique](VALIDACAO-TESTES-HENRIQUE.md).

## Método

1. O repositório foi copiado para um diretório temporário **fora do clone**. Nada desse diretório foi commitado, e ele foi apagado no fim.
2. Lá, foi escrita uma **implementação de referência mínima** do jogo em `js/main.js`, seguindo só o PLANEJAMENTO.md (seções 1 e 3): parâmetro `minas`, `data-testid`, `data-estado`, bandeiras com clique direito, contador = 40 − bandeiras, cascata que não revela mina nem bandeira, duplo clique (abrir vizinhos), derrota, vitória, bloqueio do tabuleiro e nova partida. A implementação não é entregável e não está neste repositório.
3. Rodamos só `tests/bandeiras.spec.js`, `tests/fim-de-jogo.spec.js` e `tests/abrir-vizinhos.spec.js` contra ela. **Todos os 18 testes passaram** (18 TCs: 13 a 30).
4. **Mutação manual:** um defeito por vez na referência, ligado por uma chave. Cada mutante precisa ser "morto" por pelo menos um teste, ou seja, algum teste tem que falhar.
5. **Teste intermitente:** a suíte do Felipe rodou 3 vezes seguidas em cada variante da ordem do duplo clique.
6. Como verificação extra, os 24 testes do Henrique também passaram contra a mesma referência. Isso indica que ela segue a especificação inteira, e não só a parte do Felipe.

## Duas variantes da ordem do duplo clique

A seção 1 diz que o duplo clique "revela todas as vizinhas ocultas sem bandeira", mas não diz **em que ordem**. A ordem importa quando uma vizinha é mina e outra abre cascata, que é o caso do TC-CM-25: `2-8` é vazia e `2-10` é mina.

| Variante | Ordem das vizinhas | Resultado (3 rodadas) |
|---|---|---|
| A | Ordem de leitura (de cima para baixo, da esquerda para a direita): `2-8` abre a cascata antes de `2-10` explodir | 18/18 passaram, 3 de 3 |
| B | Ordem inversa: `2-10` explode primeiro e o tabuleiro bloqueia antes de `2-8` | 18/18 passaram, 3 de 3 |

Isso prova que nenhum teste depende da ordem. O TC-CM-25 só confere o que vale nas duas: `2-10` = `explodida`, `1-8` = `bandeira-errada`, `1-10` continua `bandeira`, as outras 38 minas = `mina`, "Você perdeu!", e `oculta` + `revelada` = 211. Ele **não** confere `2-8`, `2-9` nem o total de reveladas.

## Mutantes

| # | Defeito na referência | Morto por (ordem A) | Morto por (ordem B) |
|---|---|---|---|
| 1 | Clique direito não põe bandeira | 13, 14, 15, 18, 22, 23, 24, 25, 26, 27, 28, 29 | igual |
| 2 | Clique direito não tira bandeira | 14, 28 | igual |
| 3 | Contador não muda com bandeira | 13, 14, 15, 22, 23, 24, 26, 28, 29 | igual |
| 4 | Clique esquerdo revela célula com bandeira | 15 | igual |
| 5 | Aceita bandeira em célula revelada | 16 | igual |
| 6 | Derrota não mostra as outras minas | 17, 18, 19, 25 | igual |
| 7 | Derrota não marca a bandeira errada | 18, 25 | igual |
| 8 | Derrota troca a bandeira certa por `mina` | 18, 25 | igual |
| 9 | Derrota revela também as células sem mina | 17, 18, 19 | igual |
| 10 | Tabuleiro não bloqueia depois da derrota | 19 | igual |
| 11 | Vitória não põe bandeira nas minas | 20, 21, 27, 28 | igual |
| 12 | Vitória não zera o contador | 20, 21, 27, 28 | igual |
| 13 | Vitória declarada com 211 reveladas | 28 | igual |
| 14 | Tabuleiro não bloqueia depois da vitória | 21 | igual |
| 15 | Nova partida não limpa a mensagem | 30 | igual |
| 16 | Nova partida não volta o contador a 40 | 22 | igual |
| 17 | Nova partida troca as minas do parâmetro (sorteia outras) | 22, 30 (probabilístico, ver abaixo) | igual |
| 18 | Abrir vizinhos sem conferir as bandeiras (abre sempre) | 24, 29 | igual |
| 19 | Abrir vizinhos aceita bandeiras a mais (≥ em vez de =) | 29 | igual |
| 20 | Abrir vizinhos revela as células com bandeira | 23, 25, 27 | 23, 27 |
| 21 | Cascata revela célula com bandeira | 25, 26, 28 | 26, 28 |
| 22 | Abrir vizinhos não dispara a cascata | 23, 27 | igual |

**Resultado: 22 de 22 mutantes mortos, nas duas ordens.** Nenhum teste precisou ser reforçado.

- **Mutante 17 é morto por probabilidade.** Com minas sorteadas depois da nova partida, o teste só passaria se o sorteio repetisse exatamente o "2" em `1-9` sem abrir mais nada. Medido: **20 de 20 rodadas** mataram.
- **Mutantes 20 e 21 na ordem B:** o TC-CM-25 deixa de matá-los, porque `2-10` explode antes de a cascata chegar em `1-8`. Os dois continuam mortos por outros TCs. Por isso o TC-CM-26 (cascata não revela célula com bandeira) existe: sem ele, a regra que o TC-CM-25 assume ficaria coberta só numa das ordens.
- **Mutante 13 só é morto pelo TC-CM-28.** Ele é o único que para na fronteira 211 × 212; o TC-CM-20 chega a 212 de uma vez e não distingue os dois.

## O que a validação mudou

- **Regra nova na seção 1:** "A cascata nunca revela mina **nem célula com bandeira**". O TC-CM-25 já dependia dela: se a cascata aberta por `2-8` revelasse `1-8`, ele não chegaria ao fim como `bandeira-errada`. A seção 1 só dizia isso para o clique esquerdo. Virou o TC-CM-26.
- **Cinco casos adicionais (26 a 30)** para lacunas que nenhum TC cobria: cascata com bandeira (26), vitória pelo duplo clique (27), fronteira 211 × 212 (28), bandeiras a mais no duplo clique (29) e nova partida depois da derrota (30).
- **Contagens exatas** em todo TC com um `contarEstados()` local (as 252 células, todos os estados). Um estado desconhecido quebra o `toEqual`. Assim, uma implementação que revela demais, mostra minas demais ou não marca a bandeira errada é pega.
- **Conferência intermediária** antes de testar "nada muda" (TC-14, 19, 21, 22, 23, 27, 29, 30). Sem ela, o teste passaria com um jogo que ignora o clique.
- **TC-CM-18 e TC-CM-25 não conferem o `contador-minas`** (ver a ambiguidade 6).

## Ambiguidades da especificação (decisão pendente da dupla)

Nenhuma regra foi inventada além da regra da cascata, que já estava implícita no TC-CM-25. Os testes seguem o texto atual.

1. **Contador com mais de 40 bandeiras** (ambiguidade nº 4 do Henrique): a fórmula "40 − bandeiras" permite número negativo, e a spec não limita o número de bandeiras. Não testamos; só registramos.
2. **Ordem das vizinhas no duplo clique**, quando uma é mina e outra abre cascata (TC-CM-25): não especificada. Os testes valem para as duas ordens.
3. **A cascata respeita bandeiras?** Resolvido com a regra nova da seção 1 (TC-CM-26). Se a dupla preferir outra regra, o TC-CM-25 perde a base e precisa ser revisto.
4. **Duplo clique numa célula vazia revelada, ou numa célula oculta:** não especificado. Os testes só fazem duplo clique em `1-9` (número 2) já revelada.
5. **Na derrota, as minas com bandeira certa** continuam `bandeira` (assumido nos TC-CM-18 e 25, como diz a seção 3: `mina` = "as outras minas") ou viram `mina`? Hoje assumimos `bandeira`.
6. **Contador na derrota com bandeira errada:** no TC-CM-18 há duas bandeiras colocadas (`7-1`, errada, e `2-10`). Pela fórmula, o contador seria 38. Mas, se a bandeira errada deixar de contar ao virar `bandeira-errada`, seria 39. A seção 5 não pede o contador nesses TCs, e por isso os TCs 18 e 25 não o conferem.
