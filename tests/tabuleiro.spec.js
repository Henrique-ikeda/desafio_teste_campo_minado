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
