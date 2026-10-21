import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';

const options = new Set(process.argv.slice(2));
if ([...options].some(option => !['--model', '--config'].includes(option))) {
  console.error('Uso: npm run diagnose -- [--model] [--config]');
  process.exitCode = 2;
} else {
  try {
    try { loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url))); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (options.has('--model')) process.env.FOUNDRY_MODE = 'model';
    const { foundryConfiguration, requestFoundry } = await import('../foundry.js');
    console.log(`Modo: ${foundryConfiguration.mode}. Alvo: ${foundryConfiguration.target}.`);
    if (!foundryConfiguration.configured) {
      console.error(`Configuração incompleta: ${foundryConfiguration.missing.join('; ')}.`);
      console.error('Nenhuma chamada ao Azure foi feita. Complete o .env e reinicie o servidor.');
      process.exitCode = 2;
    } else if (options.has('--config')) {
      console.log('Campos necessários presentes. Autenticação e conexão ainda não foram testadas.');
    } else {
      console.log('Enviando uma mensagem curta de teste ao Azure. Esta chamada pode consumir a cota do recurso.');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);
      try {
        const started = Date.now();
        const reply = await requestFoundry([{ role: 'user', content: 'Responda apenas: conexão OK.' }], 'Responda de forma breve ao teste de conectividade.', controller.signal);
        console.log(`SUCESSO: resposta de texto recebida em ${((Date.now() - started) / 1000).toFixed(1)} s (${reply.length} caracteres).`);
        console.log(foundryConfiguration.mode === 'agent' ? 'Execução do agente confirmada.' : 'Modelo direto validado. Este resultado não valida o agente LUPES-TOUR:2.');
      } finally {
        clearTimeout(timeout);
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') console.error('FALHA: o serviço não respondeu em até 120 segundos.');
    else if (error.status) console.error(`FALHA: ${error.message}`);
    else if (error.cause?.code && /^[A-Z0-9_]+$/.test(error.cause.code)) console.error(`FALHA de rede: ${error.cause.code}. Verifique conexão, DNS, proxy e certificado.`);
    else console.error('FALHA: não foi possível carregar a configuração ou alcançar o serviço. Confira o formato dos endpoints e FOUNDRY_MODE no .env.');
    process.exitCode = 1;
  }
}
