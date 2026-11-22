// Testes de bandeiras (tarefa F2). Contrato: seções 1, 3 e 5 do PLANEJAMENTO.md.
import { abrirJogo, celula, cliqueDireito, screen, TODAS_AS_CELULAS, MINAS_PADRAO } from './helpers.js';

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

const contador = () => screen.getByTestId('contador-minas');
const mensagemVazia = () => expect(screen.getByTestId('mensagem').textContent.trim()).toBe('');

// TC-CM-13: clique direito numa célula oculta põe bandeira (7-1 não é mina, fica "bandeira").
// Com MINAS_PADRAO, o contador passa de 40 para 39.
test('TC-CM-13 pôr bandeira', async () => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await cliqueDireito(user, celula('7-1'));

  // Positivo: 7-1 recebe bandeira.
  expect(celula('7-1')).toHaveAttribute('data-estado', 'bandeira');

  // Positivo: o contador de minas cai para 39 (40 − 1 bandeira).
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

  // Positivo: o jogo não terminou, então a mensagem continua vazia.
  mensagemVazia();
});

// TC-CM-14: clique direito numa bandeira tira a bandeira. A conferência intermediária prova que
// o 1º clique pôs a bandeira (senão o teste passaria com um jogo que ignora o clique direito).
test('TC-CM-14 tirar bandeira', async () => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await cliqueDireito(user, celula('7-1'));

  // Conferência intermediária: o 1º clique pôs a bandeira em 7-1 e o contador está em 39.
  expect(celula('7-1')).toHaveAttribute('data-estado', 'bandeira');
  expect(contador()).toHaveTextContent(/^39$/);

  // Segundo clique direito em 7-1 tira a bandeira.
  await cliqueDireito(user, celula('7-1'));

  // Positivo: 7-1 volta a ficar oculta.
  expect(celula('7-1')).toHaveAttribute('data-estado', 'oculta');

  // Positivo: o contador volta a 40.
  expect(contador()).toHaveTextContent(/^40$/);

  // Positivo: as 252 células estão ocultas, sem bandeiras.
  expect(contarEstados()).toEqual({
    oculta: 252,
    revelada: 0,
    bandeira: 0,
    mina: 0,
    explodida: 0,
    'bandeira-errada': 0,
  });

  // Positivo: o jogo não terminou, então a mensagem continua vazia.
  mensagemVazia();
});

// TC-CM-15: bandeira protege a célula. 1-10 é mina; com bandeira, o clique esquerdo não a revela
// nem explode. Por isso o jogo segue: mensagem vazia e a bandeira continua em 1-10.
test('TC-CM-15 bandeira protege a célula', async () => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await cliqueDireito(user, celula('1-10'));
  await user.click(celula('1-10'));

  // Positivo: 1-10 continua com bandeira (o clique esquerdo não a revelou).
  expect(celula('1-10')).toHaveAttribute('data-estado', 'bandeira');

  // Positivo: o contador continua em 39.
  expect(contador()).toHaveTextContent(/^39$/);

  // Positivo: só a bandeira em 1-10; nada revelado, nada explodido.
  expect(contarEstados()).toEqual({
    oculta: 251,
    revelada: 0,
    bandeira: 1,
    mina: 0,
    explodida: 0,
    'bandeira-errada': 0,
  });

  // Positivo: não houve derrota, então a mensagem continua vazia.
  mensagemVazia();
});

// TC-CM-16: célula revelada não recebe bandeira. 1-9 mostra "2" (as vizinhas 1-10 e 2-10 são minas),
// então clicar com o botão direito nela não muda nada.
test('TC-CM-16 sem bandeira em célula revelada', async () => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await user.click(celula('1-9'));
  await cliqueDireito(user, celula('1-9'));

  // Positivo: 1-9 continua revelada e mostrando "2".
  expect(celula('1-9')).toHaveAttribute('data-estado', 'revelada');
  expect(celula('1-9')).toHaveTextContent(/^2$/);

  // Positivo: o contador continua em 40 (nenhuma bandeira foi posta).
  expect(contador()).toHaveTextContent(/^40$/);

  // Positivo: só 1-9 revelada; as outras 251 continuam ocultas, sem bandeiras.
  expect(contarEstados()).toEqual({
    oculta: 251,
    revelada: 1,
    bandeira: 0,
    mina: 0,
    explodida: 0,
    'bandeira-errada': 0,
  });

  // Positivo: o jogo não terminou, então a mensagem continua vazia.
  mensagemVazia();
});

// TC-CM-26 (caso adicional): a cascata não revela célula com bandeira. 3-3 não tem mina e fica no meio
// do lado esquerdo, que é todo vazio/número. Pela seção 1, a bandeira continua lá e a cascata segue
// pelas outras vizinhas: sobram 125 reveladas do lado esquerdo (126 − 3-3).
test('TC-CM-26 cascata não revela célula com bandeira', async () => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await cliqueDireito(user, celula('3-3'));
  await user.click(celula('1-1'));

  // Positivo: 3-3 continua com bandeira (a cascata não a revelou).
  expect(celula('3-3')).toHaveAttribute('data-estado', 'bandeira');

  // Positivo: o contador continua em 39.
  expect(contador()).toHaveTextContent(/^39$/);

  // Positivo: 125 reveladas (o lado esquerdo menos 3-3), 126 ocultas (colunas 10 a 18) e 1 bandeira.
  expect(contarEstados()).toEqual({
    oculta: 126,
    revelada: 125,
    bandeira: 1,
    mina: 0,
    explodida: 0,
    'bandeira-errada': 0,
  });

  // Positivo: a cascata seguiu em volta da bandeira: 1-9 mostra "2" e 3-4 está revelada.
  expect(celula('1-9')).toHaveTextContent(/^2$/);
  expect(celula('3-4')).toHaveAttribute('data-estado', 'revelada');

  // Positivo: não houve derrota, então a mensagem continua vazia.
  mensagemVazia();
});
