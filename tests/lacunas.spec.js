// Casos adicionais de lacunas de cobertura (tarefa A6). Contrato: seções 1, 3 e 5 do PLANEJAMENTO.md.
// Cada caso fecha uma lacuna achada na auditoria (mutante que a suíte anterior não pegava); ver docs/VALIDACAO-TESTES-HENRIQUE.md.
import { abrirJogo, celula, cliqueDireito, screen, TODAS_AS_CELULAS, MINAS_PADRAO, LISTA_MINAS_PADRAO } from './helpers.js';

afterEach(() => {
  jest.useRealTimers(); // restaura sempre, para não vazar para os outros specs
});

/** Conta as 252 células por data-estado. Estado desconhecido vira chave extra e quebra o toEqual. */
function contarEstados() {
  const contagem = { oculta: 0, revelada: 0, bandeira: 0, mina: 0, explodida: 0, 'bandeira-errada': 0 };
  for (const pos of TODAS_AS_CELULAS) {
    const estado = celula(pos).getAttribute('data-estado');
    contagem[estado] = (contagem[estado] ?? 0) + 1;
  }
  return contagem;
}

/** Posições `linha-coluna` (ordenadas) das células no data-estado indicado. */
const posicoesNoEstado = (estado) => TODAS_AS_CELULAS.filter((pos) => celula(pos).getAttribute('data-estado') === estado).sort();

/** Posições de todas as linhas nas colunas de..ate (ordenadas). */
const posicoesDasColunas = (de, ate) =>
  TODAS_AS_CELULAS.filter((p) => {
    const c = Number(p.split('-')[1]);
    return c >= de && c <= ate;
  }).sort();

const contador = () => screen.getByTestId('contador-minas');
const cronometro = () => screen.getByTestId('cronometro');
const mensagem = () => screen.getByTestId('mensagem');
const mensagemVazia = () => expect(mensagem().textContent.trim()).toBe('');
const esperar = (s) => jest.advanceTimersByTime(s * 1000);
const abrirComRelogio = () => {
  jest.useFakeTimers();
  return abrirJogo({ minas: MINAS_PADRAO }, { advanceTimers: jest.advanceTimersByTime });
};

// TC-CM-36: "Nova partida" volta o cronômetro a 0, para a contagem e deixa o 1º clique do jogo novo começar do zero.
test('TC-CM-36 nova partida zera, para e reinicia o cronômetro', async () => {
  const user = await abrirComRelogio();
  await user.click(celula('1-9'));
  esperar(5);

  // Conferência intermediária: o cronômetro estava rodando.
  expect(cronometro()).toHaveTextContent(/^5$/);

  await user.click(screen.getByTestId('btn-nova-partida'));

  // Positivo: o cronômetro volta a 0 e a partida nova começou (1-9 oculta de novo).
  expect(cronometro()).toHaveTextContent(/^0$/);
  expect(celula('1-9')).toHaveAttribute('data-estado', 'oculta');

  // Positivo: sem clique, o tempo não corre.
  esperar(3);
  expect(cronometro()).toHaveTextContent(/^0$/);

  // Positivo: no 1º clique do jogo novo o cronômetro recomeça do 0 e soma 1 por segundo.
  await user.click(celula('1-9'));
  expect(celula('1-9')).toHaveAttribute('data-estado', 'revelada');
  esperar(2);
  expect(cronometro()).toHaveTextContent(/^2$/);
});

// TC-CM-37: derrota por duplo clique. 1-9 é "2" com bandeira certa em 1-10 e errada em 1-8: o duplo clique revela 2-10 (mina).
// Só confere o que vale nas duas ordens de revelação (como o TC-CM-25).
test('TC-CM-37 cronômetro para na derrota por duplo clique', async () => {
  const user = await abrirComRelogio();
  await user.click(celula('1-9'));
  await cliqueDireito(user, celula('1-10'));
  await cliqueDireito(user, celula('1-8'));
  esperar(3);

  // Conferência intermediária: o cronômetro estava rodando e o jogo não terminou.
  expect(cronometro()).toHaveTextContent(/^3$/);
  mensagemVazia();

  await user.dblClick(celula('1-9'));

  // Positivo: o duplo clique causou a derrota.
  expect(celula('2-10')).toHaveAttribute('data-estado', 'explodida');
  expect(mensagem()).toHaveTextContent(/^Você perdeu!$/);

  // Positivo: o cronômetro parou no valor da derrota e continua parado.
  expect(cronometro()).toHaveTextContent(/^3$/);
  esperar(10);
  expect(cronometro()).toHaveTextContent(/^3$/);
});

