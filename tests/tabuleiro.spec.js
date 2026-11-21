import {
  abrirJogo,
  celula,
  screen,
  within,
  TODAS_AS_CELULAS,
  MINAS_PADRAO,
  LISTA_MINAS_PADRAO,
} from './helpers.js';

/**
 * Percorre as 252 posições (TODAS_AS_CELULAS) e conta quantas células têm cada data-estado.
 * Estados ausentes contam 0; qualquer outro valor aparece como chave extra (e falha o toEqual).
 * Se a célula não existir, celula() lança TestingLibraryElementError (falha pelo motivo certo).
 */
function contarEstados() {
  const contagem = {
    oculta: 0,
    revelada: 0,
    bandeira: 0,
    mina: 0,
    explodida: 0,
    'bandeira-errada': 0,
  };
  for (const pos of TODAS_AS_CELULAS) {
    const estado = celula(pos).getAttribute('data-estado');
    contagem[estado] = (contagem[estado] ?? 0) + 1;
  }
  return contagem;
}

/**
 * Posições `linha-coluna` (ordenadas) das células que têm o data-estado indicado.
 * Usado pelos TCs seguintes (ex.: listar as minas `explodida` + `mina`).
 */
function posicoesNoEstado(estado) {
  return TODAS_AS_CELULAS.filter((pos) => celula(pos).getAttribute('data-estado') === estado);
}

test('TC-CM-01 tabuleiro 18 × 14', async () => {
  await abrirJogo();

  // Positivo: 252 células, todas ocultas, sem bandeiras, minas nem explosões.
  expect(contarEstados()).toEqual({
    oculta: 252,
    revelada: 0,
    bandeira: 0,
    mina: 0,
    explodida: 0,
    'bandeira-errada': 0,
  });

  // Positivo: o tabuleiro contém exatamente 252 células.
  expect(within(screen.getByTestId('tabuleiro')).getAllByTestId(/^celula-/)).toHaveLength(252);

  // Positivo: contador de minas em 40 e cronômetro em 0.
  expect(screen.getByTestId('contador-minas')).toHaveTextContent(/^40$/);
  expect(screen.getByTestId('cronometro')).toHaveTextContent(/^0$/);

  // Negativo (depois do positivo): não existem células fora da grade 14 × 18.
  expect(screen.queryByTestId('celula-15-1')).toBeNull();
  expect(screen.queryByTestId('celula-1-19')).toBeNull();
  expect(screen.queryByTestId('celula-0-1')).toBeNull();
});

// TC-CM-02: sem parâmetros, o sorteio é aleatório. O teste só confere a propriedade
// do sorteio (40 minas, 1 explodida) e nunca confere posições.
test('TC-CM-02 sorteio tem 40 minas', async () => {
  const user = await abrirJogo();

  // Clica as células ocultas em ordem até perder, com limite de 252 cliques.
  let cliques = 0;
  let texto = '';
  for (const pos of TODAS_AS_CELULAS) {
    if (cliques >= 252) break;
    if (celula(pos).getAttribute('data-estado') !== 'oculta') continue;

    await user.click(celula(pos));
    cliques++;
    texto = screen.getByTestId('mensagem').textContent.trim();

    if (texto === 'Você perdeu!') break;
    // Com 40 minas seguindo a ordem não dá para vencer antes de perder.
    expect(texto).not.toBe('Você venceu!');
  }

  // Positivo: o jogo termina em derrota (também cobre "acabaram as células sem perder").
  expect(screen.getByTestId('mensagem')).toHaveTextContent(/^Você perdeu!$/);

  // Positivo: exatamente 40 minas (uma explodida + as outras mostradas).
  const e = contarEstados();
  expect(e.explodida).toBe(1);
  expect(e.explodida + e.mina).toBe(40);
}, 60_000);

