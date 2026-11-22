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
