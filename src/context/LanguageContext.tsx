import { createContext, useContext, useState, type ReactNode } from "react";

export type SupportedLanguage = "en" | "lg" | "sw" | "nyn";

export interface TranslationDictionary {
  // Navigation & Shell
  overview: string;
  bctbScreening: string;
  myFarms: string;
  farmWeather: string;
  extensionTriage: string;
  governanceRules: string;
  aiAssistant: string;
  signOut: string;
  onlineStatus: string;
  offlineStatus: string;
  syncPending: string;
  demoNotice: string;
  switchRoleLabel: string;
  farmerRole: string;
  officerRole: string;
  adminRole: string;

  // Extra Navigation & Dashboards
  helpRoom: string;
  recommendations: string;
  activities: string;
  alerts: string;
  map: string;
  settings: string;
  myPlots: string;
  viewFarms: string;
  askAnOfficer: string;
  checkMyCoffee: string;
  recentQuestions: string;
  noQuestionsFound: string;
  unmanagedSuckersLabel: string;
  unmanagedSuckersHelp: string;

  // Help Room / Chat Consultation
  helpRoomHeading: string;
  helpRoomSubheading: string;
  postQuestionBtn: string;
  postingBtn: string;
  sendReplyBtn: string;
  sendingBtn: string;
  questionTitleLabel: string;
  describeLabel: string;
  replyAsLabel: string;
  filterAll: string;
  filterBctbSigns: string;
  filterPruning: string;
  filterShade: string;
  filterWeather: string;
  roleOfficerBadge: string;
  roleLeadFarmerBadge: string;
  roleFarmerBadge: string;
  roleAdminBadge: string;
  quickAdvicePruning: string;
  quickAdviceBurning: string;
  quickAdviceShade: string;
  helpAllTopics: string;
  helpLiveDiscussions: string;
  helpQuestions: string;
  helpNoQuestions: string;
  helpAskedBy: string;
  helpWaitingReply: string;
  helpReplyOnly: string;
  helpChooseQuestion: string;
  helpAskOfficer: string;
  helpStartConversation: string;
  helpTopic: string;
  helpQuestionTitle: string;
  helpDescribe: string;
  helpSendQuestion: string;
  helpSendReply: string;
  helpSending: string;
  helpPosting: string;
  helpRoomError: string;
  helpReplyError: string;
  helpPostError: string;
  helpCoffeeSupport: string;
  helpUganda: string;
  helpIntroTitle: string;
  helpIntroText: string;
  helpReplyPlaceholder: string;
  helpQuestionPlaceholder: string;
  helpMessagePlaceholder: string;

  // Hero & Dashboard
  heroTitle: string;
  heroSubtitle: string;
  startScreeningBtn: string;
  currentScreening: string;
  noAssessmentYet: string;
  updateAssessmentBtn: string;
  assessNowBtn: string;
  boundariesTitle: string;
  boundariesPoint1: string;
  boundariesPoint2: string;
  boundariesPoint3: string;

  // BCTB Screening Steps
  screeningTitle: string;
  screeningSubtitle: string;
  step1Title: string;
  selectFarm: string;
  liveWeatherMetrics: string;
  shadeCanopyLabel: string;
  denseShade: string;
  moderateShade: string;
  openShade: string;
  alternateHostsLabel: string;

  step2Title: string;
  pinSizedHolesLabel: string;
  pinSizedHolesHelp: string;
  twigBlackeningLabel: string;
  twigBlackeningHelp: string;
  wiltingDryingLabel: string;
  wiltingDryingHelp: string;
  leafYellowingLabel: string;
  twigCountLabel: string;

  step3Title: string;
  previousHistoryLabel: string;
  spreadingDamageLabel: string;
  twigRemovalLabel: string;
  pruningBurned: string;
  irregularRemoval: string;
  notRemoved: string;
  sanitationLabel: string;
  goodSanitation: string;
  fairSanitation: string;
  poorSanitation: string;

  step4Title: string;
  locationConsentLabel: string;
  referralConsentLabel: string;
  attachPhotoLabel: string;
  calculateBtn: string;
  calculatingBtn: string;

  // Screening Results & Mitigation
  resultTitle: string;
  riskHigh: string;
  riskModerate: string;
  riskLow: string;
  riskScoreLabel: string;
  q1StatusTitle: string;
  q2FactorsTitle: string;
  q3MitigationTitle: string;
  mitigationSubNote: string;
  shapTitle: string;
  requestVerificationBtn: string;
  referralSentMsg: string;
  disclaimerNotice: string;
  resumeDraft: string;
  discardDraft: string;
  historyTab: string;
  newAssessmentTab: string;
  yesChoice: string;
  noChoice: string;

  // Voice Assistant, SMS & Dashboard metrics
  speakToAi: string;
  stopListening: string;
  listenToAdvice: string;
  askVoiceQuestion: string;
  smsSentSuccessfully: string;
  smsAlerts: string;
  sendSmsToFarmer: string;
  farmsAndFields: string;
  liveMap: string;
  weatherIntel: string;
  farmJournal: string;
  extensionPortal: string;
  modelGovernance: string;
  registerFarm: string;
  soilMoisture: string;
  temperature: string;
  relativeHumidity: string;
  evapotranspiration: string;
  speakingAdvice: string;
  whatIsHappening: string;
  whyItIsHappening: string;
  advisoryDisclaimer: string;
}