// TC-CM-03: parâmetro `minas` fixa as 40 minas (MINAS_PADRAO), inclusive no primeiro clique.
test('TC-CM-03 parâmetro minas', async () => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await user.click(celula('1-10'));

  // Positivo: a mina clicada no primeiro clique fica explodida.
  expect(celula('1-10')).toHaveAttribute('data-estado', 'explodida');

  // Positivo: a derrota é anunciada.
  expect(screen.getByTestId('mensagem')).toHaveTextContent(/^Você perdeu!$/);

  // Positivo: as minas mostradas são exatamente as 40 de MINAS_PADRAO.
  const mostradas = [...posicoesNoEstado('explodida'), ...posicoesNoEstado('mina')].sort();
  expect(mostradas).toEqual([...LISTA_MINAS_PADRAO].sort());

  // Positivo: 1 explodida, 39 minas, 212 ocultas e nenhuma revelada.
  const e = contarEstados();
  expect(e.explodida).toBe(1);
  expect(e.mina).toBe(39);
  expect(e.oculta).toBe(212);
  expect(e.revelada).toBe(0);
});

// TC-CM-04: clicar numa célula com número revela só ela. 1-9 tem 2 minas vizinhas
// (1-10 e 2-10), por isso mostra "2" e não abre cascata.
test('TC-CM-04 revelar célula com número', async () => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await user.click(celula('1-9'));

  // Positivo: 1-9 fica revelada.
  expect(celula('1-9')).toHaveAttribute('data-estado', 'revelada');

  // Positivo: mostra o número de minas vizinhas (1-10 e 2-10 são minas).
  expect(celula('1-9')).toHaveTextContent(/^2$/);

  // Positivo: só a célula clicada foi revelada; as outras 251 continuam ocultas.
  expect(contarEstados()).toEqual({
    oculta: 251,
    revelada: 1,
    bandeira: 0,
    mina: 0,
    explodida: 0,
    'bandeira-errada': 0,
  });

  // Positivo: o jogo não terminou, então a mensagem continua vazia.
  expect(screen.getByTestId('mensagem').textContent.trim()).toBe('');

  // Positivo: nenhuma bandeira, contador de minas em 40.
  expect(screen.getByTestId('contador-minas')).toHaveTextContent(/^40$/);
});

// TC-CM-05: número de minas vizinhas. Os números vêm dos fatos de MINAS_PADRAO (seção 3):
// 13-16 = 1, 1-9 = 2, 7-9 = 3, 13-17 = 4. Cada caso é uma partida nova.
test.each([
  ['13-16', '1'],
  ['1-9', '2'],
  ['7-9', '3'],
  ['13-17', '4'],
])('TC-CM-05 número de minas vizinhas: %s mostra %s', async (pos, numero) => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await user.click(celula(pos));

  // Positivo: a célula clicada fica revelada.
  expect(celula(pos)).toHaveAttribute('data-estado', 'revelada');

  // Positivo: mostra o número de minas vizinhas.
  expect(celula(pos)).toHaveTextContent(new RegExp(`^${numero}$`));

  // Positivo: só a célula clicada foi revelada; as outras 251 continuam ocultas.
  expect(contarEstados()).toEqual({
    oculta: 251,
    revelada: 1,
    bandeira: 0,
    mina: 0,
    explodida: 0,
    'bandeira-errada': 0,
  });

  // Positivo: a única célula revelada é a clicada.
  expect(posicoesNoEstado('revelada')).toEqual([pos]);
});

// TC-CM-06: clicar de novo numa célula já revelada não muda nada. 1-9 mostra "2" (seção 3).
test('TC-CM-06 clicar de novo numa revelada', async () => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await user.click(celula('1-9'));
  await user.click(celula('1-9'));

  // Positivo: 1-9 continua revelada.
  expect(celula('1-9')).toHaveAttribute('data-estado', 'revelada');

  // Positivo: continua mostrando "2".
  expect(celula('1-9')).toHaveTextContent(/^2$/);

  // Positivo: só 1-9 revelada; as outras 251 continuam ocultas.
  expect(contarEstados()).toEqual({
    oculta: 251,
    revelada: 1,
    bandeira: 0,
    mina: 0,
    explodida: 0,
    'bandeira-errada': 0,
  });

  // Positivo: o jogo não terminou, então a mensagem continua vazia.
  expect(screen.getByTestId('mensagem').textContent.trim()).toBe('');
});

