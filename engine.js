/* Jyotish engine — calculations and interpretation rules drawn from
   P.V.R. Narasimha Rao, "Vedic Astrology: An Integrated Approach" (2000).
   Astronomy via astronomy-engine (global `Astronomy`). */
(function (root) {
'use strict';
const AE = root.Astronomy || (typeof require !== 'undefined' ? require('astronomy-engine') : null);

// ---------- basic tables ----------
const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SANSK = ['Mesha','Vrishabha','Mithuna','Karkataka','Simha','Kanya','Thula','Vrischika','Dhanus','Makara','Kumbha','Meena'];
const SAB = ['Ar','Ta','Ge','Cn','Le','Vi','Li','Sc','Sg','Cp','Aq','Pi'];
const PL = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const PAB = {Sun:'Su',Moon:'Mo',Mars:'Ma',Mercury:'Me',Jupiter:'Ju',Venus:'Ve',Saturn:'Sa',Rahu:'Ra',Ketu:'Ke'};
const SEVEN = PL.slice(0,7);
const EIGHT = PL.slice(0,8);
const SIGN_LORD = ['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
const ORD = n => n + (['th','st','nd','rd'][((n%100)-20)%10] || ['th','st','nd','rd'][n%100] || 'th');

// Table 6: dignities
const EXALT = {Sun:[0,10],Moon:[1,3],Mars:[9,28],Mercury:[5,15],Jupiter:[3,5],Venus:[11,27],Saturn:[6,20],Rahu:[2,null],Ketu:[8,null]};
const OWN = {Sun:[4],Moon:[3],Mars:[0,7],Mercury:[2,5],Jupiter:[8,11],Venus:[1,6],Saturn:[9,10],Rahu:[10],Ketu:[7]};
const MT = {Sun:4,Moon:1,Mars:0,Mercury:5,Jupiter:8,Venus:6,Saturn:10,Rahu:5,Ketu:11};

// Table 7: natural relationships
const NAT = {
  Sun:{f:['Moon','Mars','Jupiter'],n:['Mercury'],e:['Venus','Saturn']},
  Moon:{f:['Sun','Mercury'],n:['Mars','Jupiter','Venus','Saturn'],e:[]},
  Mars:{f:['Sun','Moon','Jupiter'],n:['Venus','Saturn'],e:['Mercury']},
  Mercury:{f:['Sun','Venus'],n:['Mars','Jupiter','Saturn'],e:['Moon']},
  Jupiter:{f:['Sun','Moon','Mars'],n:['Saturn'],e:['Mercury','Venus']},
  Venus:{f:['Mercury','Saturn'],n:['Mars','Jupiter'],e:['Sun','Moon']},
  Saturn:{f:['Mercury','Venus'],n:['Jupiter'],e:['Sun','Moon','Mars']}
};

// Table 2: nakshatras (name, Vimsottari lord, deity)
const NAKS = [
 ['Aswini','Ketu','Aswini Kumara'],['Bharani','Venus','Yama'],['Krittika','Sun','Agni'],['Rohini','Moon','Brahma'],
 ['Mrigasira','Mars','Moon'],['Aardra','Rahu','Shiva'],['Punarvasu','Jupiter','Aditi'],['Pushyami','Saturn','Jupiter'],
 ['Aasresha','Mercury','Rahu'],['Makha','Ketu','Sun'],['Poorva Phalguni','Venus','Aryaman'],['Uttara Phalguni','Sun','Sun'],
 ['Hasta','Moon','Viswakarma'],['Chitra','Mars','Vaayu'],['Swaati','Rahu','Indra'],['Visaakha','Jupiter','Mitra'],
 ['Anooraadha','Saturn','Indra'],['Jyeshtha','Mercury','Nirriti'],['Moola','Ketu','Varuna'],['Poorvaashaadha','Venus','Viswadeva'],
 ['Uttaraashaadha','Sun','Brahma'],['Sravanam','Moon','Vishnu'],['Dhanishtha','Mars','Vasu'],['Satabhishak','Rahu','Varuna'],
 ['Poorvaabhaadra','Jupiter','Ajacharana'],['Uttaraabhaadra','Saturn','Ahirbudhanya'],['Revati','Mercury','Pooshan']
];
// Table 38
const VIM_ORDER = ['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];
const VIM_YEARS = {Ketu:7,Venus:20,Sun:6,Moon:10,Mars:7,Rahu:18,Jupiter:16,Saturn:19,Mercury:17};

// Table 3, 5, 1.3.10
const TITHIS = ['Pratipat','Dwitiya','Tritiya','Chaturthi','Panchami','Shashti','Saptami','Ashtami','Navami','Dasami','Ekadasi','Dwadasi','Trayodasi','Chaturdasi'];
const YOGAS27 = [['Vishkambha','Door bolt / supporting pillar'],['Preeti','Love, affection'],['Aayushmaan','Long-lived'],['Saubhaagya','Good fortune'],['Sobhana','Splendid, bright'],['Atiganda','Great danger'],['Sukarman','One with good deeds'],['Dhriti','Firmness'],['Shoola','Pain'],['Ganda','Danger'],['Vriddhi','Growth'],['Dhruva','Fixed, constant'],['Vyaaghaata','Great blow'],['Harshana','Cheerful'],['Vajra','Diamond (strong)'],['Siddhi','Accomplishment'],['Vyatipaata','Great fall'],['Variyan','Chief, best'],['Parigha','Obstacle'],['Shiva','Purity'],['Siddha','Accomplished'],['Saadhya','Possible'],['Subha','Auspicious'],['Sukla','White, bright'],['Brahma','Good knowledge and purity'],['Indra','Ruler of gods'],['Vaidhriti','A class of gods']];
const KARANAS = ['Bava','Balava','Kaulava','Taitula','Garija','Vanija','Vishti'];
const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const WEEKDAY_LORD = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];

// ---------- chapter 2: rasis ----------
const RASI = [
 {el:'Fire',q:'Movable',g:'Rajasic',body:'head',dosha:'Pitta',ind:'dynamic, enterprising, valiant, impulsive, restless, hasty; a natural leader who can be overbearing'},
 {el:'Earth',q:'Fixed',g:'Rajasic',body:'face',dosha:'Vata',ind:'beautiful, stable, loyal, faithful, luxurious; can be sluggish'},
 {el:'Air',q:'Dual',g:'Tamasic',body:'arms and chest',dosha:'mixed',ind:'curious, learned, jovial; drawn to communication, writing, schools and study'},
 {el:'Water',q:'Movable',g:'Sattwic',body:'heart and breast',dosha:'Kapha',ind:'emotional, deeply attached, mother-like, sensitive; linked with food and home'},
 {el:'Fire',q:'Fixed',g:'Sattwic',body:'stomach and digestion',dosha:'Pitta',ind:'royal, proud, domineering, authoritative; can be insolent'},
 {el:'Earth',q:'Dual',g:'Tamasic',body:'hips',dosha:'Vata',ind:'intelligent, sharp, a good speaker, tactful and discreet; can be nervous'},
 {el:'Air',q:'Movable',g:'Rajasic',body:'lower abdomen and groin',dosha:'mixed',ind:'balanced, wise, a good talker; suited to business, trade, banking and entertainment'},
 {el:'Water',q:'Fixed',g:'Rajasic',body:'private parts',dosha:'Kapha',ind:'secretive, scheming, occult-minded, sensitive; the best friend or the worst enemy'},
 {el:'Fire',q:'Dual',g:'Sattwic',body:'thighs',dosha:'Pitta',ind:'upright, honest, genial; royal bearing, linked with law and government; a gambling streak'},
 {el:'Earth',q:'Movable',g:'Tamasic',body:'knees',dosha:'Vata',ind:'witty, perfectionist, patient, cautious, secretive, pragmatic; a good organiser'},
 {el:'Air',q:'Fixed',g:'Tamasic',body:'ankles',dosha:'mixed',ind:'hard-working, stoic, honest; drawn to charity and philosophy'},
 {el:'Water',q:'Dual',g:'Sattwic',body:'feet',dosha:'Kapha',ind:'emotional, intuitive, honest, talkative, timid, irresolute; can be lazy'}
];
const ELEMENT_EMOTION = {Fire:'normally angry, aggressive or determined',Earth:'balanced, logical and stable',Air:'unstable and wandering in emotions',Water:'imaginative and creative in mind'};

// ---------- chapter 3: planets; chapter 8 table 16; chapter 34 remedies ----------
const PD = {
 Sun:{gov:'the soul',nature:'malefic',guna:'Sattwic',el:'Fire',role:'king',dhatu:'bones',taste:'pungent',
   kar:'self, soul, constitution and health; fame and power; father and boss; career and achievements',
   gem:'Ruby',metal:'Gold',deed:'visit a temple, donate to a temple or help run one',grain:'wheat',deity:'Shiva, Rama',
   day:'Sunday',count:'6,000',sloka:'जपाकुसुमसंकाशम् काश्यपेयम् महाद्युतिम् । तमोरिम् सर्वपापघ्नम् प्रणतोऽस्मि दिवाकरम् ॥',mantra:'ॐ ह्रीं ह्रीं सूर्याय नमः'},
 Moon:{gov:'the mind',nature:'benefic when waxing, malefic when waning',guna:'Sattwic',el:'Water',role:'king',dhatu:'blood',taste:'saline',
   kar:'mind; mother and peace of mind; friends',
   gem:'White pearl',metal:'Gold',deed:'donate to a music institute or help a woman in need',grain:'rice',deity:'Gauri, Lalita, Saraswati, Krishna',
   day:'Monday',count:'10,000',sloka:'दधिशंखतुषाराभम् क्षीरोदार्णवसंभवम् । नमामि शशिनम् सोमम् शंभोर्मकुटभूषणम् ॥',mantra:'ॐ ऐं क्लीं सोमाय नमः'},
 Mars:{gov:'strength',nature:'malefic',guna:'Tamasic',el:'Fire',role:'army chief',dhatu:'marrow',taste:'bitter',
   kar:'courage and younger siblings; real estate; logic (Nyaya) and speculation; enemies, diseases, accidents and loans',
   gem:'Red coral',metal:'Copper',deed:'take up physical exercise or donate to a school gym',grain:'toor dal',deity:'Hanuman, Rudra, Kartikeya (Subrahmanya), Narasimha',
   day:'Tuesday',count:'7,000',sloka:'धरणीगर्भसंभूतम् विद्युत्कांतिसमप्रभम् । कुमारम् शक्तिहस्तम् तम् मंगळम् प्रणमाम्यहम् ॥',mantra:'ॐ हूं श्रीं मंगळाय नमः'},
 Mercury:{gov:'speech',nature:'benefic alone or with benefics, malefic with malefics',guna:'Rajasic',el:'Earth',role:'prince',dhatu:'skin',taste:'mixed',
   kar:'speech; learning; memory, scholarship and students; work, achievements and honours; credit',
   gem:'Emerald',metal:'Silver or platinum',deed:'donate to an organisation of scholars or seek a scholar’s blessings',grain:'moong dal',deity:'Vishnu, Narayana, Buddha',
   day:'Wednesday',count:'17,000',sloka:'प्रियंगुकलिकाश्यामम् रूपेणाप्रतिमम् बुधम् । सौम्यम् सौम्यगुणोपेतम् तम् बुधम् प्रणमाम्यहम् ॥',mantra:'ॐ ऐं स्त्रीं बुधाय नमः'},
 Jupiter:{gov:'knowledge and happiness',nature:'benefic',guna:'Sattwic',el:'Ether',role:'minister',dhatu:'fat',taste:'sweet',
   kar:'family and wealth; traditional learning; children and intelligence; teacher, religion and fortune; elder brother and gains',
   gem:'Yellow sapphire',metal:'Gold',deed:'respect and donate to a learned priest or teacher',grain:'chick peas',deity:'Hayagreeva, Vishnu, Parameswara, Dattatreya, any guru',
   day:'Thursday',count:'16,000',sloka:'देवानाम् च ऋषीणाम् च गुरुम् कांचनसन्निभम् । बुद्धिभूतम् त्रिलोकेशम् तम् नमामि बृहस्पतिम् ॥',mantra:'ॐ ऐं क्लीं बृहस्पतये नमः'},
 Venus:{gov:'potency',nature:'benefic',guna:'Rajasic',el:'Water',role:'minister',dhatu:'reproductive fluids',taste:'sour',
   kar:'vehicles; spouse and marital bliss; pleasures of the bed',
   gem:'Diamond',metal:'Silver or platinum',deed:'read poetry or help a poet',grain:'a whitish grain',deity:'Lakshmi, Parvati',
   day:'Friday',count:'20,000',sloka:'हिमकुंदमृणाळाभम् दैत्यानाम् परमम् गुरुम् । सर्वशास्त्रप्रवक्तारम् भार्गवम् प्रणमाम्यहम् ॥',mantra:'ॐ ह्रीं श्रीं शुक्राय नमः'},
 Saturn:{gov:'grief',nature:'malefic',guna:'Tamasic',el:'Air',role:'servant',dhatu:'muscles',taste:'astringent',
   kar:'following; servants; longevity and troubles; losses and hospitalisation; livelihood and karma',
   gem:'Blue sapphire',metal:'Iron (or silver)',deed:'do some physical labour or help people who live by manual labour',grain:'sesame seeds',deity:'Vishnu, Brahma',
   day:'Saturday',count:'19,000',sloka:'नीलांजनसमाभासम् रविपुत्रम् यमाग्रजम् । छायामार्तांडसंभूतम् तम् नमामि शनैश्चरम् ॥',mantra:'ॐ ऐं ह्रीं श्रीं शनैश्चराय नमः'},
 Rahu:{gov:'obsession and the unconventional',nature:'malefic',guna:'Tamasic',el:'Air',role:'army',dhatu:null,taste:null,
   kar:'accidents; occult knowledge; pilgrimages and going abroad; path-breaking innovation',
   gem:'Hessonite (gomedh)',metal:'Silver',deed:'donate to a research organisation or go on a pilgrimage',grain:'black gram (urad dal)',deity:'Durga, Narasimha',
   day:'Saturday',count:'18,000',sloka:'अर्धकायम् महावीर्यम् चन्द्रादित्यविमर्दनम् । सिंहिकागर्भसंभूतम् तम् राहुम् प्रणमाम्यहम् ॥',mantra:'ॐ ऐं ह्रीं राहवे नमः'},
 Ketu:{gov:'detachment and liberation',nature:'malefic',guna:'Tamasic',el:'Fire',role:'army',dhatu:null,taste:null,
   kar:'occult knowledge; pilgrimages and going abroad; moksha (liberation)',
   gem:'Cat’s eye',metal:'Silver',deed:'meditate',grain:null,deity:'Ganesa',
   day:'Tuesday',count:'7,000',sloka:'पलाशपुष्पसंकाशम् तारकाग्रहमस्तकम् । रौद्रम् रौद्रात्मकम् घोरम् तम् केतुम् प्रणमाम्यहम् ॥',mantra:'ॐ ऐं क्लीं केतवे नमः'}
};
// Table 12: houses signified by planets
const GRAHA_HOUSES = {Sun:[9,10,11],Moon:[4,1,2,11,9],Mars:[3],Mercury:[6],Jupiter:[5],Venus:[7],Saturn:[8,12]};
// AK meanings (ch.8 gives Rahu and Mercury; others follow the planets' natures in ch.3)
const AK_TEXT = {
 Sun:'a soul that seeks to shine and lead with integrity; self-respect and dharma matter deeply',
 Moon:'a soul driven by feeling and care for others; nurturing, popular and emotionally sensitive',
 Mars:'a soul of courage and drive; a fighter and doer who must learn to direct aggression well',
 Mercury:'intellectuals, orators, journalists and good communicators; people who can move with anyone and are liked by everyone — or, when weak, fickle-minded people',
 Jupiter:'a soul drawn to wisdom, teaching and dharma; a natural counsellor or guide',
 Venus:'a soul drawn to beauty, art, relationships and refinement',
 Saturn:'a soul shaped by hard work, service, patience and discipline; lessons often come through struggle',
 Rahu:'a spiritually advanced person or a saint on one hand, a revolutionary or an outcast on the other'
};

// chapter 7: houses
const HOUSE = [null,
 {n:'Self',sig:'physical body, appearance, head, intelligence, strength, energy, fame and success'},
 {n:'Wealth',sig:'wealth, assets, family, speech, eyes, face, voice and food'},
 {n:'Courage',sig:'younger siblings, confidants, courage, mental strength, communication skills, creativity, short travels'},
 {n:'Home',sig:'mother, vehicles, house, lands, motherland, education, comforts, happiness and peace of mind'},
 {n:'Intelligence',sig:'children, merit from past lives, intelligence, scholarship, devotion, mantras, love, judgement and speculation'},
 {n:'Obstacles',sig:'enemies, service, health and diseases, injuries, mental tension and accidents'},
 {n:'Partnership',sig:'marriage, spouse, passion, partners, business and long journeys'},
 {n:'Transformation',sig:'longevity, debts, disease, inheritance, occult studies, secrets, windfalls and disgrace'},
 {n:'Fortune',sig:'father, teacher, fortune, religion, spirituality, higher studies, foreign fortune, principles and dharma'},
 {n:'Career',sig:'profession, career, karma (action), conduct in society, fame, honours and dignity'},
 {n:'Gains',sig:'elder siblings, income, gains, realisation of hopes and friends'},
 {n:'Loss & release',sig:'losses, expenditure, hospitalisation, sleep, meditation, donations, foreign residence and moksha'}
];
const KENDRA=[1,4,7,10], TRIKONA=[1,5,9], DUSTHANA=[6,8,12], UPACHAYA=[3,6,10,11];

// Table 30: functional nature by lagna [yogakaraka, benefics, neutrals, malefics]
const FUNC = [
 [null,['Sun','Mars','Jupiter'],[],['Mercury','Venus','Saturn']],
 ['Saturn',['Sun','Mercury','Saturn'],['Mars'],['Moon','Jupiter','Venus']],
 [null,['Venus'],['Moon','Mercury','Saturn'],['Sun','Mars','Jupiter']],
 ['Mars',['Moon','Mars','Jupiter'],['Sun','Saturn'],['Mercury','Venus']],
 ['Mars',['Sun','Mars','Jupiter'],['Moon'],['Mercury','Venus','Saturn']],
 [null,['Mercury','Venus'],['Sun','Saturn'],['Moon','Mars','Jupiter']],
 ['Saturn',['Mercury','Venus','Saturn'],[],['Sun','Mars','Jupiter']],
 [null,['Moon','Jupiter'],['Sun','Mars'],['Mercury','Venus','Saturn']],
 [null,['Sun','Mars'],['Moon','Mercury','Jupiter'],['Venus','Saturn']],
 ['Venus',['Venus','Mercury','Saturn'],['Sun'],['Mars','Jupiter']],
 ['Venus',['Venus','Saturn'],['Sun','Mercury'],['Moon','Mars','Jupiter']],
 [null,['Moon','Mars'],['Jupiter'],['Sun','Mercury','Venus','Saturn']]
];
// Table 31: baadhakas
const BAADHAKA = [10,9,8,1,0,11,4,3,2,7,6,5];

// Tables 53-59: transits from janma rasi [good?, results]
const TRANSIT = {
 Sun:[[0,'Financial loss, many travels, discomfort'],[0,'Unhappiness, eye troubles, fear'],[1,'Wealth, good health, victory'],[0,'Marital disharmony, loss of name'],[0,'Bad health, fear from enemies'],[1,'Success over enemies, good health'],[0,'Travels, physical pain'],[0,'Disease, setbacks in marriage'],[0,'Mental worries, obstacles'],[1,'Success, honours, gains'],[1,'Good health, prosperity, honours'],[0,'Expenditure, losses']],
 Mars:[[0,'Troubles, bodily afflictions'],[0,'Accidents, losses, thefts, quarrels'],[1,'Gains, power, wealth'],[0,'Stomach problems, fevers, bad health'],[0,'Troubles from enemies, trouble with children'],[1,'Success over enemies, wealth, well-being'],[0,'Quarrels, marital troubles, eye problems'],[0,'Worries, accidents, bad name, losses'],[0,'Losses, insults, illness'],[0,'Change of place, unexpected wealth'],[1,'Authority, gains, good name'],[0,'Expenses, quarrels with spouse, diseases']],
 Mercury:[[0,'Quarrels, losses, poor advice'],[1,'Success, wealth, gains'],[0,'Wandering, losses, trouble from authorities'],[1,'Prosperity in family, gains'],[0,'Quarrels with spouse and children, suffering'],[1,'Renown, success, ornaments'],[0,'Quarrels, mental discomfort, addictions'],[1,'Childbirth, happiness, gains, success'],[0,'Mental worries, obstacles'],[1,'Money, happiness, domestic harmony, success'],[1,'Childbirth, happiness, wealth'],[0,'Disease, domestic disharmony, losses']],
 Jupiter:[[0,'Loss of money and focus, wandering'],[1,'Happiness, domestic harmony, success'],[0,'Obstacles, loss of position, travels'],[0,'Troubles, defeat, losses'],[1,'Childbirth, intelligence, prosperity, wealth'],[0,'Mental uneasiness, enemies, worries'],[1,'Health, happiness, pleasures, well-being'],[0,'Disease, illness, grief'],[1,'Success, wealth, childbirth, religiousness'],[0,'Loss of position and money, ill-health, wandering'],[1,'Recovery of health and position, happiness'],[0,'Fall from grace, misconduct, grief']],
 Venus:[[1,'Comforts, pleasures, happiness, good spirits'],[1,'Money, fortune, pleasures, childbirth'],[1,'Respect, wealth, good spirits'],[1,'Prosperity, comforts'],[1,'Fame, power, good name'],[0,'Loss of fame, bad name, quarrels'],[0,'Humiliation, disease, troubles'],[0,'Fears, mental worries, injuries'],[1,'Fortune, luxuries, marital happiness'],[0,'Troubles, unpleasant events, disgrace'],[1,'Gains, happiness, prosperity, comforts'],[0,'New friends, money, pleasures, gains']],
 Saturn:[[0,'Worries, fear of confinement, foreign trips'],[0,'Physical weakness, discomfort, unhappiness'],[1,'Wealth, health, happiness, all-round success'],[0,'Stomach problems, separation from family'],[0,'Separation from children, uneasiness, quarrels'],[1,'Freedom from disease and enemies, success'],[0,'Wandering, quarrels with spouse, trouble from authorities'],[0,'Suffering, loss of status and balance'],[0,'Diseases, suffering, loss of status'],[0,'Loss of money, bad name, changes in career, laziness'],[1,'Wealth, success, gains'],[0,'Grief, misery, losses, ill-health, frustration']]
};
// Table 54: Moon's transit from janma rasi
TRANSIT.Moon = [[1,'Comfort, good spirits'],[0,'Obstacles, losses'],[1,'Gains, happiness'],[0,'Lack of peace of mind, distrust'],[0,'Failures, disappointments, sadness'],[1,'Happiness, health, wealth'],[1,'Respect, gains'],[0,'Losses, tension, worries'],[0,'Mental uneasiness'],[1,'Success, gains, authority'],[1,'Prosperity, comforts, gains'],[0,'Injuries, expenditure, sadness']];
TRANSIT.Rahu = TRANSIT.Saturn; TRANSIT.Ketu = TRANSIT.Mars; // book: Rahu like Saturn, Ketu like Mars

// ---------- math helpers ----------
const norm = x => ((x % 360) + 360) % 360;
const R = Math.PI/180;
const signOf = lon => Math.floor(norm(lon)/30);
const degIn = lon => norm(lon) % 30;
const hFrom = (fromSign, toSign) => ((toSign - fromSign + 12) % 12) + 1; // house count
const fmtDeg = d => { const t = Math.floor(d); const m = Math.floor((d - t)*60); return `${t}°${String(m).padStart(2,'0')}′`; };

function ayanamsaLahiri(daysFromJ2000) {
  const T = daysFromJ2000/36525;
  return 23.857092 + (5028.796195*T + 1.1054348*T*T)/3600;
}
function meanNode(T) { // Meeus, tropical, T = Julian centuries TT
  return norm(125.0445479 - 1934.1362891*T + 0.0020754*T*T + T*T*T/467441 - T*T*T*T/60616000);
}
function tropLon(body, time) {
  if (body === 'Moon') return AE.EclipticGeoMoon(time).lon;
  return AE.Ecliptic(AE.GeoVector(body, time, true)).elon;
}
function ascendant(time, lat, lon) {
  const lst = norm(AE.SiderealTime(time)*15 + lon) * R;
  const eps = AE.e_tilt(time).tobl * R;
  const phi = lat * R;
  return norm(Math.atan2(Math.cos(lst), -(Math.sin(lst)*Math.cos(eps) + Math.tan(phi)*Math.sin(eps))) / R);
}

// divisional charts (ch.6)
function navamsaSign(lon) {
  const s = signOf(lon), part = Math.floor(degIn(lon)/(30/9));
  const start = [0,9,6,3][s % 4]; // fiery->Ar, earthy->Cp, airy->Li, watery->Cn
  return (start + part) % 12;
}
function saptamsaSign(lon) { // odd: from itself, even: from 7th
  const s = signOf(lon), part = Math.floor(degIn(lon)/(30/7));
  return ((s % 2 === 0 ? s : s + 6) + part) % 12;
}
function chaturthamsaSign(lon) { // parts go to 1st, 4th, 7th, 10th
  const s = signOf(lon), part = Math.floor(degIn(lon)/7.5);
  return (s + part*3) % 12;
}
function dasamsaSign(lon) {
  const s = signOf(lon), part = Math.floor(degIn(lon)/3);
  const start = s % 2 === 0 ? s : (s + 8) % 12; // odd sign: itself; even: 9th from it
  return (start + part) % 12;
}

// ---------- chart computation ----------
function computeChart(opt) {
  // opt: {utcMs, lat, lon, yearDays}
  const date = new Date(opt.utcMs);
  const time = AE.MakeTime(date);
  const ay = ayanamsaLahiri(time.tt);
  const T = time.tt/36525;
  const P = {};
  for (const b of SEVEN) {
    const l0 = tropLon(b, time);
    const lA = tropLon(b, time.AddDays(-0.25)), lB = tropLon(b, time.AddDays(0.25));
    let sp = norm(lB - lA + 180) - 180; // deg per 0.5 day
    P[b] = {lon: norm(l0 - ay), speed: sp*2, retro: b !== 'Sun' && b !== 'Moon' && sp < 0};
  }
  const rahu = norm(meanNode(T) - ay);
  P.Rahu = {lon: rahu, speed: -0.053, retro: true};
  P.Ketu = {lon: norm(rahu + 180), speed: -0.053, retro: true};
  const asc = norm(ascendant(time, opt.lat, opt.lon) - ay);

  const lagna = signOf(asc);
  for (const b of PL) {
    const p = P[b];
    p.name = b; p.sign = signOf(p.lon); p.deg = degIn(p.lon);
    p.house = hFrom(lagna, p.sign);
    p.nak = Math.floor(p.lon/(360/27)); p.pada = Math.floor((p.lon % (360/27))/(360/108)) + 1;
    p.d9 = navamsaSign(p.lon); p.d10 = dasamsaSign(p.lon); p.d7 = saptamsaSign(p.lon); p.d4 = chaturthamsaSign(p.lon);
    p.vargottama = p.d9 === p.sign;
  }
  const L = {lon: asc, sign: lagna, deg: degIn(asc), nak: Math.floor(asc/(360/27)), pada: Math.floor((asc % (360/27))/(360/108)) + 1,
             d9: navamsaSign(asc), d10: dasamsaSign(asc), d7: saptamsaSign(asc), d4: chaturthamsaSign(asc)};

  const C = {date, time, ay, P, L, lagna, lat: opt.lat, lon: opt.lon, yearDays: opt.yearDays || 365.2425};
  // waxing / waning Moon
  const elong = norm(P.Moon.lon - P.Sun.lon);
  C.waxing = elong < 180;
  // Mercury: benefic if alone or with more benefics
  const withMe = PL.filter(b => b !== 'Mercury' && P[b].sign === P.Mercury.sign);
  const benCnt = withMe.filter(b => ['Jupiter','Venus'].includes(b) || (b === 'Moon' && C.waxing)).length;
  const malCnt = withMe.length - benCnt;
  C.mercuryBenefic = malCnt <= benCnt;
  C.natBenefic = b => b === 'Jupiter' || b === 'Venus' || (b === 'Moon' && C.waxing) || (b === 'Mercury' && C.mercuryBenefic);

  // combustion (classical orbs; the book only says "too close to Sun")
  const ORB = {Moon:12,Mars:17,Mercury:P.Mercury.retro?12:14,Jupiter:11,Venus:P.Venus.retro?8:10,Saturn:15};
  for (const b of Object.keys(ORB)) {
    const d = Math.abs(norm(P[b].lon - P.Sun.lon + 180) - 180);
    P[b].combust = d < ORB[b]; P[b].sunDist = d;
  }
  // lordships
  for (const b of PL) P[b].lordOf = [];
  for (let h = 1; h <= 12; h++) P[SIGN_LORD[(lagna + h - 1) % 12]].lordOf.push(h);
  // co-lords (Scorpio: Ketu, Aquarius: Rahu)
  for (let h = 1; h <= 12; h++) { const s = (lagna + h - 1) % 12; if (s === 7) P.Ketu.lordOf.push(h); if (s === 10) P.Rahu.lordOf.push(h); }

  // relationships & dignity
  for (const b of PL) P[b].dignity = dignity(C, b);
  // functional nature
  const F = FUNC[lagna];
  C.func = {};
  for (const b of SEVEN) {
    let f = F[1].includes(b) ? 'benefic' : F[2].includes(b) ? 'neutral' : F[3].includes(b) ? 'malefic' : null;
    if (b === 'Moon' && !f) f = C.waxing ? 'malefic' : 'neutral';
    if (F[0] === b) f = 'yogakaraka';
    C.func[b] = f;
  }
  C.func.Rahu = 'node'; C.func.Ketu = 'node';

  // aspects
  C.grahaAspects = {}; // target sign -> [planets]
  for (let s = 0; s < 12; s++) C.grahaAspects[s] = [];
  for (const b of SEVEN) for (const off of aspectOffsets(b)) C.grahaAspects[(P[b].sign + off - 1) % 12].push(b);
  C.rasiAspectsOf = rasiAspects;

  // chara karakas (ch.8)
  const adv = EIGHT.map(b => [b, b === 'Rahu' ? 30 - P[b].deg : P[b].deg]).sort((a,b) => b[1]-a[1]);
  const KN = ['AK','AmK','BK','MK','PiK','PK','GK','DK'];
  const KFULL = {AK:'Atma karaka (self)',AmK:'Amatya karaka (advisors)',BK:'Bhratri karaka (siblings)',MK:'Matri karaka (mother)',PiK:'Pitri karaka (father)',PK:'Putra karaka (children)',GK:'Jnaati karaka (rivals)',DK:'Dara karaka (spouse)'};
  C.karakas = adv.map((a,i) => ({planet:a[0], code:KN[i], full:KFULL[KN[i]], adv:a[1]}));
  C.AK = C.karakas[0].planet;

  // arudha padas (ch.9)
  C.arudha = {};
  for (let h = 1; h <= 12; h++) C.arudha[h] = arudhaOf(C, (lagna + h - 1) % 12);

  // panchanga (ch.1)
  C.panchanga = panchanga(C);
  C.yogas = findYogas(C);
  C.dasa = vimsottari(C);
  return C;
}

function strongerLord(C, s) { // for Sc (Mars/Ketu) and Aq (Saturn/Rahu)
  const pair = s === 7 ? ['Mars','Ketu'] : s === 10 ? ['Saturn','Rahu'] : null;
  if (!pair) return SIGN_LORD[s];
  const [a, b] = pair, P = C.P;
  // Parasara: if one owner occupies the sign, the other acts as main owner
  if (P[a].sign === s && P[b].sign !== s) return b;
  if (P[b].sign === s && P[a].sign !== s) return a;
  const cnt = x => PL.filter(y => y !== x && P[y].sign === P[x].sign).length;
  if (cnt(a) !== cnt(b)) return cnt(a) > cnt(b) ? a : b;
  const adv = x => x === 'Rahu' || x === 'Ketu' ? 30 - P[x].deg : P[x].deg;
  return adv(a) >= adv(b) ? a : b;
}
function arudhaOf(C, s) {
  const lord = strongerLord(C, s);
  const ls = C.P[lord].sign;
  const n = hFrom(s, ls);
  let a = (ls + n - 1) % 12;
  const fromOrig = hFrom(s, a);
  if (fromOrig === 1 || fromOrig === 7) a = (a + 9) % 12;
  return a;
}

function aspectOffsets(b) {
  if (b === 'Mars') return [4,7,8];
  if (b === 'Jupiter') return [5,7,9];
  if (b === 'Saturn') return [3,7,10];
  if (b === 'Rahu' || b === 'Ketu') return [];
  return [7];
}
function rasiAspects(s) { // ch.10.3
  const q = s % 3; // 0 movable, 1 fixed, 2 dual
  const out = [];
  for (let t = 0; t < 12; t++) {
    if (t === s) continue;
    const tq = t % 3;
    if (q === 2 && tq === 2) out.push(t);
    if (q === 0 && tq === 1 && t !== (s + 1) % 12) out.push(t);
    if (q === 1 && tq === 0 && t !== (s + 11) % 12) out.push(t);
  }
  return out;
}

function compoundRel(C, a, b) { // how planet a regards planet b
  if (!NAT[a] || !NAT[b]) return null;
  const nat = NAT[a].f.includes(b) ? 1 : NAT[a].e.includes(b) ? -1 : 0;
  const h = hFrom(C.P[a].sign, C.P[b].sign);
  const tmp = [2,3,4,10,11,12].includes(h) ? 1 : -1;
  const v = nat + tmp;
  return ['Adhisatru','Satru','Sama','Mitra','Adhimitra'][v + 2];
}
function dignity(C, b) {
  const p = C.P[b], s = p.sign, d = p.deg;
  if (b === 'Moon' && s === 1) return d < 3 ? 'exalted' : 'moolatrikona';
  if (b === 'Mercury' && s === 5) return d < 15 ? 'exalted' : d < 20 ? 'moolatrikona' : 'own';
  if (EXALT[b][0] === s) return 'exalted';
  if ((EXALT[b][0] + 6) % 12 === s) return 'debilitated';
  if (MT[b] === s) {
    const lim = {Sun:20,Mars:12,Jupiter:10,Venus:15,Saturn:20}[b];
    if (lim === undefined || d < lim) return 'moolatrikona';
    return 'own';
  }
  if (OWN[b].includes(s)) return 'own';
  const lord = SIGN_LORD[s];
  const rel = compoundRel(C, b, lord);
  if (!rel) return 'neutral';
  if (rel === 'Adhimitra') return 'great friend’s sign';
  if (rel === 'Mitra') return 'friendly';
  if (rel === 'Sama') return 'neutral';
  if (rel === 'Satru') return 'inimical';
  return 'bitter enemy’s sign';
}
const DIG_SCORE = {'exalted':3,'moolatrikona':2.5,'own':2,'great friend’s sign':1.5,'friendly':1,'neutral':0,'inimical':-1,'bitter enemy’s sign':-1.5,'debilitated':-3};
function strong(C, b) { const d = C.P[b].dignity; return ['exalted','moolatrikona','own'].includes(d) && !C.P[b].combust; }
function wellPlaced(C, b) { const d = DIG_SCORE[C.P[b].dignity]; return d >= 0 && !C.P[b].combust && !DUSTHANA.includes(C.P[b].house); }

function panchanga(C) {
  const P = C.P;
  const diff = norm(P.Moon.lon - P.Sun.lon);
  const ti = Math.floor(diff/12); // 0..29
  let tithi;
  if (ti === 14) tithi = 'Sukla Paurnami (Full Moon)';
  else if (ti === 29) tithi = 'Krishna Amavasya (New Moon)';
  else tithi = (ti < 15 ? 'Sukla ' : 'Krishna ') + TITHIS[ti % 15];
  const tithiLord = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu'][ti % 8];
  const yi = Math.floor(norm(P.Sun.lon + P.Moon.lon)/(360/27));
  const k = Math.floor(diff/6);
  const karana = k === 0 ? 'Kimstughna' : k >= 57 ? ['Sakuna','Chatushpada','Naga'][k-57] : KARANAS[(k-1) % 7];
  // weekday counted from sunrise
  let wd = null, sunrise = null;
  try {
    const obs = new AE.Observer(C.lat, C.lon, 0);
    let r = AE.SearchRiseSet(AE.Body.Sun, obs, +1, C.time.AddDays(-1.2), 1.3);
    let last = null;
    while (r && r.ut <= C.time.ut) { last = r; r = AE.SearchRiseSet(AE.Body.Sun, obs, +1, r.AddDays(0.01), 1.2); }
    if (last) {
      sunrise = last.date;
      const localMs = last.date.getTime() + C.lon/15*3600e3; // local mean time day of that sunrise
      wd = new Date(localMs).getUTCDay();
    }
  } catch (e) { /* polar or failure */ }
  if (wd === null) wd = new Date(C.date.getTime() + C.lon/15*3600e3).getUTCDay();
  let hora = null;
  if (sunrise) {
    const hrs = (C.date - sunrise)/3600e3;
    const seq = ['Saturn','Jupiter','Mars','Sun','Venus','Mercury','Moon'];
    const start = seq.indexOf(WEEKDAY_LORD[wd]);
    hora = seq[(start + Math.floor(hrs)) % 7];
  }
  return {tithi, tithiIndex: ti + 1, tithiLord, paksha: ti < 15 ? 'Sukla (waxing)' : 'Krishna (waning)',
    yoga: YOGAS27[yi], karana, weekday: WEEKDAYS[wd], weekdayLord: WEEKDAY_LORD[wd], hora, sunrise,
    nakshatra: NAKS[C.P.Moon.nak], pada: C.P.Moon.pada};
}

// ---------- Vimsottari (ch.16) ----------
function vimsottari(C) {
  const moon = C.P.Moon.lon, span = 360/27;
  const n = Math.floor(moon/span);
  const done = (moon % span)/span;
  const first = NAKS[n][1];
  const yd = C.yearDays*86400e3;
  let idx = VIM_ORDER.indexOf(first);
  let start = C.date.getTime() - done*VIM_YEARS[first]*yd;
  const MD = [];
  for (let i = 0; i < 9; i++) {
    const lord = VIM_ORDER[(idx + i) % 9];
    const len = VIM_YEARS[lord]*yd;
    const md = {lord, start: new Date(start), end: new Date(start + len), ads: []};
    let as = start;
    for (let j = 0; j < 9; j++) {
      const al = VIM_ORDER[(VIM_ORDER.indexOf(lord) + j) % 9];
      const alen = len*VIM_YEARS[al]/120;
      md.ads.push({lord: al, start: new Date(as), end: new Date(as + alen)});
      as += alen;
    }
    MD.push(md); start += len;
  }
  return {MD, balance: (1 - done)*VIM_YEARS[first], first, nak: NAKS[n][0]};
}
function currentDasa(C, when) {
  const t = when.getTime();
  for (const md of C.dasa.MD) if (t >= md.start && t < md.end) {
    for (const ad of md.ads) if (t >= ad.start && t < ad.end) {
      // pratyantardasa
      const len = ad.end - ad.start; let ps = ad.start.getTime(); let pd = null;
      for (let k = 0; k < 9; k++) {
        const pl = VIM_ORDER[(VIM_ORDER.indexOf(ad.lord) + k) % 9];
        const pl2 = len*VIM_YEARS[pl]/120;
        if (t >= ps && t < ps + pl2) { pd = {lord: pl, start: new Date(ps), end: new Date(ps + pl2)}; break; }
        ps += pl2;
      }
      return {md, ad, pd};
    }
  }
  return null;
}

// ---------- yogas (ch.11) ----------
function findYogas(C) {
  const P = C.P, lag = C.lagna, Y = [];
  const lord = h => SIGN_LORD[(lag + h - 1) % 12];
  const inH = (b, hs) => hs.includes(P[b].house);
  const occ = s => PL.filter(b => P[b].sign === s);
  const occ7 = s => SEVEN.filter(b => P[b].sign === s);
  const fromSign = (s, n) => (s + n - 1) % 12;
  const houseOfSign = s => hFrom(lag, s);
  const ben = b => C.natBenefic(b);
  const mal = b => !C.natBenefic(b);
  const conj = (a, b) => P[a].sign === P[b].sign;
  const aspects = (a, b) => aspectOffsets(a).map(o => fromSign(P[a].sign, o)).includes(P[b].sign);
  const mutualAsp = (a, b) => aspects(a, b) && aspects(b, a);
  const exch = (a, b) => OWN[a].includes(P[b].sign) && OWN[b].includes(P[a].sign) && SEVEN.includes(a) && SEVEN.includes(b);
  const assoc = (a, b) => a !== b && (conj(a, b) || mutualAsp(a, b) || exch(a, b));
  const add = (cat, name, def, res, planets, strength) => Y.push({cat, name, def, res, planets: planets || [], strength: strength || 'present'});
  const lagnaLordStrong = strong(C, lord(1)) || inH(lord(1), [1,4,7,10,5,9]) && DIG_SCORE[P[lord(1)].dignity] >= 0;

  // Ravi yogas
  const sunS = P.Sun.sign;
  const s2 = occ7(fromSign(sunS, 2)).filter(b => b !== 'Moon'), s12 = occ7(fromSign(sunS, 12)).filter(b => b !== 'Moon');
  if (s2.length && s12.length) add('Solar (Ravi) yogas','Ubhayachara','Planets other than Moon in both the 2nd and 12th from Sun.','All comforts; a king or an equal.',['Sun',...s2,...s12]);
  else if (s2.length) add('Solar (Ravi) yogas','Vesi','A planet other than Moon in the 2nd from Sun.','A balanced outlook; truthful, tall and sluggish; happy and comfortable even with little wealth.',['Sun',...s2]);
  else if (s12.length) add('Solar (Ravi) yogas','Vosi','A planet other than Moon in the 12th from Sun.','Skilful, charitable, famous, learned and strong.',['Sun',...s12]);
  if (conj('Sun','Mercury')) add('Solar (Ravi) yogas','Budha-Aaditya (Nipuna)','Sun and Mercury together in one sign.','Intelligent and skilful in all works; well known, respected and happy.' + (P.Mercury.combust ? ' Mercury is combust here, so the yoga loses some of its power in the birth chart; it works best where it repeats in the career chart (D-10).' : ''),['Sun','Mercury'], P.Mercury.combust ? 'weakened' : 'present');

  // Chandra yogas
  const moS = P.Moon.sign;
  const m2 = occ7(fromSign(moS, 2)).filter(b => b !== 'Sun'), m12 = occ7(fromSign(moS, 12)).filter(b => b !== 'Sun');
  if (m2.length && m12.length) add('Lunar (Chandra) yogas','Duradhara','Planets other than Sun in both the 2nd and 12th from Moon.','Enjoys many pleasures; charitable; owns wealth and vehicles; has good helpers.',['Moon',...m2,...m12]);
  else if (m2.length) add('Lunar (Chandra) yogas','Sunaphaa','Planets other than Sun in the 2nd from Moon.','Intelligent, wealthy and famous, with self-earned wealth; a king or an equal.',['Moon',...m2]);
  else if (m12.length) add('Lunar (Chandra) yogas','Anaphaa','Planets other than Sun in the 12th from Moon.','Good looks, a body free from disease, good character and reputation; surrounded by comforts.',['Moon',...m12]);
  const nearMoon = [0,1,11].some(o => occ7((moS + o) % 12).some(b => b !== 'Sun' && b !== 'Moon'));
  const kendraOcc = [1,4,7,10].some(h => occ7(fromSign(lag, h)).some(b => b !== 'Moon'));
  if (!nearMoon && !kendraOcc) add('Lunar (Chandra) yogas','Kemadruma','No planets other than Sun in the 1st, 2nd and 12th from Moon, and no planets other than Moon in the quadrants from lagna.','A difficult yoga: luck and learning come hard; it reduces other good yogas, especially the lunar ones. Success comes through great personal effort.',['Moon'],'challenging');
  if (conj('Moon','Mars')) add('Lunar (Chandra) yogas','Chandra-Mangala','Moon and Mars together.','Worldly wise and materially successful; may earn through unscrupulous means; may be harsh with mother or other women.',['Moon','Mars']);
  if (['Mercury','Jupiter','Venus'].every(b => [6,7,8].includes(hFrom(moS, P[b].sign)))) add('Lunar (Chandra) yogas','Adhi','The natural benefics occupy the 6th, 7th and 8th from Moon.','Becomes a leader, minister or commander, depending on the strength of the planets.',['Moon','Mercury','Jupiter','Venus']);
  // Moon's general guideline
  const ms = hFrom(sunS, moS);

  // Pancha mahapurusha
  const MP = {Mars:['Ruchaka','fiery: enthusiastic, a natural leader, victorious over enemies, discriminating, well versed in occult sciences, always successful'],
    Mercury:['Bhadra','earthy: learned in all respects, a good build and deep voice, systematic and clean, independent in spirit, surrounded by relatives and friends'],
    Saturn:['Sasa','airy: wise, enjoys wandering, valorous, knows the weaknesses of others, lively but vacillating, charitable'],
    Venus:['Maalavya','watery: a lustre like moonlight, enjoys tasty food and luxuries, excellent health, well versed in arts'],
    Jupiter:['Hamsa','ethery: spiritual strength and purity, respected by all, enjoys life fully, a clever conversationalist with good speech']};
  for (const b in MP) if (inH(b, KENDRA) && (OWN[b].includes(P[b].sign) || EXALT[b][0] === P[b].sign))
    add('Great-person (Pancha Mahapurusha) yogas', MP[b][0], `${b} in its own or exaltation sign in a quadrant from lagna.`, `A great person of ${MP[b][1].replace(':', ' nature:')}.`, [b]);

  // Nabhasa
  const q7 = SEVEN.map(b => P[b].sign % 3);
  let nabhasa = false;
  if (q7.every(q => q === 0)) { nabhasa = true; add('Pattern (Nabhasa) yogas','Rajju','All planets in movable signs.','Likes to travel; good looks; flourishes in foreign countries; can be cruel.',SEVEN); }
  if (q7.every(q => q === 1)) { nabhasa = true; add('Pattern (Nabhasa) yogas','Musala','All planets in fixed signs.','Honour, wisdom and wealth; famous; a firm spirit.',SEVEN); }
  if (q7.every(q => q === 2)) { nabhasa = true; add('Pattern (Nabhasa) yogas','Nala','All planets in dual signs.','Accumulates money; good looks; helps relatives; skilful.',SEVEN); }
  const kBen = KENDRA.filter(h => occ(fromSign(lag,h)).some(ben)).length;
  const kMal = KENDRA.filter(h => occ(fromSign(lag,h)).some(mal)).length;
  if (kBen >= 3) { nabhasa = true; add('Pattern (Nabhasa) yogas','Maalaa','Three quadrants occupied by natural benefics.','Always happy; nice clothes, vehicles and luxuries; many friends.' + (kMal ? ' A malefic also sits in a quadrant, so it may not operate fully.' : ''), [], kMal ? 'weakened' : 'present'); }
  if (kMal >= 3) { nabhasa = true; add('Pattern (Nabhasa) yogas','Sarpa','Three quadrants occupied by natural malefics.','A hard combination: unhappiness and dependence on others.' + (kBen ? ' A benefic also occupies a quadrant, so it may not operate fully.' : ''), [], kBen ? 'weakened' : 'challenging'); }
  const hs = SEVEN.map(b => P[b].house), hset = new Set(hs);
  const all = arr => hs.every(h => arr.includes(h));
  const AK = [
    ['Gadaa',[[1,4],[4,7],[7,10],[10,1]],'All planets in two successive quadrants.','Wealth, gold and gems; knows sciences and music; performs rites.'],
    ['Sakata',[[1,7]],'All planets in the 1st and 7th houses.','Suffers from diseases; few friends; a hard-working life.'],
    ['Vihanga',[[4,10]],'All planets in the 4th and 10th houses.','Loves to wander; works as a messenger; quarrelsome.'],
    ['Sringaataka',[[1,5,9]],'All planets in the trines from lagna.','Happy and liked by rulers; a noble spouse; wealthy.'],
    ['Hala',[[2,6,10],[3,7,11],[4,8,12]],'All planets in mutual trines but not trines from lagna.','Works the land; eats a lot; worried and unhappy.'],
    ['Kamala',[[1,4,7,10]],'All planets in quadrants.','Becomes a ruler; strong character, famous, long-lived, pure, many good deeds.'],
    ['Vaapi',[[2,5,8,11],[3,6,9,12]],'All planets in panaparas or in apoklimas.','A mind capable of amassing wealth; all comforts.'],
    ['Yoopa',[[1,2,3,4]],'All planets in the 1st to 4th houses.','Spiritual knowledge; a devoted spouse; sattwa guna.'],
    ['Sara',[[4,5,6,7]],'All planets in the 4th to 7th houses.','A hunter’s temperament; heads prisons; hard on people.'],
    ['Sakti',[[7,8,9,10]],'All planets in the 7th to 10th houses.','Struggle and lethargy but long-lived and firm; a sharp mind in conflict.'],
    ['Danda',[[10,11,12,1]],'All planets in the 10th to 1st houses.','Separation from family; serves others; unhappy.'],
    ['Chakra',[[1,3,5,7,9,11]],'All planets in the odd houses.','A great emperor before whom many bow.'],
    ['Samudra',[[2,4,6,8,10,12]],'All planets in the even houses.','Wealth and many gems; luxuries; stable fortune; soft-natured.']
  ];
  for (const [nm, sets, def, res] of AK) for (const set of sets) {
    if (all(set) && (nm !== 'Gadaa' || set.every(h => hset.has(h)))) { nabhasa = true; add('Pattern (Nabhasa) yogas', nm, def, res, SEVEN, /Sakata|Vihanga|Hala|Sara|Sakti|Danda/.test(nm) ? 'challenging' : 'present'); break; }
  }
  // Vajra / Yava
  const hb = h => occ(fromSign(lag,h)), onlyBen = h => hb(h).length && hb(h).every(ben), onlyMal = h => hb(h).length && hb(h).every(mal);
  if (onlyBen(1) && onlyBen(7) && onlyMal(4) && onlyMal(10)) { nabhasa = true; add('Pattern (Nabhasa) yogas','Vajra','Benefics in the 1st and 7th, malefics in the 4th and 10th.','Happy in early and late life; valorous; few desires.'); }
  if (onlyMal(1) && onlyMal(7) && onlyBen(4) && onlyBen(10)) { nabhasa = true; add('Pattern (Nabhasa) yogas','Yava','Malefics in the 1st and 7th, benefics in the 4th and 10th.','Religious, happy in the middle of life, wealthy, good children, charitable and strong-minded.'); }
  // seven consecutive signs
  const span7 = start => hs.every(h => hFrom(start, h) <= 7) ;
  for (let st = 1; st <= 12; st++) {
    const occAll = [...Array(7)].every((_, i) => hset.has(((st - 1 + i) % 12) + 1));
    if (span7(st) && occAll) {
      const nm = {1:'Naukaa',4:'Koota',7:'Chatra',10:'Chaapa'}[st] || 'Ardha Chandra';
      const res = {Naukaa:'Earns through water-related things; well known; many desires; can be miserly.',Koota:'Hard, secretive life; can be untruthful; lives in hills and forts.',Chatra:'Helps his people; kind; liked by rulers; intelligent; happy early and late; long-lived.',Chaapa:'Keeps secrets; wanders; happy in middle life.','Ardha Chandra':'A commander; good physique; liked by rulers; strong; possesses gems and ornaments.'}[nm];
      nabhasa = true; add('Pattern (Nabhasa) yogas', nm, `All planets in the seven signs from the ${ORD(st)} house.`, res, SEVEN, /Koota|Chaapa/.test(nm) ? 'challenging' : 'present'); break;
    }
  }
  if (!nabhasa) {
    const n = new Set(SEVEN.map(b => P[b].sign)).size;
    const SK = {7:['Veenaa','Likes music, dance and songs; wealthy, skilful and a leader of people.'],6:['Daama','Very rich and famous; many children; helps others.'],5:['Paasa','Capable in work; talkative; must guard against entanglements and lapses of character.'],4:['Kedaara','An agriculturist type; happy, wealthy and helpful.'],3:['Soola','Sharp and valiant but can be lazy and violent; wins in conflict.'],2:['Yuga','Unconventional; happiness from children and mother is limited.'],1:['Gola','Strong but struggles with poverty and learning.']};
    add('Pattern (Nabhasa) yogas', SK[n][0], `The seven planets occupy exactly ${n} signs (the least important Nabhasa yoga, used only when no other applies).`, SK[n][1], SEVEN, n <= 3 || n === 5 ? 'challenging' : 'present');
  }

  // Other popular yogas
  const l12 = occ(fromSign(lag,12)), l2 = occ(fromSign(lag,2)), l1 = occ(lag);
  if ((l1.length && l1.every(ben)) || (l12.length && l2.length && l12.every(ben) && l2.every(ben))) add('Other yogas','Subha','Benefics in lagna, or benefics hemming lagna from the 12th and 2nd (subha kartari).','Eloquence, good looks and character.');
  if ((l1.length && l1.every(mal)) || (l12.length && l2.length && l12.every(mal) && l2.every(mal))) add('Other yogas','Asubha','Malefics in lagna, or malefics hemming lagna (paapa kartari).','Many desires; must guard against taking what belongs to others.',[],'challenging');
  const jm = hFrom(moS, P.Jupiter.sign);
  const jupHelped = SEVEN.some(b => b !== 'Jupiter' && ben(b) && (conj(b,'Jupiter') || aspects(b,'Jupiter')));
  if ([1,4,7,10].includes(jm) && jupHelped && !['debilitated','inimical','bitter enemy’s sign'].includes(P.Jupiter.dignity) && !P.Jupiter.combust)
    add('Other yogas','Gaja-Kesari','Jupiter in a quadrant from Moon, joined or aspected by a benefic, and not debilitated, combust or in an enemy’s sign.','Famous, wealthy and intelligent; great character; a key yoga for virtue and lasting fame.',['Jupiter','Moon']);
  if (conj('Jupiter','Mars') || hFrom(P.Jupiter.sign, P.Mars.sign) === 7) add('Other yogas','Guru-Mangala','Jupiter and Mars together or opposite each other.','Righteous and energetic; energies are channelled into dharmic paths.',['Jupiter','Mars']);
  const t10 = occ(fromSign(lag,10)), m10 = occ(fromSign(moS,10));
  if ((t10.length && t10.every(ben)) || (m10.length && m10.every(ben))) add('Other yogas','Amala','Only natural benefics in the 10th from lagna or Moon.','Lasting fame; respected by those in power; virtuous; helps others. Conduct in society is very pure.');
  const kOccAll = KENDRA.flatMap(h => hb(h));
  if (kOccAll.length && kOccAll.every(ben) && hb(7).every(ben) && hb(8).every(ben)) add('Other yogas','Parvata','Quadrants occupied only by benefics; 7th and 8th empty or with benefics only.','Fortunate, eloquent, famous, charitable, easy-going; likes humour.');
  const mutualK = (a, b) => [1,4,7,10].includes(hFrom(P[a].sign, P[b].sign));
  if (mutualK(lord(4),'Jupiter') && lagnaLordStrong) add('Other yogas','Kaahala','The 4th lord and Jupiter in mutual quadrants, with a strong lagna lord.','Strong, bold and resourceful; leads many people.',[lord(4),'Jupiter']);
  if ((P[lord(1)].dignity === 'exalted' && inH(lord(1), KENDRA) && aspects('Jupiter', lord(1))) || [7,9,10].some(h => hb(h).filter(ben).length >= 2))
    add('Other yogas','Chaamara','Lagna lord exalted in a quadrant with Jupiter’s aspect, or two benefics together in the 7th, 9th or 10th.','Respected by those in power; long-lived, scholarly, eloquent and learned in many arts.');
  if (lagnaLordStrong && mutualK(lord(5), lord(6))) add('Other yogas','Sankha','A strong lagna lord, with the 5th and 6th lords in mutual quadrants.','Blessed with wealth, spouse and children; kind, pious, intelligent and long-lived.',[lord(1),lord(5),lord(6)]);
  if (strong(C, lord(9)) && [1,2,7,12].every(h => hb(h).length)) add('Other yogas','Bheri','A strong 9th lord with the 1st, 2nd, 7th and 12th houses occupied.','Wealth, spouse and children; fame and character; virtuous; enjoys pleasures.');
  if (P[lord(7)].dignity === 'exalted' && P[lord(7)].house === 10 && conj(lord(10), lord(9))) add('Other yogas','Sreenaatha','The 7th lord exalted in the 10th and the 10th lord with the 9th lord.','A person of great wealth and prosperity.');
  if (hb(1).some(ben) && hb(9).some(ben) && hb(5).length && hb(4).some(mal) && hb(8).some(mal)) add('Other yogas','Matsya','Benefics in lagna and 9th, planets in 5th, malefics in the 4th and 8th.','An astrologer or seer; kind, intelligent, learned and famous; an austere pursuer.');
  if (P[lord(2)].house === 9 && P[lord(9)].house === 2 && inH(lord(1), [1,4,5,7,9,10])) add('Other yogas','Khadga','The 2nd lord in the 9th, the 9th lord in the 2nd, lagna lord in a quadrant or trine.','Skilful, wealthy, learned, happy, fortunate, grateful and mighty.',[lord(2),lord(9)]);
  if (lag % 3 === 1 && inH('Venus', KENDRA) && [1,5,9].includes(hFrom(lag, P.Moon.sign)) && occ(P.Moon.sign).some(b => b !== 'Moon' && ben(b)) && P.Saturn.house === 10) add('Other yogas','Kusuma','Fixed lagna, Venus in a quadrant, Moon in a trine with a benefic, Saturn in the 10th.','Charitable; pleasures and happiness; a community leader with character and scholarship.');
  if (inH('Jupiter',[2,5]) && ['Mercury','Venus'].every(b => conj(b,'Jupiter') || aspects(b,'Jupiter') || rasiAspects(P[b].sign).includes(P.Jupiter.sign))) add('Other yogas','Kalaanidhi','Jupiter in the 2nd or 5th, joined or aspected by Mercury and Venus.','Character, happiness, good health, wealth and learning; respected by rulers.',['Jupiter','Mercury','Venus']);
  if (hb(7).length + hb(8).length > 0 && [...hb(7),...hb(8)].every(b => ben(b) && !SEVEN.some(m => mal(m) && (conj(m,b) || aspects(m,b))))) add('Other yogas','Lagnaadhi','Benefics in the 7th and 8th from lagna, free of malefic conjunction or aspect.','A great person; learned and happy.');
  const benIn = (s, hs) => hs.every(h => occ(fromSign(s,h)).some(ben));
  if (benIn(P[lord(2)].sign,[2,12,8])) add('Other yogas','Hari','Benefics in the 2nd, 12th and 8th from the 2nd lord.','Happy, learned, blessed with wealth and children.');
  if (benIn(P[lord(7)].sign,[4,9,8])) add('Other yogas','Hara','Benefics in the 4th, 9th and 8th from the 7th lord.','Happy, learned, blessed with wealth and children.');
  if (benIn(P[lord(1)].sign,[4,10,11])) add('Other yogas','Brahma','Benefics in the 4th, 10th and 11th from the lagna lord.','Happy, learned, blessed with wealth and children.');
  if (P[lord(5)].house === 9 && P[lord(9)].house === 10 && P[lord(10)].house === 5) add('Other yogas','Siva','5th lord in 9th, 9th lord in 10th, 10th lord in 5th.','Wise and virtuous; a conqueror; can lead forces or run a business.');
  const tri = (a,b) => [1,5,9].includes(hFrom(P[a].sign, P[b].sign));
  if (tri('Sun','Moon') && tri('Moon','Mars') && tri('Sun','Mars')) add('Other yogas','Trilochana','Sun, Moon and Mars in mutual trines.','Wealthy, intelligent, long-lived, victorious over rivals; achieves without many obstacles.',['Sun','Moon','Mars']);
  if ((OWN[lord(9)].includes(P[lord(9)].sign) || P[lord(9)].dignity === 'exalted') && inH(lord(9), KENDRA) && lagnaLordStrong) add('Other yogas','Lakshmi','The 9th lord in own or exaltation sign in a quadrant, with a strong lagna lord.','Good looks, character, wealth and many children; principled and famous.',[lord(9)]);
  if (['Mercury','Jupiter','Venus'].every(b => inH(b,[1,2,4,5,7,9,10])) && (['exalted','moolatrikona','own','friendly','great friend’s sign'].includes(P.Jupiter.dignity))) add('Other yogas','Saraswathi','Mercury, Jupiter and Venus each in a quadrant, trine or the 2nd, with Jupiter in own, friendly or exaltation sign.','Very learned, skilful, intelligent, rich and famous; praised by all.',['Mercury','Jupiter','Venus']);
  if (inH('Jupiter',KENDRA) && inH('Venus',KENDRA) && inH('Saturn',KENDRA) && P.Saturn.dignity === 'exalted') add('Other yogas','Amsaavatara','Jupiter, Venus and exalted Saturn in quadrants.','Learned and pleasure-loving with an unsullied reputation.');
  if (lag % 3 === 1 && P[lord(2)].house === 10 && P[lord(10)].house === 2 && P[lord(1)].house === 11 && P[lord(11)].house === 1) add('Other yogas','Devendra','Fixed lagna, exchanges between 2nd/10th and 1st/11th lords.','A leader; handsome, romantic, long-lived and famous.');
  if (P[lord(5)].house === 11 && P[lord(11)].house === 5 && P.Moon.house === 5) add('Other yogas','Indra','5th and 11th lords exchange and Moon is in the 5th.','Bold, famous and long-lived; rises to power.');
  if (P.Sun.house === 10 && P[lord(10)].house === 3 && conj(lord(10),'Saturn')) add('Other yogas','Ravi','Sun in the 10th and the 10th lord in the 3rd with Saturn.','Learned, passionate and respected by rulers.');
  if (hFrom(sunS, moS) === 12 && hFrom(sunS, P.Mercury.sign) === 2 && [5,9].includes(jm)) add('Other yogas','Bhaaskara','Moon 12th from Sun, Mercury 2nd from Sun, Jupiter 5th or 9th from Moon.','Wealthy, valorous and aristocratic; learned in sciences, astrology and music.');
  const benUp = ['Mercury','Jupiter','Venus'].filter(b => inH(b, UPACHAYA));
  if (benUp.length >= 2) add('Other yogas','Vasumati','Benefics occupying upachayas (3, 6, 10, 11).','Abundant wealth.' + (SEVEN.some(b => mal(b) && inH(b, UPACHAYA)) ? ' Malefics also occupy upachayas, so the result is partial.' : ''), benUp);
  if (P[lord(4)].house === 10 && P[lord(10)].house === 4 && P[lord(1)].dignity === 'exalted') add('Other yogas','Chapa','4th and 10th lords exchange, with lagna lord exalted.','Works for those in power and commands much wealth.');
  if (P[lord(6)].house === 6) add('Other yogas','Harsha','The 6th lord in the 6th house.','Happy, strong, good-natured and invincible.',[lord(6)]);
  if (P[lord(8)].house === 8) add('Other yogas','Sarala','The 8th lord in the 8th house.','Long-lived, fearless, learned, celebrated and prosperous; a terror to rivals.',[lord(8)]);
  if (P[lord(12)].house === 12) add('Other yogas','Vimala','The 12th lord in the 12th house.','Noble, frugal, happy and independent.',[lord(12)]);

  // Raja yogas
  const kLords = new Set([4,7,10].map(lord).concat([lord(1)]));
  const tLords = new Set([5,9].map(lord).concat([lord(1)]));
  const seen = new Set();
  for (const a of kLords) for (const b of tLords) {
    if (a === b) continue;
    const key = [a,b].sort().join('+');
    if (seen.has(key) || !assoc(a, b)) continue;
    seen.add(key);
    const how = conj(a,b) ? 'conjoined' : exch(a,b) ? 'in exchange (parivartana)' : 'in mutual aspect';
    const hA = P[a].lordOf.filter(h => h <= 12).map(ORD).join(' & '), hB = P[b].lordOf.map(ORD).join(' & ');
    const close = conj(a,b) ? Math.abs(P[a].deg - P[b].deg) : null;
    const dk = [9,10].every(h => [a,b].some(x => P[x].lordOf.includes(h)));
    const weak = [a,b].some(x => P[x].combust || P[x].dignity === 'debilitated');
    add('Raja yogas (power and prosperity)', dk ? 'Dharma-Karmadhipati' : 'Raja yoga',
      `${a} (lord of ${hA}) and ${b} (lord of ${hB}) are ${how} — a quadrant lord (Vishnu) meets a trine lord (Lakshmi).`,
      (dk ? 'The 9th and 10th lords combine: sincere, devoted and righteous; fortunate. ' : 'Power and prosperity. ') + (close !== null ? (close <= 6 ? `The conjunction is close (${close.toFixed(1)}°), so it can give fuller results.` : `The planets are ${close.toFixed(1)}° apart; beyond about 6° the yoga does not give its full results.`) : '') + (weak ? ' One of the planets is combust or debilitated, which reduces the magnitude.' : ''),
      [a,b], weak ? 'weakened' : 'present');
  }
  const dl = [6,8,12].map(lord);
  const vip = [...new Set(dl)].filter(b => inH(b, DUSTHANA));
  if (vip.length) add('Raja yogas (power and prosperity)','Vipareeta Raja','Lords of the 6th, 8th or 12th placed in a dusthana: ' + vip.map(b => `${b} in the ${ORD(P[b].house)}`).join(', ') + '.','Tremendous success, typically after an initial struggle: obstacles run into obstacles themselves.',vip);
  if (conj(C.karakas[0].planet, C.karakas[5].planet) && conj(lord(1), lord(5))) add('Raja yogas (power and prosperity)','AK–PK Raja yoga','Atma karaka and Putra karaka conjoined, and the lagna and 5th lords conjoined.','Power and prosperity.');
  const AmK = C.karakas[1].planet, AKp = C.AK;
  if (conj(AKp, AmK)) add('Association with power (Raja Sambandha)','AK with AmK','Atma karaka and Amatya karaka conjoined.','Very intelligent; an advisor or minister type.',[AKp,AmK]);
  if (AmK !== 'Rahu' && ['exalted','own','moolatrikona'].includes(P[AmK].dignity)) add('Association with power (Raja Sambandha)','Strong Amatya karaka','Amatya karaka in own or exaltation sign.','Rises to a trusted advisory or ministerial role.',[AmK]);
  if (inH(AmK,[1,5,9])) add('Association with power (Raja Sambandha)','Amatya karaka in a trine','Amatya karaka in a trine from lagna.','A well-known advisor or minister figure.',[AmK]);
  if (P[lord(1)].house === 10 && P[lord(10)].house === 1) add('Association with power (Raja Sambandha)','Lagna–10th exchange','Lagna lord in the 10th and 10th lord in lagna.','Powerful and associated with people in power.');
  // Dhana yogas
  const DH = {0:[['Sun',5],[['Saturn','Moon','Jupiter'],11]],1:[['Mercury',5],[['Moon','Mars','Jupiter'],11]],2:[['Venus',5],[['Mars'],11]],3:[['Mars',5],[['Venus'],11]],4:[['Jupiter',5],[['Mercury'],11]],5:[['Saturn',5],[['Sun','Moon'],11]],6:[['Saturn',5],[['Sun','Moon'],11]],7:[['Jupiter',5],[['Mercury'],11]],8:[['Mars',5],[['Venus'],11]],9:[['Venus',5],[['Mars'],11]],10:[['Mercury',5],[['Moon','Mars','Jupiter'],11]],11:[['Moon',5],[['Moon'],11]]};
  const d = DH[lag];
  if (P[d[0][0]].house === 5 && d[1][0].every(b => P[b].house === 11)) add('Wealth (Dhana) yogas','Parasara’s Dhana yoga',`For ${SIGNS[lag]} lagna: ${d[0][0]} in the 5th and ${d[1][0].join(', ')} in the 11th.`,'Becomes very affluent.');
  for (const b of ['Moon','Mercury','Jupiter','Venus']) if (P[b].house === 2 && P[b].dignity === 'exalted') add('Wealth (Dhana) yogas',`Exalted ${b} in the 2nd`,`${b} exalted in the 2nd house.`,'Makes one very rich.',[b]);
  // Daridra (select)
  if (P[lord(1)].house === 12 && P[lord(12)].house === 1) add('Poverty (Daridra) yogas','Lagna–12th exchange','Lagna lord in the 12th and 12th lord in lagna.','Money tends to drain away; the result is clinched only if a maraka (2nd or 7th lord) joins or aspects them.',[],'challenging');
  if (P[lord(1)].house === 6 && P[lord(6)].house === 1) add('Poverty (Daridra) yogas','Lagna–6th exchange','Lagna lord in the 6th and 6th lord in lagna.','Financial strain; clinched only with maraka involvement. Association with trine lords is a saving factor.',[],'challenging');
  if (P.Sun.house === 2) { if (aspects('Saturn','Sun')) add('Poverty (Daridra) yogas','Sun in 2nd aspected by Saturn','Sun in the 2nd with Saturn’s aspect.','Strain on wealth.',['Sun','Saturn'],'challenging'); else add('Wealth (Dhana) yogas','Sun in 2nd, free of Saturn','Sun in the 2nd without Saturn’s aspect.','Gives wealth.',['Sun']); }
  if (P.Mars.house === 2 && P.Saturn.house === 2) { if (aspects('Mercury','Mars')) add('Wealth (Dhana) yogas','Mars & Saturn in 2nd aspected by Mercury','Mars and Saturn in the 2nd with Mercury’s aspect.','Great wealth is generated.'); else add('Poverty (Daridra) yogas','Mars & Saturn in 2nd','Mars and Saturn in the 2nd without Mercury’s aspect.','Strain on wealth.',[],'challenging'); }
  // Tapaswi (ch.13)
  const tp = ['Saturn','Ketu','Venus'];
  for (let i = 0; i < 3; i++) { const [a,b] = tp.filter((_,j) => j !== i), c = tp[i];
    if (conj(a,b) && (aspects(c,a) || rasiAspects(P[c].sign).includes(P[a].sign))) { add('Other yogas','Tapaswi',`${a} and ${b} together, with ${c} aspecting them.`,'Single-minded dedication to a pursuit — research, spiritual practice or a craft.' + ([a,b,c].includes(C.AK) ? ' The atma karaka is involved, so this effort continues work of past lives and is especially fruitful.' : ''),tp); break; } }
  return Y;
}

// ---------- interpretation ----------
const DIG_TEXT = {
 'exalted':'Exalted — like an excited person at a favourite party. It is eager and able to give its best results.',
 'moolatrikona':'In moolatrikona — like being at the office: powerful and duty-minded, doing its formal job.',
 'own':'In its own sign — like being at home: natural and comfortable.',
 'great friend’s sign':'In the sign of a great friend — well supported.',
 'friendly':'In a friendly sign — reasonably comfortable.',
 'neutral':'In a neutral sign — neither helped nor hindered by its host.',
 'inimical':'In an enemy’s sign — uneasy; its results come with friction.',
 'bitter enemy’s sign':'In the sign of a bitter enemy — uncomfortable; its results come with friction.',
 'debilitated':'Debilitated — like an unhappy person stuck at a place he hates. It struggles to deliver its good results.'
};
const FUNC_TEXT = {yogakaraka:'a yogakaraka (owns both a quadrant and a trine — an excellent planet for you)',benefic:'a functional benefic (it does you good)',neutral:'functionally neutral',malefic:'a functional malefic (its ownership brings mixed or difficult matters)',node:'a shadow planet, giving the results of its sign lord and companions'};

function score(C, b) {
  const p = C.P[b];
  let s = DIG_SCORE[p.dignity] || 0;
  if (p.combust) s -= 1.5;
  if (KENDRA.includes(p.house) || TRIKONA.includes(p.house)) s += 1;
  if (DUSTHANA.includes(p.house)) s -= 1;
  if (p.vargottama) s += 1;
  return s;
}
function verdict(C, b) {
  const s = score(C, b);
  if (s >= 2.5) return ['Strong','good'];
  if (s >= 0.5) return ['Supportive','ok'];
  if (s > -1) return ['Mixed','mixed'];
  return ['Challenged','bad'];
}

function planetReading(C, b) {
  const P = C.P, p = P[b], d = PD[b];
  const out = [];
  const f = C.func[b];
  out.push(`${b} governs ${d.gov}. ${b === 'Moon' ? (C.waxing ? 'Your Moon is waxing, so it acts as a natural benefic.' : 'Your Moon is waning, so it acts as a natural malefic.') : b === 'Mercury' ? (C.mercuryBenefic ? 'Here Mercury is alone or with benefics, so it acts as a natural benefic.' : 'Here Mercury is joined by more malefics, so it acts as a natural malefic.') : `By nature it is a ${d.nature}.`} For your ${SIGNS[C.lagna]} ascendant it is ${FUNC_TEXT[f]}.`);
  out.push(DIG_TEXT[p.dignity] + ` ${SIGNS[p.sign]} gives it a ${RASI[p.sign].el.toLowerCase()}, ${RASI[p.sign].q.toLowerCase()} colour: ${RASI[p.sign].ind}.`);
  // house
  const h = p.house;
  let hs = `In your ${ORD(h)} house (${HOUSE[h].n.toLowerCase()}), it acts on ${HOUSE[h].sig}. `;
  const good = f === 'benefic' || f === 'yogakaraka';
  if (TRIKONA.includes(h) || KENDRA.includes(h)) {
    hs += (TRIKONA.includes(h) && KENDRA.includes(h)) ? 'Lagna is both a quadrant and a trine — the most personal placement. ' : TRIKONA.includes(h) ? 'Trines are houses of prosperity. ' : 'Quadrants are houses of sustenance and vital activity. ';
    hs += good ? 'A functional benefic here brings good results.' : f === 'malefic' ? (DIG_SCORE[p.dignity] >= 2 ? 'It is a functional malefic, but it is strong, which softens the difficulty.' : 'A functional malefic here is not ideal unless it is very strong; expect some friction in these matters.') : '';
  } else if ([3,6,8,12].includes(h)) {
    hs += h === 3 ? 'The 3rd is an upachaya (a house of growth). ' : h === 6 ? 'The 6th is both a dusthana and an upachaya. ' : 'The ' + ORD(h) + ' is a dusthana (a house of setbacks). ';
    hs += (f === 'malefic' || (f === 'node')) ? 'A malefic placed here gives good results by spoiling the significations of a difficult house.' : good ? `As a functional benefic, the good it promises meets obstacles here; its own matters need extra care.` : '';
  } else if ([10,11].includes(h)) hs += 'An upachaya: its influence grows with time.';
  else if (h === 2) hs += 'The 2nd is a house of wealth and speech; the planet colours both.';
  out.push(hs.trim());
  // lordship
  const lo = p.lordOf;
  if (lo.length && b !== 'Rahu' && b !== 'Ketu') {
    let ls = `It rules your ${lo.map(ORD).join(' and ')} house${lo.length > 1 ? 's' : ''} (${lo.map(x => HOUSE[x].n.toLowerCase()).join(', ')}), so those matters are tied to the ${ORD(h)} house.`;
    const dus = lo.filter(x => DUSTHANA.includes(x));
    if (dus.length) {
      if (p.dignity === 'exalted' || p.dignity === 'moolatrikona' || p.dignity === 'own') ls += ` As a strong ${dus.map(ORD).join('/')} lord it can show real obstacles in those areas.`;
      else if (p.dignity === 'debilitated') ls += ` A weak ${dus.map(ORD).join('/')} lord means those obstacles are easily overcome.`;
    }
    if (lo.some(x => [6,8,12].includes(x)) && DUSTHANA.includes(h)) ls += ' A dusthana lord in a dusthana gives Vipareeta Raja yoga — success after struggle.';
    out.push(ls);
  } else if (lo.length) out.push(`It co-rules your ${lo.map(ORD).join(' and ')} house.`);
  // associations
  const conjWith = PL.filter(x => x !== b && P[x].sign === p.sign);
  const aspBy = C.grahaAspects[p.sign].filter(x => x !== b);
  const asp = [];
  if (conjWith.length) asp.push(`It sits with ${list(conjWith)}.`);
  if (aspBy.length) asp.push(`It receives the full planetary aspect (graha drishti) of ${list(aspBy)}${aspBy.includes('Jupiter') ? ' — Jupiter’s aspect is protective' : ''}${aspBy.some(x => ['Saturn','Mars'].includes(x)) ? '; Saturn or Mars adds pressure' : ''}.`);
  const mine = aspectOffsets(b).map(o => (p.sign + o - 1) % 12);
  if (mine.length) asp.push(`It aspects your ${mine.map(s => ORD(hFrom(C.lagna, s))).join(', ')} house${mine.length > 1 ? 's' : ''}.`);
  if (asp.length) out.push(asp.join(' '));
  const flags = [];
  if (p.combust) flags.push(`It is combust (${p.sunDist.toFixed(1)}° from the Sun), so its power to do good is reduced.`);
  if (p.retro && b !== 'Rahu' && b !== 'Ketu') flags.push('It is retrograde.');
  if (p.vargottama) flags.push('It is vargottama (same sign in the birth chart and navamsa), which strengthens it.');
  if (flags.length) out.push(flags.join(' '));
  out.push(`Natural significator of ${d.kar}.` + (GRAHA_HOUSES[b] ? ` Houses counted from ${b} also show the ${GRAHA_HOUSES[b].map(ORD).join(', ')}-house matters for you.` : ''));
  const nk = NAKS[p.nak];
  out.push(`Nakshatra: ${nk[0]} (pada ${p.pada}), ruled by ${nk[1]}, deity ${nk[2]}. Navamsa: ${SIGNS[p.d9]}. Career chart (D-10): ${SIGNS[p.d10]}.`);
  if (d.dhatu && (p.dignity === 'debilitated' || p.combust || DUSTHANA.includes(h))) out.push(`Health note: ${b} rules the ${d.dhatu}; when it is afflicted, look after this area. In its difficult periods go easy on ${d.taste} tastes.`);
  return out;
}
const list = a => a.length <= 1 ? a.join('') : a.slice(0,-1).join(', ') + ' and ' + a[a.length-1];

function overview(C) {
  const P = C.P, lag = C.lagna, ll = SIGN_LORD[lag];
  const o = [];
  o.push({h:`${SIGNS[lag]} ascendant — your true self`, t:`Lagna shows the true self. ${SIGNS[lag]} (${SANSK[lag]}) is a ${RASI[lag].q.toLowerCase()} ${RASI[lag].el.toLowerCase()} sign of ${RASI[lag].g.toLowerCase()} quality: ${RASI[lag].ind}. It rules the ${RASI[lag].body} in the body.`});
  o.push({h:`Lagna lord ${ll} in the ${ORD(P[ll].house)} house`, t:`The lagna lord represents your physical self and its vitality. ${ll} sits in ${SIGNS[P[ll].sign]} (${P[ll].dignity}), which becomes your paaka lagna: your energy flows toward ${HOUSE[P[ll].house].sig}.`});
  o.push({h:`Moon in ${SIGNS[P.Moon.sign]} — your mind`, t:`Moon governs the mind. In ${SIGNS[P.Moon.sign]} it is ${P.Moon.dignity}; your mind tends to be ${RASI[P.Moon.sign].ind}. Birth star: ${NAKS[P.Moon.nak][0]} pada ${P.Moon.pada} (ruled by ${NAKS[P.Moon.nak][1]}). ` + (() => { const k = hFrom(P.Sun.sign, P.Moon.sign); return [1,4,7,10].includes(k) ? 'Moon in a quadrant from Sun suggests modest wealth, intelligence and skills that grow with effort.' : [2,5,8,11].includes(k) ? 'Moon in a panapara from Sun suggests average wealth, intelligence and skills.' : 'Moon in an apoklima from Sun suggests a lot of wealth, intelligence and skills.'; })()});
  o.push({h:`Sun in ${SIGNS[P.Sun.sign]} — your soul`, t:`Sun governs the soul and vitality. In ${SIGNS[P.Sun.sign]} it is ${P.Sun.dignity}, in your ${ORD(P.Sun.house)} house.`});
  const ak = C.AK;
  o.push({h:`Atma karaka: ${ak}`, t:`The planet with the highest degree in its sign (${fmtDeg(C.karakas[0].adv)}) is the atma karaka, the significator of your soul and inner self. With ${ak} as atma karaka the native can be ${AK_TEXT[ak]}.`});
  const e5 = RASI[(lag + 4) % 12].el;
  o.push({h:`Emotional nature (5th house in ${SIGNS[(lag + 4) % 12]})`, t:`The 5th house shows emotional nature. In a${e5 === 'Air' || e5 === 'Earth' ? 'n' : ''} ${e5.toLowerCase()} sign it shows someone ${ELEMENT_EMOTION[e5]}.`});
  const al = C.arudha[1];
  o.push({h:`Arudha lagna in ${SIGNS[al]} — how the world sees you`, t:`Lagna is who you are; the arudha lagna is how you are perceived and your status. It falls in ${SIGNS[al]}: people tend to see you as ${RASI[al].ind}.` + (PL.filter(b => P[b].sign === al).length ? ` ${list(PL.filter(b => P[b].sign === al))} sit${PL.filter(b => P[b].sign === al).length === 1 ? 's' : ''} on it and colour your image.` : '')});
  return o;
}

function dasaReading(C, cur) {
  const P = C.P, out = [];
  const md = cur.md.lord, ad = cur.ad.lord;
  const hS = hFrom(P.Sun.sign, P[md].sign), hM = hFrom(P.Moon.sign, P[ad].sign);
  const qual = h => [1,4,7,10].includes(h) ? 'a quadrant (sustaining)' : [5,9].includes(h) ? 'a trine (prosperous)' : [3,11].includes(h) ? 'an upachaya (growth)' : [6,8,12].includes(h) ? 'a dusthana (obstacles)' : 'the 2nd (resources)';
  const lords = b => P[b].lordOf.length ? `lord of your ${P[b].lordOf.map(ORD).join(' and ')}` : '';
  let m = `${md} mahadasa (${cur.md.start.getFullYear()}–${cur.md.end.getFullYear()}): ${md} is ${lords(md)} in your ${ORD(P[md].house)} house, ${FUNC_TEXT[C.func[md]].split(' (')[0]}. It gives the results promised by its placements. Following Rath’s “tripod of life”, a mahadasa is judged from the Sun: ${md} is in the ${ORD(hS)} from Sun, ${qual(hS)}.`;
  const ravi = C.yogas.filter(y => y.cat.startsWith('Solar') && y.planets.includes(md));
  if (ravi.length) m += ` It takes part in ${ravi.map(y => y.name).join(', ')} yoga, whose results come in this mahadasa.`;
  if (P[md].lordOf.includes(8)) m += ' As 8th lord its period can bring troubles and frustration.';
  if (P[md].lordOf.some(x => [5,9].includes(x))) m += ' Lords of the 5th and 9th can give money in their periods.';
  out.push(m);
  let a = `${ad} antardasa (${fmt(cur.ad.start)} → ${fmt(cur.ad.end)}): ${ad} is ${lords(ad)} in your ${ORD(P[ad].house)} house. Antardasas are judged from the Moon: ${ad} is in the ${ORD(hM)} from Moon, ${qual(hM)}.`;
  if (hM === 8) a += ' The 8th from Moon can bring unexpected troubles and frustration.';
  const ch = C.yogas.filter(y => y.cat.startsWith('Lunar') && y.planets.includes(ad));
  if (ch.length) a += ` It takes part in ${ch.map(y => y.name).join(', ')} yoga, which gives results in its antardasas.`;
  const dh = hFrom(P[md].sign, P[ad].sign);
  a += ` Taking the dasa lord as a temporary lagna, ${ad} falls in the ${ORD(dh)} from ${md}, ${qual(dh)}.`;
  out.push(a);
  if (cur.pd) {
    const pl = cur.pd.lord, hL = P[pl].house;
    out.push(`${pl} pratyantardasa (until ${fmt(cur.pd.end)}): judged from lagna — ${pl} is in your ${ORD(hL)} house, ${qual(hL)}. Other yogas (such as raja yogas) mainly give their results in pratyantardasas of the planets involved.`);
  }
  return out;
}
const fmt = d => d.toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'});

function remedies(C, cur) {
  const P = C.P, lag = C.lagna, R2 = {gems:[], avoid:[], strengthen:[], worship:[], fasting:[], moksha:null, combo:[]};
  const fb = SEVEN.filter(b => C.func[b] === 'benefic' || C.func[b] === 'yogakaraka');
  const fm = SEVEN.filter(b => C.func[b] === 'malefic');
  const marakas = [...new Set([2,7].map(h => SIGN_LORD[(lag + h - 1) % 12]))];
  const dasaLords = cur ? [cur.md.lord, cur.ad.lord] : [];
  for (const b of fb) {
    const why = [];
    if (C.func[b] === 'yogakaraka') why.push('yogakaraka');
    else why.push('functional benefic');
    const wk = P[b].dignity === 'debilitated' || P[b].combust || DUSTHANA.includes(P[b].house);
    if (wk) why.push('weakly placed, so the gem helps it deliver its promise');
    if (dasaLords.includes(b)) why.push('running its period now');
    const risky = marakas.includes(b) && dasaLords.includes(b);
    R2.gems.push({planet:b, why, priority: (C.func[b] === 'yogakaraka' ? 3 : 0) + (wk ? 2 : 0) + (dasaLords.includes(b) ? 2 : 0) + (b === SIGN_LORD[lag] ? 1 : 0), risky});
  }
  R2.gems.sort((a,b) => b.priority - a.priority);
  for (const b of fm) R2.avoid.push({planet:b, why:'functional malefic for your ascendant'});
  if (cur) for (const b of marakas) if (dasaLords.includes(b) && !R2.avoid.find(x => x.planet === b)) R2.avoid.push({planet:b, why:'maraka (2nd/7th lord) whose period is running'});
  // combined gems: two FB friends forming a yoga together
  for (const y of C.yogas.filter(y => y.cat.startsWith('Raja') && y.planets.length === 2)) {
    const [a, b] = y.planets;
    if (fb.includes(a) && fb.includes(b) && NAT[a] && (NAT[a].f.includes(b) || NAT[b].f.includes(a))) R2.combo.push([a,b,y.name]);
  }
  // planets to pacify: functional malefics, debilitated/combust, current dasa lords that are troubled, nodes in difficult spots
  const pac = new Map();
  const addP = (b, r) => { if (!pac.has(b)) pac.set(b, []); pac.get(b).push(r); };
  for (const b of PL) {
    const p = P[b];
    if (p.dignity === 'debilitated') addP(b, 'debilitated');
    if (p.combust) addP(b, 'combust');
    if (b !== 'Rahu' && b !== 'Ketu' && C.func[b] === 'malefic' && (KENDRA.includes(p.house) || TRIKONA.includes(p.house))) addP(b, `functional malefic in the ${ORD(p.house)} house`);
    if ((b === 'Rahu' || b === 'Ketu') && [1,4,5,7,9,10].includes(p.house)) addP(b, `node in the ${ORD(p.house)} house`);
  }
  for (const b of dasaLords) addP(b, 'its dasa is running now');
  for (const [b, r] of pac) R2.strengthen.push({planet:b, why:[...new Set(r)]});
  const ll = SIGN_LORD[lag];
  R2.worship.push({planet:ll, why:`lagna lord — shows the vitality of the whole chart`});
  const nl = SIGN_LORD[C.L.d10];
  R2.worship.push({planet:nl, why:`lagna lord in your career chart (D-10) — for career`});
  const ul = strongerLord(C, C.arudha[12]);
  R2.fasting.push({planet:ul, day:PD[ul].day, why:`upapada (A12) lord — mitigates troubles in marriage`});
  const a10 = strongerLord(C, C.arudha[10]);
  R2.fasting.push({planet:a10, day:PD[a10].day, why:`rajyapada (A10) lord — mitigates troubles in career`});
  // moksha: strongest planet in 12th from AK in D-9
  const kar = P[C.AK].d9, s12 = (kar + 11) % 12;
  const inS = PL.filter(b => P[b].d9 === s12);
  const pick = inS.length ? inS.sort((a,b) => score(C,b) - score(C,a))[0] : strongerLord(C, s12);
  R2.moksha = {planet: pick, karakamsa: kar, sign: s12, occupied: inS.length > 0};
  return R2;
}

function sidLon(b, when) {
  const t = AE.MakeTime(when), ay = ayanamsaLahiri(t.tt);
  if (b === 'Rahu' || b === 'Ketu') return norm(meanNode(t.tt/36525) - ay + (b === 'Ketu' ? 180 : 0));
  return norm(tropLon(b, t) - ay);
}
// sidereal positions of all nine planets on any date (for the transit chart)
function transitPositions(when) {
  const t = AE.MakeTime(when), ay = ayanamsaLahiri(t.tt), out = {};
  for (const b of SEVEN) {
    const lA = tropLon(b, t.AddDays(-0.25)), lB = tropLon(b, t.AddDays(0.25));
    out[b] = {lon: norm(tropLon(b, t) - ay), retro: b !== 'Sun' && b !== 'Moon' && norm(lB - lA + 180) - 180 < 0};
  }
  const r = norm(meanNode(t.tt/36525) - ay);
  out.Rahu = {lon: r, retro: true}; out.Ketu = {lon: norm(r + 180), retro: true};
  for (const b of PL) { const p = out[b]; p.sign = signOf(p.lon); p.deg = degIn(p.lon); p.nak = Math.floor(p.lon/(360/27)); p.pada = Math.floor((p.lon % (360/27))/(360/108)) + 1; }
  return out;
}
function transits(C, when) {
  const T = transitPositions(when), out = [];
  for (const b of ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']) {
    const p = T[b], s = p.sign;
    const fromMoon = hFrom(C.P.Moon.sign, s), fromLag = hFrom(C.lagna, s);
    const [g, res] = TRANSIT[b][fromMoon - 1];
    out.push({planet:b, sign:s, deg:p.deg, retro:p.retro, nak:p.nak, pada:p.pada, fromMoon, fromLag, good:!!g, res});
  }
  return out;
}

// ---------- life events timeline (ch.16 dasa use, ch.6 divisional charts, ch.7, ch.13, ch.25, ch.34) ----------
const AREAS = {
  career:{label:'Career & status',good:'growth, recognition or a new role at work',bad:'pressure, setbacks or changes at work'},
  marriage:{label:'Marriage & partnership',good:'marriage, a committed relationship or better harmony with a partner',bad:'strain or delays in relationships'},
  children:{label:'Children',good:'the birth of a child or happiness through children',bad:'worries related to children or delays in having them'},
  wealth:{label:'Money & gains',good:'financial gains, better income or savings',bad:'expenses, debts or pressure on savings'},
  property:{label:'Home, property & vehicles',good:'buying a home, land or vehicle, or more comfort at home',bad:'trouble with property, a move or less peace at home'},
  travel:{label:'Travel & abroad',good:'long journeys, foreign travel or settling abroad',bad:'unwanted relocation, separation or expenses on travel'},
  education:{label:'Education & learning',good:'progress in studies, degrees or new skills',bad:'interruptions or struggles in studies'},
  health:{label:'Health',good:'recovery and good vitality',bad:'health issues, fatigue or minor injuries — take care'},
  obstacles:{label:'Obstacles & setbacks',good:'overcoming rivals and obstacles',bad:'unexpected troubles, frustration or loss of standing'},
  mind:{label:'Mind, memory & nerves',good:'mental clarity, focus and confidence',bad:'anxiety, stress, poor memory or nervous complaints'},
  spiritual:{label:'Spiritual growth',good:'spiritual interest, pilgrimage or inner growth',bad:'detachment, confusion or feeling lost'}
};
function roles(C, b) {
  const P = C.P, p = P[b];
  const lordIn = (key, h) => { const s = (C.L[key] + h - 1) % 12; return SIGN_LORD[s] === b || (s === 7 && b === 'Ketu') || (s === 10 && b === 'Rahu'); };
  const occIn = (key, h) => hFrom(C.L[key], p[key]) === h;
  const lordD1 = h => p.lordOf.includes(h);
  const A = {}; for (const k in AREAS) A[k] = {w:0, why:[]};
  const add = (k, w, why) => { A[k].w += w; A[k].why.push(why); };
  const kar = {}; C.karakas.forEach(k => kar[k.code] = k.planet);
  // career
  if (lordD1(10)) add('career', 2, 'rules your 10th house (career)');
  if (p.house === 10) add('career', 1.5, 'sits in your 10th house');
  if (lordIn('d10', 1)) add('career', 1.5, 'rules the lagna of your career chart (D-10)');
  if (lordIn('d10', 10)) add('career', 2, 'rules the 10th house of your career chart (D-10)');
  if (occIn('d10', 10) || occIn('d10', 1)) add('career', 1.5, 'occupies a key house of your career chart (D-10)');
  if (b === 'Sun' || b === 'Saturn') add('career', 0.5, 'is a natural significator of career and karma');
  // marriage
  if (lordD1(7)) add('marriage', 2, 'rules your 7th house (marriage)');
  if (p.house === 7) add('marriage', 1, 'sits in your 7th house');
  if (lordIn('d9', 7)) add('marriage', 2, 'rules the 7th house of your navamsa (D-9), the marriage chart');
  if (occIn('d9', 7)) add('marriage', 1.5, 'sits in the 7th house of your navamsa');
  if (b === 'Venus') add('marriage', 1, 'is the natural significator of marriage');
  if (kar.DK === b) add('marriage', 1, 'is your dara karaka (spouse significator)');
  if (strongerLord(C, C.arudha[12]) === b) add('marriage', 1, 'rules your upapada (UL), which shows marriage');
  // children
  if (lordD1(5)) add('children', 1.5, 'rules your 5th house (children)');
  if (p.house === 5) add('children', 1, 'sits in your 5th house');
  if (lordIn('d7', 5)) add('children', 2, 'rules the 5th house of your saptamsa (D-7), the chart of children');
  if (occIn('d7', 5)) add('children', 1.5, 'sits in the 5th house of your saptamsa (D-7)');
  if (b === 'Jupiter') add('children', 1, 'is the natural significator of children');
  if (kar.PK === b) add('children', 1, 'is your putra karaka');
  // wealth
  if (lordD1(2)) add('wealth', 1.5, 'rules your 2nd house (wealth)');
  if (lordD1(11)) add('wealth', 1.5, 'rules your 11th house (gains)');
  if (lordD1(5) || lordD1(9)) add('wealth', 1, 'is a 5th/9th lord, and these give money in their periods');
  if ([2,11].includes(p.house)) add('wealth', 1, `sits in your ${ORD(p.house)} house`);
  if (b === 'Jupiter') add('wealth', 0.5, 'signifies wealth');
  // property
  if (lordD1(4)) add('property', 1.5, 'rules your 4th house (home, vehicles)');
  if (p.house === 4) add('property', 1, 'sits in your 4th house');
  if (lordIn('d4', 4) || lordIn('d4', 1)) add('property', 1.5, 'rules a key house of your chaturthamsa (D-4), the chart of property');
  if (b === 'Venus' || b === 'Mars') add('property', 0.5, b === 'Venus' ? 'signifies vehicles' : 'signifies real estate');
  // travel
  if (lordD1(12)) add('travel', 1.5, 'rules your 12th house (foreign residence)');
  if (p.house === 12) add('travel', 1, 'sits in your 12th house');
  if (lordD1(9)) add('travel', 1, 'rules your 9th house (long journeys)');
  if (b === 'Rahu' || b === 'Ketu') add('travel', 1, 'signifies going abroad');
  if (hFrom(C.L.d4, P.Rahu.d4) === 9 && p.d4 === P.Rahu.d4) add('travel', 1.5, b === 'Rahu' ? 'sits in the 9th of your D-4 (property chart), which can give foreign residence' : 'is with Rahu in the 9th of your D-4, which can give foreign residence');
  // education
  if (lordD1(4)) add('education', 1, 'rules your 4th house (education)');
  if (lordD1(5)) add('education', 1, 'rules your 5th house (intelligence)');
  if (b === 'Mercury') add('education', 1, 'signifies learning');
  if (b === 'Jupiter') add('education', 0.5, 'signifies traditional learning');
  // health
  if (lordD1(6)) add('health', 1.5, 'rules your 6th house (diseases)');
  if (lordD1(8)) add('health', 1.5, 'rules your 8th house (chronic illness, surgery)');
  if (b === 'Mars') add('health', 1, 'signifies accidents, injuries and surgery');
  if (lordD1(12) && p.house !== 12) add('health', 0.5, 'rules your 12th house (hospitalisation)');
  if ([6,8].includes(p.house)) add('health', 1, `sits in your ${ORD(p.house)} house`);
  if (b === SIGN_LORD[C.lagna] && (p.dignity === 'debilitated' || p.combust)) add('health', 1, 'is your weak lagna lord (vitality)');
  // obstacles
  if (lordD1(8)) add('obstacles', 2, 'rules your 8th house — its periods can bring troubles and frustration');
  if (lordD1(12)) add('obstacles', 1, 'rules your 12th house (losses)');
  if (SIGN_LORD[BAADHAKA[C.lagna]] === b) add('obstacles', 1.5, 'is your baadhaka (troublemaker) for the lagna');
  const fromAL = hFrom(C.arudha[1], p.sign);
  if ([8,12].includes(fromAL)) add('obstacles', 1, `sits in the ${ORD(fromAL)} from your arudha lagna, which can bring a fall in status`);
  // mind (ch.3: Moon governs mind, Mercury speech and memory; ch.2.2.5 / 7.2: 5th house shows emotions and intelligence)
  if (b === 'Moon') add('mind', 1.5, 'governs the mind');
  if (b === 'Mercury') add('mind', 1.5, 'governs speech, nerves and memory');
  if (lordD1(5)) add('mind', 1, 'rules your 5th house (intelligence, emotions)');
  if (p.house === 5) add('mind', 0.5, 'sits in your 5th house');
  if (SIGN_LORD[P.Moon.sign] === b && b !== 'Moon') add('mind', 0.75, 'rules the sign holding your Moon');
  if (['Rahu','Ketu','Saturn'].includes(b) && ['Moon','Mercury'].some(x => P[x].sign === p.sign)) add('mind', 1, `sits with your ${['Moon','Mercury'].filter(x => P[x].sign === p.sign).join(' and ')}`);
  // spiritual
  if (b === 'Ketu') add('spiritual', 1.5, 'signifies moksha and detachment');
  if (lordD1(12)) add('spiritual', 1, 'rules your 12th house (moksha)');
  if (b === 'Jupiter') add('spiritual', 0.5, 'signifies religion');
  if (p.d9 === (P[C.AK].d9 + 11) % 12) add('spiritual', 1.5, 'sits in the 12th from your karakamsa in navamsa — thoughts of liberation');
  return A;
}
function lifeEvents(C) {
  const P = C.P, out = [];
  const birth = C.date.getTime(), yr = 365.2425*86400e3;
  const Rc = {}; for (const b of PL) Rc[b] = roles(C, b);
  // nodes give the results of their sign lord and the planets they join
  for (const n of ['Rahu','Ketu']) {
    const assoc = [...new Set([SIGN_LORD[P[n].sign], ...SEVEN.filter(b => P[b].sign === P[n].sign)])];
    for (const k in AREAS) for (const x of assoc) if (Rc[x][k].w > 0) {
      Rc[n][k].w += 0.6*Rc[x][k].w;
      Rc[n][k].why.push(`acts for ${x} (${P[x].sign === P[n].sign ? 'joined with it' : 'its sign lord'}), which ${Rc[x][k].why[0]}`);
    }
  }
  const afflict = b => {
    if (!P[b]) return 0;
    let a = 0;
    const withM = PL.filter(x => x !== b && ['Rahu','Ketu','Saturn'].includes(x) && P[x].sign === P[b].sign).length;
    a += Math.min(withM, 2)*0.5;
    if (DUSTHANA.includes(P[SIGN_LORD[P[b].sign]].house) && SIGN_LORD[P[b].sign] !== b) a += 0.4;
    if (P[b].combust) a += 0.3;
    return a;
  };
  const refQual = h => [1,4,5,7,9,10,11].includes(h) ? 1 : [6,8,12].includes(h) ? -1 : 0;
  const tone = (b, ref) => {
    let t = score(C, b)/2;
    if (['benefic','yogakaraka'].includes(C.func[b])) t += 0.75;
    if (C.func[b] === 'malefic') t -= 0.5;
    t += 0.6*refQual(hFrom(P[ref === b ? 'Moon' : ref].sign, P[b].sign));
    return t - afflict(b);
  };
  const tr = when => {
    const t = AE.MakeTime(new Date(when)), ay = ayanamsaLahiri(t.tt);
    return {Jupiter: signOf(tropLon('Jupiter', t) - ay), Saturn: signOf(tropLon('Saturn', t) - ay)};
  };
  for (const md of C.dasa.MD) for (const ad of md.ads) {
    if (ad.end.getTime() < birth) continue;
    const s = Math.max(ad.start.getTime(), birth), e = ad.end.getTime();
    const age0 = (s - birth)/yr, age1 = (e - birth)/yr;
    if (age0 > 95) continue;
    const Rm = Rc[md.lord], Ra = Rc[ad.lord];
    const tMD = tone(md.lord, 'Sun'), tAD = tone(ad.lord, 'Moon');
    const adFromMoon = hFrom(P.Moon.sign, P[ad.lord].sign);
    const samples = [0.15, 0.5, 0.85].map(f => tr(s + (e - s)*f));
    const themes = [];
    for (const k in AREAS) {
      let w = 0.6*Rm[k].w + Ra[k].w;
      if (age1 < 14 && !['health','education','obstacles','property','mind'].includes(k)) continue;
      if (k === 'education' && age1 < 5) continue;
      if (k === 'marriage' && (age0 < 19 || age0 > 50)) continue;
      if (k === 'children' && (age0 < 20 || age0 > 48)) continue;
      if (k === 'education' && age0 > 30) continue;
      if ((k === 'career' || k === 'wealth') && age0 < 17) continue;
      if (k === 'property' && age1 < 18) w *= 0.5;
      if (w < (k === 'mind' ? 2 : 2.5)) continue;
      let t = (0.6*tMD*Rm[k].w + tAD*Ra[k].w)/(0.6*Rm[k].w + Ra[k].w);
      if (k === 'mind') {
        const m = x => score(C, x)/2 - 1.2*afflict(x) - (DUSTHANA.includes(P[x].house) ? 0.6 : 0) - (P[x].lordOf.some(h => [6,8,12].includes(h)) ? 0.8 : 0);
        const base = (m('Moon') + m('Mercury'))/2;
        const lordsT = [md.lord, ad.lord].map(b => m(b)).reduce((a, b) => a + b, 0)/2;
        t = 0.5*base + 0.5*lordsT;
      }
      if (k === 'obstacles' || k === 'health') {
        // ch.7.4.4: strong dusthana lords give more trouble, debilitated ones easy sailing
        const lords = [md.lord, ad.lord].filter(b => P[b].lordOf.some(h => [6,8,12].includes(h)));
        const strongL = lords.some(b => DIG_SCORE[P[b].dignity] >= 2);
        t = strongL ? -1.2 : lords.length && lords.every(b => P[b].dignity === 'debilitated') ? 0.3 : -0.6;
        if (k === 'obstacles' && adFromMoon === 8) t -= 0.5;
      }
      const sup = [];
      for (const T of samples) {
        const jl = hFrom(C.lagna, T.Jupiter), jm = hFrom(P.Moon.sign, T.Jupiter), sm = hFrom(P.Moon.sign, T.Saturn), sl = hFrom(C.lagna, T.Saturn);
        if (k === 'marriage' && (jl === 7 || jm === 7)) sup.push('transit Jupiter in your 7th house');
        if (k === 'children' && ([5,9].includes(jm) || jl === 5)) sup.push('transit Jupiter in the 5th or 9th');
        if (k === 'career') { if (jl === 10) sup.push('transit Jupiter in your 10th'); else if (sl === 10) sup.push('transit Saturn in your 10th'); else if ([3,6,11].includes(sm)) sup.push('transit Saturn in a good house from Moon'); }
        if (k === 'wealth' && ([2,11].includes(jm) || sm === 11)) sup.push('transit Jupiter or Saturn in the 2nd/11th from Moon');
        if (k === 'property' && (jl === 4 || jm === 4)) sup.push('transit Jupiter in the 4th');
        if ((k === 'health' || k === 'obstacles') && ([1,8,12].includes(sm) || [8,12].includes(sl))) sup.push('transit Saturn in the 1st, 8th or 12th');
        if (k === 'travel' && ([9,12].includes(jl) || [9,12].includes(sl))) sup.push('transit Jupiter or Saturn in the 9th/12th');
      }
      const support = [...new Set(sup)];
      const conf = w + support.length*1.2;
      themes.push({area:k, good: t >= 0, weight:w, conf, level: conf >= 6 ? 'High' : conf >= 4 ? 'Medium' : 'Low',
        why:[...new Set([...Ra[k].why.map(x => `${ad.lord} ${x}`), ...Rm[k].why.map(x => `${md.lord} (period lord) ${x}`)])].slice(0,4), support});
    }
    themes.sort((a,b) => b.conf - a.conf);
    const top = themes.slice(0, 4);
    const overall = tMD*0.4 + tAD*0.6;
    out.push({md: md.lord, ad: ad.lord, start: new Date(s), end: ad.end, age0, age1, themes: top,
      mood: overall > 0.6 ? 'favourable' : overall < -0.3 ? 'difficult' : 'mixed', adFromMoon,
      remedy: periodRemedy(C, md.lord, ad.lord, top)});
  }
  return out;
}
function periodRemedy(C, md, ad, themes) {
  const P = C.P, r = [];
  const bad = themes.filter(t => !t.good);
  const lords = [...new Set([ad, md])];
  const trouble = lords.filter(b => score(C, b) < 0 || C.func[b] === 'malefic' || b === 'Rahu' || b === 'Ketu' || P[b].lordOf.includes(8));
  if (bad.length) for (const b of trouble) {
    const d = PD[b];
    r.push(`Pacify ${b}: ${d.deed}${d.grain ? `; donate ${d.grain} on a ${d.day} morning` : ''}; recite its mantra ${d.count} times, or worship ${d.deity.split(',')[0]}.`);
  }
  for (const t of bad) {
    if (t.area === 'marriage') { const u = strongerLord(C, C.arudha[12]); r.push(`For relationships: fast on ${PD[u].day}s (${u} rules your upapada, the house of marriage).`); }
    if (t.area === 'career') { const a = strongerLord(C, C.arudha[10]); r.push(`For career: fast on ${PD[a].day}s (${a} rules your rajyapada, A10), and worship ${SIGN_LORD[C.L.d10]}, lagna lord of your career chart (D-10).`); }
    if (t.area === 'health') { const hl = lords.find(b => PD[b].taste); r.push(`For health: take common-sense precautions and get check-ups early${hl ? `; cut down on ${PD[hl].taste} foods (${hl}’s taste)` : ''}.`); }
    if (t.area === 'obstacles') r.push(`Expect trouble and plan for it: act cautiously and avoid needless risks${lords.some(b => b === 'Mars' || P[b].lordOf.includes(8)) ? ', drive carefully' : ''}, and restrain yourself with authorities.`);
    if (t.area === 'wealth') r.push('For money: avoid speculation and large loans in this period.');
  }
  const fb = lords.filter(b => ['benefic','yogakaraka'].includes(C.func[b]));
  if (fb.length) r.push(`${bad.length ? 'To support the good side of this period' : 'To speed up these good results'}, you may wear ${fb.map(b => `${PD[b].gem.toLowerCase()} (${b})`).join(' or ')}, which is favourable for your chart.`);
  const avoid = lords.filter(b => C.func[b] === 'malefic');
  if (avoid.length) r.push(`Do not wear ${avoid.map(b => `${PD[b].gem.toLowerCase()} (${b})`).join(' or ')}: a functional malefic for you.`);
  return [...new Set(r)];
}

// ---------- money calendar (personal financial timing from the book's wealth rules) ----------
// ch.11.9 Dhana yogas: 5th & 9th lords give money in their dasas; 2nd (wealth) and 11th (gains) matter.
// ch.7: 8th = debts, 12th = losses/expenditure, 6th = loans; 5th = speculation (Table 16: Mars/Jupiter signify it).
// ch.25 transit tables (from the Moon) for Jupiter, Saturn, Rahu.
function moneyLordScore(C, b) {
  const p = C.P[b], why = [];
  let w = 0;
  if (p.lordOf.includes(2)) { w += 1.5; why.push(`${b} rules your 2nd (wealth)`); }
  if (p.lordOf.includes(11)) { w += 1.5; why.push(`${b} rules your 11th (gains)`); }
  if (p.lordOf.some(h => h === 5 || h === 9)) { w += 1; why.push(`${b} is a 5th/9th lord, which give money in their periods`); }
  if ([2, 11].includes(p.house)) { w += 0.5; why.push(`${b} sits in your ${ORD(p.house)}`); }
  if (b === 'Jupiter') { w += 0.5; why.push('Jupiter signifies wealth'); }
  if (p.lordOf.includes(8)) { w -= 1.5; why.push(`${b} rules your 8th (debts, sudden losses)`); }
  if (p.lordOf.includes(12)) { w -= 1; why.push(`${b} rules your 12th (expenditure)`); }
  if (p.lordOf.includes(6) && !p.lordOf.includes(11)) { w -= 0.5; why.push(`${b} rules your 6th (loans)`); }
  if ([8, 12].includes(p.house)) { w -= 0.5; why.push(`${b} sits in your ${ORD(p.house)}`); }
  // strength: a strong planet delivers its promise, a weak one struggles (ch.3)
  const st = score(C, b);
  w += Math.max(-1, Math.min(1, st/3));
  return {w, why};
}
function moneyCalendar(C, from, months) {
  const to = new Date(from.getTime() + months*30.44*864e5), rows = [];
  const lagna = C.lagna, moonS = C.P.Moon.sign;
  const cache = {};
  const ls = b => (cache[b] = cache[b] || moneyLordScore(C, b));
  for (const md of C.dasa.MD) for (const ad of md.ads) {
    if (ad.end < from || ad.start > to) continue;
    const len = ad.end - ad.start; let ps = ad.start.getTime();
    for (let k = 0; k < 9; k++) {
      const pl = VIM_ORDER[(VIM_ORDER.indexOf(ad.lord) + k) % 9], pe = ps + len*VIM_YEARS[pl]/120;
      if (pe > from.getTime() && ps < to.getTime()) {
        const s = Math.max(ps, from.getTime()), e = pe, mid = new Date((s + Math.min(e, to.getTime()))/2);
        const T = transitPositions(mid), why = [], warn = [];
        let v = 0.25*ls(md.lord).w + 0.3*ls(ad.lord).w + 0.45*ls(pl).w;
        [[md.lord,'main period'],[ad.lord,'sub-period'],[pl,'sub-sub-period']].forEach(([b, lvl]) => {
          const r = ls(b); if (r.why.length) why.push(`${lvl} ${b}: ${r.why[0]}${r.why[1] ? '; ' + r.why[1] : ''}`);
        });
        const jm = hFrom(moonS, T.Jupiter.sign), sm = hFrom(moonS, T.Saturn.sign), rm = hFrom(moonS, T.Rahu.sign);
        const jGood = TRANSIT.Jupiter[jm - 1][0], sGood = TRANSIT.Saturn[sm - 1][0];
        v += jGood ? 0.6 : -0.4; why.push(`transit Jupiter ${ORD(jm)} from your Moon (${jGood ? 'good' : 'difficult'}: ${TRANSIT.Jupiter[jm - 1][1].toLowerCase()})`);
        v += sGood ? 0.6 : -0.5; (sGood ? why : warn).push(`transit Saturn ${ORD(sm)} from your Moon (${TRANSIT.Saturn[sm - 1][1].toLowerCase()})`);
        const jl = hFrom(lagna, T.Jupiter.sign);
        if ([2, 11].includes(jl)) { v += 0.4; why.push(`transit Jupiter in your ${ORD(jl)} house of ${jl === 2 ? 'wealth' : 'gains'}`); }
        const rating = v >= 0.9 ? 'favourable' : v <= -0.2 ? 'caution' : 'neutral';
        // speculation (5th house): warning signs add up; one sign alone = caution, several together = avoid
        let sw = 0; const specWhy = [];
        const fifthL = (lagna + 4) % 12, fifthM = (moonS + 4) % 12;
        for (const b of ['Saturn','Rahu','Ketu']) if (T[b].sign === fifthL || T[b].sign === fifthM) { sw += 1; specWhy.push(`transit ${b} in the 5th (speculation) from your ${T[b].sign === fifthL ? 'lagna' : 'Moon'}`); }
        if (C.P[pl].lordOf.some(h => h === 8 || h === 12)) { sw += 1; specWhy.push(`sub-sub-period lord ${pl} rules your ${C.P[pl].lordOf.filter(h => h === 8 || h === 12).map(ORD).join(' & ')}`); }
        if (!TRANSIT.Mars[hFrom(moonS, T.Mars.sign) - 1][0]) { sw += 0.5; specWhy.push(`transit Mars ${ORD(hFrom(moonS, T.Mars.sign))} from your Moon`); }
        if (rating === 'caution') { sw += 1; specWhy.push('the money period itself is weak'); }
        const spec = sw >= 2.5 ? 'avoid' : sw >= 1 ? 'caution' : 'ok';
        rows.push({start: new Date(s), end: new Date(e), md: md.lord, ad: ad.lord, pd: pl, score: v, rating, why, warn, spec, specWhy,
          jup: `${SAB[T.Jupiter.sign]} (${ORD(jm)} from Moon)`, sat: `${SAB[T.Saturn.sign]} (${ORD(sm)} from Moon)`});
      }
      ps = pe;
    }
  }
  return rows;
}

const API = {SIGNS, SANSK, SAB, PL, PAB, SEVEN, SIGN_LORD, NAKS, PD, RASI, HOUSE, VIM_YEARS, ORD, fmtDeg, hFrom,
  computeChart, lifeEvents, AREAS, planetReading, overview, currentDasa, dasaReading, remedies, transits, verdict, fmt, list, rasiAspects, strongerLord, NAT, transitPositions, TRANSIT, sidLon, moneyCalendar};
if (typeof module !== 'undefined') module.exports = API; else root.Jyotish = API;
})(typeof window !== 'undefined' ? window : globalThis);