// TC-CM-38: depois da derrota o tabuleiro fica bloqueado também para o duplo clique. 1-9 é "2" e tem as 2 bandeiras certas,
// que abririam 1-8, 2-8 e 2-9 se o jogo ainda aceitasse o duplo clique.
test('TC-CM-38 duplo clique bloqueado após a derrota', async () => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await user.click(celula('1-9'));
  await cliqueDireito(user, celula('1-10'));
  await cliqueDireito(user, celula('2-10'));
  await user.click(celula('3-10')); // mina sem bandeira: perde

  // Conferência intermediária: o jogo terminou em derrota e as vizinhas de 1-9 ainda estão ocultas.
  expect(mensagem()).toHaveTextContent(/^Você perdeu!$/);
  expect(celula('3-10')).toHaveAttribute('data-estado', 'explodida');
  expect(celula('1-8')).toHaveAttribute('data-estado', 'oculta');

  await user.dblClick(celula('1-9'));

  // Positivo: nada abriu.
  expect(celula('1-8')).toHaveAttribute('data-estado', 'oculta');
  expect(celula('2-8')).toHaveAttribute('data-estado', 'oculta');
  expect(celula('2-9')).toHaveAttribute('data-estado', 'oculta');

  // Positivo: o estado é o do instante da derrota (1 revelada, 2 bandeiras, 37 minas, 1 explodida, 211 ocultas).
  expect(contarEstados()).toEqual({
    oculta: 211,
    revelada: 1,
    bandeira: 2,
    mina: 37,
    explodida: 1,
    'bandeira-errada': 0,
  });
  expect(contador()).toHaveTextContent(/^38$/);
  expect(mensagem()).toHaveTextContent(/^Você perdeu!$/);
});

// TC-CM-39: a bandeira protege também uma célula SEM mina (o TC-CM-15 só cobre uma mina).
test('TC-CM-39 clique esquerdo numa bandeira sem mina', async () => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await cliqueDireito(user, celula('7-1'));
  await user.click(celula('7-1'));

  // Positivo: 7-1 continua com bandeira.
  expect(celula('7-1')).toHaveAttribute('data-estado', 'bandeira');

  // Positivo: o contador continua em 39.
  expect(contador()).toHaveTextContent(/^39$/);

  // Positivo: só a bandeira em 7-1; as outras 251 continuam ocultas.
  expect(contarEstados()).toEqual({
    oculta: 251,
    revelada: 0,
    bandeira: 1,
    mina: 0,
    explodida: 0,
    'bandeira-errada': 0,
  });

  // Positivo: o jogo não terminou.
  mensagemVazia();
});

// TC-CM-40: sem parâmetro (sorteio), o 1º clique nunca é mina. Muitas partidas por posição, para o falso passe de um jogo sem
// a proteção ser desprezível (o TC-CM-09 faz 10 partidas e deixa passar ~18% das vezes). Só confere propriedade, nunca posições de mina.
test.each([['7-9'], ['1-1'], ['14-18']])('TC-CM-40 primeiro clique seguro em 150 partidas: %s', async (pos) => {
  for (let jogo = 1; jogo <= 150; jogo++) {
    const user = await abrirJogo();
    await user.click(celula(pos));

    // Positivo: o 1º clique revela a célula (nunca explode).
    expect(celula(pos)).toHaveAttribute('data-estado', 'revelada');

    // Positivo: a derrota não é anunciada.
    expect(mensagem().textContent.trim()).not.toBe('Você perdeu!');
  }
}, 120_000);