// TC-CM-31: base de 32 minas (colunas 17 e 18 inteiras + coluna 16 das linhas 1–4), longe de 2-2.
const BASE_32 = [
  ...Array.from({ length: 14 }, (_, i) => `${i + 1}-17`),
  ...Array.from({ length: 14 }, (_, i) => `${i + 1}-18`),
  ...Array.from({ length: 4 }, (_, i) => `${i + 1}-16`),
];
// As 8 vizinhas de 2-2. Para ter 7, 6 ou 5 minas em volta, tira-se 3-3, 3-2, 3-1 (nessa ordem)
// e põe-se 5-16, 6-16, 7-16 no lugar (longe de 2-2), mantendo sempre 40 minas.
const VIZINHAS_2_2 = ['1-1', '1-2', '1-3', '2-1', '2-3', '3-1', '3-2', '3-3'];
const TIRAR = ['3-3', '3-2', '3-1'];
const REPOR = ['5-16', '6-16', '7-16'];
const minasComVizinhas = (n) => {
  const k = 8 - n;
  return [...BASE_32, ...VIZINHAS_2_2.filter((p) => !TIRAR.slice(0, k).includes(p)), ...REPOR.slice(0, k)];
};

test.each([[8], [7], [6], [5]])('TC-CM-31 número de minas vizinhas de 5 a 8: 2-2 mostra %i', async (n) => {
  const minas = minasComVizinhas(n);
  // Sanidade do próprio cenário: erro aqui é erro do teste, não do jogo. Por isso é um Error comum
  // (o verificador acusa como "motivo errado"), e não um expect (que contaria como motivo certo).
  if (new Set(minas).size !== 40) throw new Error(`cenário do TC-CM-31 com ${new Set(minas).size} minas, e não 40`);

  const user = await abrirJogo({ minas: minas.join(',') });
  await user.click(celula('2-2'));

  // Positivo: 2-2 fica revelada com o número de minas vizinhas.
  expect(celula('2-2')).toHaveAttribute('data-estado', 'revelada');
  expect(celula('2-2')).toHaveTextContent(new RegExp(`^${n}$`));

  // Positivo: só 2-2 revelada; as outras 251 continuam ocultas.
  expect(contarEstados()).toEqual({ oculta: 251, revelada: 1, bandeira: 0, mina: 0, explodida: 0, 'bandeira-errada': 0 });

  // Positivo: o jogo não terminou, então a mensagem continua vazia.
  expect(screen.getByTestId('mensagem').textContent.trim()).toBe('');
});

// Posições `linha-coluna` (ordenadas) de todas as linhas nas colunas de..ate.
// Usado pelos TCs de cascata (TC-CM-07, 08 e 32).
const posicoesDasColunas = (de, ate) =>
  TODAS_AS_CELULAS.filter((p) => {
    const c = Number(p.split('-')[1]);
    return c >= de && c <= ate;
  }).sort();

// TC-CM-07: clicar 1-1 (vazia) abre em cascata todo o lado esquerdo (colunas 1–9 = 126 células).
// A coluna 10 é parede de minas, então fica toda oculta.
test('TC-CM-07 cascata', async () => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await user.click(celula('1-1'));

  // Positivo: 126 células reveladas e 126 ocultas; nenhuma mina, explodida, bandeira ou erro.
  const e = contarEstados();
  expect(e.revelada).toBe(126);
  expect(e.oculta).toBe(126);
  expect(e.mina + e.explodida + e.bandeira + e['bandeira-errada']).toBe(0);

  // Positivo: o conjunto revelado é exatamente as colunas 1 a 9.
  expect([...posicoesNoEstado('revelada')].sort()).toEqual(posicoesDasColunas(1, 9));

  // Positivo: 1-1 é vazia, então não mostra número.
  expect(celula('1-1').textContent.trim()).toBe('');

  // Positivo: 1-9 mostra "2" e 7-9 mostra "3" (números da cascata).
  expect(celula('1-9')).toHaveTextContent(/^2$/);
  expect(celula('7-9')).toHaveTextContent(/^3$/);

  // Positivo: a coluna 10 inteira e 1-11 continuam ocultas.
  for (let l = 1; l <= 14; l++) expect(celula(`${l}-10`)).toHaveAttribute('data-estado', 'oculta');
  expect(celula('1-11')).toHaveAttribute('data-estado', 'oculta');

  // Positivo: o jogo não terminou, então a mensagem continua vazia.
  expect(screen.getByTestId('mensagem').textContent.trim()).toBe('');
});

