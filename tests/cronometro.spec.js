// Testes do cronômetro (tarefa A5). Contrato: seções 1, 3 e 5 do PLANEJAMENTO.md.
// Relógio falso só neste arquivo: o relógio falso moderno do Jest controla setTimeout/setInterval E Date,
// então estes testes valem para uma implementação por setInterval ou por Date.now().
import { abrirJogo, celula, cliqueDireito, screen, MINAS_PADRAO } from './helpers.js';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers(); // restaura sempre, para não vazar para os outros specs
});

// Parâmetro de URL `minas` (seção 3): MINAS_PADRAO = 40 minas fixas, inclusive no primeiro clique.
const abrir = () => abrirJogo({ minas: MINAS_PADRAO }, { advanceTimers: jest.advanceTimersByTime });
const esperar = (s) => jest.advanceTimersByTime(s * 1000);
const cronometro = () => screen.getByTestId('cronometro');

test('TC-CM-10 cronômetro começa no 1º clique', async () => {
  const user = await abrir();
  esperar(3);
  expect(cronometro()).toHaveTextContent(/^0$/); // sem clique, não conta
  await user.click(celula('1-9'));
  expect(cronometro()).toHaveTextContent(/^0$/); // no instante do clique ainda 0
  esperar(3);
  expect(cronometro()).toHaveTextContent(/^3$/);
  expect(celula('1-9')).toHaveAttribute('data-estado', 'revelada');
});

test('TC-CM-11 cronômetro para no fim', async () => {
  const user = await abrir();
  await user.click(celula('1-9'));
  esperar(5);
  expect(cronometro()).toHaveTextContent(/^5$/);
  await user.click(celula('1-10'));            // 1-10 é mina: perde
  expect(screen.getByTestId('mensagem')).toHaveTextContent(/^Você perdeu!$/);
  expect(cronometro()).toHaveTextContent(/^5$/);  // no momento da derrota
  esperar(10);
  expect(cronometro()).toHaveTextContent(/^5$/);  // parou
});

test('TC-CM-12 cronômetro não passa de 999', async () => {
  const user = await abrir();
  await user.click(celula('1-9'));
  esperar(1200);
  expect(cronometro()).toHaveTextContent(/^999$/);   // nem 1000, nem 1200
  expect(screen.getByTestId('mensagem').textContent.trim()).toBe('');  // o jogo continua
  expect(celula('1-9')).toHaveAttribute('data-estado', 'revelada');
});

test('TC-CM-33 cronômetro não começa com bandeira', async () => {
  const user = await abrir();
  await cliqueDireito(user, celula('7-1'));
  expect(celula('7-1')).toHaveAttribute('data-estado', 'bandeira');
  esperar(3);
  expect(celula('7-1')).toHaveAttribute('data-estado', 'bandeira'); // a bandeira continua lá
  expect(cronometro()).toHaveTextContent(/^0$/);   // bandeira não revela: não conta
  await user.click(celula('1-9'));
  esperar(2);
  expect(cronometro()).toHaveTextContent(/^2$/);
});

test('TC-CM-34 cronômetro para na vitória', async () => {
  const user = await abrir();
  await user.click(celula('1-1'));      // abre o lado esquerdo (126)
  esperar(4);
  await user.click(celula('1-13'));     // abre o lado direito (86): 212 = vitória
  expect(screen.getByTestId('mensagem')).toHaveTextContent(/^Você venceu!$/);
  expect(cronometro()).toHaveTextContent(/^4$/);  // no momento da vitória
  esperar(10);
  expect(cronometro()).toHaveTextContent(/^4$/);  // parou
});
