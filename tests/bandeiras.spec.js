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