// TC-CM-41: "Nova partida" depois da VITÓRIA volta ao começo e desbloqueia o tabuleiro, com as mesmas minas do parâmetro.
test('TC-CM-41 nova partida depois da vitória', async () => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await user.click(celula('1-1'));
  await user.click(celula('1-13'));

  // Conferência intermediária: o jogo terminou em vitória.
  expect(mensagem()).toHaveTextContent(/^Você venceu!$/);
  expect(contador()).toHaveTextContent(/^0$/);

  await user.click(screen.getByTestId('btn-nova-partida'));

  // Positivo: tudo volta ao começo.
  expect(contarEstados()).toEqual({
    oculta: 252,
    revelada: 0,
    bandeira: 0,
    mina: 0,
    explodida: 0,
    'bandeira-errada': 0,
  });
  expect(contador()).toHaveTextContent(/^40$/);
  expect(cronometro()).toHaveTextContent(/^0$/);
  mensagemVazia();

  // O tabuleiro está desbloqueado e as minas são as do parâmetro: 1-9 mostra "2".
  await user.click(celula('1-9'));
  expect(celula('1-9')).toHaveAttribute('data-estado', 'revelada');
  expect(celula('1-9')).toHaveTextContent(/^2$/);
  expect(contarEstados()).toEqual({
    oculta: 251,
    revelada: 1,
    bandeira: 0,
    mina: 0,
    explodida: 0,
    'bandeira-errada': 0,
  });
  mensagemVazia();
});

// TC-CM-42: o duplo clique vale para qualquer número, não só o "2" (TC-CM-23 a 29). 2-9 mostra "3" (1-10, 2-10 e 3-10 são minas).
test.each([
  [['1-10', '2-10', '3-10'], true],
  [['1-10', '2-10'], false],
])('TC-CM-42 duplo clique em número 3 com bandeiras %j abre: %s', async (bandeiras, abre) => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await user.click(celula('2-9'));
  for (const pos of bandeiras) await cliqueDireito(user, celula(pos));

  // Conferência intermediária: 2-9 revelada com "3" e as bandeiras postas.
  expect(celula('2-9')).toHaveTextContent(/^3$/);
  expect(contador()).toHaveTextContent(new RegExp(`^${40 - bandeiras.length}$`));

  await user.dblClick(celula('2-9'));

  // Positivo: 2-9 continua com "3" e as bandeiras continuam no lugar.
  expect(celula('2-9')).toHaveTextContent(/^3$/);
  for (const pos of bandeiras) expect(celula(pos)).toHaveAttribute('data-estado', 'bandeira');
  expect(contador()).toHaveTextContent(new RegExp(`^${40 - bandeiras.length}$`));
  mensagemVazia();

  if (abre) {
    // 3 bandeiras = número 3: abre as vizinhas; 1-8 é vazia e a cascata abre o lado esquerdo todo (126).
    expect(celula('1-8')).toHaveAttribute('data-estado', 'revelada');
    expect(contarEstados()).toEqual({
      oculta: 123,
      revelada: 126,
      bandeira: 3,
      mina: 0,
      explodida: 0,
      'bandeira-errada': 0,
    });
  } else {
    // 2 bandeiras ≠ número 3: não faz nada.
    expect(celula('1-8')).toHaveAttribute('data-estado', 'oculta');
    expect(contarEstados()).toEqual({
      oculta: 249,
      revelada: 1,
      bandeira: 2,
      mina: 0,
      explodida: 0,
      'bandeira-errada': 0,
    });
  }
});

// TC-CM-43: número em canto (3 vizinhas), na borda esquerda e na borda de baixo (5 vizinhas): 40 minas, sendo 32 de base
// (colunas 17 e 18 inteiras + coluna 16 das linhas 1–4), TODAS as vizinhas da célula clicada e o resto na coluna 16, longe dela.
const BASE_32 = [
  ...Array.from({ length: 14 }, (_, i) => `${i + 1}-17`),
  ...Array.from({ length: 14 }, (_, i) => `${i + 1}-18`),
  ...Array.from({ length: 4 }, (_, i) => `${i + 1}-16`),
];
const REPOR_NA_COLUNA_16 = Array.from({ length: 10 }, (_, i) => `${i + 5}-16`);
test.each([
  ['1-1', ['1-2', '2-1', '2-2']],
  ['14-1', ['13-1', '13-2', '14-2']],
  ['7-1', ['6-1', '6-2', '7-2', '8-1', '8-2']],
  ['14-9', ['13-8', '13-9', '13-10', '14-8', '14-10']],
])('TC-CM-43 número em canto ou borda: %s mostra o total das vizinhas', async (pos, vizinhas) => {
  const minas = [...BASE_32, ...vizinhas, ...REPOR_NA_COLUNA_16.slice(0, 8 - vizinhas.length)];
  // Sanidade do próprio cenário: erro aqui é erro do teste (o verificador acusa como "motivo errado"), não do jogo.
  if (new Set(minas).size !== 40) throw new Error(`cenário do TC-CM-43 com ${new Set(minas).size} minas, e não 40`);

  const user = await abrirJogo({ minas: minas.join(',') });
  await user.click(celula(pos));

  // Positivo: a célula fica revelada com o número de minas vizinhas.
  expect(celula(pos)).toHaveAttribute('data-estado', 'revelada');
  expect(celula(pos)).toHaveTextContent(new RegExp(`^${vizinhas.length}$`));

  // Positivo: só ela revelada; as outras 251 continuam ocultas.
  expect(contarEstados()).toEqual({ oculta: 251, revelada: 1, bandeira: 0, mina: 0, explodida: 0, 'bandeira-errada': 0 });
  mensagemVazia();
});

