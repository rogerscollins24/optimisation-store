import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { normalizeLanguageCode, translateBatch } from '../lib/translationApi';

export type LanguageCode = 'en' | 'fr' | 'es' | 'it' | 'pl' | 'ru' | 'de' | 'nl' | 'tr' | 'pt';

export const languageOptions = [
  { code: 'en', short: 'EN', flag: '🇬🇧', label: 'English' },
  { code: 'fr', short: 'FR', flag: '🇫🇷', label: 'Français' },
  { code: 'es', short: 'ES', flag: '🇪🇸', label: 'Español' },
  { code: 'it', short: 'IT', flag: '🇮🇹', label: 'Italiano' },
  { code: 'pl', short: 'PL', flag: '🇵🇱', label: 'Polski' },
  { code: 'ru', short: 'RU', flag: '🇷🇺', label: 'Русский' },
  { code: 'de', short: 'DE', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'nl', short: 'NL', flag: '🇳🇱', label: 'Nederlands' },
  { code: 'tr', short: 'TR', flag: '🇹🇷', label: 'Türkçe' },
  { code: 'pt', short: 'PT', flag: '🇵🇹', label: 'Português' },
] as const;

const STORAGE_KEY = 'shopping-optimized-language';
const LOCALE_AUTOFILL_STORAGE_PREFIX = 'locale-autofill-v1:';

