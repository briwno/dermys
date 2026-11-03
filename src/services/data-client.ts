import { supabase as remoto } from './supabase';
import { ConsultaDemo } from './apresentacao-query';
import { demoAtiva } from './apresentacao-store';

// A autenticação continua sendo a real. Apenas dados de negócio são locais quando
// o usuário ativa expressamente o modo apresentação. Nunca há fallback para a rede.
export const supabase = new Proxy(remoto, {
  get(target, prop) {
    if (prop === 'from') return (tabela: string) => demoAtiva() ? new ConsultaDemo(tabela) : target.from(tabela);
    if (demoAtiva() && ['rpc', 'storage', 'functions'].includes(String(prop))) {
      throw new Error('Operação externa indisponível na apresentação local.');
    }
    const valor = Reflect.get(target, prop, target);
    return typeof valor === 'function' ? valor.bind(target) : valor;
  },
});
