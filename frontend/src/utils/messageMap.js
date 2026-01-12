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
    },
    errorFetchingAppointments: {
        neutral: "Erro ao buscar seus agendamentos.",
        feminine: "Tive um probleminha ao buscar seus agendamentos. Tente de novo? 🥺"
    },
    errorCancellingAppointment: {
        neutral: "Erro ao cancelar agendamento.",
        feminine: "Não consegui cancelar agora. Pode tentar novamente? 🙏"
    },
    errorLoadingSalons: {
        neutral: "Erro ao carregar salões. Tente recarregar a página.",
        feminine: "Não consegui carregar os salões. Dá um refresh na página pra mim? 🔄✨"
    },
    errorLoadingServices: {
        neutral: "Erro ao carregar serviços.",
        feminine: "Ops, não consegui carregar os serviços. Tenta de novo? 💅"
    },
    errorLoadingProfessionals: {
        neutral: "Erro ao carregar profissionais.",
        feminine: "Não consegui carregar a lista de profissionais. 😢"
    },
    errorFetchingSlots: {
        neutral: "Erro ao buscar horários.",
        feminine: "Tive um erro ao buscar os horários. Vamos tentar outra data? 🗓️"
    },
    errorFinalizing: {
        neutral: "Ocorreu um erro ao finalizar. Tente novamente.",
        feminine: "Algo deu errado na hora de finalizar. Tenta mais uma vez? 🙏"
    },
    // New Additions
    yesChooseAnotherDate: {
        neutral: "Sim, escolher outra data",
        feminine: "Sim, quero ver outro dia! 🗓️"
    },
    noCancelService: {
        neutral: "Não, encerrar atendimento",
        feminine: "Não, deixa pra depois... ❌"
    },
    cancelAcknowledgement: {
        neutral: "Entendido. Agradecemos o contato!",
        feminine: "Entendido! Se precisar, estou por aqui. Beijos! 💖"
    },
    yes: {
        neutral: "Sim",
        feminine: "Sim! ✨"
    },
    no: {
        neutral: "Não",
        feminine: "Não"
    },
    calendarOptionPrompt: {
        neutral: "Escolha sua agenda:",
        feminine: "Onde você prefere salvar? 📲"
    },
    calendarCombinedPrompt: {
        neutral: "Combinado! Te esperamos lá. 😉",
        feminine: "Combinadíssimo! Mal posso esperar pra te ver! 😉✨"
    },
    newAppointment: {
        neutral: "Novo Agendamento",
        feminine: "Marcar Novo Horário 💅"
    },
    enableNotifications: {
        neutral: "Ativar Notificações",
        feminine: "Me avise do horário 🔔"
    },
    notificationHint: {
        neutral: "Receba lembretes automáticos",
        feminine: "Vou te lembrar pra você não esquecer! 💕"
    },
    scheduledStatus: {
        neutral: "Agendado",
        feminine: "Confirmadíssimo! ✅"
    },
    cancelButton: {
        neutral: "Cancelar Agendamento",
        feminine: "Cancelar este horário 🗑️"
    },
    backButton: {
        neutral: "Voltar",
        feminine: "Voltar ↩️"
    },
    loadingSalon: {
        neutral: "Aguarde, carregando informações do estabelecimento...",
        feminine: "Só um minutinho, estou preparando tudo... 🌸"
    },
    connectionError: {
        neutral: "Erro ao conectar com o servidor.",
        feminine: "Ops, minha conexão falhou. Tenta de novo? 🥺"
    },
    homeButton: {
        neutral: "Início",
        feminine: "Início 🏠"
    },
    myAppointmentsButton: {
        neutral: "Meus Agendamentos",
        feminine: "Meus Horários 💖"
    },
    myAppointmentsShort: {
        neutral: "Agenda",
        feminine: "Agenda 📅"
    },
    onlineStatus: {
        neutral: "Online agora",
        feminine: "Online pra você ✨"
    },
    summaryTitle: {
        neutral: "Resumo",
        feminine: "Resuminho do seu agendamento 📝"
    },
    summaryClient: {
        neutral: "Cliente:",
        feminine: "Para: 👤"
    },
    summaryPhone: {
        neutral: "Telefone:",
        feminine: "Celular: 📱"
    },
    summaryService: {
        neutral: "Serviço:",
        feminine: "Serviço escolhido: 💅"
    },
    summaryProfessional: {
        neutral: "Profissional:",
        feminine: "Com: 👩‍🎨"
    },
    summaryDate: {
        neutral: "Data:",
        feminine: "Quando: 🗓️"
    },
    summaryTotal: {
        neutral: "Total:",
        feminine: "Valor: 💰"
    },
    inputPhonePlaceholder: {
        neutral: "Digite seu celular...",
        feminine: "Seu celular com DDD... 📱"
    },
    inputNamePlaceholder: {
        neutral: "Digite seu nome...",
        feminine: "Seu nome lindo... ✨"
    },
    confirmCount: {
        neutral: (count) => `Confirmar (${count})`,
        feminine: (count) => `Confirmar (${count}) 💖`
    },
    swipeHint: {
        neutral: "Arraste para o lado para ver mais opções →",
        feminine: "Arraste para o ladinho para ver mais → ✨"
    },
    // Admin Preview Messages
    previewWelcome: {
        neutral: (name) => `Olá! Sou ${name}. Como posso ajudar você hoje?`,
        feminine: (name) => `Oiii! Sou ${name}. 💖 Como posso te ajudar hoje? ✨`
    },
    previewUserMessage: {
        neutral: "Gostaria de agendar um horário para corte de cabelo.",
        feminine: "Queria marcar um horário, por favor. 💅"
    },
    previewBotResponse: {
        neutral: "Claro! Para qual serviço seria?",
        feminine: "Claro, amore! Qual serviço você quer fazer? 💖"
    },
    previewService1: {
        neutral: "Corte de Cabelo",
        feminine: "Manicure 💅"
    },
    previewService2: {
        neutral: "Barba",
        feminine: "Pedicure ✨"
    },
    // Notification Alerts & Alt Text
    notificationIncompleteData: {
        neutral: "Erro: Dados incompletos para notificação. Tente recarregar.",
        feminine: "Ops! Faltou algum dado para a notificação. Tenta recarregar? 🥺"
    },
    notificationSuccess: {
        neutral: "Notificações ativadas com sucesso! Você será avisado sobre este agendamento.",
        feminine: "Prontinho! Notificações ativadas! Vou te avisar de tudo! 💖🔔"
    },
    notificationError: {
        neutral: "Não foi possível ativar as notificações. Verifique as permissões do navegador.",
        feminine: "Não consegui ativar as notificações. Confere as permissões do navegador? 🙏"
    },
    notificationNotSupported: {
        neutral: "Seu navegador não suporta notificações ou você está em modo anônimo.",
        feminine: "Seu navegador não aceita notificações ou você está no modo anônimo. 😢"
    },
    notificationErrorGeneric: {
        neutral: (error) => `Erro ao ativar notificações: ${error}. Tente recarregar a página.`,
        feminine: (error) => `Tive um erro ao ativar notificações: ${error}. Tenta recarregar? 🥺`
    },
    avatarAlt: {
        neutral: "Avatar",
        feminine: "Avatar ✨"
    },
    botAlt: {
        neutral: "Bot",
        feminine: "Assistente 🤖"
    },
    memeAlt: {
        neutral: "Meme",
        feminine: "Gif divertido ✨"
    }
};