const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    guest: 'Guest',
    welcomeBack: '👋 Welcome back, {{name}}!',
    menu: 'Menu',
    list: 'List',
    service: 'Service',
    event: 'Event',
    withdrawal: 'Withdrawal',
    deposit: 'Deposit',
    terms: 'T & C',
    certificate: 'Certificate',
    faqs: 'FAQs',
    vipLevels: 'VIP Levels',
    viewMore: 'View More',
    vipReceive: 'Receive a set of {{tasks}} product optimization data tasks.',
    vipEach: 'Profit for each product optimization is {{commission}}.',
    vipCombined: 'Combined product optimization profit is {{comboProfit}}.',
    vipActivate: 'Activate with {{amount}}.',
    vipDaily: 'Up to 3 sets of product optimization data tasks can be completed per day.',
    home: 'Home',
    starting: 'Starting',
    records: 'Records',
    loginTagline: 'A responsive optimization workspace for web and mobile.',
    signInContinue: 'Sign in to continue optimizing tasks and tracking records.',
    loginPrompt: 'Login to continue optimizing tasks',
    username: 'Username',
    password: 'Password',
    enterUsername: 'Enter username',
    enterPassword: 'Enter password',
    login: 'Login',
    signingIn: 'Signing in...',
    backToHome: 'Back to home',
    loading: 'Loading...',
    submit: 'Submit',
    supportChat: 'Support Chat',
    balanceIssueSubject: 'Balance issue',
    balanceIssueMessage: 'Hello Support, I need help with a pending task and insufficient balance. Required deposit: USDT {amount}. Please advise.',
    profile: 'Profile',
    myFinancial: 'My Financial',
    myDetails: 'My Details',
    otherSection: 'Other',
    personalInformation: 'Personal Information',
    bindWalletAddress: 'Bind Wallet Address',
    contactUs: 'Contact Us',
    logout: 'Logout',
    invitationCode: 'Invitation Code',
    wallet: 'Wallet',
    noEmailAddedYet: 'No email added yet',
    noPhoneAddedYet: 'No phone added yet',
    notBoundYet: 'Not bound yet',
    creditScore: 'Credit Score',
    totalBalance: 'Total Balance',
    commissionToday: 'Commission Today',
    remainingTasks: 'Remaining Tasks',
    all: 'All',
    pending: 'Pending',
    completed: 'Completed',
    noRecordsFound: 'No records found.',
    pendingDeposit: 'Pending Deposit',
    balanceNegativeContinue: 'Balance is negative. Deposit and submit this task to continue.',
    amountLabel: 'Amount',
    commissionLabel: 'Commission',
    taskCode: 'Task Code',
    resumeTask: 'Resume Task',
    history: 'History',
    accountAmount: 'Account Amount',
    depositAmount: 'Deposit Amount',
    enterDepositAmount: 'Enter deposit amount',
    submitDepositRequest: 'Submit Deposit Request',
    openingSupportChat: 'Opening support chat...',
    manualDepositFlow: 'Manual Deposit Flow',
    manualDepositFlowDesc: 'Submit the amount here and the app will open your support chat with a pre-filled deposit request.',
    contactCustomerService: 'Contact Customer Service',
    pleaseLoginAgain: 'Please log in again',
    pleaseEnterValidDepositAmount: 'Please enter a valid deposit amount',
    depositRequestSubject: 'Deposit Request',
    depositHistoryUnavailable: 'Deposit history is not available yet.',
    availableBalance: 'Available Balance',
    pleaseEnterValidAmount: 'Please enter a valid amount',
    insufficientBalance: 'Insufficient balance',
    pleaseEnterWithdrawalPassword: 'Please enter your withdrawal password',
    invalidWithdrawalPassword: 'Invalid withdrawal password',
    withdrawalRequestSubject: 'Withdrawal Request',
    withdrawalFailed: 'Withdrawal failed',
    withdrawalAmount: 'Withdrawal Amount',
    enterWithdrawalAmount: 'Enter withdrawal amount',
    withdrawalPassword: 'Withdrawal Password',
    submitAndOpenSupportChat: 'Submit and Open Support Chat',
    submitting: 'Submitting...',
    withdrawalRules: 'Withdrawal Rules',
    minimumWithdrawalAmount: 'Minimum withdrawal amount is 10 USDT.',
    withdrawalProcessingTime: 'Withdrawal processing time is 1-24 hours.',
    ensureWalletBound: 'Please ensure your wallet address is bound correctly.',
    notificationsTitle: 'Notifications',
    loadingNotifications: 'Loading notifications...',
    noActiveNotifications: 'No active notifications from admin right now.',
    recentlyPosted: 'Recently posted',
    usernameLabel: 'Username',
    email: 'Email',
    phone: 'Phone',
    gender: 'Gender',
    enterYourEmail: 'Enter your email',
    enterYourPhoneNumber: 'Enter your phone number',
    selectGender: 'Select gender',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    savePersonalInformation: 'Save Personal Information',
    unableToSavePersonalInformation: 'Unable to save personal information',
    saving: 'Saving...',
    exchangeNetwork: 'Exchange / Network',
    walletAddress: 'Wallet Address',
    pasteWalletAddress: 'Paste your wallet address',
    saveWalletDetails: 'Save Wallet Details',
    unableToBindWalletAddress: 'Unable to bind wallet address',
    startOptimization: 'Start Optimization',
    taskProgress: 'Task Progress',
    optimizing: 'Optimizing...',
    start: 'Start',
    waiting: 'Waiting',
    pendingTaskWarning: 'You have a pending task and cannot start a new one until it is submitted.',
    resumePendingTask: 'Resume Pending Task',
    pendingSection: 'Pending',
    activeLabel: 'active',
    noPendingTasks: 'No pending tasks right now.',
    depositFunds: 'Deposit Funds',
    taskSubmission: 'Task Submission',
    totalAmount: 'Total Amount',
    createdAt: 'Created At',
    insufficientBalanceDeposit: 'Insufficient balance. Please deposit to continue.',
    requiredDeposit: 'Required deposit',
    goToDeposit: 'Go to Deposit',
    contactSupportChat: 'Contact Support / Chat',
    support: 'Support',
    tickets: 'Tickets',
    newChat: 'New Chat',
    pleaseLoginToAccessSupport: 'Please login to access support.',
    noTicketsYet: 'No tickets yet. Start a new chat to contact support.',
    startNewChat: 'Start a new chat',
    writeIssueAndSupportWillReply: 'Write your issue and support will reply here.',
    liveSupport: 'Live Support',
    startSupportRequest: 'Start a support request',
    subject: 'Subject',
    describeYourIssue: 'Describe your issue',
    createTicket: 'Create Ticket',
    cancel: 'Cancel',
    needHelpFast: 'Need help fast?',
    supportTip: 'Tip: include your issue, recent action, and any balance or task details for a faster reply.',
    supportConversationHint: 'Open a ticket and keep the conversation in one place. Replies from support will appear in this chat panel automatically.',
    noMessagesYet: 'No messages yet. Send a message to start the conversation.',
    sendMessageToStart: 'Send a message to start the conversation.',
    enterYourMessage: 'Enter your message',
    send: 'Send',
    noTicketSelected: 'No ticket selected',
    chooseTicketOrStartChat: 'Choose a ticket on the left or start a new chat.',
    connected: 'Connected',
    reconnecting: 'Reconnecting...',
    completedAllTasks: 'You have completed all tasks for this set.',
    requestFailed: 'Request failed',
    taskFailed: 'Task failed',
    unableToStartTask: 'Unable to start task',
    submitFailed: 'Submit failed',
    unableToSubmitTask: 'Unable to submit task',
    ticketNumber: 'Ticket #{{id}}',
    newConversation: 'New conversation',
    defaultSupportGreeting: 'Hello, I need help.',
    statusOpen: 'Open',
    statusClosed: 'Closed',
    statusPending: 'Pending',
    statusResolved: 'Resolved',
    statusInProgress: 'In progress',
    statusPendingDebited: 'Pending debited',
    unableToCreateDepositRequest: 'Unable to create the deposit request',
    unableToLogin: 'Unable to login',
    brandName: 'Shopping Optimized',
    depositSupportMessage: 'Hello Support, I would like to make a deposit of {{amount}} USDT.\nUsername: {{username}}\nCurrent balance: {{balance}} USDT. Please share the payment steps.',
    withdrawSupportMessage: 'Hello Support, I submitted a withdrawal request for {{amount}} USDT.\nUsername: {{username}}\nExchange: {{exchange}}\nWallet: {{wallet}}. Please follow up if anything else is needed.',
    clientWithdrawalReason: 'client withdrawal',
    notSet: 'Not set',
    exchangePlaceholder: 'e.g. Binance, TRC20, ERC20',
    vipBadge: 'VIP {{level}}',
    notAvailable: 'N/A',
    avatarAlt: 'Avatar',
    productAlt: 'Product',
    faqP1: 'At the core of our philosophy is a strong commitment to you, our esteemed users. We understand that navigating a dynamic platform like ours can create questions and situations that standard FAQs cannot address. That is why our customer service team is always on standby, eager to provide you with personalised help and trusted insights.',
    faqP2: 'We do not just answer your questions, we provide solutions to ensure that your experience with us is seamless, enjoyable, and fulfilling. If you experience any challenge, please contact one of our customer service specialists, available from 10am to 10pm.',
    faqP3: 'Your satisfaction is not only our top priority, it is our passion. Allow us to guide you, support you, and celebrate every step of this remarkable journey with you.',
  },
  fr: {
    guest: 'Invité',
    welcomeBack: '👋 Bon retour, {{name}} !',
    menu: 'Menu',
    list: 'Liste',
    service: 'Service',
    event: 'Événement',
    withdrawal: 'Retrait',
    deposit: 'Dépôt',
    terms: 'C.G.U',
    certificate: 'Certificat',
    faqs: 'FAQs',
    vipLevels: 'Niveaux VIP',
    viewMore: 'Voir plus',
    vipReceive: 'Recevez un ensemble de {{tasks}} tâches d’optimisation de produits.',
    vipEach: 'Le profit pour chaque optimisation de produit est de {{commission}}.',
    vipCombined: 'Le profit combiné de l’optimisation est de {{comboProfit}}.',
    vipActivate: 'Activez avec {{amount}}.',
    vipDaily: 'Jusqu’à 3 ensembles de tâches peuvent être complétés par jour.',
    home: 'Accueil',
    starting: 'Démarrer',
    records: 'Historique',
    loginTagline: 'Un espace d’optimisation réactif pour le web et le mobile.',
    signInContinue: 'Connectez-vous pour continuer à optimiser et suivre vos tâches.',
    loginPrompt: 'Connectez-vous pour continuer',
    username: 'Nom d’utilisateur',
    password: 'Mot de passe',
    enterUsername: 'Entrez le nom d’utilisateur',
    enterPassword: 'Entrez le mot de passe',
    login: 'Connexion',
    signingIn: 'Connexion...',
    backToHome: 'Retour a l\'accueil',
    loading: 'Chargement...',
    submit: 'Soumettre',
    supportChat: 'Chat d\'assistance',
    balanceIssueSubject: 'Probleme de solde',
    balanceIssueMessage: 'Bonjour Support, j\'ai besoin d\'aide avec une tache en attente et un solde insuffisant. Depot requis : USDT {amount}. Merci de m\'indiquer la suite.',
    faqP1: 'Au cœur de notre philosophie se trouve un engagement fort envers vous, nos utilisateurs estimés. Nous savons qu’une plateforme dynamique comme la nôtre peut susciter des questions que les FAQ classiques ne couvrent pas. C’est pourquoi notre équipe d’assistance est toujours disponible pour vous accompagner.',
    faqP2: 'Nous ne répondons pas seulement à vos questions, nous vous apportons aussi des solutions pour rendre votre expérience simple, agréable et satisfaisante. En cas de difficulté, contactez l’un de nos spécialistes du service client, disponibles de 10h à 22h.',
    faqP3: 'Votre satisfaction n’est pas seulement notre priorité, c’est notre passion. Laissez-nous vous guider, vous soutenir et célébrer chaque étape de votre parcours.',
  },
  es: {
    guest: 'Invitado',
    welcomeBack: '👋 ¡Bienvenido de nuevo, {{name}}!',
    menu: 'Menú',
    list: 'Lista',
    service: 'Servicio',
    event: 'Evento',
    withdrawal: 'Retiro',
    deposit: 'Depósito',
    terms: 'Términos',
    certificate: 'Certificado',
    faqs: 'Preguntas frecuentes',
    vipLevels: 'Niveles VIP',
    viewMore: 'Ver más',
    vipReceive: 'Reciba un conjunto de {{tasks}} tareas de optimización de productos.',
    vipEach: 'La ganancia por cada optimización de producto es {{commission}}.',
    vipCombined: 'La ganancia combinada de optimización es {{comboProfit}}.',
    vipActivate: 'Activar con {{amount}}.',
    vipDaily: 'Se pueden completar hasta 3 conjuntos de tareas por día.',
    home: 'Inicio',
    starting: 'Empezar',
    records: 'Registros',
    loginTagline: 'Un espacio de optimización adaptable para web y móvil.',
    signInContinue: 'Inicia sesión para seguir optimizando y revisando registros.',
    loginPrompt: 'Inicia sesión para continuar',
    username: 'Usuario',
    password: 'Contraseña',
    enterUsername: 'Ingrese el usuario',
    enterPassword: 'Ingrese la contraseña',
    login: 'Entrar',
    signingIn: 'Entrando...',
    backToHome: 'Volver al inicio',
    loading: 'Cargando...',
    submit: 'Enviar',
    supportChat: 'Chat de soporte',
    balanceIssueSubject: 'Problema de saldo',
    balanceIssueMessage: 'Hola Soporte, necesito ayuda con una tarea pendiente y saldo insuficiente. Deposito requerido: USDT {amount}. Por favor indiquenme como continuar.',
    faqP1: 'En el centro de nuestra filosofía existe un fuerte compromiso con usted, nuestro estimado usuario. Sabemos que una plataforma dinámica como la nuestra puede generar preguntas que las FAQ estándar no siempre resuelven. Por eso, nuestro equipo de atención al cliente siempre está disponible para ayudarle.',
    faqP2: 'No solo respondemos preguntas, también ofrecemos soluciones para que su experiencia sea fluida, agradable y satisfactoria. Si tiene alguna dificultad, contacte con uno de nuestros especialistas, disponibles de 10:00 a 22:00.',
    faqP3: 'Su satisfacción no es solo nuestra prioridad, es nuestra pasión. Permítanos guiarle, apoyarle y celebrar cada paso de este recorrido con usted.',
  },
  it: {
    guest: 'Ospite',
    welcomeBack: '👋 Bentornato, {{name}}!',
    menu: 'Menu',
    list: 'Elenco',
    service: 'Servizio',
    event: 'Evento',
    withdrawal: 'Prelievo',
    deposit: 'Deposito',
    terms: 'Termini',
    certificate: 'Certificato',
    faqs: 'FAQ',
    vipLevels: 'Livelli VIP',
    viewMore: 'Vedi altro',
    vipReceive: 'Ricevi un set di {{tasks}} attività di ottimizzazione prodotti.',
    vipEach: 'Il profitto per ogni ottimizzazione prodotto è {{commission}}.',
    vipCombined: 'Il profitto combinato è {{comboProfit}}.',
    vipActivate: 'Attiva con {{amount}}.',
    vipDaily: 'Fino a 3 set di attività possono essere completati ogni giorno.',
    home: 'Home',
    starting: 'Avvio',
    records: 'Record',
    loginTagline: 'Uno spazio di ottimizzazione reattivo per web e mobile.',
    signInContinue: 'Accedi per continuare a ottimizzare e monitorare i record.',
    loginPrompt: 'Accedi per continuare',
    username: 'Nome utente',
    password: 'Password',
    enterUsername: 'Inserisci il nome utente',
    enterPassword: 'Inserisci la password',
    login: 'Accedi',
    signingIn: 'Accesso in corso...',
    backToHome: 'Torna alla home',
    loading: 'Caricamento...',
    submit: 'Invia',
    supportChat: 'Chat di supporto',
    balanceIssueSubject: 'Problema di saldo',
    balanceIssueMessage: 'Ciao Supporto, ho bisogno di aiuto con un\'attivita in sospeso e saldo insufficiente. Deposito richiesto: USDT {amount}. Per favore indicatemi come procedere.',
    faqP1: 'Al centro della nostra filosofia c’è un forte impegno verso di voi, i nostri stimati utenti. Sappiamo che una piattaforma dinamica come la nostra può generare domande che le FAQ standard non sempre coprono. Per questo il nostro team di assistenza è sempre pronto ad aiutarti.',
    faqP2: 'Non ci limitiamo a rispondere alle tue domande, ma forniamo soluzioni per rendere la tua esperienza semplice, piacevole e soddisfacente. Se incontri un problema, contatta uno dei nostri specialisti disponibili dalle 10 alle 22.',
    faqP3: 'La tua soddisfazione non è solo la nostra priorità, è la nostra passione. Lascia che ti guidiamo, ti supportiamo e celebriamo ogni passo del tuo percorso.',
  },
  pl: {
    guest: 'Gość',
    welcomeBack: '👋 Witaj ponownie, {{name}}!',
    menu: 'Menu',
    list: 'Lista',
    service: 'Serwis',
    event: 'Wydarzenie',
    withdrawal: 'Wypłata',
    deposit: 'Wpłata',
    terms: 'Regulamin',
    certificate: 'Certyfikat',
    faqs: 'FAQ',
    vipLevels: 'Poziomy VIP',
    viewMore: 'Zobacz więcej',
    vipReceive: 'Otrzymaj zestaw {{tasks}} zadań optymalizacji produktów.',
    vipEach: 'Zysk z każdej optymalizacji produktu wynosi {{commission}}.',
    vipCombined: 'Łączny zysk z optymalizacji wynosi {{comboProfit}}.',
    vipActivate: 'Aktywuj za {{amount}}.',
    vipDaily: 'Można ukończyć do 3 zestawów zadań dziennie.',
    home: 'Główna',
    starting: 'Start',
    records: 'Rekordy',
    loginTagline: 'Responsywna przestrzeń optymalizacji dla web i mobile.',
    signInContinue: 'Zaloguj się, aby kontynuować optymalizację i śledzenie wyników.',
    loginPrompt: 'Zaloguj się, aby kontynuować',
    username: 'Nazwa użytkownika',
    password: 'Hasło',
    enterUsername: 'Wpisz nazwę użytkownika',
    enterPassword: 'Wpisz hasło',
    login: 'Zaloguj się',
    signingIn: 'Logowanie...',
    backToHome: 'Powrot do strony glownej',
    loading: 'Ladowanie...',
    submit: 'Wyslij',
    supportChat: 'Czat wsparcia',
    balanceIssueSubject: 'Problem z saldem',
    balanceIssueMessage: 'Witaj Pomoc, potrzebuje pomocy z oczekujacym zadaniem i niewystarczajacym saldem. Wymagany depozyt: USDT {amount}. Prosze o dalsze wskazowki.',
    faqP1: 'W centrum naszej filozofii znajduje się silne zaangażowanie wobec naszych użytkowników. Rozumiemy, że dynamiczna platforma taka jak nasza może rodzić pytania, których standardowe FAQ nie obejmują. Dlatego nasz zespół obsługi klienta jest zawsze gotowy do pomocy.',
    faqP2: 'Nie tylko odpowiadamy na pytania, ale także dostarczamy rozwiązania, aby Twoje doświadczenie było płynne i satysfakcjonujące. Jeśli napotkasz problem, skontaktuj się z jednym z naszych specjalistów dostępnych od 10:00 do 22:00.',
    faqP3: 'Twoja satysfakcja jest nie tylko naszym priorytetem, ale także naszą pasją. Pozwól nam Cię prowadzić i wspierać na każdym etapie tej podróży.',
  },
  ru: {
    guest: 'Гость',
    welcomeBack: '👋 С возвращением, {{name}}!',
    menu: 'Меню',
    list: 'Список',
    service: 'Сервис',
    event: 'Событие',
    withdrawal: 'Вывод',
    deposit: 'Депозит',
    terms: 'Условия',
    certificate: 'Сертификат',
    faqs: 'FAQ',
    vipLevels: 'VIP уровни',
    viewMore: 'Подробнее',
    vipReceive: 'Получите набор из {{tasks}} задач по оптимизации товаров.',
    vipEach: 'Прибыль за каждую оптимизацию товара составляет {{commission}}.',
    vipCombined: 'Совокупная прибыль составляет {{comboProfit}}.',
    vipActivate: 'Активировать за {{amount}}.',
    vipDaily: 'До 3 наборов задач можно выполнять ежедневно.',
    home: 'Главная',
    starting: 'Старт',
    records: 'Записи',
    loginTagline: 'Адаптивная платформа оптимизации для веба и мобильных устройств.',
    signInContinue: 'Войдите, чтобы продолжить оптимизацию и отслеживание записей.',
    loginPrompt: 'Войдите, чтобы продолжить',
    username: 'Имя пользователя',
    password: 'Пароль',
    enterUsername: 'Введите имя пользователя',
    enterPassword: 'Введите пароль',
    login: 'Войти',
    signingIn: 'Вход...',
    backToHome: 'Назад на главную',
    loading: 'Загрузка...',
    submit: 'Отправить',
    supportChat: 'Чат поддержки',
    balanceIssueSubject: 'Проблема с балансом',
    balanceIssueMessage: 'Здравствуйте, поддержка. Мне нужна помощь: есть ожидающая задача и недостаточный баланс. Требуемый депозит: USDT {amount}. Подскажите, пожалуйста, что делать дальше.',
    faqP1: 'В основе нашей философии лежит сильная приверженность вам, нашим уважаемым пользователям. Мы понимаем, что динамичная платформа, подобная нашей, может вызывать вопросы, на которые не всегда отвечают стандартные FAQ. Поэтому наша служба поддержки всегда готова помочь.',
    faqP2: 'Мы не просто отвечаем на вопросы, мы предлагаем решения, чтобы ваш опыт был удобным и приятным. Если у вас возникли трудности, свяжитесь с нашими специалистами службы поддержки, доступными с 10:00 до 22:00.',
    faqP3: 'Ваше удовлетворение — не только наш приоритет, но и наша страсть. Позвольте нам сопровождать и поддерживать вас на каждом этапе этого пути.',
  },
  de: {
    guest: 'Gast',
    welcomeBack: '👋 Willkommen zurück, {{name}}!',
    menu: 'Menü',
    list: 'Liste',
    service: 'Service',
    event: 'Ereignis',
    withdrawal: 'Auszahlung',
    deposit: 'Einzahlung',
    terms: 'AGB',
    certificate: 'Zertifikat',
    faqs: 'FAQ',
    vipLevels: 'VIP-Stufen',
    viewMore: 'Mehr sehen',
    vipReceive: 'Erhalten Sie ein Set mit {{tasks}} Produktoptimierungsaufgaben.',
    vipEach: 'Der Gewinn pro Produktoptimierung beträgt {{commission}}.',
    vipCombined: 'Der kombinierte Optimierungsgewinn beträgt {{comboProfit}}.',
    vipActivate: 'Aktivieren mit {{amount}}.',
    vipDaily: 'Bis zu 3 Aufgabensets können pro Tag abgeschlossen werden.',
    home: 'Start',
    starting: 'Starten',
    records: 'Verlauf',
    loginTagline: 'Ein responsiver Optimierungsbereich für Web und Mobilgeräte.',
    signInContinue: 'Melden Sie sich an, um Aufgaben weiter zu optimieren und zu verfolgen.',
    loginPrompt: 'Anmelden, um fortzufahren',
    username: 'Benutzername',
    password: 'Passwort',
    enterUsername: 'Benutzernamen eingeben',
    enterPassword: 'Passwort eingeben',
    login: 'Anmelden',
    signingIn: 'Anmeldung läuft...',
    backToHome: 'Zuruck zur Startseite',
    loading: 'Wird geladen...',
    submit: 'Senden',
    supportChat: 'Support-Chat',
    balanceIssueSubject: 'Kontostandproblem',
    balanceIssueMessage: 'Hallo Support, ich brauche Hilfe bei einer ausstehenden Aufgabe und unzureichendem Guthaben. Erforderliche Einzahlung: USDT {amount}. Bitte teilen Sie mir die nachsten Schritte mit.',
    faqP1: 'Im Mittelpunkt unserer Philosophie steht ein starkes Engagement für Sie, unsere geschätzten Nutzer. Wir wissen, dass eine dynamische Plattform wie unsere Fragen aufwerfen kann, die Standard-FAQ nicht immer beantworten. Deshalb steht unser Kundendienstteam jederzeit bereit.',
    faqP2: 'Wir beantworten nicht nur Fragen, sondern bieten auch Lösungen, damit Ihre Erfahrung reibungslos und angenehm bleibt. Wenn Sie ein Problem haben, wenden Sie sich bitte an einen unserer Kundendienstspezialisten, die von 10 bis 22 Uhr erreichbar sind.',
    faqP3: 'Ihre Zufriedenheit ist nicht nur unsere Priorität, sondern unsere Leidenschaft. Lassen Sie uns Sie begleiten, unterstützen und jeden Schritt Ihrer Reise mit Ihnen feiern.',
  },
  nl: {
    guest: 'Gast',
    welcomeBack: '👋 Welkom terug, {{name}}!',
    menu: 'Menu',
    list: 'Lijst',
    service: 'Service',
    event: 'Evenement',
    withdrawal: 'Opname',
    deposit: 'Storting',
    terms: 'Voorwaarden',
    certificate: 'Certificaat',
    faqs: 'FAQ',
    vipLevels: 'VIP-niveaus',
    viewMore: 'Meer bekijken',
    vipReceive: 'Ontvang een set van {{tasks}} productoptimalisatietaken.',
    vipEach: 'De winst per productoptimalisatie is {{commission}}.',
    vipCombined: 'De gecombineerde winst is {{comboProfit}}.',
    vipActivate: 'Activeer met {{amount}}.',
    vipDaily: 'Er kunnen dagelijks maximaal 3 sets worden voltooid.',
    home: 'Home',
    starting: 'Start',
    records: 'Records',
    loginTagline: 'Een responsieve optimalisatiewerkruimte voor web en mobiel.',
    signInContinue: 'Meld u aan om taken te blijven optimaliseren en volgen.',
    loginPrompt: 'Log in om door te gaan',
    username: 'Gebruikersnaam',
    password: 'Wachtwoord',
    enterUsername: 'Voer gebruikersnaam in',
    enterPassword: 'Voer wachtwoord in',
    login: 'Inloggen',
    signingIn: 'Bezig met inloggen...',
    backToHome: 'Terug naar home',
    loading: 'Laden...',
    submit: 'Verzenden',
    supportChat: 'Supportchat',
    balanceIssueSubject: 'Saldo probleem',
    balanceIssueMessage: 'Hallo Support, ik heb hulp nodig met een openstaande taak en onvoldoende saldo. Vereiste storting: USDT {amount}. Laat me weten wat de volgende stappen zijn.',
    faqP1: 'De kern van onze filosofie is een sterke toewijding aan u, onze gewaardeerde gebruikers. We begrijpen dat een dynamisch platform zoals het onze vragen kan oproepen die standaard FAQ’s niet altijd beantwoorden. Daarom staat ons klantenserviceteam altijd klaar om te helpen.',
    faqP2: 'We beantwoorden niet alleen vragen, maar bieden ook oplossingen zodat uw ervaring soepel en plezierig blijft. Als u een uitdaging ervaart, neem dan contact op met een van onze specialisten, beschikbaar van 10.00 tot 22.00 uur.',
    faqP3: 'Uw tevredenheid is niet alleen onze topprioriteit, maar ook onze passie. Laat ons u begeleiden, ondersteunen en elke stap van uw reis met u vieren.',
  },
  tr: {
    guest: 'Misafir',
    welcomeBack: '👋 Tekrar hoş geldin, {{name}}!',
    menu: 'Menü',
    list: 'Liste',
    service: 'Servis',
    event: 'Etkinlik',
    withdrawal: 'Çekim',
    deposit: 'Yatırma',
    terms: 'Şartlar',
    certificate: 'Sertifika',
    faqs: 'SSS',
    vipLevels: 'VIP Seviyeleri',
    viewMore: 'Daha fazla',
    vipReceive: '{{tasks}} ürün optimizasyon görevi içeren bir set alın.',
    vipEach: 'Her ürün optimizasyonundan elde edilen kâr {{commission}}.',
    vipCombined: 'Birleşik optimizasyon kârı {{comboProfit}}.',
    vipActivate: '{{amount}} ile etkinleştirin.',
    vipDaily: 'Günde en fazla 3 görev seti tamamlanabilir.',
    home: 'Ana Sayfa',
    starting: 'Başlat',
    records: 'Kayıtlar',
    loginTagline: 'Web ve mobil için duyarlı bir optimizasyon çalışma alanı.',
    signInContinue: 'Görevleri optimize etmeye ve kayıtları izlemeye devam etmek için giriş yapın.',
    loginPrompt: 'Devam etmek için giriş yapın',
    username: 'Kullanıcı adı',
    password: 'Şifre',
    enterUsername: 'Kullanıcı adını girin',
    enterPassword: 'Şifreyi girin',
    login: 'Giriş yap',
    signingIn: 'Giriş yapılıyor...',
    backToHome: 'Ana sayfaya don',
    loading: 'Yukleniyor...',
    submit: 'Gonder',
    supportChat: 'Destek sohbeti',
    balanceIssueSubject: 'Bakiye sorunu',
    balanceIssueMessage: 'Merhaba Destek, bekleyen bir gorev ve yetersiz bakiye konusunda yardima ihtiyacim var. Gerekli yatirim: USDT {amount}. Lutfen sonraki adimlari paylasin.',
    faqP1: 'Felsefemizin merkezinde size, değerli kullanıcılarımıza, güçlü bir bağlılık yer alır. Bizim gibi dinamik bir platformun standart SSS’lerin cevaplayamadığı sorular doğurabileceğini biliyoruz. Bu nedenle müşteri hizmetleri ekibimiz her zaman yardıma hazırdır.',
    faqP2: 'Sadece sorularınızı yanıtlamakla kalmıyor, aynı zamanda deneyiminizin sorunsuz ve keyifli olması için çözümler sunuyoruz. Bir sorun yaşarsanız, 10:00 ile 22:00 arasında hizmet veren uzmanlarımızla iletişime geçin.',
    faqP3: 'Memnuniyetiniz sadece önceliğimiz değil, aynı zamanda tutkumuzdur. Bu yolculuğun her adımında size rehberlik etmemize ve destek olmamıza izin verin.',
  },
  pt: {
    guest: 'Convidado',
    welcomeBack: '👋 Bem-vindo de volta, {{name}}!',
    menu: 'Menu',
    list: 'Lista',
    service: 'Serviço',
    event: 'Evento',
    withdrawal: 'Levantamento',
    deposit: 'Depósito',
    terms: 'T & C',
    certificate: 'Certificado',
    faqs: 'FAQs',
    vipLevels: 'Níveis VIP',
    viewMore: 'Ver mais',
    vipReceive: 'Receba um conjunto de {{tasks}} tarefas de otimização de produtos.',
    vipEach: 'O lucro por cada otimização de produto é {{commission}}.',
    vipCombined: 'O lucro combinado da otimização é {{comboProfit}}.',
    vipActivate: 'Ative com {{amount}}.',
    vipDaily: 'Até 3 conjuntos de tarefas podem ser concluídos por dia.',
    home: 'Início',
    starting: 'Começar',
    records: 'Registos',
    loginTagline: 'Um espaço de otimização responsivo para web e mobile.',
    signInContinue: 'Entre para continuar a otimizar tarefas e acompanhar registos.',
    loginPrompt: 'Inicie sessão para continuar',
    username: 'Nome de utilizador',
    password: 'Palavra-passe',
    enterUsername: 'Introduza o nome de utilizador',
    enterPassword: 'Introduza a palavra-passe',
    login: 'Entrar',
    signingIn: 'A entrar...',
    backToHome: 'Voltar ao inicio',
    loading: 'A carregar...',
    submit: 'Enviar',
    supportChat: 'Chat de suporte',
    balanceIssueSubject: 'Problema de saldo',
    balanceIssueMessage: 'Ola Suporte, preciso de ajuda com uma tarefa pendente e saldo insuficiente. Deposito necessario: USDT {amount}. Por favor indiquem os proximos passos.',
    faqP1: 'No centro da nossa filosofia está um forte compromisso consigo, nosso estimado utilizador. Sabemos que uma plataforma dinâmica como a nossa pode gerar perguntas que as FAQs padrão nem sempre resolvem. Por isso, a nossa equipa de apoio ao cliente está sempre pronta para ajudar.',
    faqP2: 'Não respondemos apenas às suas perguntas, também oferecemos soluções para garantir que a sua experiência seja simples, agradável e satisfatória. Se tiver algum desafio, contacte um dos nossos especialistas disponíveis das 10h às 22h.',
    faqP3: 'A sua satisfação não é apenas a nossa prioridade, é a nossa paixão. Permita-nos orientá-lo, apoiá-lo e celebrar cada passo desta jornada consigo.',
  },
};

