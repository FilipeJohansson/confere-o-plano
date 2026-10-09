import { describe, expect, it } from 'vitest';
import { textoCompartilhar } from './compartilhar';

describe('textoCompartilhar', () => {
  it('cita primeiro o plano mais próximo, com os dois percentuais', () => {
    expect(textoCompartilhar({ lula: 0.63, flavio: 0.55 })).toBe(
      'Fiz o Confere o Plano: minhas respostas ficaram mais próximas do plano de Lula (63%) do que do de Flávio Bolsonaro (55%). ' +
        'Cada resposta vem com o trecho e a página dos planos registrados no TSE. Com qual você concorda mais?',
    );
    expect(textoCompartilhar({ lula: 0.4, flavio: 0.8 })).toContain(
      'mais próximas do plano de Flávio Bolsonaro (80%) do que do de Lula (40%)',
    );
  });

  it('usa "praticamente empatadas" quando a diferença é menor que o limite de empate', () => {
    expect(textoCompartilhar({ lula: 0.6, flavio: 0.61 })).toContain(
      'praticamente empatadas entre os planos de Flávio Bolsonaro (61%) e de Lula (60%)',
    );
  });
});