// TC-CM-44: a cascata não revela uma célula com bandeira mesmo quando ela tem NÚMERO (o TC-CM-26 usa uma célula vazia).
test('TC-CM-44 cascata não revela bandeira em célula com número', async () => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await cliqueDireito(user, celula('1-9')); // 1-9 não é mina e mostraria "2"
  await user.click(celula('1-1'));

  // Positivo: 1-9 continua com bandeira.
  expect(celula('1-9')).toHaveAttribute('data-estado', 'bandeira');

  // Positivo: o contador continua em 39.
  expect(contador()).toHaveTextContent(/^39$/);

  // Positivo: 125 reveladas (o lado esquerdo menos 1-9), 126 ocultas e 1 bandeira; a cascata seguiu pelas outras vizinhas.
  expect(contarEstados()).toEqual({
    oculta: 126,
    revelada: 125,
    bandeira: 1,
    mina: 0,
    explodida: 0,
    'bandeira-errada': 0,
  });
  expect(celula('1-8')).toHaveAttribute('data-estado', 'revelada');
  expect(celula('2-9')).toHaveTextContent(/^3$/);
  mensagemVazia();
});

// TC-CM-45: cascata do lado direito a partir de uma célula do meio e de outra linha (o TC-CM-08 parte de 1-13, na linha 1).
test('TC-CM-45 cascata do lado direito a partir de 7-13', async () => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await user.click(celula('7-13'));

  // Positivo: 86 reveladas e 166 ocultas; nenhuma mina revelada.
  const e = contarEstados();
  expect(e.revelada).toBe(86);
  expect(e.oculta).toBe(166);
  expect(e.mina + e.explodida).toBe(0);

  // Positivo: o conjunto revelado é exatamente as colunas 11 a 16, mais 13-17 e 14-17.
  expect(posicoesNoEstado('revelada')).toEqual([...posicoesDasColunas(11, 16), '13-17', '14-17'].sort());

  // Positivo: 7-13 é vazia; 1-10 e 1-17 (minas) e 1-9 (outro lado da parede) continuam ocultas.
  expect(celula('7-13').textContent.trim()).toBe('');
  expect(celula('1-10')).toHaveAttribute('data-estado', 'oculta');
  expect(celula('1-17')).toHaveAttribute('data-estado', 'oculta');
  expect(celula('1-9')).toHaveAttribute('data-estado', 'oculta');
  mensagemVazia();
});

// TC-CM-46: depois de "Nova partida" TODAS as 40 minas do parâmetro continuam valendo (o TC-CM-22 só confere 1-9 = "2", que
// depende de 2 minas). 7-10 é mina; a derrota mostra as 40 minas de MINAS_PADRAO.
test('TC-CM-46 nova partida mantém as 40 minas do parâmetro', async () => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await user.click(celula('1-1'));
  await user.click(screen.getByTestId('btn-nova-partida'));

  // Conferência intermediária: a partida nova começou do zero.
  expect(contarEstados().oculta).toBe(252);

  await user.click(celula('7-10'));

  // Positivo: 7-10 é mina e explode, como no primeiro jogo.
  expect(celula('7-10')).toHaveAttribute('data-estado', 'explodida');
  expect(mensagem()).toHaveTextContent(/^Você perdeu!$/);

  // Positivo: as minas mostradas são exatamente as 40 de MINAS_PADRAO.
  expect([...posicoesNoEstado('explodida'), ...posicoesNoEstado('mina')].sort()).toEqual([...LISTA_MINAS_PADRAO].sort());
  expect(contarEstados()).toEqual({
    oculta: 212,
    revelada: 0,
    bandeira: 0,
    mina: 39,
    explodida: 1,
    'bandeira-errada': 0,
  });
});