if (!i18n.isInitialized) {
  const resources = Object.fromEntries(
    Object.entries(translations).map(([code, values]) => [code, { translation: values }]),
  );

  const savedLanguage = localStorage.getItem(STORAGE_KEY);
  const fallbackLanguage: LanguageCode = 'en';
  const initialLanguage =
    savedLanguage && languageOptions.some((item) => item.code === savedLanguage)
      ? (savedLanguage as LanguageCode)
      : fallbackLanguage;

  i18n.use(initReactI18next).init({
    resources,
    lng: initialLanguage,
    fallbackLng: fallbackLanguage,
    interpolation: {
      escapeValue: false,
    },
  });
}

function getAutofillStorageKey(language: LanguageCode): string {
  return `${LOCALE_AUTOFILL_STORAGE_PREFIX}${language}`;
}

function loadAutofill(language: LanguageCode): Record<string, string> {
  try {
    const raw = localStorage.getItem(getAutofillStorageKey(language));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveAutofill(language: LanguageCode, values: Record<string, string>) {
  try {
    localStorage.setItem(getAutofillStorageKey(language), JSON.stringify(values));
  } catch {
    // Ignore localStorage failures.
  }
}

async function ensureLocaleCoverage(language: LanguageCode) {
  if (language === 'en') return;

  const englishEntries = translations.en;
  const existingAutofill = loadAutofill(language);

  for (const [key, value] of Object.entries(existingAutofill)) {
    i18n.addResource(language, 'translation', key, value, { silent: true });
  }

  const missingKeys = Object.keys(englishEntries).filter((key) => {
    const localizedValue = i18n.getResource(language, 'translation', key);
    return typeof localizedValue !== 'string' || !localizedValue.trim();
  });

  if (missingKeys.length === 0) return;

  const sourceTexts = missingKeys.map((key) => englishEntries[key]);
  const targetLanguage = normalizeLanguageCode(language);

  try {
    const translated = await translateBatch(sourceTexts, targetLanguage, 'en');
    const nextAutofill = { ...existingAutofill };

    missingKeys.forEach((key, index) => {
      const translatedValue = translated[index] || englishEntries[key];
      i18n.addResource(language, 'translation', key, translatedValue, { silent: true });
      nextAutofill[key] = translatedValue;
    });

    saveAutofill(language, nextAutofill);
  } catch {
    missingKeys.forEach((key) => {
      i18n.addResource(language, 'translation', key, englishEntries[key], { silent: true });
    });
  }
}

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  languages: typeof languageOptions;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const resolved = i18n.resolvedLanguage || i18n.language || 'en';
    return (languageOptions.some((item) => item.code === resolved) ? resolved : 'en') as LanguageCode;
  });

  useEffect(() => {
    const onLanguageChanged = (nextLanguage: string) => {
      if (!languageOptions.some((item) => item.code === nextLanguage)) {
        return;
      }

      const typedLanguage = nextLanguage as LanguageCode;
      setLanguageState(typedLanguage);
      localStorage.setItem(STORAGE_KEY, typedLanguage);
    };

    i18n.on('languageChanged', onLanguageChanged);
    return () => {
      i18n.off('languageChanged', onLanguageChanged);
    };
  }, []);

  useEffect(() => {
    void ensureLocaleCoverage(language);
  }, [language]);

  const setLanguage = (nextLanguage: LanguageCode) => {
    if (!languageOptions.some((item) => item.code === nextLanguage)) {
      return;
    }
    void i18n.changeLanguage(nextLanguage);
  };

  const t = (key: string, vars?: Record<string, string | number>) => {
    return String(i18n.t(key, vars as Record<string, string> | undefined));
  };

  const value = useMemo(
    () => ({ language, setLanguage, languages: languageOptions, t }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
