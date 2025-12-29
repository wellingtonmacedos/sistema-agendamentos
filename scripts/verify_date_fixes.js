const { format, parseISO, parse, startOfToday, addDays } = require('date-fns');
const { ptBR } = require('date-fns/locale');

console.log("--- Teste de Lógica de Data (Chatbot) ---");
// Simular o problema do fuso horário UTC-3
// Se hoje for dia 31/10
const today = new Date('2023-10-31T00:00:00-03:00'); // Local time
console.log("Data Local:", today.toString());

// Lógica antiga (com erro)
const isoString = today.toISOString();
const splitDate = isoString.split('T')[0];
console.log("Lógica Antiga (toISOString):", isoString);
console.log("Lógica Antiga (split):", splitDate); 
// Se for 00:00 local, ISO é 03:00 do mesmo dia (se +3) ou 21:00 do dia anterior (se -3).
// No Brasil (UTC-3), 00:00 local = 03:00 UTC. Então dia 31 vira 31.
// Mas se o servidor estiver em UTC e o usuário em UTC-3...
// O problema descrito pelo usuário (dia 31 vira dia anterior) sugere que o 'today' estava sendo gerado como UTC ou a conversão estava subtraindo.
// Se eu tenho 2023-10-31 00:00 UTC, e converto para string, dá 2023-10-31.
// Mas se o usuário seleciona e o sistema faz `new Date("2023-10-31")` (UTC) e exibe em local (UTC-3), vira dia 30 as 21:00.

console.log("\n--- Simulação do Erro ---");
const dateStr = "2023-10-31"; // String enviada pelo botão
const dateObjErrado = new Date(dateStr); // UTC midnight
console.log("new Date('2023-10-31') (UTC):", dateObjErrado.toISOString());
console.log("Formatado localmente (pode ser dia 30):", format(dateObjErrado, 'dd/MM/yyyy'));

console.log("\n--- Lógica Nova (Correção) ---");
// Parse como local
const dateObjCerto = parse(dateStr, 'yyyy-MM-dd', new Date());
console.log("parse('2023-10-31', 'yyyy-MM-dd') (Local):", dateObjCerto.toString());
console.log("Formatado:", format(dateObjCerto, 'dd/MM/yyyy'));

console.log("\n--- Teste de Lógica de Horário (Admin) ---");
const app = {
    date: "2023-10-31T03:00:00.000Z",
    startTime: "2023-10-31T17:00:00.000Z" // 14:00 em UTC-3
};

console.log("App StartTime (ISO):", app.startTime);
const start = new Date(app.startTime);
console.log("Parsed Start (Local):", start.toString());
console.log("Formatado HH:mm:", format(start, 'HH:mm'));

const legacyApp = {
    date: "2023-10-31T03:00:00.000Z",
    startTime: "14:00"
};
console.log("Legacy StartTime:", legacyApp.startTime);
if (legacyApp.startTime.includes(':') && !legacyApp.startTime.includes('T')) {
    const combined = parseISO(`${legacyApp.date.split('T')[0]}T${legacyApp.startTime}`);
    console.log("Combined Parsed:", combined.toString());
    console.log("Formatado HH:mm:", format(combined, 'HH:mm'));
}
