// Testes de fim de jogo: derrota (F3), vitória e nova partida (F4). Contrato: seções 1, 3 e 5 do PLANEJAMENTO.md.
import { abrirJogo, celula, cliqueDireito, screen, TODAS_AS_CELULAS, MINAS_PADRAO, LISTA_MINAS_PADRAO } from './helpers.js';

/**
 * Conta quantas das 252 células (TODAS_AS_CELULAS) estão em cada data-estado.
 * Estado desconhecido vira chave extra e quebra o toEqual. Célula ausente → TestingLibraryElementError (motivo certo).
 */
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

const contador = () => screen.getByTestId('contador-minas');
const mensagem = () => screen.getByTestId('mensagem');
const mensagemVazia = () => expect(mensagem().textContent.trim()).toBe('');

// TC-CM-17: derrota. Clicar na mina 1-10 explode essa mina e mostra as outras 39 minas.
// As 212 células sem mina continuam ocultas (a derrota só mostra as minas, não abre o resto).
test('TC-CM-17 derrota', async () => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await user.click(celula('1-10'));

  // Positivo: a mina clicada fica explodida.
  expect(celula('1-10')).toHaveAttribute('data-estado', 'explodida');

  // Positivo: a derrota é anunciada.
  expect(mensagem()).toHaveTextContent(/^Você perdeu!$/);

  // Positivo: 7-1 (sem mina) continua oculta.
  expect(celula('7-1')).toHaveAttribute('data-estado', 'oculta');

  // Positivo: as outras 39 minas são mostradas como 'mina', e são exatamente as de MINAS_PADRAO menos 1-10.
  expect(posicoesNoEstado('mina')).toEqual([...LISTA_MINAS_PADRAO].filter((p) => p !== '1-10').sort());

  // Positivo: 1 explodida, 39 minas mostradas, 212 ocultas (sem mina), nenhuma revelada ou bandeira.
  expect(contarEstados()).toEqual({
    oculta: 212,
    revelada: 0,
    bandeira: 0,
    mina: 39,
    explodida: 1,
    'bandeira-errada': 0,
  });

  // Positivo: sem bandeiras, o contador continua em 40.
  expect(contador()).toHaveTextContent(/^40$/);
});

// TC-CM-18: bandeira errada na derrota. 7-1 não tem mina, então a bandeira vira 'bandeira-errada'.
// 2-10 é mina e a bandeira continua nela. A mina clicada (1-10) explode e as outras minas aparecem.
// O contador-minas não é conferido aqui: a seção 5 não diz se a bandeira errada ainda conta.
test('TC-CM-18 bandeira errada na derrota', async () => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await cliqueDireito(user, celula('7-1'));
  await cliqueDireito(user, celula('2-10'));
  await user.click(celula('1-10'));

  // Positivo: a bandeira em 7-1 (sem mina) é marcada como errada.
  expect(celula('7-1')).toHaveAttribute('data-estado', 'bandeira-errada');

  // Positivo: a bandeira em 2-10 (mina) continua bandeira.
  expect(celula('2-10')).toHaveAttribute('data-estado', 'bandeira');

  // Positivo: a mina clicada fica explodida.
  expect(celula('1-10')).toHaveAttribute('data-estado', 'explodida');

  // Positivo: a derrota é anunciada.
  expect(mensagem()).toHaveTextContent(/^Você perdeu!$/);

  // Positivo: as minas mostradas são as de MINAS_PADRAO menos 1-10 (explodida) e menos 2-10 (bandeira).
  expect(posicoesNoEstado('mina')).toEqual([...LISTA_MINAS_PADRAO].filter((p) => p !== '1-10' && p !== '2-10').sort());

  // Positivo: 211 ocultas, 38 minas, 1 explodida, 1 bandeira e 1 bandeira errada.
  expect(contarEstados()).toEqual({
    oculta: 211,
    revelada: 0,
    bandeira: 1,
    mina: 38,
    explodida: 1,
    'bandeira-errada': 1,
  });
});