const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    overview: "Overview",
    bctbScreening: "BCTB Screening",
    myFarms: "Robusta Farms",
    farmWeather: "Farm Weather",
    extensionTriage: "Extension Triage",
    governanceRules: "Governance & Rules",
    aiAssistant: "AgriSense AI",
    signOut: "Sign Out",
    onlineStatus: "Online (Cloud Linked)",
    offlineStatus: "Offline Mode (Local Storage)",
    syncPending: "assessments waiting to sync",
    demoNotice: "Demonstration & evaluation mode — validates deterministic expert rules for Black Coffee Twig Borer (Xylosandrus compactus) in Robusta coffee.",
    switchRoleLabel: "Role Switcher (Demo):",
    farmerRole: "Farmer (Nalule H.)",
    officerRole: "Officer (Mukono)",
    adminRole: "Administrator",

    helpRoom: "Farmer-Officer Help Room",
    recommendations: "Recommendations",
    activities: "Farm Journal",
    alerts: "Alerts",
    map: "Farm Map",
    settings: "Settings",
    myPlots: "My Coffee Plots",
    viewFarms: "View My Farms",
    askAnOfficer: "Ask an Officer",
    checkMyCoffee: "Check My Coffee",
    recentQuestions: "Recent Conversations",
    noQuestionsFound: "No inquiries yet. Start the conversation with your first question.",
    unmanagedSuckersLabel: "Unmanaged water suckers present around coffee stems?",
    unmanagedSuckersHelp: "Water suckers provide tender shoot tissue favored by young female borers.",

    helpRoomHeading: "Ask the Coffee Community & Extension Experts",
    helpRoomSubheading: "Inquire directly from agricultural extension officers and lead farmers for practical BCTB guidance. Never post private passwords or financial details.",
    postQuestionBtn: "Post Inquiry",
    postingBtn: "Posting...",
    sendReplyBtn: "Send Guidance Reply",
    sendingBtn: "Sending...",
    questionTitleLabel: "Inquiry Title",
    describeLabel: "Describe symptoms, tree condition & observations",
    replyAsLabel: "Reply as",
    filterAll: "All Inquiries",
    filterBctbSigns: "🐛 Pest Symptoms",
    filterPruning: "✂️ Pruning & Burning",
    filterShade: "🌳 Canopy & Shade",
    filterWeather: "☀️ Drought & Rain",
    roleOfficerBadge: "👮 Extension Officer",
    roleLeadFarmerBadge: "🌾 Lead Farmer / Manager",
    roleFarmerBadge: "🧑‍🌾 Coffee Farmer",
    roleAdminBadge: "⚖️ Platform Admin",
    quickAdvicePruning: "✂️ Prune 5cm below pin-hole",
    quickAdviceBurning: "🔥 Burn immediately in sacks",
    quickAdviceShade: "🌳 Regulate shade to 30-40%",
    helpAllTopics: "All topics", helpLiveDiscussions: "Live discussions", helpQuestions: "Questions",
    helpNoQuestions: "No questions yet. Start a conversation below.", helpAskedBy: "Asked by",
    helpWaitingReply: "Waiting for a reply. New replies will appear here.", helpReplyOnly: "Only the farmer who asked and support staff can reply.",
    helpChooseQuestion: "Choose a question or post one to begin.", helpAskOfficer: "Ask an agricultural officer", helpStartConversation: "Start a conversation",
    helpTopic: "Topic", helpQuestionTitle: "Question title", helpDescribe: "What did you see on your coffee plants?",
    helpSendQuestion: "Post question", helpSendReply: "Send reply", helpSending: "Sending...", helpPosting: "Posting...",
    helpRoomError: "Could not connect to the help room. Check your internet connection and sign-in.", helpReplyError: "Could not load replies for this conversation.", helpPostError: "Your message was not sent. Check your connection and try again.",
    helpCoffeeSupport: "Coffee farming help", helpUganda: "Uganda", helpIntroTitle: "Robusta coffee help room",
    helpIntroText: "Post a question for the farmer community and agricultural officers. Officers can use your location to guide their help; replies appear here live.",
    helpReplyPlaceholder: "Write your reply...", helpQuestionPlaceholder: "For example: What is making these coffee twigs dry?",
    helpMessagePlaceholder: "Tell us what you see, where it is happening and when you first noticed it.",

    heroTitle: "Explainable early-warning screening before twig damage spreads.",
    heroSubtitle: "Combine direct field scouting with live agro-meteorological metrics to screen BCTB risk, explain contributing factors, and guide sanitary cultural mitigation.",
    startScreeningBtn: "Start BCTB Screening",
    currentScreening: "Latest Screening Assessment",
    noAssessmentYet: "Complete an assessment to receive deterministic risk screening and safe non-chemical management steps.",
    updateAssessmentBtn: "Re-evaluate Screening",
    assessNowBtn: "Assess Coffee Block Now",
    boundariesTitle: "Core System Boundaries",
    boundariesPoint1: "Screening is not diagnosis: Flags infestation risk; only extension officers verify beetles in the field.",
    boundariesPoint2: "Safe cultural guidance only: Pruning 5cm below hole, sanitary burning, desuckering, and shade regulation. Strictly no chemical brand recipes.",
    boundariesPoint3: "Transparent Factor Attribution: Every score is explainable with feature contributions (SHAP-style).",

    screeningTitle: "Black Coffee Twig Borer (BCTB) Screening",
    screeningSubtitle: "Scout Robusta coffee branches, plantation management, and climatic stress to identify early infestation risk.",
    step1Title: "Step 1 of 4: Coffee Plantation Context",
    selectFarm: "Select Robusta Coffee Farm",
    liveWeatherMetrics: "Live Agro-Meteorological Metrics",
    shadeCanopyLabel: "Coffee Canopy Shade Level",
    denseShade: "Dense shade (>60% canopy cover — damp microclimate)",
    moderateShade: "Moderate shade (30–40% filtered canopy — recommended)",
    openShade: "Open / Full sun (<20% canopy cover)",
    alternateHostsLabel: "Alternative Host Trees Nearby (Avocado, Erythrina, Albizia)",

    step2Title: "Step 2 of 4: Physical Pest Observations (Xylosandrus compactus)",
    pinSizedHolesLabel: "Pin-sized entry holes on the underside of coffee twigs?",
    pinSizedHolesHelp: "Look closely at the underside of thin primary and secondary branches for tiny 1mm diameter entry holes.",
    twigBlackeningLabel: "Blackening or dark necrosis along affected twigs?",
    twigBlackeningHelp: "Associated with the ambrosia fungus (Fusarium solani) carried by the borer beetle.",
    wiltingDryingLabel: "Leaves and twigs wilting, drooping, or drying up?",
    wiltingDryingHelp: "Vascular blockage distal to the beetle entrance hole causing sudden dieback.",
    leafYellowingLabel: "Unusual leaf yellowing (chlorosis) on affected branches?",
    twigCountLabel: "Estimated number of affected twigs observed across sampled trees:",

    step3Title: "Step 3 of 4: Farm Sanitation & Cultural Practices",
    previousHistoryLabel: "Have BCTB problems occurred on this farm or neighbors before?",
    spreadingDamageLabel: "Is twig dieback spreading or increasing over recent weeks?",
    twigRemovalLabel: "How are infested or dried twigs managed?",
    pruningBurned: "Pruned 5cm below hole and burned off-field immediately in bags",
    irregularRemoval: "Irregular pruning; prunings sometimes left on the ground",
    notRemoved: "Not pruned or burned (left on tree)",
    sanitationLabel: "Overall Plantation Cleanliness & Desuckering",
    goodSanitation: "Good: Routine desuckering, weed-free, ground clear of prunings",
    fairSanitation: "Fair: Occasional maintenance; some water suckers present",
    poorSanitation: "Poor: Dense overgrown suckers and dry branches under canopy",

    step4Title: "Step 4 of 4: Verification Consent & Reference Photo",
    locationConsentLabel: "Location Consent: Allow using my farm coordinates for regional pest warning tracking.",
    referralConsentLabel: "Extension Referral Consent: If screening indicates elevated risk, share this report with the agricultural extension officer for on-farm verification.",
    attachPhotoLabel: "Attach reference photo of affected branch (Optional)",
    calculateBtn: "Calculate Early-Warning Screening Result",
    calculatingBtn: "Evaluating Rules & Weather Data...",

    resultTitle: "Official Screening Assessment Result",
    riskHigh: "Elevated Risk Screening",
    riskModerate: "Moderate Risk Screening",
    riskLow: "Low Risk Screening",
    riskScoreLabel: "Deterministic Risk Score:",
    q1StatusTitle: "Current Risk Status",
    q2FactorsTitle: "Main Contributing Risk Factors",
    q3MitigationTitle: "Approved Non-Chemical Cultural Mitigation Steps",
    mitigationSubNote: "Strictly follow cultural hygiene; chemical pesticide recipes or unregistered brand names are not recommended.",
    shapTitle: "Transparent Factor Attribution (SHAP-Style Feature Weights)",
    requestVerificationBtn: "Request Extension Officer Verification",
    referralSentMsg: "Verification referral submitted! The sub-county extension office has been notified.",
    disclaimerNotice: "Official Advisory Notice: This tool provides early BCTB-risk screening and is not a confirmed pest diagnosis. Consult a qualified agricultural extension officer for verification and management advice.",
    resumeDraft: "You have an unsaved assessment draft. Resume draft?",
    discardDraft: "Discard",
    historyTab: "Assessment History",
    newAssessmentTab: "New Screening Assessment",
    yesChoice: "Yes",
    noChoice: "No",

    speakToAi: "Speak to AgriSense AI",
    stopListening: "Stop Listening",
    listenToAdvice: "Listen to Advice",
    askVoiceQuestion: "Ask a question by voice...",
    smsSentSuccessfully: "SMS advisory sent successfully!",
    smsAlerts: "SMS Pest Alerts & Broadcast",
    sendSmsToFarmer: "Send SMS Advisory to Farmer",
    farmsAndFields: "Robusta Farms & Fields",
    liveMap: "Live Farm & Pest Map",
    weatherIntel: "Agro-Weather Intelligence",
    farmJournal: "Farm Activity Journal",
    extensionPortal: "Extension Officer Portal",
    modelGovernance: "Rules & Model Governance",
    registerFarm: "Register New Robusta Farm",
    soilMoisture: "Soil Moisture",
    temperature: "Temperature",
    relativeHumidity: "Relative Humidity",
    evapotranspiration: "Evapotranspiration",
    speakingAdvice: "Reading advisory aloud...",
    whatIsHappening: "What is happening in the coffee block?",
    whyItIsHappening: "Why is this happening?",
    advisoryDisclaimer: "Official Decision Support Notice: Screening is not a biological diagnosis. Consult your sub-county agricultural extension officer.",
  },

  lg: { // Luganda
    overview: "Okutwaliza Awamu",
    bctbScreening: "Okukebereka Olunyo (BCTB)",
    myFarms: "Ennimiro z'Emwanyi",
    farmWeather: "Embeera y'Obudde",
    extensionTriage: "Ababaka b'Ebyobulimi",
    governanceRules: "Enteekateeka n'Amateeka",
    aiAssistant: "Omuyambi wa AgriSense AI",
    signOut: "Vaamu",
    onlineStatus: "Kikwatagana n'Omutimbagano",
    offlineStatus: "Okola awatali Mutimbagano (Offline)",
    syncPending: "ebikozeddwa birindirira okutikkibwa",
    demoNotice: "Enkola eno ya kugezesa — egezesa amateeka ag'obukugu agakwata ku Lunyo lw'Emwanyi (BCTB) mu Robusta.",
    switchRoleLabel: "Kyusa Obuvunaanyizibwa (Demo):",
    farmerRole: "Omulimi (Nalule H.)",
    officerRole: "Omukugu w'Ebyobulimi (Mukono)",
    adminRole: "Akulira Ebyuma (Admin)",

    helpRoom: "Ekisenge ky'Obuyambi n'Okwebuuza",
    recommendations: "Amagezi g'Obulimi",
    activities: "Ebiwandiiko by'Ennimiro",
    alerts: "Okulabula kw'Ebiwuka",
    map: "Maapu y'Ennimiro",
    settings: "Enteekateeka",
    myPlots: "Emisiri Gyange Egy'Emwanyi",
    viewFarms: "Laba Ennimiro Zange",
    askAnOfficer: "Bunya Omukugu w'Obulimi",
    checkMyCoffee: "Kebereka Emwanyi Zange",
    recentQuestions: "Ebibuuzo n'Emboozi Ebisembyeyo",
    noQuestionsFound: "Tewali bibuuzo binnaba kuteekebwawo. Ba gwe asooka okubuuza.",
    unmanagedSuckersLabel: "Waliwo amasejjere amangi agakula ku bikolo by'emwanyi?",
    unmanagedSuckersHelp: "Amasejjere galina amatabi amagonvu ennyo agasikiriza obunyo obukazi.",

    helpRoomHeading: "Bunya Abalimi n'Abakugu b'Ebyobulimi",
    helpRoomSubheading: "Bunya abakugu b'ebyobulimi mu ggombolola n'abalimi abakulu amagezi ag'obulimi ku Lunyo luno (BCTB). Tokolola ssimu oba namba za banka wano.",
    postQuestionBtn: "Teekamu Ekibuuzo",
    postingBtn: "Kiteekebwamu...",
    sendReplyBtn: "Weereza Amagezi",
    sendingBtn: "Kiweerezebwa...",
    questionTitleLabel: "Omutwe gw'Ekibuuzo",
    describeLabel: "Nnyonnyola by'olabye ku miti, amatabi oba amakoola",
    replyAsLabel: "Ddamu nga",
    filterAll: "Ebibuuzo Byonna",
    filterBctbSigns: "🐛 Obubonero bw'Olunyo",
    filterPruning: "✂️ Okusalira n'Okwokera",
    filterShade: "🌳 Ebisikirize n'Emiti",
    filterWeather: "☀️ Ekyeya n'Enkuba",
    roleOfficerBadge: "👮 Omukugu w'Ebyobulimi",
    roleLeadFarmerBadge: "🌾 Omulimi Omukulu",
    roleFarmerBadge: "🧑‍🌾 Omulimi w'Emwanyi",
    roleAdminBadge: "⚖️ Akulira Enkola",
    quickAdvicePruning: "✂️ Sala 5cm wansi w'ekituli",
    quickAdviceBurning: "🔥 Yookera amangu ago mu bisawo",
    quickAdviceShade: "🌳 Salako ebisikirize bituuke ku 30-40%",
    helpAllTopics: "Emitwe gyonna", helpLiveDiscussions: "Emboozi ezigenda mu maaso", helpQuestions: "Ebibuuzo",
    helpNoQuestions: "Tewali kibuuuzo. Tandika emboozi wansi.", helpAskedBy: "Yabuuza",
    helpWaitingReply: "Tulindirira okuddamu. Eby'okuddamu bijja kulabika wano.", helpReplyOnly: "Omulimi eyabuuza n'abakozi b'ebyobulimi be bokka abayinza okuddamu.",
    helpChooseQuestion: "Londa ekibuuzo oba teekawo ekipya okutandika.", helpAskOfficer: "Buuza omukugu w'ebyobulimi", helpStartConversation: "Tandika emboozi",
    helpTopic: "Omutwe", helpQuestionTitle: "Omutwe gw'ekibuuzo", helpDescribe: "Olabye ki ku miti gy'emwanyi?",
    helpSendQuestion: "Weereza ekibuuzo", helpSendReply: "Weereza eky'okuddamu", helpSending: "Kiweerezebwa...", helpPosting: "Kiteekebwawo...",
    helpRoomError: "Tetuyinza kuyunga ku kisenge ky'obuyambi. Kebera omutimbagano n'okuyingira mu akawunti.", helpReplyError: "Tetuyinza kutikka eby'okuddamu mu mboozi eno.", helpPostError: "Obubaka bwo tebuweerezeddwa. Kebera omutimbagano oddemu ogezeeko.",
    helpCoffeeSupport: "Obuyambi bw'okulima emwanyi", helpUganda: "Uganda", helpIntroTitle: "Ekisenge ky'obuyambi bw'emwanyi za Robusta",
    helpIntroText: "Weereza ekibuuzo abalimi n'abakozi b'ebyobulimi kye basobola okulaba. Abakozi basobola okukozesa ekifo kyo okukuyamba; eby'okuddamu bijja kulabika wano.",
    helpReplyPlaceholder: "Wandiika eky'okuddamu...", helpQuestionPlaceholder: "Okugeza: Lwaki amatabi gano gakaze?",
    helpMessagePlaceholder: "Nnyonnyola by'olabye, we biri, n'ekiseera lwe watandika okubiraba.",

    heroTitle: "Okulabula amangu ku Lunyo lw'Emwanyi ng'amatabi tegannaba kwononeka.",
    heroSubtitle: "Gatta bye weerabirako ku nnimiro n'embeera y'obudde (ekyeya n'ebbula ly'enkuba) okumanya obulabe bw'olunyo n'engeri y'okwerinda mu bulimi obw'obutonde.",
    startScreeningBtn: "Tandika Okukebereka Olunyo",
    currentScreening: "Ebirowoozo ebisembyeyo ku Nnimiro",
    noAssessmentYet: "Maliriza okukebereka amakubo ag'amagezi ag'obulimi awatali ddagala lya kkemiko.",
    updateAssessmentBtn: "Ddamu Okukebereka",
    assessNowBtn: "Kebereka Omusiri Gwo Kaakano",
    boundariesTitle: "Enkizo n'Amateeka g'Enkola Eno",
    boundariesPoint1: "Okukebereka si kwe kumalawo obulwadde: Kukulabula bulabuzi; omukugu w'ebyobulimi y'agenda mu nnimiro okuzuula obunyo mu matabi.",
    boundariesPoint2: "Amagezi ga butonde gyokka: Sala amatabi 5cm wansi w'ekituli, gooke mu kisawo, tema amasejjere, era salako ebisikirize. Tewali ddagala lya kkemiko likubirizibwa.",
    boundariesPoint3: "Buli nsonga eragibwa lwaki esalawo bwe etyo (SHAP Factor Attribution).",

    screeningTitle: "Okukebereka Olunyo lw'Emwanyi (BCTB)",
    screeningSubtitle: "Kebera amatabi g'emwanyi, enkola z'obulimi, n'embeera y'obutonde okulaba obulabe bw'olunyo.",
    step1Title: "Eddaala 1 ku 4: Embeera y'Ennimiro y'Emwanyi",
    selectFarm: "Londa Ennimiro y'Emwanyi",
    liveWeatherMetrics: "Embeera y'Obudde okuva mu Satelayiti",
    shadeCanopyLabel: "Obunene bw'Ebisikirize mu Nnimiro",
    denseShade: "Ebisikirize bingi nnyo (>60% — kireeta obunyogovu obuleeta obunyo)",
    moderateShade: "Ebisikirize eby'ekigero (30–40% — bye biyinga obulungi)",
    openShade: "Ettaka eriri mu musana omukalu (<20%)",
    alternateHostsLabel: "Emiti emirala egikyaza olunyo (Avocado, Kiko/Erythrina, Albizia)",

    step2Title: "Eddaala 2 ku 4: By'olabye ku Matabi (Xylosandrus compactus)",
    pinSizedHolesLabel: "Olaba obutuli obutono ng'empiso wansi ku matabi g'emwanyi?",
    pinSizedHolesHelp: "Kebera wansi ku matabi amatonotono okulaba oba eriyo obutuli obutono bwa 1mm.",
    twigBlackeningLabel: "Amatabi gakutte obufuzi oba gabiise nga mafu?",
    twigBlackeningHelp: "Kino kiva ku kibubi (Fusarium solani) ekitwalibwa olunyo luno.",
    wiltingDryingLabel: "Amakoola n'amatabi gawotose oba gakaze?",
    wiltingDryingHelp: "Amazzi galemereddwa okulinnya mu ttabi olw'olunyo okulyokamu ekituli.",
    leafYellowingLabel: "Amakoola gaakayenvu ku matabi agalwaddewo?",
    twigCountLabel: "Obala amatabi amakosefu ameka ku miti gy'okebereddeko?",

    step3Title: "Eddaala 3 ku 4: Obuyonjo bw'Ennimiro n'Okusalira",
    previousHistoryLabel: "Ennimiro eno oba eza baliraanwa zaaliko olunyo luno emabegako?",
    spreadingDamageLabel: "Okwonooneka kw'amatabi kweyongedde mu wiiki zino ez'emabega?",
    twigRemovalLabel: "Amatabi agalwadde oba amakaze ogakola ki?",
    pruningBurned: "Ngasala 5cm wansi w'ekituli ne ngyokera mu kisawo ebweru w'ennimiro",
    irregularRemoval: "Olusala olumu; amatabi agamu gasigala wansi mu nnimiro",
    notRemoved: "Sigateema oba sigookera (gasigala ku muti)",
    sanitationLabel: "Obuyonjo bw'Ennimiro n'Okutema Amasejjere",
    goodSanitation: "Bulungi: Ntema amasejjere buli lwe gamera, tewali bikoola bikaafu",
    fairSanitation: "Kyakigero: Nsala olusi n'olusi; amasejjere agamu galiwo",
    poorSanitation: "Bubi: Amasejjere mangi nnyo n'amatabi amakaze gasaasaanidde wansi",

    step4Title: "Eddaala 4 ku 4: Okukkiriza n'Ekifaananyi",
    locationConsentLabel: "Nzikiriza okukozesa ekifo ky'ennimiro yange okulondoola obulabe bw'ebiwuka mu kitundu.",
    referralConsentLabel: "Nzikiriza alipoota eno okuweerezebwa eri omukugu w'ebyobulimi ankyalire mu nnimiro nga waliwo obulabe.",
    attachPhotoLabel: "Kwata Ekifaananyi ky'Ettabi erirwadde (Bw'oba oyagala)",
    calculateBtn: "Bala Obulabe bw'Olunyo Ku Nnimiro",
    calculatingBtn: "Ebyuma Bikola n'Okwekenneenya...",

    resultTitle: "Ebyavudde mu Kukebereka Olunyo",
    riskHigh: "Obulabe bwa Waggulu Nnyo",
    riskModerate: "Obulabe bwa Kigero",
    riskLow: "Obulabe Butono",
    riskScoreLabel: "Obubonero bw'Obulabe:",
    q1StatusTitle: "1. Embeera y'Obulabe bwa Kiro Kaakano",
    q2FactorsTitle: "2. Ensonga Ezisinze Okuvaako Obulabe Buno",
    q3MitigationTitle: "3. Amagezi ag'Okwerinda g'Olina Okukola Amangu (Awatali Ddagala lya Kkemiko)",
    mitigationSubNote: "Goberera amateeka g'obuyonjo mu bulimi; tosiiga ddagala lya kkemiko ly'otamanyi ku mwanyi zo.",
    shapTitle: "Ensonga Eziri Mabega w'Obubonero Buno (SHAP Style)",
    requestVerificationBtn: "Saba Omukugu w'Ebyobulimi Akukyalire mu Nnimiro",
    referralSentMsg: "Okusaba kwo kutuuse! Omukugu w'Ebyobulimi mu ggombolola agenda kukukyalira.",
    disclaimerNotice: "Okulabula kw'Obulimi: Bino bya kukulabula amangu si kwe kumalawo buzaale bwa bulwadde. Funira amagezi ddala ku mukugu w'ebyobulimi.",
    resumeDraft: "Waliwo ebyo bye wali otandise okwekenneenya. Oyagala kubyongerako?",
    discardDraft: "Bisuule",
    historyTab: "Ebyakeberwa Emabega",
    newAssessmentTab: "Okukebereka Okupya",
    yesChoice: "Yee",
    noChoice: "Nedda",

    speakToAi: "Yogera ne AgriSense AI",
    stopListening: "Lekera awo Okuwuliriza",
    listenToAdvice: "Wuliriza Amagezi",
    askVoiceQuestion: "Buuza ekibuuzo n'eddoboozi lyo...",
    smsSentSuccessfully: "Obubaka bwa SMS buweerezeddwa bulungi!",
    smsAlerts: "Okulabula kw'Ebiwuka ku SMS",
    sendSmsToFarmer: "Weereza Omulimi Obubaka bwa SMS",
    farmsAndFields: "Ennimiro n'Emisiri gy'Emwanyi",
    liveMap: "Maapu y'Ennimiro n'Ebiwuka",
    weatherIntel: "Embeera y'Obudde n'Enkuba",
    farmJournal: "Ebiwandiiko by'Ennimiro",
    extensionPortal: "Omukutu gw'Ababaka b'Ebyobulimi",
    modelGovernance: "Enteekateeka n'Amateeka g'Ebyuma",
    registerFarm: "Wandiisa Ennimiro y'Emwanyi Empya",
    soilMoisture: "Amazzi agali mu Ttaka",
    temperature: "Obubangirivu bw'Omusana",
    relativeHumidity: "Obunyogovu mu Mpewo",
    evapotranspiration: "Okukala kw'Amazzi mu Ttaka",
    speakingAdvice: "Esoma amagezi n'eddoboozi...",
    whatIsHappening: "Kiki ekigenda mu maaso mu mwanyi?",
    whyItIsHappening: "Lwaki kino kigenda mu maaso?",
    advisoryDisclaimer: "Okulabula kw'Ebyobulimi: Okukebereka si kwe kumalawo obulwadde. Bunya omukugu w'ebyobulimi mu ggombolola.",
  },

  sw: { // Swahili
    overview: "Muhtasari",
    bctbScreening: "Uchunguzi wa Kidungadunga (BCTB)",
    myFarms: "Mashamba ya Kahawa",
    farmWeather: "Hali ya Hewa",
    extensionTriage: "Maafisa Ugani wa Kilimo",
    governanceRules: "Utawala na Kanuni",
    aiAssistant: "AgriSense AI",
    signOut: "Toka",
    onlineStatus: "Imeunganishwa Mtandaoni",
    offlineStatus: "Hali ya Nje ya Mtandao (Offline)",
    syncPending: "uchunguzi unasubiri kupakiwa",
    demoNotice: "Hali ya maonyesho — inathibitisha kanuni za kitaalamu za Kidungadunga cha Matawi ya Kahawa (Xylosandrus compactus) kwenye kahawa ya Robusta.",
    switchRoleLabel: "Badilisha Wadhifa (Demo):",
    farmerRole: "Mkulima (Nalule H.)",
    officerRole: "Afisa Ugani (Mukono)",
    adminRole: "Msimamizi wa Mfumo",

    helpRoom: "Chumba cha Mashauriano ya Wakulima na Maafisa",
    recommendations: "Mapendekezo ya Kilimo",
    activities: "Shajara ya Shamba",
    alerts: "Tahadhari za Wadudu",
    map: "Ramani ya Shamba",
    settings: "Mipangilio",
    myPlots: "Vitalu Vyangu vya Kahawa",
    viewFarms: "Tazama Mashamba Yangu",
    askAnOfficer: "Uliza Afisa Ugani",
    checkMyCoffee: "Chunguza Kahawa Yangu",
    recentQuestions: "Mazungumzo ya Hivi Karibuni",
    noQuestionsFound: "Hakuna maswali yaliyotumwa bado. Anzisha mazungumzo na swali lako la kwanza.",
    unmanagedSuckersLabel: "Kuna chipukizi mengi yanayoota chini ya miti ya kahawa?",
    unmanagedSuckersHelp: "Chipukizi lina matawi laini yanayopendwa na wadudu wa kike.",

    helpRoomHeading: "Uliza Jumuiya ya Wakulima na Maafisa Ugani",
    helpRoomSubheading: "Pata mwongozo sahihi wa kitamaduni kuhusu Kidungadunga (BCTB) kutoka kwa maafisa ugani na wakulima wakuu. Usiweke manenosiri wala taarifa binafsi.",
    postQuestionBtn: "Tuma Swali",
    postingBtn: "Linatuma...",
    sendReplyBtn: "Tuma Ushauri",
    sendingBtn: "Inatuma...",
    questionTitleLabel: "Kichwa cha Swali",
    describeLabel: "Eleza dalili unazoona kwenye matawi au miti",
    replyAsLabel: "Jibu kama",
    filterAll: "Maswali Yote",
    filterBctbSigns: "🐛 Dalili za Wadudu",
    filterPruning: "✂️ Kupogoa na Kuchoma",
    filterShade: "🌳 Vivuli na Miti",
    filterWeather: "☀️ Ukame na Mvua",
    roleOfficerBadge: "👮 Afisa Ugani wa Kilimo",
    roleLeadFarmerBadge: "🌾 Mkulima Kiongozi",
    roleFarmerBadge: "🧑‍🌾 Mkulima wa Kahawa",
    roleAdminBadge: "⚖️ Msimamizi",
    quickAdvicePruning: "✂️ Pogoa sm 5 chini ya tundu",
    quickAdviceBurning: "🔥 Choma moto mara moja ndani ya gunia",
    quickAdviceShade: "🌳 Punguza kivuli kufikia 30-40%",
    helpAllTopics: "Mada zote", helpLiveDiscussions: "Mazungumzo yanayoendelea", helpQuestions: "Maswali",
    helpNoQuestions: "Hakuna maswali bado. Anzisha mazungumzo hapa chini.", helpAskedBy: "Ameuliza",
    helpWaitingReply: "Tunasubiri jibu. Majibu mapya yataonekana hapa.", helpReplyOnly: "Mkulima aliyeuliza na maafisa wa kilimo pekee wanaweza kujibu.",
    helpChooseQuestion: "Chagua swali au tuma swali jipya ili kuanza.", helpAskOfficer: "Uliza afisa ugani wa kilimo", helpStartConversation: "Anzisha mazungumzo",
    helpTopic: "Mada", helpQuestionTitle: "Kichwa cha swali", helpDescribe: "Umeona nini kwenye mimea yako ya kahawa?",
    helpSendQuestion: "Tuma swali", helpSendReply: "Tuma jibu", helpSending: "Inatuma...", helpPosting: "Inatuma...",
    helpRoomError: "Imeshindwa kuunganisha kwenye chumba cha msaada. Angalia intaneti na uingie tena.", helpReplyError: "Imeshindwa kupakia majibu ya mazungumzo haya.", helpPostError: "Ujumbe wako haukutumwa. Angalia intaneti ujaribu tena.",
    helpCoffeeSupport: "Msaada wa kilimo cha kahawa", helpUganda: "Uganda", helpIntroTitle: "Chumba cha msaada kwa wakulima wa Robusta",
    helpIntroText: "Tuma swali ambalo wakulima na maafisa wa kilimo wanaweza kuona. Maafisa wanaweza kutumia eneo lako kukusaidia; majibu yataonekana hapa moja kwa moja.",
    helpReplyPlaceholder: "Andika jibu lako...", helpQuestionPlaceholder: "Kwa mfano: Kwa nini matawi haya ya kahawa yanakauka?",
    helpMessagePlaceholder: "Eleza ulichoona, mahali kilipotokea na ulipoanza kukiona.",

    heroTitle: "Uchunguzi wa tahadhari ya mapema kabla ya uharibifu wa matawi kusambaa.",
    heroSubtitle: "Unganisha uchunguzi wa shamba na takwimu za hali ya hewa (ukame na uhaba wa mvua) kupima hatari ya BCTB na kuelekeza hatua salama za kuzuia.",
    startScreeningBtn: "Anza Uchunguzi wa BCTB",
    currentScreening: "Tathmini ya Hivi Karibuni ya Shamba",
    noAssessmentYet: "Kamilisha uchunguzi kupata ushauri salama wa kilimo bila kemikali.",
    updateAssessmentBtn: "Sasisha Uchunguzi",
    assessNowBtn: "Chunguza Shamba Lako Sasa",
    boundariesTitle: "Misingi ya Mfumo",
    boundariesPoint1: "Uchunguzi si utambuzi kamili: Unaonya uwezekano; maafisa ugani pekee wanathibitisha wadudu shambani.",
    boundariesPoint2: "Mbinu salama za asili pekee: Kupogoa sm 5 chini ya tundu, kuchoma moto ndani ya gunia, na kupunguza vivuli. Hakuna dawa za kemikali.",
    boundariesPoint3: "Ufafanuzi wa wazi wa mambo yaliyochangia matokeo (SHAP).",

    screeningTitle: "Uchunguzi wa Kidungadunga cha Kahawa (BCTB)",
    screeningSubtitle: "Chunguza matawi ya Robusta, usafi wa shamba, na athari za hali ya hewa kutambua hatari ya wadudu mapema.",
    step1Title: "Hatua 1 ya 4: Mazingira ya Shamba la Kahawa",
    selectFarm: "Chagua Shamba la Kahawa",
    liveWeatherMetrics: "Hali ya Hewa ya Moja kwa Moja",
    shadeCanopyLabel: "Kiwango cha Kivuli cha Miti",
    denseShade: "Kivuli kingi mno (>60% — unyevu mwingi unaolea wadudu)",
    moderateShade: "Kivuli cha wastani (30–40% — kinachoshauriwa)",
    openShade: "Jua kali / Wazi (<20%)",
    alternateHostsLabel: "Miti mingine inayopokea wadudu (Parachichi, Muringa/Erythrina)",

    step2Title: "Hatua 2 ya 4: Uchunguzi wa Dalili za Wadudu (Xylosandrus compactus)",
    pinSizedHolesLabel: "Kuna matundu madogo kama ya sindano chini ya matawi ya kahawa?",
    pinSizedHolesHelp: "Angalia kwa makini chini ya matawi madogo kuona matundu ya mm 1.",
    twigBlackeningLabel: "Matawi yanaonekana meusi au yamekufa?",
    twigBlackeningHelp: "Hii inasababishwa na fangasi wa ambrosia (Fusarium solani) inayoletwa na kidungadunga.",
    wiltingDryingLabel: "Majani na matawi yananyauka au kukauka ghafla?",
    wiltingDryingHelp: "Maji yanakosa kupita kwenye tawi baada ya mdudu kutoboa tundu.",
    leafYellowingLabel: "Majani yamebadilika kuwa ya njano kwenye matawi yaliyoathirika?",
    twigCountLabel: "Kadirio la matawi yaliyoathirika kwenye miti uliyochunguza:",

    step3Title: "Hatua 3 ya 4: Usafi wa Shamba na Mbinu za Kupogoa",
    previousHistoryLabel: "BCTB imewahi kutokea kwenye shamba hili au kwa majirani?",
    spreadingDamageLabel: "Uharibifu wa matawi unaongezeka katika wiki za hivi karibuni?",
    twigRemovalLabel: "Matawi yaliyoathirika yanatunzwa vipi?",
    pruningBurned: "Yanapogolewa sm 5 chini ya tundu na kuchomwa moto mara moja ndani ya gunia",
    irregularRemoval: "Kupogoa mara chache; wakati mwingine matawi yanaachwa ardhini",
    notRemoved: "Hayapogolewi wala kuchomwa moto",
    sanitationLabel: "Usafi wa Shamba na Ukataji wa Chipukizi",
    goodSanitation: "Mzuri: Chipukizi yanakatwa mara kwa mara, hakuna magugu",
    fairSanitation: "Wastani: Usafi unafanywa mara kwa mara; kuna chipukizi kadhaa",
    poorSanitation: "Duni: Chipukizi mengi na matawi makavu yamesambaa ardhini",

    step4Title: "Hatua 4 ya 4: Ridhaa na Picha ya Ushahidi",
    locationConsentLabel: "Naruhusu matumizi ya eneo la shamba langu kufuatilia tahadhari ya wadudu.",
    referralConsentLabel: "Naruhusu ripoti hii kutumwa kwa afisa ugani wa kilimo kunitembelea shambani ikiwa hatari ni kubwa.",
    attachPhotoLabel: "Ambatisha picha ya tawi lililoathirika (Hiari)",
    calculateBtn: "Piga Hesabu ya Hatari ya Shamba",
    calculatingBtn: "Inatathmini Kanuni na Hali ya Hewa...",

    resultTitle: "Matokeo Rasmi ya Uchunguzi",
    riskHigh: "Hatari Kubwa ya Wadudu",
    riskModerate: "Hatari ya Wastani",
    riskLow: "Hatari Ndogo",
    riskScoreLabel: "Alama za Hatari:",
    q1StatusTitle: "1. Hali ya Hatari ya Sasa",
    q2FactorsTitle: "2. Sababu Kuu Zilizochangia Matokeo Haya",
    q3MitigationTitle: "3. Hatua Salama za Kilimo za Kuzuia (Bila Kemikali)",
    mitigationSubNote: "Fuata usafi wa kitamaduni; usitumie dawa za kemikali ambazo hazijasajiliwa.",
    shapTitle: "Uzito wa Sababu Zilizosababisha Alama Hizi (SHAP)",
    requestVerificationBtn: "Omba Afisa Ugani Akutembelee Shambani",
    referralSentMsg: "Ombi lako limetumwa! Afisa ugani atawasiliana nawe hivi karibuni.",
    disclaimerNotice: "Ilani Rasmi: Chombo hiki hutoa tahadhari ya mapema na si utambuzi kamili. Wasiliana na afisa ugani kwa uthibitisho.",
    resumeDraft: "Kuna uchunguzi uliouanza hapo awali. Ungependa kuendelea nao?",
    discardDraft: "Futa",
    historyTab: "Historia ya Uchunguzi",
    newAssessmentTab: "Uchunguzi Mpya",
    yesChoice: "Ndiyo",
    noChoice: "Hapana",

    speakToAi: "Ongea na AgriSense AI",
    stopListening: "Acha Kusikiliza",
    listenToAdvice: "Sikiliza Ushauri",
    askVoiceQuestion: "Uliza swali kwa sauti...",
    smsSentSuccessfully: "Ujumbe wa SMS umetumwa kwa mafanikio!",
    smsAlerts: "Tahadhari za Wadudu kwa SMS",
    sendSmsToFarmer: "Mtumie Mkulima Ujumbe wa SMS",
    farmsAndFields: "Mashamba na Vitalu vya Kahawa",
    liveMap: "Ramani ya Mashamba na Wadudu",
    weatherIntel: "Taarifa za Hali ya Hewa",
    farmJournal: "Shajara ya Shamba",
    extensionPortal: "Tovuti ya Maafisa Ugani",
    modelGovernance: "Utawala na Kanuni za Mfumo",
    registerFarm: "Sajili Shamba Jipya la Kahawa",
    soilMoisture: "Unyevu wa Udongo",
    temperature: "Joto la Hewa",
    relativeHumidity: "Unyevunyevu wa Hewa",
    evapotranspiration: "Kupotea kwa Maji Udongoni",
    speakingAdvice: "Inasoma ushauri kwa sauti...",
    whatIsHappening: "Ni nini kinatokea shambani?",
    whyItIsHappening: "Kwa nini hii inatokea?",
    advisoryDisclaimer: "Ilani Rasmi: Uchunguzi huu si utambuzi kamili wa kibaolojia. Wasiliana na afisa ugani wa kilimo.",
  },

  nyn: { // Runyankole / Rukiga
    overview: "Ebirikukwataho",
    bctbScreening: "Okushwijuma Enyo (BCTB)",
    myFarms: "Emisiri y'Omwani",
    farmWeather: "Obwire n'Obutonde",
    extensionTriage: "Abahabuzi b'Ebyoburimi",
    governanceRules: "Entebeekanisa n'Amateeka",
    aiAssistant: "Omuhabuzi wa AgriSense AI",
    signOut: "Rugaamu",
    onlineStatus: "Kikwataine n'Omutimbagano",
    offlineStatus: "Okukora Ahatari Mutimbagano (Offline)",
    syncPending: "ebishwijwirwe birinzire kutimbagizibwa",
    demoNotice: "Entebeekanisa y'okworeka — erikushwijuma amateeka g'obukugu aha nyo y'omwani (BCTB) omu Robusta.",
    switchRoleLabel: "Hindura Obujunaanizibwa (Demo):",
    farmerRole: "Omuriimi (Nalule H.)",
    officerRole: "Omuhabuzi (Mukono)",
    adminRole: "Omukuru w'Ebyuma",

    helpRoom: "Ekiika ky'Obuhabuzi bw'Abalimi n'Abeebembezi",
    recommendations: "Ebirikuhaburwa",
    activities: "Ebirobyo by'Omusiri",
    alerts: "Okurabura",
    map: "Maapu y'Omusiri",
    settings: "Entuute",
    myPlots: "Emisiri Yange ey'Omwani",
    viewFarms: "Reeba Emisiri Yange",
    askAnOfficer: "Shaba Omuhabuzi",
    checkMyCoffee: "Shwijuma Omwani Gwangye",
    recentQuestions: "Ebigambo n'Ebibuuzo bya Hati",
    noQuestionsFound: "Tihariho bibuuzo biheebwe hati. Tandika n'ekibuuzo kyawe eky'okubanza.",
    unmanagedSuckersLabel: "Waliho amasejjere amangi agakula ahansi y'emiti y'omwani?",
    unmanagedSuckersHelp: "Amasejjere gaine amataagi agorobi agarikukwata enyo ahonaaho.",

    helpRoomHeading: "Shaba Obuhabuzi kuruga omu Bahabuzi n'Abaheereza",
    helpRoomSubheading: "Tunga obuhabuzi bw'oburimi aha nyo y'omwani (BCTB) kuruga omu bahabuzi b'ebyoburimi omu ggomborora n'abaheereza abakuru. Otaataho mananukiro g'esente z'omwisimu wano.",
    postQuestionBtn: "Taamu Ekibuuzo",
    postingBtn: "Nikitaho...",
    sendReplyBtn: "Yoohereza Obuhabuzi",
    sendingBtn: "Niyoohereza...",
    questionTitleLabel: "Omutwe gw'Ekibuuzo",
    describeLabel: "Shoboorora ebi orikureeba aha miti n'amataagi",
    replyAsLabel: "Garukamu nka",
    filterAll: "Ebibuuzo Byona",
    filterBctbSigns: "🐛 Obubonero bw'Enyo",
    filterPruning: "✂️ Okushara n'Okootsya",
    filterShade: "🌳 Ebibisi n'Emiti",
    filterWeather: "☀️ Ekyeya n'Enjura",
    roleOfficerBadge: "👮 Omuhabuzi w'Ebyoburimi",
    roleLeadFarmerBadge: "🌾 Omuhingi Omukuru",
    roleFarmerBadge: "🧑‍🌾 Omuhingi w'Omwani",
    roleAdminBadge: "⚖️ Omwebembezi",
    quickAdvicePruning: "✂️ Shara 5cm ahansi y'ekituri",
    quickAdviceBurning: "🔥 Ootsya ahonaaho omu nshaho",
    quickAdviceShade: "🌳 Shungura ebibisi bihikye aha 30-40%",
    helpAllTopics: "Emitwe yoona", helpLiveDiscussions: "Ebiganiro ebirikugyenda", helpQuestions: "Ebibuuzo",
    helpNoQuestions: "Tihariho kibuuzo hati. Tandika ekiganiro ahansi.", helpAskedBy: "Abuuziibwe",
    helpWaitingReply: "Niturindirire eky'okugarukamu. Eby'okugarukamu bisya nibiija kureebeka ahanu.", helpReplyOnly: "Omuriimi obuuziibwe n'abakozi b'ebyoburimi nibo bonka abarikubaasa kugarukamu.",
    helpChooseQuestion: "Toorana ekibuuzo nari oteho ekisya kutandika.", helpAskOfficer: "Buuza omuhabuzi w'ebyoburimi", helpStartConversation: "Tandika ekiganiro",
    helpTopic: "Omwanya gw'ekiganiro", helpQuestionTitle: "Omutwe gw'ekibuuzo", helpDescribe: "Nooreeba ki aha miti y'omwani?",
    helpSendQuestion: "Ohereza ekibuuzo", helpSendReply: "Ohereza eky'okugarukamu", helpSending: "Niyoohereza...", helpPosting: "Nikitaho...",
    helpRoomError: "Titurikubaasa kuta omukago n'ekyumba ky'obuhwezi. Reeba intaneeti n'okwingira omu akawunti.", helpReplyError: "Titurikubaasa kutwara eby'okugarukamu by'ekiganiro eki.", helpPostError: "Obutumwa bwawe tibwoohereziibwe. Reeba intaneeti ogyezeyo.",
    helpCoffeeSupport: "Obuhwezi bw'okurima omwani", helpUganda: "Uganda", helpIntroTitle: "Ekyumba ky'obuhwezi bw'omwani gwa Robusta",
    helpIntroText: "Ohereza ekibuuzo eki abarikurima n'abahabuzi b'ebyoburimi barikubaasa kureeba. Abahabuzi nibabaasa kukoresa eyawe kukuhwera; eby'okugarukamu nibija kureebeka ahanu.",
    helpReplyPlaceholder: "Handiika eky'okugarukamu...", helpQuestionPlaceholder: "Nk'oku: Ahabw'enki amataagi g'omwani gari kukama?",
    helpMessagePlaceholder: "Shoboorora eki waareebire, ahu kiri n'obwire obu watandikire kukireeba.",

    heroTitle: "Okwerinda amangu enyo y'omwani amataagi gakatakacwekire.",
    heroSubtitle: "Gaita ebi orikureeba aha musiri n'embeera y'obutonde (ekyeya n'enjura) kumanya oburemeezi bw'enyo y'omwani n'okwerinda omu muringo gw'obutonde.",
    startScreeningBtn: "Tandika Okushwijuma Enyo",
    currentScreening: "Ebiherize Kushwijumwa aha Musiri",
    noAssessmentYet: "Hwamu okushwijuma kutunga obuhabuzi bw'omusingye ahatariho kubazi ya kkemiko.",
    updateAssessmentBtn: "Dizamu Okushwijuma",
    assessNowBtn: "Shwijuma Omusiri Gwawe Hati",
    boundariesTitle: "Amateeka g'Entebeekanisa Eno",
    boundariesPoint1: "Okushwijuma tikwo kumanya oburwaire bwona: Nikukurabura; abahabuzi b'ebyoburimi nibo baraije omu musiri kureeba enyo.",
    boundariesPoint2: "Obuhabuzi bw'obutonde kyonka: Shara amataagi 5cm ahansi y'ekituri, gootsye omu nshaho, tema amasejjere, reero oshungure ebibisi.",
    boundariesPoint3: "Buri nshonga neyoreka ahabw'enki ecwamu etyo (SHAP).",

    screeningTitle: "Okushwijuma Enyo y'Omwani (BCTB)",
    screeningSubtitle: "Shwijuma amataagi g'omwani gwa Robusta, engyenderwaho y'omusiri n'embeera y'obutonde.",
    step1Title: "Eicweka 1 aha 4: Embeera y'Omusiri gw'Omwani",
    selectFarm: "Toorana Omusiri gw'Omwani",
    liveWeatherMetrics: "Obwire n'Enjura ebiriho Hati",
    shadeCanopyLabel: "Obunene bw'Ebibisi omu Musiri",
    denseShade: "Ebibisi byingi munonga (>60% — nireeta obunyonyi obukwata enyo)",
    moderateShade: "Ebibisi by'ekigyezo (30–40% — nibyo birungi)",
    openShade: "Omu musana gwonka (<20%)",
    alternateHostsLabel: "Emiti erikutunga enyo egi (Avocado, Omuko/Erythrina)",

    step2Title: "Eicweka 2 aha 4: Ebi Orikureeba aha Mataagi (Xylosandrus compactus)",
    pinSizedHolesLabel: "Oreebire obuturi bukye nk'empiso ahansi y'amataagi g'omwani?",
    pinSizedHolesHelp: "Reeba gye ahansi y'amataagi amakye yaaba hine obuturi bwa mm 1.",
    twigBlackeningLabel: "Amataagi nigooneka gaafiire nari maraguju?",
    twigBlackeningHelp: "Kireetwa obukoko (Fusarium solani) oburikureetwa enyo egi.",
    wiltingDryingLabel: "Amababi n'amataagi nibyomiirira nari kwoma gye?",
    wiltingDryingHelp: "Ameezi tibirikuhika omu taagi ahabw'ekituri ekyacwekiremu.",
    leafYellowingLabel: "Amababi gahindukire kyenju aha mataagi agarwaire?",
    twigCountLabel: "Amataagi agaakwasirwe agarikwingana ki aha miti ei washwijuma:",

    step3Title: "Eicweka 3 aha 4: Obwecereze bw'Omusiri n'Okushara",
    previousHistoryLabel: "Enyo egi yaherize kubaho aha musiri ogu nari aha bataahi?",
    spreadingDamageLabel: "Okucweka kw'amataagi kwayeyongyera omu saabiiti ezihembire?",
    twigRemovalLabel: "Amataagi agarwaire n'agoomire nogatwaza ota?",
    pruningBurned: "Nigasharwa 5cm ahansi y'ekituri gootsibwa omu nshaho aheeru y'omusiri",
    irregularRemoval: "Okushara rimwe na rimwe; amataagi agamwe nigatsigara ahansi",
    notRemoved: "Tigarikusharwa nari kootsibwa (nigatsigara aha muti)",
    sanitationLabel: "Obwecereze bw'Omusiri n'Okutema Amasejjere",
    goodSanitation: "Burungi: Ntema amasejjere buriijo, tihine nshwa ziri ahansi",
    fairSanitation: "Kyakigyezo: Nshara rimwe na rimwe; amasejjere agamwe gahoraho",
    poorSanitation: "Kubi: Amasejjere maingi n'amataagi goomire gashengyerire ahansi",

    step4Title: "Eicweka 4 aha 4: Okwikiriza n'Ekifani",
    locationConsentLabel: "Ninyikiriza enkora egi kukozesa omusiri gwangye kureeberaho obwereinde.",
    referralConsentLabel: "Ninyikiriza alipoota egi kuheebwa omuhabuzi w'ebyoburimi aije kumpwera omu musiri.",
    attachPhotoLabel: "Kozesa Ekifani ky'Etaagi erirwaire (Kikukwataho)",
    calculateBtn: "Bara Oburemeezi bw'Omusiri Hati",
    calculatingBtn: "Ebyuma birikubara n'okushwijuma...",

    resultTitle: "Ebirugire omu Kushwijuma",
    riskHigh: "Oburemeezi bwa Waggulu",
    riskModerate: "Oburemeezi bw'Ekigyezo",
    riskLow: "Oburemeezi Bukye",
    riskScoreLabel: "Amananu g'Oburemeezi:",
    q1StatusTitle: "1. Embeera y'Oburemeezi Hati",
    q2FactorsTitle: "2. Enshonga Empango Ezaareeta Eki",
    q3MitigationTitle: "3. Eby'Okukora By'Obwecereze (Ahatariho Kubazi ya Kkemiko)",
    mitigationSubNote: "Goberera obucureezi bw'obutonde; otaakozesa emibazi ya kkemiko ei otarikumanya.",
    shapTitle: "Enshonga eziheire amananu aga (SHAP)",
    requestVerificationBtn: "Shaba Omuhabuzi w'Ebyoburimi Akutaayayire omu Musiri",
    referralSentMsg: "Okushaba kwawe kwatungwa! Omuhabuzi naija kukutaayayira.",
    disclaimerNotice: "Okwerinda kw'Ebyoburimi: Ebi n'eby'okukuhwera kwerinda kwonka; ti kureebera ddala buri kimwe. Gamba n'omuhabuzi w'ebyoburimi.",
    resumeDraft: "Hine ebi watandikire kushwijuma. N'oyenda kubigumizamu?",
    discardDraft: "Birekye",
    historyTab: "Ebiherize Kushwijumwa",
    newAssessmentTab: "Okushwijuma Kusya",
    yesChoice: "Eego",
    noChoice: "Ngaaha",

    speakToAi: "Gamba na AgriSense AI",
    stopListening: "Reka Kuhurikiriza",
    listenToAdvice: "Hurikiriza Obuhabuzi",
    askVoiceQuestion: "Buuza ekibuuzo n'eiraka ryawe...",
    smsSentSuccessfully: "Obutumwa bwa SMS bwahika gye!",
    smsAlerts: "Okurabura kw'Enyo aha SMS",
    sendSmsToFarmer: "Yoohereza Omuhingi Obutumwa bwa SMS",
    farmsAndFields: "Emisiri n'Ebyanya by'Omwani",
    liveMap: "Maapu y'Emisiri n'Enyo",
    weatherIntel: "Obwire n'Enjura",
    farmJournal: "Ebirobyo by'Omusiri",
    extensionPortal: "Omukutu gw'Abahabuzi b'Ebyoburimi",
    modelGovernance: "Entebeekanisa n'Amateeka g'Ebyuma",
    registerFarm: "Handiisa Omusiri gw'Omwani Musya",
    soilMoisture: "Ameezi agari omu Itaka",
    temperature: "Obutagatsi",
    relativeHumidity: "Obunyonyi bw'Enyombeko",
    evapotranspiration: "Okucweka kw'Ameezi omu Itaka",
    speakingAdvice: "Ereshoma obuhabuzi n'eiraka...",
    whatIsHappening: "Niki ekirikugyenda mu maaso omu mwani?",
    whyItIsHappening: "Ahabw'enki eki kirikubaho?",
    advisoryDisclaimer: "Okurabura kw'Ebyoburimi: Okushwijuma tikwo kumanya oburwaire bwona. Gamba n'omuhabuzi w'ebyoburimi.",
  },
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: TRANSLATIONS.en,
});

const LANGUAGE_STORAGE_KEY = "agrisense_language_v2";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      // Clear legacy stale key that may have cached Luganda or Runyankole
      if (localStorage.getItem("agrisense_language")) {
        localStorage.removeItem("agrisense_language");
      }
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === "en" || saved === "lg" || saved === "sw" || saved === "nyn") {
        return saved;
      }
    } catch {
      // Fallback if localStorage is disabled or restricted
    }
    return "en";
  });

  function setLanguage(lang: SupportedLanguage) {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: TRANSLATIONS[language] || TRANSLATIONS.en,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