// TC-CM-08: clicar 1-13 (vazia) abre em cascata o lado direito (colunas 11–16, mais 13-17 e 14-17 = 86 células).
// A cascata para nos números e nunca revela mina: 1-10 e 1-17 (minas) continuam ocultas.
test('TC-CM-08 cascata para nos números e nunca revela mina', async () => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await user.click(celula('1-13'));

  // Positivo: 86 reveladas e 166 ocultas; a cascata nunca revela mina (nenhuma mina nem explodida).
  const e = contarEstados();
  expect(e.revelada).toBe(86);
  expect(e.oculta).toBe(166);
  expect(e.mina).toBe(0);
  expect(e.explodida).toBe(0);

  // Positivo: o conjunto revelado é exatamente as colunas 11 a 16, mais 13-17 e 14-17.
  expect([...posicoesNoEstado('revelada')].sort()).toEqual([...posicoesDasColunas(11, 16), '13-17', '14-17'].sort());

  // Positivo: os números da cascata (1-11 = 2, 1-16 = 2, 13-17 = 4, 14-17 = 2).
  expect(celula('1-11')).toHaveTextContent(/^2$/);
  expect(celula('1-16')).toHaveTextContent(/^2$/);
  expect(celula('13-17')).toHaveTextContent(/^4$/);
  expect(celula('14-17')).toHaveTextContent(/^2$/);

  // Positivo: as minas 1-10 e 1-17 continuam ocultas; 1-9 (outro lado da parede) também.
  expect(celula('1-10')).toHaveAttribute('data-estado', 'oculta');
  expect(celula('1-17')).toHaveAttribute('data-estado', 'oculta');
  expect(celula('1-9')).toHaveAttribute('data-estado', 'oculta');

  // Positivo: o jogo não terminou, então a mensagem continua vazia.
  expect(screen.getByTestId('mensagem').textContent.trim()).toBe('');
});

// TC-CM-09: sem parâmetro, o sorteio é aleatório. O teste só confere a propriedade
// "o 1º clique nunca é mina" e nunca confere posições. Cada jogo é aberto de novo (sorteio novo).
test('TC-CM-09 primeiro clique seguro', async () => {
  for (let jogo = 1; jogo <= 10; jogo++) {
    const user = await abrirJogo();
    await user.click(celula('7-9'));

    // Positivo: o primeiro clique revela 7-9 (nunca cai numa mina).
    expect(celula('7-9')).toHaveAttribute('data-estado', 'revelada');

    // Positivo: a derrota não é anunciada no primeiro clique.
    expect(screen.getByTestId('mensagem').textContent.trim()).not.toBe('Você perdeu!');

    // Positivo: nenhuma mina foi explodida.
    expect(contarEstados().explodida).toBe(0);
  }
}, 30_000);

// TC-CM-32 (caso adicional): o lado esquerdo de MINAS_PADRAO (colunas 1–9) é uma região só.
// De qualquer célula vazia dela a cascata abre as mesmas 126 células. 7-5 e 14-1 são pontos de partida diferentes.
test.each([['7-5'], ['14-1']])('TC-CM-32 cascata a partir de %s', async (pos) => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await user.click(celula(pos));

  // Positivo: as mesmas 126 células reveladas e 126 ocultas.
  const e = contarEstados();
  expect(e.revelada).toBe(126);
  expect(e.oculta).toBe(126);

  // Positivo: o conjunto revelado é exatamente as colunas 1 a 9.
  expect([...posicoesNoEstado('revelada')].sort()).toEqual(posicoesDasColunas(1, 9));

  // Positivo: a célula de partida é vazia, então não mostra número.
  expect(celula(pos).textContent.trim()).toBe('');

  // Positivo: 1-9 mostra "2" (número da cascata).
  expect(celula('1-9')).toHaveTextContent(/^2$/);

  // Positivo: a coluna 10 inteira continua oculta.
  for (let l = 1; l <= 14; l++) expect(celula(`${l}-10`)).toHaveAttribute('data-estado', 'oculta');

  // Positivo: o jogo não terminou, então a mensagem continua vazia.
  expect(screen.getByTestId('mensagem').textContent.trim()).toBe('');
});