// TC-CM-19: depois da derrota, o tabuleiro fica bloqueado. A conferência intermediária prova que
// o jogo já terminou em derrota antes de tentar clicar de novo (senão o teste passaria sem o bloqueio ser testado).
test('TC-CM-19 tabuleiro bloqueado após derrota', async () => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await user.click(celula('1-10'));

  // Conferência intermediária: o jogo terminou em derrota.
  expect(mensagem()).toHaveTextContent(/^Você perdeu!$/);
  expect(celula('1-10')).toHaveAttribute('data-estado', 'explodida');

  // Depois da derrota, tenta revelar 7-1 e pôr bandeira em 7-2.
  await user.click(celula('7-1'));
  await cliqueDireito(user, celula('7-2'));

  // Positivo: 7-1 continua oculta (clique esquerdo bloqueado).
  expect(celula('7-1')).toHaveAttribute('data-estado', 'oculta');

  // Positivo: 7-2 continua oculta (clique direito bloqueado).
  expect(celula('7-2')).toHaveAttribute('data-estado', 'oculta');

  // Positivo: o contador continua em 40 (nenhuma bandeira posta).
  expect(contador()).toHaveTextContent(/^40$/);

  // Positivo: a mensagem continua a de derrota.
  expect(mensagem()).toHaveTextContent(/^Você perdeu!$/);

  // Positivo: o estado é o mesmo do TC-CM-17 (212 ocultas, 39 minas mostradas, 1 explodida).
  expect(contarEstados()).toEqual({
    oculta: 212,
    revelada: 0,
    bandeira: 0,
    mina: 39,
    explodida: 1,
    'bandeira-errada': 0,
  });
});

// TC-CM-20: vitória. Abrir 1-1 (126 células à esquerda) e 1-13 (86 à direita) dá 212 = todas as
// células sem mina. Aí o jogo termina em vitória e as 40 minas recebem bandeira (contador em 0).
test('TC-CM-20 vitória', async () => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await user.click(celula('1-1'));
  await user.click(celula('1-13'));

  // Positivo: a vitória é anunciada.
  expect(mensagem()).toHaveTextContent(/^Você venceu!$/);

  // Positivo: o contador vai a 0 (40 bandeiras − 40 minas).
  expect(contador()).toHaveTextContent(/^0$/);

  // Positivo: as 40 bandeiras são exatamente as minas de MINAS_PADRAO.
  expect(posicoesNoEstado('bandeira')).toEqual([...LISTA_MINAS_PADRAO].sort());

  // Positivo: 212 reveladas, 40 bandeiras, nenhuma oculta, mina, explodida ou bandeira errada.
  expect(contarEstados()).toEqual({
    oculta: 0,
    revelada: 212,
    bandeira: 40,
    mina: 0,
    explodida: 0,
    'bandeira-errada': 0,
  });
});

// TC-CM-21: depois da vitória, o tabuleiro fica bloqueado. A conferência intermediária prova que
// a vitória aconteceu antes de testar o bloqueio. 1-10 e 2-10 são minas já com bandeira; nada pode mudar nelas.
test('TC-CM-21 tabuleiro bloqueado após vitória', async () => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await user.click(celula('1-1'));
  await user.click(celula('1-13'));

  // Conferência intermediária: o jogo terminou em vitória e 1-10 está com bandeira.
  expect(mensagem()).toHaveTextContent(/^Você venceu!$/);
  expect(celula('1-10')).toHaveAttribute('data-estado', 'bandeira');

  // Depois da vitória, tenta tirar a bandeira de 1-10 e clicar com o esquerdo em 2-10.
  await cliqueDireito(user, celula('1-10'));
  await user.click(celula('2-10'));

  // Positivo: 1-10 continua com bandeira (clique direito bloqueado).
  expect(celula('1-10')).toHaveAttribute('data-estado', 'bandeira');

  // Positivo: 2-10 continua com bandeira (clique esquerdo bloqueado).
  expect(celula('2-10')).toHaveAttribute('data-estado', 'bandeira');

  // Positivo: o contador continua em 0.
  expect(contador()).toHaveTextContent(/^0$/);

  // Positivo: a mensagem continua a de vitória.
  expect(mensagem()).toHaveTextContent(/^Você venceu!$/);

  // Positivo: o estado é o mesmo do TC-CM-20 (212 reveladas, 40 bandeiras).
  expect(contarEstados()).toEqual({
    oculta: 0,
    revelada: 212,
    bandeira: 40,
    mina: 0,
    explodida: 0,
    'bandeira-errada': 0,
  });
});
