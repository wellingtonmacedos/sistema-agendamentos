export const messageMap = {
    identifyFirst: {
        neutral: "Por favor, identifique-se primeiro para ver seus agendamentos.",
        feminine: "Preciso saber quem é você primeiro! Por favor, se identifique. ✨"
    },
    timeFound: {
        neutral: (date) => `Encontrei estes horários para ${date}:`,
        feminine: (date) => `Olha só os horários que encontrei para ${date}: 💖`
    },
    noSlots: {
        neutral: (date) => `Não há horários livres para ${date}. Por favor, escolha outra data.`,
        feminine: (date) => `Poxa, não temos mais horários livres para ${date}. Que tal escolher outro dia? 🗓️`
    },
    welcome: {
        neutral: "Olá! Vamos agendar seu horário?",
        feminine: "Oi! 💕 Que alegria te ver por aqui!"
    },
    welcomeBack: {
        neutral: (name) => `Olá novamente, **${name}**! Que bom te ver.`,
        feminine: (name) => `Oi **${name}**! 💕 Que saudade! Fico feliz em te ver de novo!`
    },
    askName: {
        neutral: "Como é a primeira vez, qual seu **Nome Completo**?",
        feminine: "Como é sua primeira vez aqui, me conta: qual seu **Nome Completo**? ✨"
    },
    askNameFallback: {
        neutral: "Obrigado. E qual é o seu **Nome Completo**?",
        feminine: "Obrigada! E qual é o seu **Nome Completo**? 🌷"
    },
    niceToMeetYou: {
        neutral: (name) => `Prazer, ${name}!`,
        feminine: (name) => `Prazer te conhecer, ${name}! 💖`
    },
    chooseService: {
        neutral: "Escolha o serviço desejado.",
        feminine: "Qual serviço você gostaria de agendar hoje? 💅✨"
    },
    chooseProfessional: {
        neutral: "Escolha o profissional.",
        feminine: "Com quem você gostaria de ser atendida? 👩‍🎨"
    },
    chooseDate: {
        neutral: "Escolha a data.",
        feminine: "Qual o melhor dia para você? 📅"
    },
    chooseTime: {
        neutral: "Escolha o horário.",
        feminine: "Qual horário fica melhor para você? ⏰"
    },
    confirmDetails: {
        neutral: "Confira os detalhes do agendamento:",
        feminine: "Dá uma olhadinha se está tudo certo com seu agendamento: ✨"
    },
    confirmButton: {
        neutral: "Confirmar Agendamento",
        feminine: "Confirmar meu Horário 💖"
    },
    success: {
        neutral: "Agendamento confirmado com sucesso!",
        feminine: "Oba! Seu horário está confirmadíssimo! 🎉"
    },
    myAppointmentsEmpty: {
        neutral: "Você não possui agendamentos ativos no momento.",
        feminine: "Você não tem nenhum agendamento ativo agora. Que tal marcar um? 💕"
    },
    myAppointmentsFound: {
        neutral: (count) => `Encontrei ${count} agendamento(s) ativo(s).`,
        feminine: (count) => `Achei ${count} horário(s) agendado(s) para você! ✨`
    },
    cancelConfirm: {
        neutral: "Tem certeza que deseja cancelar este agendamento?",
        feminine: "Tem certeza que quer cancelar? 😢"
    },
    cancelSuccess: {
        neutral: "Agendamento cancelado com sucesso.",
        feminine: "Tudo bem, agendamento cancelado. Quando quiser voltar, estarei aqui! 💖"
    },
    chooseSalon: {
        neutral: "Selecione o estabelecimento:",
        feminine: "Em qual de nossos espaços você gostaria de ser atendida? 🌸"
    },
    noSalons: {
        neutral: "Nenhum estabelecimento encontrado.",
        feminine: "Poxa, não encontrei nenhum estabelecimento disponível no momento. 😕"
    },
    welcomeInitial: {
        neutral: "Olá! Sou seu assistente de agendamentos. 🤖\n\nAntes de começarmos, por favor, me informe seu **número de celular** (com DDD).",
        feminine: "Oiii! Sou sua assistente virtual. 💖\n\nPara começarmos, me diz seu **número de celular** (com DDD)? ✨"
    },
    newAppointmentPrompt: {
        neutral: "Que tal realizar um novo agendamento? Confira as opções abaixo:",
        feminine: "Que tal aproveitarmos para marcar um horário novo? Dá uma olhada nas opções: 👇✨"
    },
    checkingSchedule: {
        neutral: "Consultando agenda...",
        feminine: "Só um momentinho, estou conferindo a agenda... 📅✨"
    },
    arrivalOrderWarning: {
        neutral: "Neste dia, o atendimento será realizado por ordem de chegada.",
        feminine: "Atençãozinha: nesse dia o atendimento é por ordem de chegada, tá bom? 💕"
    },
    chooseAnotherDate: {
        neutral: "Deseja agendar para outra data?",
        feminine: "Prefere escolher outro dia para garantir seu horário? 🗓️"
    },
    addToCalendar: {
        neutral: "Deseja adicionar à sua agenda? Escolha uma opção abaixo:",
        feminine: "Quer deixar salvo na sua agenda para não esquecer? Escolha abaixo: 📲"
    },
    noProfessionals: {
        neutral: "Não há profissionais disponíveis no momento.",
        feminine: "Poxa, não temos profissionais disponíveis agora. 😕"
    },
    noPreference: {
        neutral: "Sem preferência",
        feminine: "Tanto faz / Sem preferência ✨"
    },
    welcomeBackDevice: {
        neutral: (name) => `Olá novamente, **${name}**! 👋 (Reconhecido pelo seu dispositivo)`,
        feminine: (name) => `Oi de novo, **${name}**! 💕 (Te reconheci pelo dispositivo!)`
    }
};
