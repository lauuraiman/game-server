import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'https://game-server-1ybw.onrender.com';
const socket = io(SOCKET_URL);

function GameBoard({ roomCode, playersList = [] }) {
  
  // 1. Все стейты компонента
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [players, setPlayers] = useState(
    playersList.map((name, index) => ({
      id: index,
      name: name,
      cellIndex: 0,      
      subStep: 1,        
      yearsLeft: 0,
      goal: '',          
      rule: '',          
      newActionCustomText: '',
      isFinished: false,
      levelCardsHistory: {
        'Захват денег': [],
        'Плата': [],
        'Иллюзия': [],
        'Дискомфорт': [],
        'Истинная суть денег': [],
        'Помощь': [],
        'Проверка': [],
        'Освобождение': []
      }
    }))
  );

  const getRoomIdFromUrl = () => {
    const pathSegments = window.location.pathname.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];
    if (lastSegment && lastSegment !== '' && lastSegment !== 'room') {
      return lastSegment.toUpperCase();
    }
    return roomCode ? roomCode.toUpperCase() : Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const [roomId] = useState(getRoomIdFromUrl);
  const [copied, setCopied] = useState(false);

  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  
  const [dice1, setDice1] = useState(null);
  const [dice2, setDice2] = useState(null);
  const [isRolling, setIsRolling] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentYearCard, setCurrentYearCard] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  
  const [diceResultModal, setDiceResultModal] = useState(null); 

  const [newActionText, setNewActionText] = useState('');
  const [pendingActionPlayer, setPendingActionPlayer] = useState(null);

  const [setupInputModal, setSetupInputModal] = useState(null); 
  const [tempInputValue, setTempInputValue] = useState('');

  const [isPlayersListOpen, setIsPlayersListOpen] = useState(false);
  const [selectedPlayerModal, setSelectedPlayerModal] = useState(null);

  // 2. Эффекты
  useEffect(() => {
    socket.emit('join_room', { roomId }, (response) => {
      if (response.success) {
        console.log(`Подключились к комнате: ${roomId}`);
      } else {
        alert(response.message);
      }
    });

    socket.on('player_joined', (data) => {
      if (data.players) {
        // Логика обновления списка игроков
      }
    });

    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      socket.off('player_joined');
      window.removeEventListener('resize', checkScreenSize);
    };
  }, [roomId]);

  // 3. Вспомогательные функции (например, копирование ссылки)
  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const boardCells = [
    { id: 0, name: 'СТАРТ' },
    { id: 1, name: 'Правила игры' },
    { id: 2, name: 'Захват денег' },
    { id: 3, name: 'Плата' },
    { id: 4, name: 'Иллюзия' },
    { id: 5, name: 'Дискомфорт' },
    { id: 6, name: 'НОВОЕ ДЕЙСТВИЕ (动)' },
    { id: 7, name: 'Истинная суть денег' },
    { id: 8, name: 'Помощь' },
    { id: 9, name: 'Проверка' },
    { id: 10, name: 'Освобождение' },
    { id: 11, name: 'Изобилие' }
  ];

  const questionsDatabase = {
    'Захват денег': [
      'ДОЛГИ И КРЕДИТЫ — ҚАРЫЗ БЕН НЕСИЕ',
      'МАЛЕНЬКИЙ ДОХОД — ТАБЫСТЫҢ АЗДЫҒЫ',
      'ИМПУЛЬСИВНЫЕ ПОКУПКИ — ОЙЛАНБАЙ САТЫП АЛУ',
      'ПОМОЩЬ РОДСТВЕННИКАМ — ТУЫСТАРҒА ҚАРЖЫЛАЙ КӨМЕКТЕСУ',
      'НЕЗАПЛАНИРОВАННЫЕ РАСХОДЫ — КҮТПЕГЕН ШЫҒЫНДАР',
      'БОЛЕЗНЬ И ЛЕЧЕНИЕ — АУРУ МЕН ЕМГЕ КЕТКЕН ШЫҒЫН',
      'ПОТЕРЯ ИСТОЧНИКА ДОХОДА — ТАБЫС КӨЗІНЕН АЙЫРЫЛУ',
      'ДОЛГАЯ БЕЗРАБОТИЦА — ҰЗАҚ УАҚЫТ ЖҰМЫССЫЗ ҚАЛУ',
      'ИНФЛЯЦИЯ — ИНФЛЯЦИЯ',
      'ДЕВАЛЬВАЦИЯ — ДЕВАЛЬВАЦИЯ',
      'АРЕСТОВАННЫЕ ДЕНЬГИ — АРЕСТКЕ АЛЫНҒАН АҚША',
      'ЗАМОРОЖЕННЫЕ АКТИВЫ — БҰҒАТТАЛҒАН АКТИВТЕР',
      'МОШЕННИЧЕСТВО — АЛАЯҚТЫҚ',
      'ВОРОВСТВО — ҰРЛЫҚ',
      'ФИНАНСОВАЯ ПИРАМИДА — ҚАРЖЫ ПИРАМИДАСЫ',
      'НЕУДАЧНАЯ ИНВЕСТИЦИЯ — СӘТСІЗ ИНВЕСТИЦИЯ',
      'НЕЭФФЕКТИВНОЕ УПРАВЛЕНИЕ КАПИТАЛОМ — КАПИТАЛДЫ ТИІМСІЗ БАСҚАРУ',
      'РАЗДЕЛ ИМУЩЕСТВА — МҮЛІКТІ БӨЛІСУ',
      'ПРОБЛЕМНЫЙ ПАРТНЁР — МӘСЕЛЕЛІ СЕРІКТЕСТІК',
      'ФИНАНСОВЫЙ КОНФЛИКТ В СЕМЬЕ — ОТБАСЫНДАҒЫ ҚАРЖЫ ДАУЫ',
      'НЕУДАЧНЫЙ БИЗНЕС-ПРОЕКТ — СӘТСІЗ БИЗНЕС ЖОБАСЫ',
      'НЕПРАВИЛЬНЫЙ ПАРТНЁР — СЕРІКТЕСТІКТІ ДҰРЫС ТАҢДАМАУ',
      'НЕНАДЁЖНЫЙ СОТРУДНИК — СЕНІМСІЗ ҚЫЗМЕТКЕР',
      'ПОТЕРЯ КЛЮЧЕВОГО СОТРУДНИКА — МАҢЫЗДЫ ҚЫЗМЕТКЕРДЕН АЙЫРЫЛУ',
      'ПОТЕРЯ КЛЮЧЕВОГО КЛИЕНТА — МАҢЫЗДЫ КЛИЕНТТЕН АЙЫРЫЛУ',
      'ПАДЕНИЕ СПРОСА — СҰРАНЫСТЫҢ ТӨМЕНДЕУІ',
      'РОСТ СЕБЕСТОИМОСТИ — ӨЗІНДІК ҚҰННЫҢ ӨСУІ',
      'ДОЛГИ БИЗНЕСА — БИЗНЕСТІҢ ҚАРЫЗҒА БАТУЫ',
      'КАССОВЫЙ РАЗРЫВ — АҚША АЙНАЛЫМЫНДАҒЫ ҮЗІЛІС',
      'СУДЕБНЫЕ РАЗБИРАТЕЛЬСТВА — СОТ ДАУЛАРЫ',
      'ШТРАФЫ И НАЛОГИ — АЙЫППҰЛДАР МЕН САЛЫҚТАР',
      'РЕПУТАЦИОННЫЙ СКАНДАЛ — БЕДЕЛГЕ НҰҚСАН КЕЛТІРЕТІН ЖАНЖАЛ',
      'ПАРТНЁР ЗАБРАЛ ДЕНЬГИ — СЕРІКТЕС АҚШАНЫ ИЕМДЕНІП КЕТТІ',
      'БИЗНЕС ПРИШЛОСЬ ЗАКРЫТЬ — БИЗНЕСТІ ЖАБУҒА ТУРА КЕЛДІ',
      'ПОТЕРЯ КРУПНОГО КАПИТАЛА — ІРІ КАПИТАЛДАН АЙЫРЫЛУ',
      'ПОТЕРЯ БИЗНЕСА — БИЗНЕСТЕН АЙЫРЫЛУ',
      'ОБВАЛ РЫНКА — НАРЫҚТЫҢ КҮРТ ҚҰЛДЫРАУЫ',
      'ЭКОНОМИЧЕСКИЙ КРИЗИС — ЭКОНОМИКАЛЫҚ ДАҒДАРЫС',
      'ЗАМОРОЖЕННЫЕ АКТИВЫ (ДУБЛЬ) — БҰҒАТТАЛҒАН АКТИВТЕР',
      'ДЕНЬГИ ЗАСТРЯЛИ В ПРОЕКТЕ — АҚША ЖОБАҒА БАЙЛАНЫП ҚАЛДЫ',
      'БАНКРОТСТВО — БАНКРОТТЫҚ',
      'ПОТЕРЯ НАСЛЕДСТВА — МҰРАДАН АЙЫРЫЛУ'
    ],
    'Плата': [
      'СТРАХ — ҚОРҚЫНЫШ', 'ТРЕВОГА — МАЗАСЫЗДЫҚ', 'СТЫД — ҰЯТ', 'ЧУВСТВО ВИНЫ — КІНӘ СЕЗІМІ',
      'ЗЛОСТЬ — АШУ', 'ОБИДА — ӨКПЕ', 'РАЗОЧАРОВАНИЕ — КӨҢІЛ ҚАЛУ', 'ЗАВИСТЬ — ҚЫЗҒАНЫШ',
      'РАЗДРАЖЕНИЕ — ЫЗА', 'БЕССИЛИЕ — ДӘРМЕНСІЗДІК', 'ОТЧАЯНИЕ — ҮМІТСІЗДІК', 'ЭМОЦИОНАЛЬНОЕ ИСТОЩЕНИЕ — ЭМОЦИЯЛЫҚ ШАРШАУ',
      'ВЫГОРАНИЕ — ЭМОЦИЯЛЫҚ КҮЙЗЕЛУ', 'ПОСТОЯННОЕ НАПРЯЖЕНИЕ — ҮНЕМІ КЕРНЕУДЕ ЖҮРУ', 'ВНУТРЕННЕЕ БЕСПОКОЙСТВО — ІШКІ МАЗАСЫЗДЫҚ', 'ОЩУЩЕНИЕ НЕБЕЗОПАСНОСТИ — ҚАУІПСІЗДІКТІҢ ЖОҚТЫҒЫН СЕЗІНУ',
      'ПОТЕРЯ ВНУТРЕННЕГО СПОКОЙСТВИЯ — ІШКІ ТЫНЫШТЫҚТЫ ЖОҒАЛТУ', 'НЕДОВЕРИЕ — СЕНІМСІЗДІК', 'ПОТРЕБНОСТЬ ВСЁ КОНТРОЛИРОВАТЬ — БӘРІН БАҚЫЛАУҒА ДЕГЕН ҚАЖЕТТІЛІК', 'СТРАХ СНОВА ПОТЕРЯТЬ — ҚАЙТА ЖОҒАЛТУДАН ҚОРҚУ',
      'СТРАХ БЕДНОСТИ — КЕДЕЙЛІКТЕН ҚОРҚУ', 'СТРАХ ПРОВАЛА — СӘТСІЗДІКТЕН ҚОРҚУ', 'СТРАХ УСПЕХА — ТАБЫСТАН ҚОРҚУ'
    ],
    'Иллюзия': [
      'ДЕНЬГИ = ТЯЖЁЛЫЙ ТРУД\nЧтобы много зарабатывать, нужно много работать.\n— Көп ақша табу үшін көп жұмыс істеу керек.',
      'ДЕНЬГИ = ЗАСЛУГА\nЯ должна заслужить большие деньги.\n— Мен көп ақша табуға лайық болуым үшін оны еңбегіммен дәлелдеуім керек.',
      'ДЕНЕЖНЫЙ ПОТОЛОК\nЯ не могу зарабатывать больше определённой суммы.\n— Мен белгілі бір сомадан артық ақша таба алмаймын.',
      'ЦЕНА\nЕсли я подниму цену, люди уйдут.\n— Егер бағамды көтерсем, адамдар менен кетеді.',
      'САМОЦЕННОСТЬ\nЧтобы брать больше денег, мне нужно стать лучше.\n— Көбірек ақша табу үшін алдымен өзімді жетілдіруым керек.',
      'ЛЁГКИЕ ДЕНЬГИ\nЛёгкие деньги долго не живут.\n— Оңай келген ақша ұзаққа бармайды.',
      'БОГАТСТВО И РИСК\nБольшие деньги требуют слишком большого риска.\n— Үлкен ақша табу үшін тым үлкен тәуекелге бару керек.',
      'БОГАТСТВО И БЕЗОПАСНОСТЬ\nЧем больше денег, тем больше я могу потерять.\n— Ақша көбейген сайын, жоғалтатын нәрсем де көбейеді.',
      'ДЕНЬГИ И КОНТРОЛЬ\nЕсли я не контролирую всё сам, я потеряю деньги.\n— Егер бәрін өзім бақыламасам, ақшамнан айырылып қаламын.',
      'ДЕНЬГИ И КОМАНДА\nЕсли я не участвую лично, результат будет хуже.\n— Егер іске өзім тікелей араласамasam, нәтиже нашар болады.',
      'МАСШТАБ\nМой бизнес уже достиг своего естественного масштаба.\n— Менің бизнесім өзінің табиғи шегіне жетті.',
      'СВОБОДА\nЧем больше мой бизнес, тем меньше у меня свободы.\n— Бизнесім өскен сайын, еркіндігім азаяды.',
      'УСПЕХ\nМне нужно постоянно расти, иначе я откатюсь назад.\n— Мен үнемі өсуім керек, әйтпесе артқа шегінемін.',
      'КОНКУРЕНЦИЯ\nЕсли я остановлюсь, конкуренты меня обойдут.\n— Егер тоқтасам, бәсекелестерім мені басып озады.',
      'ОТДЫХ\nЯ не могу расслабиться, пока не достигну следующего уровня.\n— Келесі деңгейге жетпейінше, мен демала алмаймын.',
      'ПОТЕРЯ\nЯ могу потерять всё, поэтому нужно всегда быть начеку.\n— Мен бәрінен айырылып қалуым мүмкін, сондықтан үнемі сақ болуым керек.',
      'ОДИНОЧЕСТВО УСПЕШНОГО\nЧем успешнее я становлюсь, тем меньше людей меня понимают.\n— Мен неғұрлым табысты болған сайын, мені түсінетін адамдар азая береді.',
      'БОГАТСТВО И ОТНОШЕНИЯ\nЕсли я стану слишком успешной, близкие отдалятся от меня.\n— Егер мен тым табысты болсам, жақындарым менен алыстайды.',
      'СЕМЕЙНАЯ ЛОЯЛЬНОСТЬ\nМне нельзя иметь больше, чем моя семья.\n— Менің отбасымнан артық ақшаға ие болуға болмайды.',
      'БОГАТСТВО И ВИНА\nЕсли у меня много денег, я должна делиться ими со всеми.\n— Егер менде көп ақша болса, оны бәрімен бөлісуім керек.',
      'ИДЕНТИЧНОСТЬ\nЧтобы выйти на следующий уровень, мне придётся стать другим человеком.\n— Келесі деңгейге өту үшін мен басқа адамға айналуым керек.',
      'СЛЕДУЮЩИЙ УРОВЕНЬ\nЯ знаю, как зарабатывать свои деньги, но не знаю, как сделать следующий скачок.\n— Мен ақша табуды білемін, бірақ келесі серпілісті қалай жасау керегін білмеймін.',
      'ПРЕДЕЛ УСПЕХА\nМой текущий успех — результат того, что я уже умею.\n— Менің қазіргі жетістігім — осы уақытқа дейін білетінім мен істей алатынымның нәтижесе.',
      'ЦЕНА МАСШТАБА\nЧтобы заработать ещё больше, мне придётся слишком многим пожертвовать.\n— Одан да көп ақша табу үшін мен тым көп нәрседен бас тартуым керек.'
    ],
    'Дискомфорт': [
      'РАЗВОД\nАжырасу', 'ПРЕДАТЕЛЬСТВО\nСатқындық', 'СМЕРТЬ БЛИЗКОГО\nЖақын адамның қайтыс болуы', 'РАЗРУШЕНИЕ\nҚирау',
      'БАНКРОТСТВО\nБанкроттық', 'КРАХ БИЗНЕСА\nБизнестің күйреуі', 'ПОТЕРЯ РЕПУТАЦИИ\nБеделден айырылу', 'ЗАВИСИМОСТЬ\nТәуелділік',
      'ТЮРЬМА\nТүрмеге түсу', 'РАЗРЫВ С БЛИЗКИМ ЧЕЛОВЕКОМ\nЖақын адаммен қарым-қатынастың үзілуі', 'ТЕБЯ ЗАМЕНЯЮТ\nОрныңды басқа адамның басуы', 'ТЫ УЗНАЁШЬ ПРАВДУ\nШындықтың ашылуы',
      'НЕОЖИДАННОЕ БОГАТСТВО\nКүтпеген байлық', 'ТЕБЕ ПРЕДЛАГАЮТ ПРОДАТЬ БИЗНЕС\nБизнесті сату туралы ұсыныс', 'ВЫНУЖДЕННАЯ ЭМИГРАЦИЯ\nМәжбүрлі эмиграция', 'НЕОЖИДАННАЯ ВСТРЕЧА\nКүтпеген кездесу',
      'СЕРЬЁЗНАЯ БОЛЕЗНЬ\nАуыр дерт', 'ОПАСНОСТЬ ДЛЯ ЖИЗНИ\nӨмірге төнген қауіп', 'ТЫ ДОСТИГАЕШЬ ВСЕГО\nБарлық мақсатқа жету', 'ТЫ ТЕРЯЕШЬ СЕБЯ\nӨзін жоғалту',
      'ПОТЕРЯ ДОВЕРИЯ\nСенімнен айырылу', 'ПРОВЕРКА САМОЦЕННОСТИ\nӨз құндылығын сынау', 'КРИЗИС\nДағдарыс', 'ДУХОВНЫЙ КРИЗИС\nРухани дағдарыс'
    ],
    'Истинная суть денег': ['_______', '_______', '_______', '_______', '_______'],
    'Помощь': [
      'ДИСЦИПЛИНА\nТәртіп', 'СИЛА ВОЛИ\nЕрік күші', 'СМЕЛОСТЬ\nБатылдық', 'РЕШИТЕЛЬНОСТЬ\nШешімділік',
      'НАСТОЙЧИВОСТЬ\nТабандылық', 'ИНТУИЦИЯ\nІшкі түйсік', 'УВЕРЕННОСТЬ\nӨзіне деген сенім', 'ОТВЕТСТВЕННОСТЬ\nЖауапкершілік',
      'СЕМЬЯ\nОтбасы', 'НАСТАВНИК\nТәлімгер', 'ПАРТНЕР\nСеріктес', 'КОМАНДА\nТоп',
      'ПОДДЕРЖКА\nҚолдау', 'ПОЛЕЗНЫЕ СВЯЗИ\nПайдалы байланыстар', 'ОПЫТ\nТәжірибе', 'ЗНАНИЯ\nБілім',
      'РАЗВИТИЕ\nДаму', 'ЗДОРОВЬЕ\nДЕНСАУЛЫҚ', 'ВОЗМОЖНОСТЬ\nМүмкіндік', 'РИСК\nТәуекел',
      'ПЛАНИРОВАНИЕ\nЖоспарлау', 'ДЕЛЕГИРОВАНИЕ\nМіндетті бөлісу', 'ДОВЕРИЕ\nСенім', 'ДЕЙСТВИЕ\nӘрекет'
    ],
    'Освобождение': [
      'Что ты оставляешь в прошлом?\nӨткен шақта нені қалдырасың?',
      'Что больше никогда не будет управлять твоими финансовыми решениями?\nҚаржылық шешімдеріңе енді не ықпал етпейді?',
      'Что ты больше не будешь терпеть ради денег?\nАқша үшін енді қандай жағдайға жол бермейсің?',
      'От какой роли ты отказываешься?\nҚандай рөлден бас тартасың?',
      'Какую привычку ты оставляешь сегодня?\nБүгін қай әдетіңмен қоштасасың?',
      'Какой страх больше не будет влиять на твои действия?\nҚандай қорқыныш енді әрекеттеріңе әсер етпейді?',
      'Какое ограничение ты снимаешь с себя?\nӨзіңе қойған қандай шектеуден арыласың?',
      'Какое убеждение о деньгах перестает быть частью твоей жизни?\nАқша туралы қандай сенімің енді өміріңде орын алмайды?',
      'Что ты перестаешь доказывать себе и другим?\nӨзіңе де, өзгелерге де нені дәлелдеуді тоқтатасың?',
      'Какое чувство больше не будет руководить твоими финансовыми решениями?\nҚандай сезім енді қаржылық шешімдеріңді басқармайды?',
      'Чему ты больше не говоришь «да»?\nЕнді қандай нәрсеге келіспейсің?',
      'Что ты перестаешь оправдывать?\nНені ақтап алуды тоқтатасың?',
      'Чье мнение перестает определять твой выбор?\nКімнің пікірі енді таңдауыңа әсер етпейді?',
      'От какого внутреннего запрета ты освобождаешься?\nҚандай ішкі тыйымнан арыласың?',
      'За что ты перестаешь брать ответственность?\nЕнді кім үшін жауапкершілікті мойныңа алмайсың?',
      'Что ты перестаешь откладывать?\nНені кейінге қалдыруды тоқтатасың?',
      'Какой старый сценарий завершается сегодня?\nБүгін қай ескі сценарий аяқталады?',
      'Что ты перестаешь контролировать любой ценой?\nНені үнемі бақылауда ұстауды тоқтатасың?',
      'Что ты прощаешь себе и отпускаешь?\nӨзіңді не үшін кешіріп, нені босатасың?',
      'От чего ты освобождаешься пространство в своей жизни?\nӨміріңде неге орын босатасың?',
      'Что больше не соответствует человеку, которым ты становишься?\nЖаңа болмысыңа енді не сай келмейді?',
      'Какую цену ты больше не готов платить за деньги?\nАқша үшін енді қандай құрбандыққа бармайсың?',
      'Какой выбор ты больше никогда не повторишь?\nҚандай таңдауды енді қайталамайсың?',
      'Что должно остаться здесь, чтобы ты смог войти в Изобилие?\n«Молшылық» деңгейіне өту үшін мұнда нені қалдыруың керек?'
    ],
    'Проверка': [
      'Карта — не территория\nКарта — территорияның өзі емес',
      'У каждого человека своя модель мира\nӘр адамның әлем туралы өз моделі бар',
      'Смысл коммуникации — в полученной реакции\nКоммуникацияның мәні — алынған реакцияда',
      'За каждым поведением стоит позитивное намерение\nӘрбір мінез-құлықтың артында позитивті ниет бар',
      'У человека уже есть все необходимые ресурсы\nАдамда қажетті ресурстардың барлығы бар',
      'Если то, что ты делаешь, не работает — сделай что-то другое\nЖасағаның нәтиже бермесе — басқа нәрсе жаса',
      'Невозможность — это ограничение модели мира\nМүмкін еместік — әлем моделінің шектеуі',
      'Человек способен изменить своё состояние\nАдам өзінің күйін өзгерте алады',
      'Любое поведение имеет контекст, в котором оно полезно\nКез келген мінез-құлықтың пайдалы болатын өз контексті бар',
      'Нет поражения — есть обратная связь\nЖеңіліс жоқ — кері байланыс бар',
      'Человек выбирает лучшее из доступных ему вариантов\nАдам өзіне қолжетімді нұсқалардың ішінен ең жақсысын таңдайды',
      'Если один человек способен чему-то научиться, другие тоже могут этому научиться\nЕгер бір адам бір нәрсені үйрене алса, оны басқалар да үйрене алады',
      'Тело и разум — единая система\nДене мен сана — біртұтас жүйе',
      'Сопротивление — это сигнал о необходимости изменить способ взаимодействия\nҚарсылық — өзара әрекет ету тәсілін өзгерту қажеттілігінің белгісі',
      'Всегда существует больше одно способа достичь цели\nМақсатқа жетудің әрқашан бірден көп жолы бар',
      'Человек — не его поведение\nАдам — оның мінез-құлқы ғана емес'
    ]
  };

  const renderDiceFace = (num) => {
    const dotPositions = {
      1: [[50, 50]],
      2: [[25, 25], [75, 75]],
      3: [[25, 25], [50, 50], [75, 75]],
      4: [[25, 25], [25, 75], [75, 25], [75, 75]],
      5: [[25, 25], [25, 75], [50, 50], [75, 25], [75, 75]],
      6: [[25, 20], [25, 50], [25, 80], [75, 20], [75, 50], [75, 80]]
    };
    const currentDots = dotPositions[num] || dotPositions[1];

    return (
      <div style={{
        width: '45px', height: '45px', background: '#fff', borderRadius: '8px',
        position: 'relative', boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
        border: '2px solid #ffd700', display: 'inline-block'
      }}>
        {currentDots.map((pos, i) => (
          <div key={i} style={{
            position: 'absolute', width: '8px', height: '8px', background: '#111',
            borderRadius: '50%', top: `${pos[1]}%`, left: `${pos[0]}%`,
            transform: 'translate(-50%, -50%)'
          }} />
        ))}
      </div>
    );
  };

  const rollDice = () => {
    const currentPlayer = players[activePlayerIndex];
    if (currentPlayer.isFinished || hasRolled || isRolling) return;

    if (!currentPlayer.goal) {
      setSetupInputModal('goal');
      setTempInputValue('');
      return;
    }
    if (!currentPlayer.rule) {
      setSetupInputModal('rule');
      setTempInputValue('');
      return;
    }

    setIsRolling(true);
    setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const total = d1 + d2; 

      setDice1(d1);
      setDice2(d2);
      setIsRolling(false);
      setHasRolled(true);

      let totalSubSteps = (currentPlayer.cellIndex * 6) + currentPlayer.subStep + total;
      const maxTotalSteps = boardCells.length * 6;
      const startGlobalSub = (currentPlayer.cellIndex * 6) + currentPlayer.subStep;
      const actionCellGlobalSub = 6 * 6; 

      let hitActionNode = false;
      if (
        (startGlobalSub < actionCellGlobalSub && totalSubSteps >= actionCellGlobalSub) ||
        Math.floor((totalSubSteps % maxTotalSteps) / 6) === 6
      ) {
        hitActionNode = true;
      }

      let finalCellIndex, finalSubStep;
      if (hitActionNode) {
        finalCellIndex = 6;
        finalSubStep = 1;
      } else {
        if (totalSubSteps >= maxTotalSteps - 6) {
          finalCellIndex = 11;
          finalSubStep = 1;
        } else {
          totalSubSteps = totalSubSteps % maxTotalSteps;
          finalCellIndex = Math.floor(totalSubSteps / 6);
          finalSubStep = (totalSubSteps % 6) + 1;
        }
      }

      const updatedPlayers = [...players];
      updatedPlayers[activePlayerIndex].cellIndex = finalCellIndex;
      updatedPlayers[activePlayerIndex].subStep = finalSubStep;

      if (finalCellIndex === 11) {
        updatedPlayers[activePlayerIndex].isFinished = true;
      }

      let yearsSpent = 0;
      if (finalCellIndex >= 2 && finalCellIndex !== 11) {
        const allowedYears = [0, 25, 5, 3, 12, 37, 1, 7];
        yearsSpent = allowedYears[Math.floor(Math.random() * allowedYears.length)];
        setCurrentYearCard(yearsSpent);
        updatedPlayers[activePlayerIndex].yearsLeft += yearsSpent;
      } else {
        setCurrentYearCard(null);
      }

      setPlayers(updatedPlayers);
      setDiceResultModal({ d1, d2, total, finalCellIndex, isAction: finalCellIndex === 6, currentPlayerId: currentPlayer.id });
    }, 2000);
  };

  const handleDiceResultOk = () => {
    const data = diceResultModal;
    setDiceResultModal(null); 

    if (data.isAction) {
      setPendingActionPlayer(data.currentPlayerId);
      setIsModalOpen(true);
      setCurrentQuestion(null);
      setCurrentYearCard(null);
      return;
    }

    const finalCellIndex = data.finalCellIndex;
    const cellData = boardCells[finalCellIndex];
    
    if (finalCellIndex > 1 && finalCellIndex !== 11 && questionsDatabase[cellData.name]) {
      const questionsList = questionsDatabase[cellData.name];
      const updatedPlayers = [...players];
      const player = updatedPlayers[activePlayerIndex];

      if (finalCellIndex === 2) {
        const shuffled = [...questionsList].sort(() => 0.5 - Math.random());
        const twoCards = [shuffled[0], shuffled[1]];
        
        if (!player.levelCardsHistory[cellData.name]) {
          player.levelCardsHistory[cellData.name] = [];
        }
        player.levelCardsHistory[cellData.name].push(twoCards[0], twoCards[1]);
        setPlayers(updatedPlayers);

        setCurrentQuestion({ cell: cellData.name, text: twoCards, isMultiple: true });
      } else {
        const randomQuestion = questionsList[Math.floor(Math.random() * questionsList.length)];
        
        if (!player.levelCardsHistory[cellData.name]) {
          player.levelCardsHistory[cellData.name] = [];
        }
        player.levelCardsHistory[cellData.name].push(randomQuestion);
        setPlayers(updatedPlayers);

        setCurrentQuestion({ cell: cellData.name, text: randomQuestion, isMultiple: false });
      }
    } else {
      setCurrentQuestion(null);
    }
  };

  const handleSaveSetupInput = () => {
    if (!tempInputValue.trim()) return;
    const updatedPlayers = [...players];
    const currentPlayer = updatedPlayers[activePlayerIndex];
    
    if (setupInputModal === 'goal') {
      currentPlayer.goal = tempInputValue;
      setPlayers(updatedPlayers);
      setSetupInputModal(null);
      setTempInputValue('');
    } 
    else if (setupInputModal === 'rule') {
      currentPlayer.rule = tempInputValue;
      currentPlayer.cellIndex = 2; 
      setPlayers(updatedPlayers);
      setSetupInputModal(null);
      setTempInputValue('');

      const nextUnfinishedIndex = updatedPlayers.findIndex(p => !p.goal || !p.rule);
      if (nextUnfinishedIndex !== -1) setActivePlayerIndex(nextUnfinishedIndex);
    }
  };

  const handleApproveNewAction = () => {
    const updatedPlayers = players.map(p => {
      if (p.id === pendingActionPlayer) {
        return { ...p, newActionCustomText: newActionText, cellIndex: 7, subStep: 1 };
      }
      return p;
    });
    setPlayers(updatedPlayers);
    setIsModalOpen(false);
    setNewActionText('');
    setPendingActionPlayer(null);
    setHasRolled(false);

    const cellData = boardCells[7];
    if (questionsDatabase[cellData.name]) {
      const questionsList = questionsDatabase[cellData.name];
      const randomQuestion = questionsList[Math.floor(Math.random() * questionsList.length)];
      
      const targetPlayer = updatedPlayers.find(p => p.id === pendingActionPlayer);
      if (targetPlayer) {
        if (!targetPlayer.levelCardsHistory[cellData.name]) {
          targetPlayer.levelCardsHistory[cellData.name] = [];
        }
        targetPlayer.levelCardsHistory[cellData.name].push(randomQuestion);
      }
      setPlayers(updatedPlayers);
      setCurrentQuestion({ cell: cellData.name, text: randomQuestion, isMultiple: false });
    }
  };

  const handleRejectNewAction = () => {
    const updatedPlayers = players.map(p => {
      if (p.id === pendingActionPlayer) {
        return { ...p, cellIndex: 0, subStep: 1, goal: '', rule: '' };
      }
      return p;
    });
    
    setPlayers(updatedPlayers);
    setIsModalOpen(false);
    setNewActionText('');
    setPendingActionPlayer(null);
    setDice1(null);
    setDice2(null);
    setCurrentYearCard(null);
    setHasRolled(false);

    const rejectedIndex = updatedPlayers.findIndex(p => p.id === pendingActionPlayer);
    if (rejectedIndex !== -1) {
      setActivePlayerIndex(rejectedIndex);
      setSetupInputModal('goal');
      setTempInputValue('');
    }
  };

  const nextTurn = () => {
    if (players.every(p => p.isFinished)) {
      alert('🎉 Все игроки достигли Изобилия! Игра завершена.');
      return;
    }
    let nextIndex = (activePlayerIndex + 1) % players.length;
    let iterations = 0;
    while (players[nextIndex].isFinished && iterations < players.length) {
      nextIndex = (nextIndex + 1) % players.length;
      iterations++;
    }
    setActivePlayerIndex(nextIndex);
    setDice1(null);
    setDice2(null);
    setCurrentYearCard(null);
    setHasRolled(false);
  };

  const getButtonText = () => {
    const p = players[activePlayerIndex];
    if (p.isFinished) return '✨ Достиг Изобилия (Ожидание)';
    if (!p.goal) return `🎯 Ввести цель (${p.name})`;
    if (!p.rule) return `📜 Написать правило (${p.name})`;
    if (hasRolled) return 'Ход сделан';
    return '🎲 Бросить кубики и сделать ход';
  };

  const activePlayer = players[activePlayerIndex];

  return (
    <div className="game-board-container" style={{ position: 'relative', width: '100%', minHeight: '100vh', boxSizing: 'border-box', padding: '20px', fontFamily: 'sans-serif', background: '#1a1a1a', color: '#fff' }}>
      
      {/* 📱 МОБИЛЬНАЯ ВЕРСИЯ */}
      {isMobile && (
        <button 
          onClick={() => setIsPlayersListOpen(true)}
          style={{
            display: 'block', width: '100%', padding: '12px',
            background: 'linear-gradient(135deg, #b8860b, #ffd700)',
            color: '#111', border: 'none', fontWeight: 'bold', fontSize: '15px',
            cursor: 'pointer', borderRadius: '6px', marginBottom: '15px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
          }}
        >
          👥 Открыть карточки всех игроков (Меню)
        </button>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Комната: {roomId}</h2>
        <button onClick={copyInviteLink} style={{ padding: '8px 16px', background: '#ffd700', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
          {copied ? 'Ссылка скопирована!' : 'Скопировать инвайт-ссылку'}
        </button>
      </div>

      <div style={{ background: '#2a2a2a', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
        <h3>Игрок ходит: {activePlayer.name}</h3>
        <p>Цель: {activePlayer.goal || 'Не задана'}</p>
        <p>Правило: {activePlayer.rule || 'Не задано'}</p>
        <p>Потрачено лет: {activePlayer.yearsLeft}</p>
        
        <div style={{ margin: '15px 0' }}>
          <button 
            onClick={rollDice} 
            disabled={isRolling || (hasRolled && activePlayer.goal && activePlayer.rule)}
            style={{ padding: '12px 24px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer', marginRight: '10px' }}
          >
            {getButtonText()}
          </button>

          {hasRolled && !activePlayer.isFinished && (
            <button onClick={nextTurn} style={{ padding: '12px 24px', background: '#2196F3', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer' }}>
              Следующий ход ➡️
            </button>
          )}
        </div>

        {(dice1 !== null && dice2 !== null) && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
            <span>Кубики:</span>
            {renderDiceFace(dice1)}
            {renderDiceFace(dice2)}
            <span>(Сумма: {dice1 + dice2})</span>
          </div>
        )}
      </div>

      {/* Модальное окно для ввода Цели или Правила */}
      {setupInputModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#333', padding: '30px', borderRadius: '10px', width: '400px', textAlign: 'center' }}>
            <h3>{setupInputModal === 'goal' ? 'Введите вашу цель на игру:' : 'Введите ваше правило:'}</h3>
            <input 
              type="text" 
              value={tempInputValue} 
              onChange={(e) => setTempInputValue(e.target.value)}
              placeholder={setupInputModal === 'goal' ? 'Например: Купить квартиру' : 'Например: Я разрешаю себе ошибаться'}
              style={{ width: '100%', padding: '10px', margin: '15px 0', boxSizing: 'border-box' }}
            />
            <button onClick={handleSaveSetupInput} style={{ padding: '10px 20px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Сохранить
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно результата броска */}
      {diceResultModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#333', padding: '30px', borderRadius: '10px', width: '400px', textAlign: 'center' }}>
            <h3>Результат броска</h3>
            <p>Выпало: {diceResultModal.d1} и {diceResultModal.d2} (Всего: {diceResultModal.total})</p>
            <p>Клетка: {boardCells[diceResultModal.finalCellIndex].name}</p>
            {currentYearCard !== null && <p>Годы трансформации: +{currentYearCard} лет</p>}
            <button onClick={handleDiceResultOk} style={{ padding: '10px 20px', background: '#2196F3', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '15px' }}>
              ОК
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно Нового Действия */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#333', padding: '30px', borderRadius: '10px', width: '400px', textAlign: 'center' }}>
            <h3>НОВОЕ ДЕЙСТВИЕ (动)</h3>
            <p>Введите описание нового действия:</p>
            <input 
              type="text" 
              value={newActionText} 
              onChange={(e) => setNewActionText(e.target.value)}
              style={{ width: '100%', padding: '10px', margin: '15px 0', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={handleApproveNewAction} style={{ padding: '10px 15px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                Принять
              </button>
              <button onClick={handleRejectNewAction} style={{ padding: '10px 15px', background: '#f44336', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                Сбросить игру
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Отображение выпавшей карточки вопроса */}
      {currentQuestion && (
        <div style={{ background: '#333', padding: '15px', borderRadius: '8px', marginTop: '20px', border: '1px solid #ffd700' }}>
          <h4>Карточка уровня: {currentQuestion.cell}</h4>
          {currentQuestion.isMultiple ? (
            <ul>
              {currentQuestion.text.map((q, idx) => <li key={idx}>{q}</li>)}
            </ul>
          ) : (
            <p style={{ whiteSpace: 'pre-line' }}>{currentQuestion.text}</p>
          )}
        </div>
      )}
    </div>
  );
}

      {/* 💻 ДЕСКТОПНАЯ ВЕРСИЯ: Панель карточек всех игроков сверху со скроллингом */}
      {!isMobile && (
        <div style={{
          display: 'flex', gap: '12px', overflowX: 'auto', marginBottom: '20px',
          paddingBottom: '10px', width: '100%', boxSizing: 'border-box'
        }}>
          {players.map((p, idx) => (
            <div 
              key={p.id}
              onClick={() => setSelectedPlayerModal(p)}
              style={{
                minWidth: '220px', maxWidth: '240px', flexShrink: 0,
                background: '#1a0505',
                border: idx === activePlayerIndex ? '2px solid #ffd700' : '1px solid rgba(255,215,0,0.4)',
                borderRadius: '8px', padding: '12px', cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.4)'
              }}
            >
              <h4 style={{ margin: '0 0 6px 0', color: '#ffd700', fontSize: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{p.name}</span>
                {idx === activePlayerIndex && <span style={{ fontSize: '12px' }}>⭐</span>}
              </h4>
              <div style={{ fontSize: '12px', color: '#ddd', lineHeight: '1.4' }}>
                <div>Поле: <b>{boardCells[p.cellIndex].name}</b></div>
                <div>Шаг: <b>{p.subStep}/6</b></div>
                <div>Годы: <b>{p.yearsLeft}л.</b></div>
              </div>
              <div style={{ marginTop: '6px', borderTop: '1px solid rgba(255,215,0,0.2)', paddingTop: '6px', fontSize: '11px', color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <div>🎯 <b>Цель:</b> {p.goal || '—'}</div>
                <div>📜 <b>Правило:</b> {p.rule || '—'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Мобильная шторка со списком игроков */}
      {isPlayersListOpen && isMobile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex',
          justifyContent: 'center', alignItems: 'center', padding: '15px', boxSizing: 'border-box'
        }}>
          <div style={{
            background: '#1a0505', border: '2px solid #ffd700', borderRadius: '12px',
            width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '20px', boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ffd700', paddingBottom: '10px', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#ffd700', fontSize: '18px' }}>👥 Карточки игроков</h3>
              <button onClick={() => setIsPlayersListOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {players.map((p, idx) => (
                <div 
                  key={p.id}
                  onClick={() => { setSelectedPlayerModal(p); setIsPlayersListOpen(false); }}
                  style={{
                    background: idx === activePlayerIndex ? 'rgba(255, 215, 0, 0.2)' : 'rgba(30, 10, 10, 0.9)',
                    border: idx === activePlayerIndex ? '2px solid #ffd700' : '1px solid rgba(255, 215, 0, 0.4)',
                    borderRadius: '8px', padding: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#ffd700', fontSize: '16px' }}>
                      {p.name} {idx === activePlayerIndex && '⭐ (Ходит)'}
                    </h4>
                    <div style={{ fontSize: '12px', color: '#ccc' }}>
                      Поле: <b>{boardCells[p.cellIndex].name}</b> | Годы: <b>{p.yearsLeft}л.</b>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', background: '#ffd700', color: '#111', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>Открыть ➔</span>
                </div>
              ))}
            </div>
            <button onClick={() => setIsPlayersListOpen(false)} style={{ width: '100%', marginTop: '20px', padding: '12px', background: '#ffd700', color: '#111', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Закрыть меню</button>
          </div>
        </div>
      )}

      {/* Модальное окно подробной информации конкретного игрока с полной историей выпавших карточек */}
      {selectedPlayerModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex',
          justifyContent: 'center', alignItems: 'center', padding: '15px', boxSizing: 'border-box'
        }}>
          <div style={{
            background: '#1a0505', border: '2px solid #ffd700', borderRadius: '12px',
            width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '20px', boxSizing: 'border-box', textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ffd700', paddingBottom: '10px', marginBottom: '15px' }}>
              <h2 style={{ margin: 0, color: '#ffd700', fontSize: '18px' }}>👤 Карточка игрока: {selectedPlayerModal.name}</h2>
              <button onClick={() => setSelectedPlayerModal(null)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ marginBottom: '15px', background: 'rgba(255,215,0,0.05)', padding: '10px', borderRadius: '6px', fontSize: '14px' }}>
              <p style={{ margin: '5px 0' }}>📍 <b>Текущее поле:</b> {boardCells[selectedPlayerModal.cellIndex].name} (Шаг {selectedPlayerModal.subStep}/6)</p>
              <p style={{ margin: '5px 0' }}>⏳ <b>Потрачено лет:</b> {selectedPlayerModal.yearsLeft} лет</p>
              {selectedPlayerModal.isFinished && <p style={{ margin: '5px 0', color: '#ffd700' }}>✨ <b>Статус:</b> Достиг Изобилия!</p>}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <p style={{ margin: '4px 0', color: '#ffd700', fontSize: '14px' }}>🎯 <b>Цель игрока:</b></p>
              <div style={{ background: '#111', padding: '8px 12px', borderRadius: '4px', border: '1px solid #444', color: '#fff', fontSize: '14px' }}>
                {selectedPlayerModal.goal || 'Цель еще не заполнена'}
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <p style={{ margin: '4px 0', color: '#ffd700', fontSize: '14px' }}>📜 <b>Правило игрока:</b></p>
              <div style={{ background: '#111', padding: '8px 12px', borderRadius: '4px', border: '1px solid #444', color: '#fff', fontSize: '14px' }}>
                {selectedPlayerModal.rule || 'Правило еще не заполнено'}
              </div>
            </div>

            {selectedPlayerModal.newActionCustomText && (
              <div style={{ marginBottom: '15px' }}>
                <p style={{ margin: '4px 0', color: '#ffd700', fontSize: '14px' }}>⚡ <b>Новое действие (动):</b></p>
                <div style={{ background: '#111', padding: '8px 12px', borderRadius: '4px', border: '1px solid #444', color: '#fff', fontSize: '14px' }}>
                  {selectedPlayerModal.newActionCustomText}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '15px' }}>
              <p style={{ margin: '6px 0', color: '#ffd700', fontWeight: 'bold', fontSize: '14px' }}>🎴 История выпавших карточек по уровням:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '5px' }}>
                {trackedLevels.map((lvl) => {
                  const historyArr = selectedPlayerModal.levelCardsHistory[lvl] || [];
                  return (
                    <div key={lvl} style={{ background: '#130101', padding: '8px', borderRadius: '4px', border: '1px solid rgba(255,215,0,0.2)' }}>
                      <span style={{ color: '#ffd700', fontSize: '13px', fontWeight: 'bold' }}>{lvl} ({historyArr.length}):</span>
                      {historyArr.length > 0 ? (
                        historyArr.map((item, i) => (
                          <div key={i} style={{ color: '#fff', fontSize: '13px', marginTop: '4px', background: 'rgba(255,215,0,0.08)', padding: '6px', borderRadius: '4px', whiteSpace: 'pre-line', borderLeft: '3px solid #ffd700' }}>
                            {item}
                          </div>
                        ))
                      ) : (
                        <div style={{ color: '#666', fontSize: '13px', marginTop: '2px' }}>— нет карточек —</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <button onClick={() => setSelectedPlayerModal(null)} style={{ width: '100%', padding: '12px', background: '#ffd700', color: '#111', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>Закрыть карточку</button>
          </div>
        </div>
      )}
<>
      {/* Основное игровое поле */}
      <div className="infinity-board">
        <div className="setup-cells-row">
          {[boardCells[0], boardCells[1]].map((cell) => (
            <div key={cell.id} className={`board-cell setup-cell ${players.some(p => p.cellIndex === cell.id) ? 'active-cell-glow' : ''}`}>
              <span>{cell.name}</span>
              <div className="tokens-on-cell">
                {players.filter(p => p.cellIndex === cell.id).map(p => (
                  <span key={p.id} className="player-token" title={`${p.name}`}>
                    {p.name[0]}({p.subStep})
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="phase-section">
          <div className="phase-title">ФАЗА 1: Бессознательное повторение</div>
          <div className="cells-row">
            {phase1Cells.map((cell) => (
              <div key={cell.id} className={`board-cell ${players.some(p => p.cellIndex === cell.id) ? 'active-cell-glow' : ''}`}>
                <span>{cell.name}</span>
                <div className="tokens-on-cell">
                  {players.filter(p => p.cellIndex === cell.id).map(p => (
                    <span key={p.id} className="player-token" title={`${p.name}`}>
                      {p.name[0]}({p.subStep})
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="center-action-node">
          <div className={`board-cell cell-center ${players.some(p => p.cellIndex === centerCell.id) ? 'active-cell-glow' : ''}`}>
            <span><b>{centerCell.name}</b></span>
            <div className="tokens-on-cell">
              {players.filter(p => p.cellIndex === centerCell.id).map(p => (
                <span key={p.id} className="player-token" title={`${p.name}`}>
                  {p.name[0]}({p.subStep})
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="phase-section">
          <div className="phase-title">ФАЗА 2: Осознанная жизнь</div>
          <div className="cells-row">
            {phase2Cells.map((cell) => (
              <div key={cell.id} className={`board-cell ${players.some(p => p.cellIndex === cell.id) ? 'active-cell-glow' : ''}`}>
                <span>{cell.name}</span>
                <div className="tokens-on-cell">
                  {players.filter(p => p.cellIndex === cell.id).map(p => (
                    <span key={p.id} className="player-token" title={`${p.name}`}>
                      {p.name[0]}({p.subStep})
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="control-panel">
        <div className="active-player-info">
          Ходит: <b>{players[activePlayerIndex].name}</b>
        </div>
        
        <button 
          className="dice-btn" 
          onClick={rollDice} 
          disabled={players[activePlayerIndex].isFinished || (hasRolled && allGoalsEntered && allRulesEntered) || isRolling}
        >
          {isRolling ? '🎲 Бросаем кубики...' : getButtonText()}
        </button>

        {!isRolling && dice1 !== null && dice2 !== null && (
          <div className="dice-result-inline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            {renderDiceFace(dice1)}
            {renderDiceFace(dice2)}
            <span style={{ marginLeft: '5px' }}>Сумма: <b>{dice1 + dice2} шаг(ов)</b></span>
          </div>
        )}

        {currentYearCard !== null && (
          <div className="year-card-result">
            {currentYearCard > 0 ? `Потрачено: +${currentYearCard} лет` : '0 лет потрачено'}
          </div>
        )}

        <button 
          className="next-turn-btn" 
          onClick={nextTurn} 
          disabled={!players[activePlayerIndex].isFinished && (!hasRolled || !allGoalsEntered || !allRulesEntered)}
        >
          Завершить ход ➔
        </button>
      </div>
    </>
  

      {/* Модалки */}
      {diceResultModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center' }}>
            <h2>🎲 РЕЗУЛЬТАТ БРОСКА</h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', margin: '20px 0' }}>
              {renderDiceFace(diceResultModal.d1)}
              {renderDiceFace(diceResultModal.d2)}
            </div>
            <p style={{ fontSize: '20px', color: '#ffd700', fontWeight: 'bold', margin: '15px 0' }}>
              Всего выпало: {diceResultModal.total} шаг(ов)
            </p>
            <button className="approve-btn" onClick={handleDiceResultOk}>ОК</button>
          </div>
        </div>
      )}

      {setupInputModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{!players[activePlayerIndex].goal ? `🎯 НОВАЯ ЦЕЛЬ: ${players[activePlayerIndex].name}` : `📜 ПРАВИЛО ДЛЯ: ${players[activePlayerIndex].name}`}</h2>
            <p className="question-text">
              {!players[activePlayerIndex].goal ? 'С каким запросом ты заходишь после возвращения в Старт?' : 'Напиши свое правило для игры:'}
            </p>
            <input 
              type="text" 
              value={tempInputValue} 
              onChange={(e) => setTempInputValue(e.target.value)}
              placeholder={!players[activePlayerIndex].goal ? 'Моя цель...' : 'Мое правило...'}
              style={{ width: '100%', padding: '10px', background: '#130101', border: '2px solid #ffd700', color: '#ffd700', borderRadius: '6px', marginBottom: '15px', boxSizing: 'border-box' }}
            />
            <button className="approve-btn" onClick={handleSaveSetupInput}>Сохранить</button>
          </div>
        </div>
      )}

      {currentQuestion && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>🎴 КАРТА: {currentQuestion.cell} {currentQuestion.isMultiple && '(2 карточки застрявшего)'}</h2>
            {currentQuestion.isMultiple ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '20px 0' }}>
                {currentQuestion.text.map((cardText, idx) => (
                  <div key={idx} style={{ fontSize: '16px', color: '#fff', background: 'rgba(255,215,0,0.1)', padding: '12px', borderLeft: '4px solid #ffd700', whiteSpace: 'pre-line' }}>
                    <b>Карточка {idx + 1}:</b><br/>{cardText}
                  </div>
                ))}
              </div>
            ) : (
              <p className="question-text" style={{ fontSize: '18px', color: '#fff', margin: '20px 0', background: 'rgba(255,215,0,0.1)', padding: '15px', borderLeft: '4px solid #ffd700', whiteSpace: 'pre-line' }}>
                {currentQuestion.text}
              </p>
            )}
            <button className="approve-btn" onClick={() => setCurrentQuestion(null)}>Закрыть карточку</button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content new-action-modal">
            <h2>⚡ НОВОЕ ДЕЙСТВИЕ (动)</h2>
            <p style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '16px', margin: '10px 0' }}>
              Игрок: {players.find(p => p.id === pendingActionPlayer)?.name}
            </p>
            <p>Введите новое осознанное действие:</p>
            <input 
              type="text" 
              value={newActionText} 
              onChange={(e) => setNewActionText(e.target.value)}
              placeholder="Я выбираю..."
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button className="approve-btn" onClick={handleApproveNewAction}>Подтвердить</button>
              <button className="reject-btn" onClick={handleRejectNewAction}>В Старт</button>
            </div>
          </div>
        </div>
      );
    }
   


export default GameBoard;
