import { createContext, useContext, useState, type ReactNode } from "react";

export type SupportedLanguage = "en" | "lg" | "sw" | "nyn";

export interface TranslationDictionary {
  [key: string]: string;
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

  // Shell, Topbar & Roles
  eyebrowText: string;
  workspaceLabel: string;
  roleFarmerText: string;
  roleOfficerText: string;
  roleManagerText: string;
  roleOrgAdminText: string;
  rolePlatformAdminText: string;
  roleViewerText: string;
  roleAccessDenied: string;
  returnDashboard: string;
  onlinePill: string;
  offlinePill: string;
  toSyncPill: string;
  syncNowPill: string;

  // Farmer Hero & Today Card
  farmerHubKicker: string;
  welcomeBack: string;
  farmerHeroDesc: string;
  districtWord: string;
  subCountyWord: string;
  farmsRegisteredCount: string;
  farmRegisteredCount: string;
  todayOnYourFarm: string;
  avgTemp30dLabel: string;
  rain30dLabel: string;
  drySpellsLabel: string;
  regionalWeatherLabel: string;

  // KPIs & States
  soilMoistureLabel: string;
  temperatureLabel: string;
  humidityLabel: string;
  rain30dKpi: string;
  stateDry: string;
  stateWet: string;
  stateAdequate: string;
  stateComfortable: string;
  stateHealthy: string;
  stateCheck: string;
  stateNoData: string;
  demoSensorNote: string;

  // Quick Actions
  quickActions: string;
  quickCheckCoffeeTitle: string;
  quickCheckCoffeeDesc: string;
  quickAskOfficerTitle: string;
  quickAskOfficerDesc: string;
  quickMyFarmsDesc: string;
  quickFarmWeatherDesc: string;

  // Screening Status Card
  yourLatestScreening: string;
  modelScoreText: string;
  savedResultText: string;
  researchModelEstimate: string;
  screeningWarningText: string;
  askOfficerReviewBtn: string;
  noScreeningTitle: string;
  noScreeningDesc: string;
  finePrintWarning: string;

  // NARO Cultural Sanitary Checklist
  naroChecklistTitle: string;
  culturalStandardKicker: string;
  pruneTitle: string;
  pruneDesc: string;
  burnTitle: string;
  burnDesc: string;
  desuckerTitle: string;
  desuckerDesc: string;
  shadeTitle: string;
  shadeDesc: string;
  recordJournalBtn: string;

  // Extension Officer Desk & Workspace
  extensionDeskKicker: string;
  goodMorningOfficer: string;
  officerHeroDesc: string;
  openCaseworkQueue: string;
  answerFarmerQuestions: string;
  assignedAreaCard: string;
  assignedFarmersMetric: string;
  assignedFarmersHelp: string;
  highRiskCasesMetric: string;
  highRiskCasesHelp: string;
  reportsToReviewMetric: string;
  reportsToReviewHelp: string;
  verifiedReportsMetric: string;
  verifiedReportsHelp: string;
  districtCaseworkKicker: string;
  recentReferralsTitle: string;
  viewAllCasework: string;
  fieldToolsKicker: string;
  planNextResponseTitle: string;
  fieldVisitReminderKicker: string;
  fieldVisitReminderText: string;
  refreshDataBtn: string;
  viewDistrictMapBtn: string;

  // Navigation Tabs for Extension Workspace
  tabOverview: string;
  tabFarmersFarms: string;
  tabFarmReports: string;
  tabVerification: string;
  tabHelpRoom: string;
  tabInspections: string;
  tabRecommendations: string;
  tabMyProfile: string;

  // Assessment Steps & Wizard
  stepTwigSigns: string;
  stepFarmHistory: string;
  stepFarmCare: string;
  stepFarmReadings: string;
  stepReview: string;
  guidedDiebackQ: string;
  guidedDiebackHelp: string;
  guidedHolesQ: string;
  guidedHolesHelp: string;
  guidedCountQ: string;
  guidedCountHelp: string;
  guidedHistoryQ: string;
  guidedHistoryHelp: string;
  guidedPruningQ: string;
  guidedPruningRegular: string;
  guidedPruningOccasional: string;
  guidedPruningRare: string;
  guidedSanitationQ: string;
  guidedSanitationGood: string;
  guidedSanitationFair: string;
  guidedSanitationPoor: string;
  guidedRecentPruningQ: string;

  // Plain Risk Descriptions
  riskLowHeading: string;
  riskLowBody: string;
  riskModerateHeading: string;
  riskModerateBody: string;
  riskHighHeading: string;
  riskHighBody: string;

  // Recommendations Page
  recEyebrow: string;
  recHeading: string;
  recSubheading: string;
  whoSetsRecs: string;
  whoSetsRecsAnswer: string;
  planAroundWeather: string;
  drySpellWarning: string;
  noDroughtRisk: string;
  fungalDiseaseWarning: string;
}

const TRANSLATIONS: Record<SupportedLanguage, Partial<TranslationDictionary>> = {
  en: {
    mapAssignedDistrict: "Assigned district", farmCoordinates: "Your registered farm coordinates", farmLocations: "Farm locations", farmMap: "Farm map", reviewDistrictLocations: "Review registered farm locations in your assigned district.", exploreFarmMap: "Explore the map centered on a farm you registered. Select a different farm to move the map pin.", manageFarms: "Manage farms", loadingFarmLocations: "Loading your registered farm locations…", settingsTitle: "Settings", workspacePreferencesSecurity: "Workspace preferences & security", settingsDescription: "Choose a section to review or update your workspace preferences.", saveChanges: "Save changes", saved: "Saved", accountProfile: "Account profile", notificationRules: "Notification rules", dataOfflineCache: "Data & offline cache", securityPrivacy: "Security & privacy", settingsSections: "Settings sections", profileInformation: "Profile information", signedInRegionalPreferences: "Your signed-in account and regional preferences.", fullName: "Full name", emailAddress: "Email address", workspaceRole: "Workspace role", timezone: "Time zone", advisoryNotifications: "Advisory notifications", farmUpdatesPreference: "Choose which farm updates appear in your workspace.", criticalBctbAlerts: "Critical BCTB risk alerts", criticalBctbDescription: "Highlight elevated screening results that need prompt field review.", weatherAdvisories: "Weather advisories", weatherAdvisoriesDescription: "Show rainfall and dry-spell notices for your registered farms.", extensionFollowUp: "Extension follow-up updates", extensionFollowUpDescription: "Show progress when you consent to an officer verification referral.",
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

    // Shell, Topbar & Roles
    eyebrowText: "Explainable decision support · Robusta coffee",
    workspaceLabel: "workspace",
    roleFarmerText: "Farmer",
    roleOfficerText: "Agricultural Extension Officer",
    roleManagerText: "Farm Manager",
    roleOrgAdminText: "Cooperative Administrator",
    rolePlatformAdminText: "Platform Administrator",
    roleViewerText: "Observer",
    roleAccessDenied: "This workspace page is not assigned to your role level.",
    returnDashboard: "Return to your dashboard",
    onlinePill: "Online",
    offlinePill: "Offline",
    toSyncPill: "to sync",
    syncNowPill: "Sync now",

    // Farmer Hero & Today Card
    farmerHubKicker: "Robusta coffee farmer hub",
    welcomeBack: "Welcome back",
    farmerHeroDesc: "Check your coffee trees for twig borer, get clear next steps, and keep every farm record in one place.",
    districtWord: "District",
    subCountyWord: "Sub-County",
    farmsRegisteredCount: "farms registered",
    farmRegisteredCount: "farm registered",
    todayOnYourFarm: "Today on your farm",
    avgTemp30dLabel: "average temperature, last 30 days",
    rain30dLabel: "Rain, 30 days",
    drySpellsLabel: "Dry spells",
    regionalWeatherLabel: "Regional weather",

    // KPIs & States
    soilMoistureLabel: "Soil moisture",
    temperatureLabel: "Temperature",
    humidityLabel: "Humidity",
    rain30dKpi: "Rain, 30 days",
    stateDry: "Dry",
    stateWet: "Wet",
    stateAdequate: "Adequate",
    stateComfortable: "Comfortable",
    stateHealthy: "Healthy",
    stateCheck: "Check",
    stateNoData: "No data",
    demoSensorNote: "Demo sensor values until you connect your field device.",

    // Quick Actions
    quickActions: "Quick actions",
    quickCheckCoffeeTitle: "Check my coffee",
    quickCheckCoffeeDesc: "Seven quick questions about your twigs",
    quickAskOfficerTitle: "Ask an officer",
    quickAskOfficerDesc: "Get advice from an extension officer",
    quickMyFarmsDesc: "registered on your account",
    quickFarmWeatherDesc: "Rain and dry-spell outlook",

    // Screening Status Card
    yourLatestScreening: "Your latest screening",
    modelScoreText: "model score",
    savedResultText: "Saved result",
    researchModelEstimate: "Research model estimate",
    screeningWarningText: "This is an early warning based on your answers, not a diagnosis. Ask your extension officer to confirm what is happening in your field.",
    askOfficerReviewBtn: "Ask an officer to review this",
    noScreeningTitle: "No screening yet",
    noScreeningDesc: "Start a two-minute check to see your risk level and what to do next.",
    finePrintWarning: "Screening is an early warning, not a diagnosis. Confirm with your sub-county agricultural extension officer.",

    // NARO Cultural Sanitary Checklist
    naroChecklistTitle: "NARO BCTB sanitary checklist",
    culturalStandardKicker: "Cultural management standard",
    pruneTitle: "Prune",
    pruneDesc: "Clip infested twigs 5 cm (2 inches) below the lowest beetle hole.",
    burnTitle: "Burn",
    burnDesc: "Collect clipped twigs in sacks and burn them off the farm.",
    desuckerTitle: "Desucker",
    desuckerDesc: "Remove excess water suckers growing from the stem base.",
    shadeTitle: "Regulate shade",
    shadeDesc: "Keep canopy at 30–40% filtered light for a healthy microclimate.",
    recordJournalBtn: "Record this work in my journal",

    // Extension Officer Desk & Workspace
    extensionDeskKicker: "AGRICULTURAL EXTENSION · DISTRICT OF",
    goodMorningOfficer: "Good day,",
    officerHeroDesc: "Your extension desk for farmer questions, BCTB referrals, and field follow-up in your assigned area.",
    openCaseworkQueue: "Open casework queue →",
    answerFarmerQuestions: "Answer farmer questions",
    assignedAreaCard: "YOUR ASSIGNED AREA",
    assignedFarmersMetric: "Assigned farmers",
    assignedFarmersHelp: "With registered district farms",
    highRiskCasesMetric: "High-risk cases",
    highRiskCasesHelp: "Prioritize field verification",
    reportsToReviewMetric: "Reports to review",
    reportsToReviewHelp: "New farmer submissions",
    verifiedReportsMetric: "Verified reports",
    verifiedReportsHelp: "Field status recorded",
    districtCaseworkKicker: "DISTRICT CASEWORK",
    recentReferralsTitle: "Recent referrals",
    viewAllCasework: "View all →",
    fieldToolsKicker: "FIELD TOOLS",
    planNextResponseTitle: "Plan your next response",
    fieldVisitReminderKicker: "FIELD VISIT REMINDER",
    fieldVisitReminderText: "Screening results guide follow-up; confirm BCTB on-farm by inspecting affected twigs. Recommend approved cultural practices and avoid unregistered chemical treatments.",
    refreshDataBtn: "↻ Refresh Data",
    viewDistrictMapBtn: "🗺 View District Map",

    // Navigation Tabs for Extension Workspace
    tabOverview: "Overview",
    tabFarmersFarms: "Farmers & Farms",
    tabFarmReports: "Farm Reports",
    tabVerification: "Verification",
    tabHelpRoom: "Farmer Help Room",
    tabInspections: "Inspections",
    tabRecommendations: "Recommendations",
    tabMyProfile: "My Profile",

    // Assessment Steps & Wizard
    stepTwigSigns: "Twig signs",
    stepFarmHistory: "Farm history",
    stepFarmCare: "Farm care",
    stepFarmReadings: "Farm readings",
    stepReview: "Review",
    guidedDiebackQ: "Are the tips of some branches dying back?",
    guidedDiebackHelp: "Young twigs turn brown or black and dry out, starting from the tip.",
    guidedHolesQ: "Do you see tiny round holes in the twigs?",
    guidedHolesHelp: "Holes about the size of a pin, often close to where a leaf joins the twig.",
    guidedCountQ: "About how many twigs are damaged?",
    guidedCountHelp: "Count on the trees you checked. A best guess is fine. Enter 0 if you saw none.",
    guidedHistoryQ: "Has twig borer been found on this farm before?",
    guidedHistoryHelp: "Answer Yes if you, a neighbour or an extension officer has seen it here.",
    guidedPruningQ: "How often do you prune your coffee?",
    guidedPruningRegular: "Regularly (Every season)",
    guidedPruningOccasional: "Sometimes (Not every season)",
    guidedPruningRare: "Rarely (Almost never)",
    guidedSanitationQ: "How clean is your plantation?",
    guidedSanitationGood: "Clean (Dead twigs removed, weeds under control)",
    guidedSanitationFair: "Fair (Some dead twigs or weeds left)",
    guidedSanitationPoor: "Untidy (Many dead twigs, bush or weeds)",
    guidedRecentPruningQ: "Have you pruned in the last few weeks?",

    // Plain Risk Descriptions
    riskLowHeading: "Low risk",
    riskLowBody: "Your answers match farms with a lower chance of twig borer. Keep checking your trees regularly.",
    riskModerateHeading: "Moderate risk",
    riskModerateBody: "Your answers match farms with some chance of twig borer. Check your young twigs again soon.",
    riskHighHeading: "High risk",
    riskHighBody: "Your answers match farms with severe twig borer signs. Act now to stop it spreading.",

    // Recommendations Page
    recEyebrow: "Farm and weather guidance",
    recHeading: "Recommendations",
    recSubheading: "Guidance is based on local weather and your recorded BCTB screening. AgriSense does not need farm sensors.",
    whoSetsRecs: "Who sets these recommendations?",
    whoSetsRecsAnswer: "Weather guidance is generated automatically from forecasts. BCTB screening guidance comes from your answers using NARO and UCDA standards. An agricultural officer provides personalized advice in the Help Room or during farm visits.",
    planAroundWeather: "Plan around the local weather",
    drySpellWarning: "A dry spell is expected. Check the soil and trees directly, conserve moisture with suitable mulch, and discuss water planning with an extension officer.",
    noDroughtRisk: "No high drought risk is indicated in the current weather estimate. Continue checking the soil and crop directly.",
    fungalDiseaseWarning: "Scout for disease symptoms: Warm, humid weather may favour some fungal diseases. This is not a diagnosis; ask an officer to verify symptoms.",
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

    // Shell, Topbar & Roles
    eyebrowText: "Okusalawo okutangaavu · Emwanyi za Robusta mu Uganda",
    workspaceLabel: "Ekiikaro ky'emirimu",
    roleFarmerText: "Omulimi w'Emwanyi",
    roleOfficerText: "Omukugu w'Ebyobulimi",
    roleManagerText: "Omukulembeze w'Ennimiro",
    roleOrgAdminText: "Akulira Ekibiina ky'Abalimi",
    rolePlatformAdminText: "Akulira Enkola yonna (Admin)",
    roleViewerText: "Omulambuzi",
    roleAccessDenied: "Omuko guno tegukkirizibwa ku buvunaanyizibwa bwo.",
    returnDashboard: "Ddayo ku Dashboard yo",
    onlinePill: "Kikwatagana n'Omutimbagano",
    offlinePill: "Awatali Mutimbagano",
    toSyncPill: "ebirindirira okutikkibwa",
    syncNowPill: "Tikka kaakano",

    // Farmer Hero & Today Card
    farmerHubKicker: "Ekitebe ky'Omulimi w'Emwanyi eza Robusta",
    welcomeBack: "Tukusanyukidde nnyo, kulikaayo",
    farmerHeroDesc: "Kebera emitima n'amatabi g'emwanyi zo ku lunyo lw'emwanyi (BCTB), funa amagezi amatuufu amangu, era tereka ebiwandiiko byonna awamu.",
    districtWord: "Disitulikiti",
    subCountyWord: "Ggombolola",
    farmsRegisteredCount: "ennimiro ziwandiisiddwa",
    farmRegisteredCount: "ennimiro ewandiisiddwa",
    todayOnYourFarm: "Embeera y'ennimiro yo leero",
    avgTemp30dLabel: "ebbire ly'omusana mu nnaku 30 eziyise",
    rain30dLabel: "Enkuba, ennaku 30",
    drySpellsLabel: "Ebbula ly'enkuba",
    regionalWeatherLabel: "Embeera y'obudde mu kitundu",

    // KPIs & States
    soilMoistureLabel: "Amazzi mu ttaka",
    temperatureLabel: "Obubangirivu bw'ebbugumu",
    humidityLabel: "Obunyogovu mu mpewo",
    rain30dKpi: "Enkuba, ennaku 30",
    stateDry: "Kikalu",
    stateWet: "Kinafuutifuuti",
    stateAdequate: "Kyamatira",
    stateComfortable: "Kirungi",
    stateHealthy: "Ggumu",
    stateCheck: "Kebera",
    stateNoData: "Tewali bipimo",
    demoSensorNote: "Bino bipimo bya kugezesa okutuusa lw'onoyunga ekyuma kyo eky'omu nnimiro.",

    // Quick Actions
    quickActions: "Ebikolwa eby'amangu",
    quickCheckCoffeeTitle: "Kebera emwanyi zange",
    quickCheckCoffeeDesc: "Ebibuuzo 7 ebikwata ku matabi g'emwanyi zo",
    quickAskOfficerTitle: "Buuza omukugu w'ebyobulimi",
    quickAskOfficerDesc: "Funa amagezi okuva eri omukozi w'ebyobulimi mu ggombolola",
    quickMyFarmsDesc: "eziri ku akawunti yo",
    quickFarmWeatherDesc: "Okulagula kw'enkuba n'ekyeya mu kitundu",

    // Screening Status Card
    yourLatestScreening: "Okukebereka kwo okusembyeyo",
    modelScoreText: "obubonero obukebreddwako",
    savedResultText: "Ebyaterekebwa",
    researchModelEstimate: "Okubalirira kw'ebikozesebwa mu kunoonyereza",
    screeningWarningText: "Kino kya kukulabula amangu ng'osinziira ku bye wazzeemu, si kwe kumalawo obulwadde. Sisinkana omukugu w'ebyobulimi mu kitundu akakase embeera mu nnimiro.",
    askOfficerReviewBtn: "Saba omukugu w'ebyobulimi akebeere kino",
    noScreeningTitle: "Tewannabaawo kukebereka",
    noScreeningDesc: "Tandika okukebereka okw'eddakiika ebbiri olabe obulabe bw'olunyo n'ebiddako.",
    finePrintWarning: "Okukebereka kukulabula bulabuzi, si kwe kukakasa obulwadde. Bunya omukugu w'ebyobulimi mu ggombolola yo.",

    // NARO Cultural Sanitary Checklist
    naroChecklistTitle: "Omutindo gwa NARO ogw'obuyonjo bw'emwanyi ku Lunyo (BCTB)",
    culturalStandardKicker: "Amateeka ag'obukuumi bw'obutonde",
    pruneTitle: "Salira amatabi",
    pruneDesc: "Sala amatabi agalwadde 5 cm (insi 2) wansi w'ekituli ky'olunyo we kiri.",
    burnTitle: "Yookera mu kisawo",
    burnDesc: "Kuŋŋaanya amatabi agasaliddwa mu bisawo obirongoose ebweru w'ennimiro obyookere eyo.",
    desuckerTitle: "Tema amasejjere",
    desuckerDesc: "Tema amasejjere gonna amangi agakula ku bikolo by'emwanyi wansi.",
    shadeTitle: "Salako ebisikirize",
    shadeDesc: "Leka ebisikirize bituuke ku 30–40% okusobozesa emyaka n'omusana ebirungi.",
    recordJournalBtn: "Wandiika omulimu guno mu kiwandiiko ky'ennimiro",

    // Extension Officer Desk & Workspace
    extensionDeskKicker: "EBYOBULIMI MU GGOMBOLOLA · DISITULIKITI Y'E",
    goodMorningOfficer: "Osiibye otyanno,",
    officerHeroDesc: "Wano we weekenneenyeza ebibuuzo by'abalimi, okukebereka olunyo (BCTB), n'okulambula ennimiro mu kitundu kyo.",
    openCaseworkQueue: "Ggulawo layini y'okusalawo →",
    answerFarmerQuestions: "Ddamu ebibuuzo by'abalimi",
    assignedAreaCard: "EKIFO KYO EKYAKUKWASIBWA",
    assignedFarmersMetric: "Abalimi b'olina",
    assignedFarmersHelp: "Abalina ennimiro mu disitulikiti eno",
    highRiskCasesMetric: "Ennimiro eziri mu bulabe",
    highRiskCasesHelp: "Kulembeza okulambula mu nnimiro",
    reportsToReviewMetric: "Alipoota ez'okwekenneenya",
    reportsToReviewHelp: "Ebiweerezeddwa abalimi ebipya",
    verifiedReportsMetric: "Alipoota ezikakasiddwa",
    verifiedReportsHelp: "Embeera ewandiikiddwa mu nnimiro",
    districtCaseworkKicker: "EMIRIMU GY'OKULAMBULA MU DISITULIKITI",
    recentReferralsTitle: "Ennimiro ezaakayisibwawo gye buvuddeko",
    viewAllCasework: "Laba zonna →",
    fieldToolsKicker: "EBIKOZESEBWA MU NNIMIRO",
    planNextResponseTitle: "Teekateeka eby'okukola ebiddako",
    fieldVisitReminderKicker: "OKUJUKIZA KU BY'OKULAMBULA MU NNIMIRO",
    fieldVisitReminderText: "Ebyavudde mu kukebereka bikulagiriza buzi; kakasa olunyo luno ng'ogenze ddala mu nnimiro okukebera amatabi amakosefu. Kubiriza amakubo ag'obulimi ag'obutonde era weekwate okutali ddagala lya kkemiko eritasunsuddwa.",
    refreshDataBtn: "↻ Zza buggya ebiwandiiko",
    viewDistrictMapBtn: "🗺 Laba Maapu y'Ennimiro",

    // Navigation Tabs for Extension Workspace
    tabOverview: "Okutwaliza Awamu",
    tabFarmersFarms: "Abalimi n'Ennimiro",
    tabFarmReports: "Alipoota z'Ennimiro",
    tabVerification: "Okukakasa mu Nnimiro",
    tabHelpRoom: "Ekisenge ky'Obuyambi",
    tabInspections: "Okulambula kw'Omukugu",
    tabRecommendations: "Amagezi g'Obulimi",
    tabMyProfile: "Ebikwata ku Nze",

    // Assessment Steps & Wizard
    stepTwigSigns: "Obubonero ku matabi",
    stepFarmHistory: "Ebyayita ku nnimiro",
    stepFarmCare: "Endabirira y'ennimiro",
    stepFarmReadings: "Ebipimo by'ennimiro",
    stepReview: "Weetegereze byonna",
    guidedDiebackQ: "Amatabi agamu gakaze oba gafudde ku nsonga?",
    guidedDiebackHelp: "Amatabi amato gafuuka ga kitaka oba maddugavu ne gakala, nga gatandikira ku nsonga.",
    guidedHolesQ: "Olaba obutuli obutonotono obwetooloovu ku matabi?",
    guidedHolesHelp: "Obutuli obulinga obw'empiso obwa mm 1, obutera okuba awali essanja ku ttabi.",
    guidedCountQ: "Amatabi amakosefu gaweza obungi ki ku miti gy'okebedde?",
    guidedCountHelp: "Bala ku miti gy'okebedde. Bw'oba tolabye ttabi na limu, teekamu 0.",
    guidedHistoryQ: "Olunyo lw'emwanyi lwakalabikako ku nnimiro eno oba ku baliraanwa?",
    guidedHistoryHelp: "Ddamu Yee singa gwe, muliraanwa oba omukugu w'ebyobulimi yalirabako wano.",
    guidedPruningQ: "Osalira emwanyi zo emirundi emeka?",
    guidedPruningRegular: "Buli kiseera (Buli sizoni)",
    guidedPruningOccasional: "Olusi n'olusi (Si buli sizoni)",
    guidedPruningRare: "Lutono nnyo (Mpaawo)",
    guidedSanitationQ: "Obuyonjo bw'ennimiro yo buli butya?",
    guidedSanitationGood: "Nyonjo (Amatabi amakaze maggyewo, tewali muddo mungi)",
    guidedSanitationFair: "Kyakigero (Waliwo amatabi amakaze amatono n'omuddo ogumu)",
    guidedSanitationPoor: "Kikaafu (Amatabi amakaze mangi nnyo n'ensiko)",
    guidedRecentPruningQ: "Wakasala ku matabi mu wiiki zino eziyise?",

    // Plain Risk Descriptions
    riskLowHeading: "Obulabe Butono",
    riskLowBody: "By'otutegeezezza biraga nti ennimiro yo eri mu bulabe butono obw'olunyo lw'emwanyi. Weeyongere okukebereka buli kiseera.",
    riskModerateHeading: "Obulabe bwa Kigero",
    riskModerateBody: "By'otutegeezezza biraga nti ennimiro yo eyinza okubaamu olunyo lw'emwanyi. Ddamu okukebereka amatabi amato mu bwangu.",
    riskHighHeading: "Obulabe bwa Waggulu Nnyo",
    riskHighBody: "By'otutegeezezza biraga nti ennimiro yo erimu obulabe bwa waggulu nnyo obw'olunyo. Situkiramu amangu ago okutangira obunyo okusaasaana.",

    // Recommendations Page
    recEyebrow: "Amagezi g'ennimiro n'embeera y'obudde",
    recHeading: "Amagezi n'Okubuulirirwa kw'Obulimi",
    recSubheading: "Amagezi gano gasinziira ku mbeera y'obudde mu kitundu kyo n'ebyo bye wazzeemu mu kukebereka olunyo (BCTB). AgriSense teyetaagisa byuma bya mu nimiro.",
    whoSetsRecs: "Ani awa amagezi gano?",
    whoSetsRecsAnswer: "Amagezi g'obudde gava mu satelayiti eziragula enkuba n'ebbugumu. Amagezi ku Lunyo (BCTB) gava mu bye wazzeemu ng'osinziira ku mitindo gya NARO ne UCDA. Omukugu w'ebyobulimi akuwa amagezi agasingawo bwe muba mu Kisenge cy'Okwebuuza oba ng'akukyaliddeko mu nnimiro.",
    planAroundWeather: "Teekateeka ng'osinziira ku mbeera y'obudde mu kitundu",
    drySpellWarning: "Ebbula ly'enkuba lisuubirwa. Kebera ettaka n'emiti butereevu, bikkirira ettaka okukuuma amazzi, era teekateeka n'omukugu w'ebyobulimi enkola y'okufukirira.",
    noDroughtRisk: "Tewali bulabe bwa kyeya bulagiddwa mu kiseera kino. Weeyongere okukebereka ettaka n'emwanyi zo buli luvannyuma lw'ekiseera.",
    fungalDiseaseWarning: "Kebera obubonero bw'obukoko n'ebibubi: Obudde obufukutu era obubuguumirivu bungi bwongera emikisa gy'ebibubi. Bunya omukugu w'ebyobulimi okukakasa obubonero buno.",
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

    // Shell, Topbar & Roles
    eyebrowText: "Uamuzi unaoeleweka · Kahawa ya Robusta Uganda",
    workspaceLabel: "Eneo la kazi",
    roleFarmerText: "Mkulima wa Kahawa",
    roleOfficerText: "Afisa Ugani wa Kilimo",
    roleManagerText: "Msimamizi wa Shamba",
    roleOrgAdminText: "Msimamizi wa Ushirika",
    rolePlatformAdminText: "Msimamizi wa Mfumo",
    roleViewerText: "Mtazamaji",
    roleAccessDenied: "Ukurasa huu hauruhusiwi kwa ngazi yako ya kazi.",
    returnDashboard: "Rudi kwenye dashibodi yako",
    onlinePill: "Mtandaoni",
    offlinePill: "Nje ya mtandao",
    toSyncPill: "inayosubiri kupakiwa",
    syncNowPill: "Pakia sasa",

    // Farmer Hero & Today Card
    farmerHubKicker: "Kituo cha Mkulima wa Kahawa ya Robusta",
    welcomeBack: "Karibu tena",
    farmerHeroDesc: "Chunguza miti yako ya kahawa kwa kidungadunga cha matawi, pata mwongozo wa wazi, na uhifadhi kumbukumbu zote mahali pamoja.",
    districtWord: "Wilaya",
    subCountyWord: "Kaunti Ndogo",
    farmsRegisteredCount: "mashamba yamesajiliwa",
    farmRegisteredCount: "shamba limesajiliwa",
    todayOnYourFarm: "Hali ya shamba lako leo",
    avgTemp30dLabel: "wastani wa joto, siku 30 zilizopita",
    rain30dLabel: "Mvua, siku 30",
    drySpellsLabel: "Vipindi vya ukame",
    regionalWeatherLabel: "Hali ya hewa ya eneo",

    // KPIs & States
    soilMoistureLabel: "Unyevu wa udongo",
    temperatureLabel: "Kiwango cha joto",
    humidityLabel: "Unyevunyevu wa hewa",
    rain30dKpi: "Mvua, siku 30",
    stateDry: "Kavu",
    stateWet: "Unyevu mwingi",
    stateAdequate: "Inatosha",
    stateComfortable: "Nzuri",
    stateHealthy: "Bora",
    stateCheck: "Angalia",
    stateNoData: "Hakuna takwimu",
    demoSensorNote: "Vipimo vya majaribio hadi utakapounganisha kifaa chako shambani.",

    // Quick Actions
    quickActions: "Vitendo vya haraka",
    quickCheckCoffeeTitle: "Chunguza kahawa yangu",
    quickCheckCoffeeDesc: "Maswali 7 ya haraka kuhusu matawi yako",
    quickAskOfficerTitle: "Uliza afisa ugani",
    quickAskOfficerDesc: "Pata ushauri kutoka kwa afisa ugani",
    quickMyFarmsDesc: "yaliyosajiliwa kwenye akaunti yako",
    quickFarmWeatherDesc: "Utabiri wa mvua na vipindi vya ukame",

    // Screening Status Card
    yourLatestScreening: "Uchunguzi wako wa hivi karibuni",
    modelScoreText: "alama za kielelezo",
    savedResultText: "Matokeo yaliyohifadhiwa",
    researchModelEstimate: "Makadirio ya mfumo wa utafiti",
    screeningWarningText: "Hii ni tahadhari ya mapema kulingana na majibu yako, si utambuzi kamili. Wasiliana na afisa ugani kuthibitisha shambani.",
    askOfficerReviewBtn: "Omba afisa ugani akague hili",
    noScreeningTitle: "Hakuna uchunguzi bado",
    noScreeningDesc: "Anza uchunguzi wa dakika mbili kuona hatari na hatua za kuchukua.",
    finePrintWarning: "Uchunguzi ni tahadhari ya mapema, si utambuzi. Thibitisha na afisa ugani wa kilimo.",

    // NARO Cultural Sanitary Checklist
    naroChecklistTitle: "Orodha ya usafi ya NARO dhidi ya BCTB",
    culturalStandardKicker: "Kiwango cha usimamizi wa asili",
    pruneTitle: "Pogoa matawi",
    pruneDesc: "Kata matawi yaliyoathirika sm 5 (inchi 2) chini ya tundu la mdudu.",
    burnTitle: "Choma moto",
    burnDesc: "Kusanya matawi yaliyokatwa ndani ya magunia na uyachome nje ya shamba.",
    desuckerTitle: "Kata chipukizi",
    desuckerDesc: "Ondoa chipukizi zote zinazoota chini kwenye shina la mti.",
    shadeTitle: "Punguza kivuli",
    shadeDesc: "Weka kivuli cha matawi kufikia 30–40% kwa hewa na mwanga mzuri.",
    recordJournalBtn: "Rekodi kazi hii kwenye shajara ya shamba",

    // Extension Officer Desk & Workspace
    extensionDeskKicker: "UGANI WA KILIMO · WILAYA YA",
    goodMorningOfficer: "Habari ya leo,",
    officerHeroDesc: "Dawati lako la ugani kwa maswali ya wakulima, rufaa za BCTB, na ufuatiliaji shambani.",
    openCaseworkQueue: "Fungua orodha ya kazi →",
    answerFarmerQuestions: "Jibu maswali ya wakulima",
    assignedAreaCard: "ENEO LAKO ULILOPANGIWA",
    assignedFarmersMetric: "Wakulima waliopo",
    assignedFarmersHelp: "Wenye mashamba wilayani humu",
    highRiskCasesMetric: "Mashamba yenye hatari kubwa",
    highRiskCasesHelp: "Weka kipaumbele ukaguzi wa shambani",
    reportsToReviewMetric: "Ripoti za kukagua",
    reportsToReviewHelp: "Mawasilisho mapya ya wakulima",
    verifiedReportsMetric: "Ripoti zilizothibitishwa",
    verifiedReportsHelp: "Hali ya shamba iliyorekodiwa",
    districtCaseworkKicker: "KAZI ZA WILAYA",
    recentReferralsTitle: "Rufaa za hivi karibuni",
    viewAllCasework: "Tazama zote →",
    fieldToolsKicker: "ZANA ZA SHAMBANI",
    planNextResponseTitle: "Panga majibu yanayofuata",
    fieldVisitReminderKicker: "KUMBUSHO LA ZIARA YA SHAMBANI",
    fieldVisitReminderText: "Matokeo ya uchunguzi huongoza ufuatiliaji; thibitisha BCTB shambani kwa kukagua matawi. Pendekeza mbinu salama za asili na epuka kemikali ambazo hazijasajiliwa.",
    refreshDataBtn: "↻ Sasisha Taarifa",
    viewDistrictMapBtn: "🗺 Tazama Ramani ya Wilaya",

    // Navigation Tabs for Extension Workspace
    tabOverview: "Muhtasari",
    tabFarmersFarms: "Wakulima na Mashamba",
    tabFarmReports: "Ripoti za Shamba",
    tabVerification: "Uthibitisho",
    tabHelpRoom: "Chumba cha Msaada",
    tabInspections: "Ukaguzi",
    tabRecommendations: "Mapendekezo",
    tabMyProfile: "Wasifu Wangu",

    // Assessment Steps & Wizard
    stepTwigSigns: "Dalili za matawi",
    stepFarmHistory: "Historia ya shamba",
    stepFarmCare: "Utunzaji wa shamba",
    stepFarmReadings: "Vipimo vya shamba",
    stepReview: "Kagua yote",
    guidedDiebackQ: "Je, ncha za baadhi ya matawi zinakauka?",
    guidedDiebackHelp: "Matawi machanga yanakuwa meusi au ya hudhurungi na kukauka kuanzia nchani.",
    guidedHolesQ: "Je, unaona matundu madogo ya duara kwenye matawi?",
    guidedHolesHelp: "Matundu yenye ukubwa wa pini, karibu na mahali jani linapojiunga na tawi.",
    guidedCountQ: "Kadirio la matawi yaliyoharibika ni mangapi?",
    guidedCountHelp: "Hesabu kwenye miti uliyochunguza. Weka 0 kama hukuona tawi lililoharibika.",
    guidedHistoryQ: "Je, kidungadunga kimewahi kupatikana kwenye shamba hili au kwa majirani?",
    guidedHistoryHelp: "Jibu Ndiyo ikiwa wewe, jirani au afisa ugani amewahi kukiona hapa.",
    guidedPruningQ: "Unapogoa kahawa yako mara ngapi?",
    guidedPruningRegular: "Mara kwa mara (Kila msimu)",
    guidedPruningOccasional: "Wakati mwingine (Si kila msimu)",
    guidedPruningRare: "Mara chache (Karibu kamwe)",
    guidedSanitationQ: "Usafi wa shamba lako ukoje?",
    guidedSanitationGood: "Safi (Matawi makavu yameondolewa, magugu yanadhibitiwa)",
    guidedSanitationFair: "Wastani (Matawi machache makavu yapo)",
    guidedSanitationPoor: "Chafu (Matawi mengi makavu na vichaka)",
    guidedRecentPruningQ: "Umepogoa katika wiki chache zilizopita?",

    // Plain Risk Descriptions
    riskLowHeading: "Hatari Ndogo",
    riskLowBody: "Majibu yako yanaashiria hatari ndogo ya kidungadunga cha matawi. Endelea kuchunguza miti yako mara kwa mara.",
    riskModerateHeading: "Hatari ya Wastani",
    riskModerateBody: "Majibu yako yanaashiria uwezekano wa kidungadunga cha matawi. Chunguza tena matawi machanga hivi karibuni.",
    riskHighHeading: "Hatari Kubwa",
    riskHighBody: "Majibu yako yanaonyesha dalili kubwa za kidungadunga. Chukua hatua sasa kuzuia kuenea kwake.",

    // Recommendations Page
    recEyebrow: "Mwongozo wa shamba na hali ya hewa",
    recHeading: "Mapendekezo ya Kilimo",
    recSubheading: "Mwongozo huu unategemea hali ya hewa ya eneo lako na majibu yako ya uchunguzi wa BCTB. AgriSense haihitaji vifaa shambani.",
    whoSetsRecs: "Nani anayetoa mapendekezo haya?",
    whoSetsRecsAnswer: "Mwongozo wa hali ya hewa huzalishwa kiotomatiki kutoka utabiri wa anga. Mwongozo wa BCTB hutokana na majibu yako kulingana na viwango vya NARO na UCDA. Afisa ugani hutoa ushauri maalum kwenye Chumba cha Msaada au shambani.",
    planAroundWeather: "Panga kulingana na hali ya hewa ya eneo",
    drySpellWarning: "Kipindi cha ukame kinatarajiwa. Chunguza udongo na miti, weka matandazo kuhifadhi unyevu, na shauriana na afisa ugani kuhusu mpango wa maji.",
    noDroughtRisk: "Hakuna hatari kubwa ya ukame kwa sasa. Endelea kuchunguza udongo na mazao mara kwa mara.",
    fungalDiseaseWarning: "Kagua dalili za magonjwa ya ukungu: Hali ya hewa ya joto na unyevu inaweza kukuza magonjwa ya ukungu. Wasiliana na afisa ugani kuthibitisha dalili.",
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

    // Shell, Topbar & Roles
    eyebrowText: "Okushwijuma n'Amagezi agarikwetegyerezibwa · Omwani gwa Robusta omu Uganda",
    workspaceLabel: "Omwanya gw'emirimo",
    roleFarmerText: "Omuriimi w'Omwani",
    roleOfficerText: "Omuhabuzi w'Ebyoburimi",
    roleManagerText: "Omukuru w'Omusiri",
    roleOrgAdminText: "Omwebembezi w'Ekibiina",
    rolePlatformAdminText: "Omukuru w'Ebyuma Byona (Admin)",
    roleViewerText: "Omureebi",
    roleAccessDenied: "Orubaju oru terwikiriiziibwe aha bujunaanizibwa bwawe.",
    returnDashboard: "Garuka aha Dashibodi yawe",
    onlinePill: "Kikwataine n'Omutimbagano",
    offlinePill: "Ahatariho Mutimbagano",
    toSyncPill: "ebirinzire kutimbagizibwa",
    syncNowPill: "Timbagiza hati",

    // Farmer Hero & Today Card
    farmerHubKicker: "Ekitebe ky'Omuriimi w'Omwani gwa Robusta",
    welcomeBack: "Tukushemereirwe, kaakano",
    farmerHeroDesc: "Shwijuma amataagi g'omwani gwawe aha nyo y'omwani (BCTB), tunga obuhabuzi bw'obutonde, kandi orekye ebirobyo byona hamwe.",
    districtWord: "Disiturikiti",
    subCountyWord: "Ggomborora",
    farmsRegisteredCount: "emisiri ehandiikirwe",
    farmRegisteredCount: "omusiri guhandiikirwe",
    todayOnYourFarm: "Embeera y'omusiri gwawe eriizooba",
    avgTemp30dLabel: "oburinganiza bw'obutagatsi, ebiro 30 ebihembire",
    rain30dLabel: "Enjura, ebiro 30",
    drySpellsLabel: "Ekyeya n'ebiro by'ekyeya",
    regionalWeatherLabel: "Obwire n'obutonde omu kitundu",

    // KPIs & States
    soilMoistureLabel: "Ameezi agari omu itaka",
    temperatureLabel: "Obutagatsi bw'omwanya",
    humidityLabel: "Obunyonyi bw'omwanya",
    rain30dKpi: "Enjura, ebiro 30",
    stateDry: "Kikozire",
    stateWet: "Kirobirwe munonga",
    stateAdequate: "Kihikire",
    stateComfortable: "Kirungi",
    stateHealthy: "Ggumu",
    stateCheck: "Shwijuma",
    stateNoData: "Tihariho bipimo",
    demoSensorNote: "Ebi n'ebipimo by'okugezesa okuhitsya obu orataho ekyuma kyawe omu musiri.",

    // Quick Actions
    quickActions: "Ebikwatirweho amangu",
    quickCheckCoffeeTitle: "Shwijuma omwani gwangye",
    quickCheckCoffeeDesc: "Ebibuuzo 7 eby'amangu aha mataagi g'omwani gwawe",
    quickAskOfficerTitle: "Shaba omuhabuzi",
    quickAskOfficerDesc: "Tunga obuhabuzi kuruga aha muhabuzi w'ebyoburimi",
    quickMyFarmsDesc: "ebiri aha akawunti yawe",
    quickFarmWeatherDesc: "Okuragura kw'enjura n'ekyeya omu kitundu",

    // Screening Status Card
    yourLatestScreening: "Okushwijuma kwawe okuherize",
    modelScoreText: "amananu g'okushwijuma",
    savedResultText: "Ebiherize kubikwa",
    researchModelEstimate: "Okubara kw'entebeekanisa y'okucondooza",
    screeningWarningText: "Eki n'okukurabura amangu kurugirira aha bi wagambire, ti kureebera ddala oburwaire bwona. Gamba n'omuhabuzi w'ebyoburimi ahamye ebi biri omu musiri.",
    askOfficerReviewBtn: "Shaba omuhabuzi ashwijume eki",
    noScreeningTitle: "Tihariho kushwijuma kwabaireho",
    noScreeningDesc: "Tandika okushwijuma kw'edakiika ibiri oreebe oburemeezi n'eby'okukora.",
    finePrintWarning: "Okushwijuma nikukurabura, ti kumanya buri kimwe. Hamya n'omuhabuzi w'ebyoburimi omu ggomborora yawe.",

    // NARO Cultural Sanitary Checklist
    naroChecklistTitle: "Engyenderwaho ya NARO ey'obwecereze bw'omwani (BCTB)",
    culturalStandardKicker: "Amateeka g'obwecereze bw'obutonde",
    pruneTitle: "Shara amataagi",
    pruneDesc: "Shara amataagi agarwaire 5 cm (inci 2) ahansi y'ekituri ky'enyo.",
    burnTitle: "Ootsya omu nshaho",
    burnDesc: "Koma amataagi agashazirwe omu nshaho ogatware aheeru y'omusiri ogootsye.",
    desuckerTitle: "Tema amasejjere",
    desuckerDesc: "Tema amasejjere goona agarikukura ahansi y'emiti y'omwani.",
    shadeTitle: "Shungura ebibisi",
    shadeDesc: "Teeka ebibisi by'emiti aha 30–40% kureetera omwani omushana murungi.",
    recordJournalBtn: "Handiika omurimo ogu omu birobyo by'omusiri",

    // Extension Officer Desk & Workspace
    extensionDeskKicker: "ABAHABUZI B'EBYOBURIMI · DISITULIKITI YA",
    goodMorningOfficer: "Oraire ote,",
    officerHeroDesc: "Omwanya gwawe ogw'okugarukamu ebibuuzo by'abariimi, enyo y'omwani, n'okutaayayira emisiri.",
    openCaseworkQueue: "Gingura emirimo y'okushwijuma →",
    answerFarmerQuestions: "Garukamu ebibuuzo by'abariimi",
    assignedAreaCard: "EICWEKA ERI WAHEERWE",
    assignedFarmersMetric: "Abariimi abu oine",
    assignedFarmersHelp: "Ataine emisiri omu disitulikiti egi",
    highRiskCasesMetric: "Emisiri eri omu kabi",
    highRiskCasesHelp: "Banza okutaayayira emisiri egi",
    reportsToReviewMetric: "Alipoota z'okwekenneenya",
    reportsToReviewHelp: "Ebisya ebi abariimi baayohereza",
    verifiedReportsMetric: "Alipoota ezaahamiibwe",
    verifiedReportsHelp: "Embeera y'omusiri ehandiikirwe",
    districtCaseworkKicker: "EMIRIMO Y'OMU DISITULIKITI",
    recentReferralsTitle: "Ebiheereirwe kuza aha muhabuzi",
    viewAllCasework: "Reeba byona →",
    fieldToolsKicker: "EBIKUKORESESIBWA OMU MUSIRI",
    planNextResponseTitle: "Tebeekanisa ebirikukurataho",
    fieldVisitReminderKicker: "OKWIJUSYA KW'OKUTAAYAYIRA OMUSIRI",
    fieldVisitReminderText: "Ebirugire omu kushwijuma nibikuhabura; hamya enyo egi omu musiri ahabw'okureeba amataagi gonyine. Habura obwecereze bw'obutonde kandi orinde emibazi ya kkemiko etaikiriiziibwe.",
    refreshDataBtn: "↻ Garukamu ebirobyo",
    viewDistrictMapBtn: "🗺 Reeba Maapu y'Emisiri",

    // Navigation Tabs for Extension Workspace
    tabOverview: "Ebirikukwataho",
    tabFarmersFarms: "Abariimi n'Emisiri",
    tabFarmReports: "Alipoota z'Emisiri",
    tabVerification: "Okushwijuma n'Okuhamya",
    tabHelpRoom: "Ekiika ky'Obuhabuzi",
    tabInspections: "Okutaayayira kw'Omuhabuzi",
    tabRecommendations: "Ebirikuhaburwa",
    tabMyProfile: "Ebinkwataho",

    // Assessment Steps & Wizard
    stepTwigSigns: "Obubonero bw'amataagi",
    stepFarmHistory: "Ebyayita aha musiri",
    stepFarmCare: "Endeeberezi y'omusiri",
    stepFarmReadings: "Ebipimo by'omusiri",
    stepReview: "Shwijuma byona",
    guidedDiebackQ: "Amataagi agamwe goomire nari gaafiire aha mutwe?",
    guidedDiebackHelp: "Amataagi amato nigahinduka ga kitaka nari maraguju kandi goome, kuruga aha mutwe.",
    guidedHolesQ: "Nooreeba obuturi bukye obwetororire omu mataagi?",
    guidedHolesHelp: "Obuturi obukye nk'obw'empiso obwa mm 1, obutera kureebeka ahu eibabi rikwatira aha taagi.",
    guidedCountQ: "Amataagi agaakwasirwe nigabaasa kuba gari kwingana ki?",
    guidedCountHelp: "Bara aha miti ei washwijuma. Bw'oraabe otareebireho, taamu 0.",
    guidedHistoryQ: "Enyo y'omwani egi ekaherize kureebeka aha musiri ogu nari aha bataahi?",
    guidedHistoryHelp: "Garukamu Eego yaaba iwe, omutaahi nari omuhabuzi waagireebireho.",
    guidedPruningQ: "Nosharira amataagi g'omwani gwawe emirundi engahi?",
    guidedPruningRegular: "Buriijo (Buri sizoni)",
    guidedPruningOccasional: "Rimwe na rimwe (Ti buri sizoni)",
    guidedPruningRare: "Mporampora (Tihariho)",
    guidedSanitationQ: "Obwecereze bw'omusiri gwawe buri kwingana ki?",
    guidedSanitationGood: "Burungi (Amataagi goomire gakurwaho, nshwa nzikye)",
    guidedSanitationFair: "Kyakigyezo (Amataagi makye goomire galiho)",
    guidedSanitationPoor: "Kubi (Amataagi maingi goomire n'enku)",
    guidedRecentPruningQ: "Waherize kushara aha mataagi omu saabiiti ezihembire?",

    // Plain Risk Descriptions
    riskLowHeading: "Oburemeezi Bukye",
    riskLowBody: "Ebi waagarukamu nibyoreka ngu omusiri gwawe gwine oburemeezi bukye bw'enyo y'omwani. Gumizamu n'okushwijuma buriijo.",
    riskModerateHeading: "Oburemeezi bw'Ekigyezo",
    riskModerateBody: "Ebi waagarukamu nibyoreka ngu omusiri gwawe nigubaasa kutunga enyo y'omwani. Shwijuma amataagi amato ahonaaho.",
    riskHighHeading: "Oburemeezi bwa Waggulu",
    riskHighBody: "Ebi waagarukamu nibyoreka ngu omusiri gwawe gwine oburemeezi bwa waggulu. Garukamu ahonaaho kutangira enyo egi kutaaha omu bindi.",

    // Recommendations Page
    recEyebrow: "Obuhabuzi bw'omusiri n'obutonde",
    recHeading: "Ebirikuhaburwa aha Burimi",
    recSubheading: "Obuhabuzi obu nibwesigamira aha mbeera y'obutonde omu kitundu kyawe n'ebi waagarukamu aha nyo (BCTB). AgriSense teyetaagisa byuma by'omu musiri.",
    whoSetsRecs: "N'oha orikuha obuhabuzi obu?",
    whoSetsRecsAnswer: "Obuhabuzi bw'obudde n'enjura buruga omu satelayiti ezirikuragura obudde. Obuhabuzi bw'enyo (BCTB) buruga omu bi waagarukamu kurugirira aha ngenderwaho za NARO na UCDA. Omuhabuzi akuha obuhabuzi obw'omutaano omu Kiika ky'Obuhabuzi nari obu arikutaayayira omusiri gwawe.",
    planAroundWeather: "Tebeekanisa kurugirira aha mbeera y'obutonde omu kitundu",
    drySpellWarning: "Ekyeya nikiija. Shwijuma itaka n'emiti, biikirira itaka kurinda ameezi, kandi otebeekanise n'omuhabuzi emiringo y'okufukirira.",
    noDroughtRisk: "Tihariho kabi k'ekyeya kaherize kworekwa hati. Gumizamu n'okushwijuma itaka n'omwani gwawe.",
    fungalDiseaseWarning: "Reeba obubonero bw'obukoko n'ebirwaire: Obwire obw'omushana n'obunyonyi nibubaasa kureeta ebirwaire. Shaba omuhabuzi ahamye obubonero obu.",
  },
};

// Page copy that was previously hard-coded in English. Keep it in the same
// language context so changing the selector updates mounted pages immediately.
const PAGE_TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    governanceEyebrow: "System administration & audit ledger", governanceTitle: "Platform governance & rule management", governanceIntro: "Manage rule versions, assign extension officers, inspect audit trails, and review system statistics.", exportAggregate: "Export anonymized report (JSON)", systemStatistics: "System statistics", ruleConfiguration: "Rule configuration", officerAreas: "Extension officer areas", caseRegistry: "Case registry", auditLedger: "Audit ledger", riskEngineTests: "Risk engine checks",
    navFarmReports: "Farm Reports", navVerification: "Verification", navInspections: "Inspections", navOfficerApplications: "Officer applications", navAccountManagement: "Account management", navCoffeePassport: "Coffee Passport", navCooperative: "Cooperative surveillance", navPlans: "Plans & Pricing", navOrgPortal: "Cooperative Portal",
    farmersAndFarms: "Farmers & Farms", directoryIntro: "Read-only directory of registered farms in your assigned area. Open a report to review symptoms and record field verification.", viewFarmLocations: "View farm locations", farmersWithFarms: "Farmers with registered farms", registeredFarms: "Registered farms", openElevatedReports: "Open elevated risk reports ? screening only", farmSearchPlaceholder: "Farm, farmer, village or sub-county", retry: "Retry", loadingDistrictFarms: "Loading district farms?", farmerLabel: "Farmer", registeredFarmer: "Registered farmer", locationLabel: "Location", farmRecordLabel: "Farm record", cropNotRecorded: "Crop not recorded", coordinatesLabel: "Coordinates", latestReport: "Latest report", reviewReportVerification: "Review report and verification", noFollowupReport: "No BCTB follow-up report is linked to this farm.", noSearchMatch: "No farms match your search", noDistrictFarms: "No farms registered in this district yet", assignedDistrictOnly: "Only farms in the officer?s assigned district are shown.",
    totalFarms: "Total farms", totalArea: "Total area", activeFarmFields: "Fields on active farm", searchFarm: "Search by farm name or district...",
    loadingFarms: "Loading registered farms...", noFarms: "No farms registered yet", noFarmsHelp: "Create your first farm in any Ugandan district to receive location-specific recommendations and weather insights.", registerFirstFarm: "Register first farm", yourFarms: "Your farms", activeGrowingSite: "Active growing site", gpsCoordinates: "GPS coordinates", addFieldPlot: "Add field / plot", registeredPlotsFields: "Registered plots & fields", noFarmFields: "No fields have been demarcated for this farm yet.", addFirstField: "Add your first field block", soilClassification: "Soil classification", irrigationSystem: "Irrigation system", moistureTarget: "Moisture target", plantingDate: "Planting date", monitored: "Monitored", cooperative: "Cooperative", standalone: "Standalone", areaLabel: "Area", unspecified: "Unspecified", deleteFarm: "Delete farm record", registerNewFarm: "Register new farm", addFarmDescription: "Add an individual or cooperative farm in Uganda.", farmName: "Farm name", ugandanDistrict: "Ugandan district", subCounty: "Sub-county", parishWard: "Parish / ward", villageCell: "Village / LC1 cell", topography: "Topography", flatTerrain: "Flat terrain", hillsideSlope: "Hillside / slope", valleyBottom: "Valley bottom", captureGps: "Capture my current GPS", acquiringGps: "Acquiring GPS...", latitude: "Latitude", longitude: "Longitude", totalFarmArea: "Total farm area (acres)", robustaAcreage: "Robusta coffee acreage", approxCoffeeTrees: "Approx. coffee trees", coffeeVariety: "Coffee variety", coffeeStandAge: "Coffee stand age", canopyShadeCover: "Canopy shade cover", standaloneSmallholder: "Standalone independent smallholder", descriptionAgronomicNotes: "Description / agronomic notes", cancel: "Cancel", registering: "Registering...", saveFarmRecord: "Save farm record", addFieldToFarm: "Add field / plot to", searchDistrictDirectory: "Search district directory",
    latestForecastLoading: "Fetching the latest forecast...", liveWeatherFallback: "Showing cached or estimated weather because the live provider could not be reached.", liveForecast: "Live forecast from Open-Meteo, updated", lastAvailableUpdate: "Last available update", feelsLike: "Feels like", rainProbability24h: "24-hour rain probability", relativeHumidityLabel: "Relative humidity", windSpeed: "Wind speed", fieldWaterBalance: "Field water balance & drought monitor", estimatedDailyMoisture: "Estimated daily moisture balance", reason: "Reason", relevantConditions: "Relevant conditions", suggestedAction: "Suggested action", supplementalIrrigation: "Prepare supplemental irrigation cycles and check root mulch to conserve moisture.", stableMoisture: "Moisture balance is stable. Rain-fed crops have adequate transpiration reserve.", extendedPlanning: "Extended planning horizon", sevenDayForecast: "7-day agricultural forecast", hourlyForecast: "Updated hourly from regional meteorological models", today: "Today", tomorrow: "Tomorrow", 
    filterSeverity: "Filter severity", allSeverities: "All severities", criticalOnly: "Critical only", high: "High", medium: "Medium", low: "Low", activeHazards: "Active hazards requiring attention", noActiveAlerts: "No active alerts", addFarmMonitor: "Add a farm to start monitoring", weatherAlertsChecked: "Weather alerts are checked when you open the workspace. Higher-risk BCTB screening results are added when you submit a screening.", addFarmLocation: "Add a farm with a saved location so AgriSense can check local weather conditions.", acknowledge: "Acknowledge", resolve: "Resolve", acknowledged: "Acknowledged", resolved: "Resolved", alertDetails: "Alert details",
    showJournalFor: "Show journal for", journalReady: "Your farm journal is ready", addFarmJournalHelp: "Add a farm first, then create fields or plots and record pruning, scouting, inputs, labour, and harvests here.", setUpFarm: "Set up a farm", localJournalNotice: "Journal entries are saved on this device and are not synchronized to other devices.", operationsLogged: "Operations logged", activeSeasonTracking: "Active season tracking", inputLabourInvestment: "Total input & labour investment", plantingRuns: "Sowing / planting runs", cropPhenologyReferences: "Crop phenology references", chronologicalOperations: "Chronological operations", fieldLogTimeline: "Field log timeline", noActivities: "No activities recorded for this farm yet", recordFirstActivityHelp: "Record your first field task to build a seasonal history for your selected farm.", recordFirstActivity: "Record the first activity", recordFarmActivity: "Record farm activity", activitySubtitle: "Log a field management action to keep historical agronomic context.", activityTitle: "Activity title", applied: "Applied", labour: "Labour", field: "Field", activityType: "Activity type", activityDate: "Date", inputName: "Input name", quantity: "Quantity", unit: "Unit", costUgx: "Cost (UGX)", labourCount: "Labour count", notes: "Notes", saveActivity: "Save activity", planting: "Planting", pruning: "Pruning", scouting: "Scouting", harvest: "Harvest", weeding: "Weeding", fertilizing: "Fertilizing", spraying: "Spraying", otherActivity: "Other",
  },
  lg: {
    governanceEyebrow: "Okuddukanya omukutu n'ebiwandiiko by'okukebera", governanceTitle: "Enzirukanya y'omukutu n'amateeka", governanceIntro: "Ddukanya enkyusa z'amateeka, teeka abakugu mu bitundu, kebera ebiwandiiko n'ebibalo by'omukutu.", exportAggregate: "Fuluma alipoota etalaga mannya (JSON)", systemStatistics: "Ebibalo by'omukutu", ruleConfiguration: "Enteekateeka y'amateeka", officerAreas: "Ebitundu by'abakugu", caseRegistry: "Olukalala lw'emirimu", auditLedger: "Ebiwandiiko by'okukebera", riskEngineTests: "Okukebera ebyuma by'obuzibu",
    navFarmReports: "Alipoota z'ennimiro", navVerification: "Okukakasa", navInspections: "Okukebera", navOfficerApplications: "Okusaba kw'abakugu", navAccountManagement: "Okuddukanya akawunti", navCoffeePassport: "Paspooti ya Kaawa", navCooperative: "Okulondoola ekibiina", navPlans: "Enteekateeka n'ebisale", navOrgPortal: "Omukutu gw'ekibiina",
    farmersAndFarms: "Abalimi n'emirima", directoryIntro: "Olukalala lw'emirima egiteereddwa mu kitundu kyo. Ggulawo alipoota okukebera obubonero n'okuwandiika ebyo bye weekebejjezza mu nnimiro.", viewFarmLocations: "Laba ebifo by'emirima", farmersWithFarms: "Abalimi abalina emirima", registeredFarms: "Emirima egiteereddwa", openElevatedReports: "Alipoota ezirina obuzibu obw'amaanyi ? kukebera kwokka", farmSearchPlaceholder: "Omulimi, ekyalo oba gombolola", retry: "Ddamu ogezeeko", loadingDistrictFarms: "Emirima gya disitulikiti giteekebwa?", farmerLabel: "Omulimi", registeredFarmer: "Omulimi ateereddwa", locationLabel: "Ekifo", farmRecordLabel: "Ebiwandiiko by'omulimi", cropNotRecorded: "Ekika ky'ekirime tekiteereddwa", coordinatesLabel: "Obubonero bw'ekifo", latestReport: "Alipoota esembyeyo", reviewReportVerification: "Kebera alipoota n'okukakasa", noFollowupReport: "Tewali alipoota ya BCTB ey'okuddirira erina akakwate n'omulimi guno.", noSearchMatch: "Tewali mulimi atuukana n'okunoonya kwo", noDistrictFarms: "Tewali mulimi ateereddwa mu disitulikiti eno", assignedDistrictOnly: "Emirima egy'omu disitulikiti y'omukugu gyokka gye giragibwa.",
    mapAssignedDistrict: "Disitulikiti gye baakuwadde", farmCoordinates: "Obubonero bw'emirima gyo obuteereddwa", farmLocations: "Ebifo by'emirima", farmMap: "Maapu y'omulimi", reviewDistrictLocations: "Kebera ebifo by'emirima ebiteereddwa mu disitulikiti gye baakuwadde.", exploreFarmMap: "Kebera maapu eri ku mulimi gwe wateereddwa. Londa omulimi omulala okukyusa akabonero ku maapu.", manageFarms: "Ddukanya emirima", loadingFarmLocations: "Ebifo by'emirima biteekebwa…", settingsTitle: "Enteekateeka", workspacePreferencesSecurity: "Eby'oyagala n'obukuumi bw'ekifo", settingsDescription: "Londa ekitundu okukebera oba okukyusa enteekateeka zo.", saveChanges: "Tereka enkyukakyuka", saved: "Bitereddwa", accountProfile: "Ebikwata ku akawunti", notificationRules: "Amateeka g'obubaka", dataOfflineCache: "Data n'ebitereko ebitali ku mutimbagano", securityPrivacy: "Obukuumi n'ebyama", settingsSections: "Ebitundu by'enteekateeka", profileInformation: "Ebikwata ku muntu", signedInRegionalPreferences: "Akawunti gy'oyingiziddemu n'enteekateeka z'ekitundu.", fullName: "Erinnya erijjuvu", emailAddress: "Endagiriro ya email", workspaceRole: "Omulimu ku mukutu", timezone: "Ekiseera ky'ekitundu", advisoryNotifications: "Obubaka bw'amagezi", farmUpdatesPreference: "Londa amawulire g'omulimi agalabika ku mukutu gwo.", criticalBctbAlerts: "Okulabula kwa BCTB okw'amaanyi", criticalBctbDescription: "Laga ebyava mu kukebera ebyetaaga okwekebejjebwa amangu mu nnimiro.", weatherAdvisories: "Amagezi g'obudde", weatherAdvisoriesDescription: "Laga enkuba n'ebiseera by'ekyeeya ku mirima gyo.", extensionFollowUp: "Amawulire g'okuddirira kw'omukugu", extensionFollowUpDescription: "Laga enkulaakulana ng'okkirizza omukugu okukebera.",
    totalFarms: "Omuwendo gw'emirima", totalArea: "Obunene bw'ettaka", activeFarmFields: "Ebitundu ebiri ku mulimi guno", searchFarm: "Noonya erinnya ly'omulimi oba disitulikiti...",
    loadingFarms: "Ebirime ebiteereddwa ku mukutu biteekebwa...", noFarms: "Tewali mulimi ateereddwa ku mukutu", noFarmsHelp: "Teekawo omulimi wo ogwasooka mu disitulikiti yonna mu Uganda ofune amagezi n'amawulire g'obudde ag'ekitundu.", registerFirstFarm: "Teekawo omulimi wo ogwasooka", yourFarms: "Emirimi gyo", activeGrowingSite: "Ekifo ky'okulimamu ekikola", gpsCoordinates: "Obubonero bwa GPS", addFieldPlot: "Yongerako ekitundu / plot", registeredPlotsFields: "Plots n'ebitundu ebiteereddwa", noFarmFields: "Tewali bitundu byamulimi bino byateereddwa.", addFirstField: "Yongerako ekitundu kyo ekyasooka", soilClassification: "Ekika ky'ettaka", irrigationSystem: "Enkola y'okufukirira", moistureTarget: "Obunnyogovu obwetaagisa", plantingDate: "Olunaku lwe wasimbira", monitored: "Kirondoolwa", cooperative: "Kibiina kya bulimi", standalone: "Omulimi omwetongodde", areaLabel: "Obunene", unspecified: "Tekunnategeezebwa", deleteFarm: "Sangula ebiwandiiko by'omulimi", registerNewFarm: "Teekawo omulimi omupya", addFarmDescription: "Yongerako ekifo ky'omulimi omwetongodde oba ekibiina mu Uganda.", farmName: "Erinnya ly'omulimi", ugandanDistrict: "Disitulikiti ya Uganda", subCounty: "Gombolola", parishWard: "Parishi / Ward", villageCell: "Ekyalo / LC1", topography: "Engeri ettaka gye lifaanana", flatTerrain: "Ettaka eryenkana", hillsideSlope: "Olusozi / ekkubo eryeserengeta", valleyBottom: "Ekiwonvu", captureGps: "Kuba GPS yange eriwo kati", acquiringGps: "GPS efunibwa...", latitude: "Latitude", longitude: "Longitude", totalFarmArea: "Obunene bw'omulimi gwonna (obukadde)", robustaAcreage: "Obunene bwa kaawa Robusta", approxCoffeeTrees: "Emiti gya kaawa egy'okubalirira", coffeeVariety: "Ekika kya kaawa", coffeeStandAge: "Emyaka gy'emiti gya kaawa", canopyShadeCover: "Ekisiikirize ky'ebikoola", standaloneSmallholder: "Omulimi omutono eyeetongodde", descriptionAgronomicNotes: "Ebifa ku mulimi / amagezi g'ebyobulimi", cancel: "Sazaamu", registering: "Kiteekebwa ku mukutu...", saveFarmRecord: "Tereka ebiwandiiko by'omulimi", addFieldToFarm: "Yongerako ekitundu ku", searchDistrictDirectory: "Noonya mu nkalala za disitulikiti",
    latestForecastLoading: "Tufunayo obudde obw'omulembe...", liveWeatherFallback: "Obudde obuterekeddwa oba obubaliriddwa bulagibwa kubanga omuwa obudde obw'omu kiseera kino tafunise.", liveForecast: "Obudde obw'omu kiseera kino okuva ku Open-Meteo, buzziddwa bupya", lastAvailableUpdate: "Okusookera ddala okwabaddewo", feelsLike: "Obwawulira nga", rainProbability24h: "Ekisaanyizo ky'enkuba mu ssaawa 24", relativeHumidityLabel: "Obunnyogovu mu mpewo", windSpeed: "Amaanyi g'empewo", fieldWaterBalance: "Ennyonta y'ettaka n'ekyeeya", estimatedDailyMoisture: "Obunnyogovu bw'ettaka obubaliriddwa buli lunaku", reason: "Ensonga", relevantConditions: "Embeera ezikwata ku nsonga", suggestedAction: "Ekikolwa ekiteeseddwa", supplementalIrrigation: "Tegeka okufukirira era wekembeze ebisasiro ebikuuma obunnyogovu ku mirandira.", stableMoisture: "Obunnyogovu bw'ettaka bulungi. Ebimera ebifuna enkuba birina amazzi agamala.", extendedPlanning: "Okutegeka okw'ekiseera ekiwanvu", sevenDayForecast: "Obudde bw'ebyobulimi obw'ennaku musanvu", hourlyForecast: "Buzza bupya buli ssaawa okuva ku byuma ebikebera obudde mu kitundu", today: "Leero", tomorrow: "Enkya",
    filterSeverity: "Sunsula obuzibu", allSeverities: "Obuzibu bwonna", criticalOnly: "Obuzibu obw'amaanyi ennyo", high: "Waggulu", medium: "Wakati", low: "Wansi", activeHazards: "Obuzibu obwetaaga okufaako", noActiveAlerts: "Tewali kulabula kukyakola", addFarmMonitor: "Yongerako omulimi otandike okulondoola", weatherAlertsChecked: "Okulabula kw'obudde kukeberebwa bw'oggulawo ekifo kino. BCTB bw'eba mu kukebera okwa waggulu nayo eyongerwako.", addFarmLocation: "Yongerako omulimi alina ekifo ekiteereddwa AgriSense esobole okukebera obudde obw'omu kitundu.", acknowledge: "Kakasa nti okirabye", resolve: "Gonjoola", acknowledged: "Kikakasiddwa", resolved: "Kigonjoddwa", alertDetails: "Ebikwata ku kulabula",
    showJournalFor: "Laga ebiwandiiko bya", journalReady: "Ebiwandiiko by'omulimi gwo byetegefu", addFarmJournalHelp: "Sooka oyongeremu omulimi, oluvannyuma oteekewo ebifo n'ewandiike okusala, okukebera, ebikozesebwa, abakozi n'okukungula.", setUpFarm: "Teekawo omulimi", localJournalNotice: "Ebiwandiiko biteerekebwa ku kyuma kino era tebikyusibwa ku byuma birala.", operationsLogged: "Emirimu egyawandiikiddwa", activeSeasonTracking: "Okulondoola sizoni ekola", inputLabourInvestment: "Omuwendo gw'ebikozesebwa n'abakozi", plantingRuns: "Emirundi gy'okusimba", cropPhenologyReferences: "Eby'okulabirako by'okukula kw'ebimera", chronologicalOperations: "Emirimu mu nsengeka y'ebiseera", fieldLogTimeline: "Ebiwandiiko by'emirimu mu nnaku", noActivities: "Tewali mirimu gya mulimi guno giwandiikiddwa", recordFirstActivityHelp: "Wandiika omulimu gwo ogusooka okuteekawo ebyafaayo bya sizoni y'omulimi gw'olondeddwa.", recordFirstActivity: "Wandiika omulimu ogusooka", recordFarmActivity: "Wandiika omulimu gw'omulimi", activitySubtitle: "Wandiika ekikolwa ky'okulabirira ennimiro okukuuma ebyafaayo by'ebyobulimi.", activityTitle: "Erinnya ly'omulimu", applied: "Kikozeseddwa", labour: "Abakozi", field: "Ekifo", activityType: "Ekika ky'omulimu", activityDate: "Olunaku", inputName: "Ekikozesebwa", quantity: "Obungi", unit: "Ekipimo", costUgx: "Ebisale (UGX)", labourCount: "Omuwendo gw'abakozi", notes: "Ebiwandiiko", saveActivity: "Tereka omulimu", planting: "Okusimba", pruning: "Okusalira", scouting: "Okukebera", harvest: "Okukungula", weeding: "Okulima omuddo", fertilizing: "Okuteekamu ebigimusa", spraying: "Okufuuyira", otherActivity: "Omulala",
  },
  sw: {
    governanceEyebrow: "Usimamizi wa mfumo na kumbukumbu za ukaguzi", governanceTitle: "Uongozi wa mfumo na usimamizi wa kanuni", governanceIntro: "Dhibiti matoleo ya kanuni, wapangie maafisa maeneo, kagua kumbukumbu na takwimu za mfumo.", exportAggregate: "Hamisha ripoti isiyo na majina (JSON)", systemStatistics: "Takwimu za mfumo", ruleConfiguration: "Mipangilio ya kanuni", officerAreas: "Maeneo ya maafisa", caseRegistry: "Orodha ya kesi", auditLedger: "Kumbukumbu za ukaguzi", riskEngineTests: "Ukaguzi wa injini ya hatari",
    navFarmReports: "Ripoti za shamba", navVerification: "Uthibitishaji", navInspections: "Ukaguzi", navOfficerApplications: "Maombi ya maafisa", navAccountManagement: "Usimamizi wa akaunti", navCoffeePassport: "Pasipoti ya Kahawa", navCooperative: "Ufuatiliaji wa ushirika", navPlans: "Mipango na bei", navOrgPortal: "Tovuti ya ushirika",
    farmersAndFarms: "Wakulima na Mashamba", directoryIntro: "Orodha ya mashamba yaliyosajiliwa katika eneo lako. Fungua ripoti kukagua dalili na kurekodi ukaguzi wa shambani.", viewFarmLocations: "Tazama mahali pa mashamba", farmersWithFarms: "Wakulima wenye mashamba", registeredFarms: "Mashamba yaliyosajiliwa", openElevatedReports: "Ripoti za hatari kubwa ? uchunguzi pekee", farmSearchPlaceholder: "Shamba, mkulima, kijiji au kata ndogo", retry: "Jaribu tena", loadingDistrictFarms: "Inapakia mashamba ya wilaya?", farmerLabel: "Mkulima", registeredFarmer: "Mkulima aliyesajiliwa", locationLabel: "Mahali", farmRecordLabel: "Rekodi ya shamba", cropNotRecorded: "Zao halijarekodiwa", coordinatesLabel: "Viambatisho", latestReport: "Ripoti ya hivi karibuni", reviewReportVerification: "Kagua ripoti na uthibitishaji", noFollowupReport: "Hakuna ripoti ya ufuatiliaji wa BCTB iliyounganishwa na shamba hili.", noSearchMatch: "Hakuna mashamba yanayolingana na utafutaji wako", noDistrictFarms: "Hakuna mashamba yaliyosajiliwa katika wilaya hii", assignedDistrictOnly: "Mashamba katika wilaya aliyopewa afisa pekee ndiyo yanaonyeshwa.",
    mapAssignedDistrict: "Wilaya uliyopewa", farmCoordinates: "Mahali pa mashamba yako yaliyosajiliwa", farmLocations: "Mahali pa mashamba", farmMap: "Ramani ya shamba", reviewDistrictLocations: "Kagua mahali pa mashamba yaliyosajiliwa katika wilaya uliyopewa.", exploreFarmMap: "Tazama ramani iliyo katikati ya shamba ulilosajili. Chagua shamba jingine kusogeza alama ya ramani.", manageFarms: "Dhibiti mashamba", loadingFarmLocations: "Inapakia mahali pa mashamba yako…", settingsTitle: "Mipangilio", workspacePreferencesSecurity: "Mapendeleo na usalama wa eneo", settingsDescription: "Chagua sehemu ya kukagua au kubadilisha mapendeleo yako.", saveChanges: "Hifadhi mabadiliko", saved: "Imehifadhiwa", accountProfile: "Wasifu wa akaunti", notificationRules: "Kanuni za arifa", dataOfflineCache: "Data na akiba ya nje ya mtandao", securityPrivacy: "Usalama na faragha", settingsSections: "Sehemu za mipangilio", profileInformation: "Taarifa za wasifu", signedInRegionalPreferences: "Akaunti uliyoingia na mapendeleo ya eneo.", fullName: "Jina kamili", emailAddress: "Barua pepe", workspaceRole: "Jukumu la eneo", timezone: "Saa za eneo", advisoryNotifications: "Arifa za ushauri", farmUpdatesPreference: "Chagua taarifa za shamba zinazoonekana kwenye eneo lako.", criticalBctbAlerts: "Tahadhari muhimu za hatari ya BCTB", criticalBctbDescription: "Angazia matokeo ya uchunguzi yanayohitaji ukaguzi wa haraka shambani.", weatherAdvisories: "Ushauri wa hali ya hewa", weatherAdvisoriesDescription: "Onyesha taarifa za mvua na ukame kwa mashamba yako.", extensionFollowUp: "Taarifa za ufuatiliaji wa afisa", extensionFollowUpDescription: "Onyesha maendeleo baada ya kukubali rufaa ya ukaguzi wa afisa.",
    totalFarms: "Jumla ya mashamba", totalArea: "Eneo lote", activeFarmFields: "Mashamba madogo katika shamba hili", searchFarm: "Tafuta kwa jina la shamba au wilaya...",
    loadingFarms: "Inapakia mashamba yaliyosajiliwa...", noFarms: "Hakuna shamba lililosajiliwa", noFarmsHelp: "Sajili shamba lako la kwanza katika wilaya yoyote ya Uganda ili upate ushauri na taarifa za hali ya hewa za eneo lako.", registerFirstFarm: "Sajili shamba la kwanza", yourFarms: "Mashamba yako", activeGrowingSite: "Eneo la kilimo linalotumika", gpsCoordinates: "Viambatisho vya GPS", addFieldPlot: "Ongeza kipande / shamba dogo", registeredPlotsFields: "Vipande na mashamba madogo yaliyosajiliwa", noFarmFields: "Hakuna vipande vilivyopimwa katika shamba hili bado.", addFirstField: "Ongeza kipande chako cha kwanza", soilClassification: "Aina ya udongo", irrigationSystem: "Mfumo wa umwagiliaji", moistureTarget: "Kiwango cha unyevu", plantingDate: "Tarehe ya kupanda", monitored: "Inafuatiliwa", cooperative: "Chama cha ushirika", standalone: "Mkulima binafsi", areaLabel: "Eneo", unspecified: "Haijabainishwa", deleteFarm: "Futa rekodi ya shamba", registerNewFarm: "Sajili shamba jipya", addFarmDescription: "Ongeza shamba la mtu binafsi au la chama cha ushirika nchini Uganda.", farmName: "Jina la shamba", ugandanDistrict: "Wilaya ya Uganda", subCounty: "Kaunti ndogo", parishWard: "Parokia / kata", villageCell: "Kijiji / LC1", topography: "Muundo wa ardhi", flatTerrain: "Ardhi tambarare", hillsideSlope: "Mteremko wa kilima", valleyBottom: "Bonde la chini", captureGps: "Pata GPS yangu ya sasa", acquiringGps: "Inatafuta GPS...", latitude: "Latitudo", longitude: "Longitudo", totalFarmArea: "Eneo lote la shamba (ekari)", robustaAcreage: "Eneo la kahawa Robusta", approxCoffeeTrees: "Takriban miti ya kahawa", coffeeVariety: "Aina ya kahawa", coffeeStandAge: "Umri wa miti ya kahawa", canopyShadeCover: "Kivuli cha matawi", standaloneSmallholder: "Mkulima mdogo binafsi", descriptionAgronomicNotes: "Maelezo / kumbukumbu za kilimo", cancel: "Ghairi", registering: "Inasajili...", saveFarmRecord: "Hifadhi rekodi ya shamba", addFieldToFarm: "Ongeza kipande kwenye", searchDistrictDirectory: "Tafuta katika orodha ya wilaya",
    latestForecastLoading: "Inapata utabiri wa hivi karibuni...", liveWeatherFallback: "Inaonyesha hali ya hewa iliyohifadhiwa au iliyokadiriwa kwa sababu huduma ya moja kwa moja haipatikani.", liveForecast: "Utabiri wa moja kwa moja kutoka Open-Meteo, umesasishwa", lastAvailableUpdate: "Taarifa ya mwisho iliyopatikana", feelsLike: "Joto linalohisiwa", rainProbability24h: "Uwezekano wa mvua saa 24", relativeHumidityLabel: "Unyevu wa hewa", windSpeed: "Kasi ya upepo", fieldWaterBalance: "Usawa wa maji shambani na ufuatiliaji wa ukame", estimatedDailyMoisture: "Usawa wa unyevu wa kila siku unaokadiriwa", reason: "Sababu", relevantConditions: "Hali zinazohusika", suggestedAction: "Hatua inayopendekezwa", supplementalIrrigation: "Panga umwagiliaji wa ziada na tumia matandazo kuhifadhi unyevu kwenye mizizi.", stableMoisture: "Unyevu uko sawa. Mazao yanayotegemea mvua yana akiba ya kutosha.", extendedPlanning: "Mipango ya muda mrefu", sevenDayForecast: "Utabiri wa kilimo wa siku 7", hourlyForecast: "Husasishwa kila saa kutoka mifumo ya hali ya hewa ya eneo", today: "Leo", tomorrow: "Kesho",
    filterSeverity: "Chuja kwa ukali", allSeverities: "Ukali wote", criticalOnly: "Hatari sana pekee", high: "Juu", medium: "Wastani", low: "Chini", activeHazards: "Hatari zinazohitaji kuangaliwa", noActiveAlerts: "Hakuna tahadhari zinazotumika", addFarmMonitor: "Ongeza shamba ili kuanza ufuatiliaji", weatherAlertsChecked: "Tahadhari za hali ya hewa hukaguliwa unapofungua mfumo. Matokeo ya uchunguzi wa BCTB yenye hatari zaidi huongezwa unapowasilisha uchunguzi.", addFarmLocation: "Ongeza shamba lenye eneo lililohifadhiwa ili AgriSense ikague hali ya hewa ya eneo lako.", acknowledge: "Thibitisha", resolve: "Tatua", acknowledged: "Imethibitishwa", resolved: "Imetatuliwa", alertDetails: "Maelezo ya tahadhari",
    showJournalFor: "Onyesha jarida la", journalReady: "Jarida la shamba lako liko tayari", addFarmJournalHelp: "Ongeza shamba kwanza, kisha tengeneza vipande na urekodi upogoaji, ukaguzi, pembejeo, kazi na mavuno hapa.", setUpFarm: "Sanidi shamba", localJournalNotice: "Maingizo ya jarida huhifadhiwa kwenye kifaa hiki na hayalandanishwi na vifaa vingine.", operationsLogged: "Shughuli zilizorekodiwa", activeSeasonTracking: "Ufuatiliaji wa msimu unaendelea", inputLabourInvestment: "Jumla ya gharama za pembejeo na kazi", plantingRuns: "Vipindi vya kupanda", cropPhenologyReferences: "Rejea za ukuaji wa mazao", chronologicalOperations: "Shughuli kwa mpangilio wa tarehe", fieldLogTimeline: "Ratiba ya kumbukumbu za shamba", noActivities: "Hakuna shughuli zilizorekodiwa kwa shamba hili", recordFirstActivityHelp: "Rekodi kazi yako ya kwanza ya shamba ili kuanza historia ya msimu kwa shamba hili.", recordFirstActivity: "Rekodi shughuli ya kwanza", recordFarmActivity: "Rekodi shughuli ya shamba", activitySubtitle: "Rekodi hatua ya usimamizi wa shamba ili kuhifadhi historia ya kilimo.", activityTitle: "Jina la shughuli", applied: "Imetumika", labour: "Wafanyakazi", field: "Kipande", activityType: "Aina ya shughuli", activityDate: "Tarehe", inputName: "Jina la pembejeo", quantity: "Kiasi", unit: "Kipimo", costUgx: "Gharama (UGX)", labourCount: "Idadi ya wafanyakazi", notes: "Maelezo", saveActivity: "Hifadhi shughuli", planting: "Kupanda", pruning: "Kupogoa", scouting: "Ukaguzi", harvest: "Mavuno", weeding: "Kupalilia", fertilizing: "Kuweka mbolea", spraying: "Kunyunyizia", otherActivity: "Nyingine",
  },
  nyn: {
    governanceEyebrow: "Okutegyeka pulatifomu n'ebiwandiiko by'okukebera", governanceTitle: "Entebeekanisa ya pulatifomu n'amateeka", governanceIntro: "Tegyeka empindahinduka z'amateeka, ha abakugu omu bicweka, reeba ebiwandiiko n'ebibarirwe bya pulatifomu.", exportAggregate: "Hingisa ripooti etarikworeka amabara (JSON)", systemStatistics: "Ebibaro bya pulatifomu", ruleConfiguration: "Entebeekanisa y'amateeka", officerAreas: "Ebibanja by'abahabuzi", caseRegistry: "Orutonde rw'emishango", auditLedger: "Ebiwandiiko by'okureeba", riskEngineTests: "Okukebera ekyuma ky'oburemeezi",
    navFarmReports: "Ripooti z'emisiri", navVerification: "Okuhamya", navInspections: "Okukebera", navOfficerApplications: "Okushaba kw'abahabuzi", navAccountManagement: "Okutegyeka akawunti", navCoffeePassport: "Paspooti ya Kaawa", navCooperative: "Okurondoola ekibiina", navPlans: "Entebeekanisa n'ebisente", navOrgPortal: "Omwanya gw'ekibiina",
    farmersAndFarms: "Abariimi n'emisiri", directoryIntro: "Orutonde rw'emisiri ebikire omu kicweka eki baakuhaire. Shumbura ripooti kureeba obubonero n'okuhandiika ebyareebirwe omu musiri.", viewFarmLocations: "Reeba ebicweka by'emisiri", farmersWithFarms: "Abariimi abafite emisiri", registeredFarms: "Emisiri ebikire", openElevatedReports: "Ripooti z'oburemeezi bwingi ? okukebera kwonka", farmSearchPlaceholder: "Omusiri, omuriimi, ekyaro nari omugombolola", retry: "Gezaaho obundi", loadingDistrictFarms: "Emisiri ya disiturikiti neetwarwa?", farmerLabel: "Omuriimi", registeredFarmer: "Omuriimi obikire", locationLabel: "Ekicweka", farmRecordLabel: "Ebiwandiiko by'omusiri", cropNotRecorded: "Ekihingwa tikihandiikire", coordinatesLabel: "Ebipimo by'ekicweka", latestReport: "Ripooti eyaaherukire", reviewReportVerification: "Reeba ripooti n'okuhamya", noFollowupReport: "Tihariho ripooti ya BCTB ekwatirwe aha musiri ogu.", noSearchMatch: "Tihariho misiri erikuhika aha kuzaana kwawe", noDistrictFarms: "Tihariho misiri ebikire omu disiturikiti egi", assignedDistrictOnly: "Emisiri yomu disiturikiti ei omuhabuzi yaahaire niyo yorekwa.",
    mapAssignedDistrict: "Disiturikiti ei baakuhaire", farmCoordinates: "Ebicweka by'emisiri yawe ebibikire", farmLocations: "Ebicweka by'emisiri", farmMap: "Maapu y'omusiri", reviewDistrictLocations: "Reeba ebicweka by'emisiri ebibikire omu disiturikiti ei baakuhaire.", exploreFarmMap: "Reeba maapu eri aha musiri ogubikire. Toorana omusiri ogundi kuhindura akabonero ka maapu.", manageFarms: "Tegyeka emisiri", loadingFarmLocations: "Ebicweka by'emisiri nibitebeekanisa…", settingsTitle: "Entebeekanisa", workspacePreferencesSecurity: "Ebyo orikwenda n'oburinzi bw'omwanya", settingsDescription: "Toorana ekicweka kureeba nari kuhindura entebeekanisa yawe.", saveChanges: "Bika empindahinduka", saved: "Bibikire", accountProfile: "Ebirikukwata aha akawunti", notificationRules: "Amateeka g'obutumwa", dataOfflineCache: "Data n'ebibikiro bitari aha mutimbagano", securityPrivacy: "Oburinzi n'ebyama", settingsSections: "Ebicweka by'entebeekanisa", profileInformation: "Ebirikukwata aha muntu", signedInRegionalPreferences: "Akawunti ei oyingiremu n'entebeekanisa z'omu kiikaro.", fullName: "Eiziina ryona", emailAddress: "Endagiriro ya email", workspaceRole: "Omurimo aha mwanya", timezone: "Obwire bw'omu kiikaro", advisoryNotifications: "Obutumwa bw'amagezi", farmUpdatesPreference: "Toorana amakuru g'omusiri agarikworekwa aha mwanya gwawe.", criticalBctbAlerts: "Okurabura kwa BCTB okw'amaani", criticalBctbDescription: "Yoreka ebyarugiremu omu kukebera ebyetenga kwereberwa juba omu musiri.", weatherAdvisories: "Amagezi g'obwire", weatherAdvisoriesDescription: "Yoreka amakuru g'enkuba n'ekyanda aha misiri yawe.", extensionFollowUp: "Amakuru g'okukurataho kw'omuhabuzi", extensionFollowUpDescription: "Yoreka entunguuka waikiriza omuhabuzi kukora okureeba.",
    totalFarms: "Omuhendo gw'emirima", totalArea: "Obugazi bw'itaka", activeFarmFields: "Emirima eri aha musiri ogu", searchFarm: "Zaana eiziina ry'omusiri nari disiturikiti...",
    loadingFarms: "Emirima eri kukwatwa...", noFarms: "Tihariho musiri oguteirweho", noFarmsHelp: "Teeraho omusiri gwawe ogw'okubanza omu disiturikiti yoona omuri Uganda kugira ngu oreebwe amagezi n'obwire bw'omu kiikaro kyawe.", registerFirstFarm: "Teeraho omusiri ogw'okubanza", yourFarms: "Emirima yawe", activeGrowingSite: "Ekicweka ky'okurimamu ekirikukora", gpsCoordinates: "Obumanyiso bwa GPS", addFieldPlot: "Yongeraho ekicweka / plot", registeredPlotsFields: "Plots n'ebicweka ebiteirweho", noFarmFields: "Tihariho bicweka ebyateirweho omu musiri ogu.", addFirstField: "Yongeraho ekicweka kyawe eky'okubanza", soilClassification: "Omutindo gw'itaka", irrigationSystem: "Enkora y'okufukirira", moistureTarget: "Obunnyogovu obwetaagisa", plantingDate: "Eizooba ry'okubiba", monitored: "Nikireebwa", cooperative: "Ekibiina ky'abariimi", standalone: "Omuriimi arikwetegyeka", areaLabel: "Obugazi", unspecified: "Tikirikworekwa", deleteFarm: "Siba ebiwandiiko by'omusiri", registerNewFarm: "Teeraho omusiri musya", addFarmDescription: "Yongeraho omusiri gw'omuntu omwe nari ogw'ekibiina omuri Uganda.", farmName: "Eiziina ry'omusiri", ugandanDistrict: "Disiturikiti ya Uganda", subCounty: "Gomborora", parishWard: "Parishi / Ward", villageCell: "Ekyaaro / LC1", topography: "Engeri y'itaka", flatTerrain: "Eitaka erirungi", hillsideSlope: "Omushozi / omurondo", valleyBottom: "Ekiiruru", captureGps: "Kwata GPS yange eya hati", acquiringGps: "GPS neeyetunga...", latitude: "Latitude", longitude: "Longitude", totalFarmArea: "Obugazi bw'omusiri gwona (obukadde)", robustaAcreage: "Obugazi bwa kaawa Robusta", approxCoffeeTrees: "Emiti ya kaawa eri kubarwa", coffeeVariety: "Ekika kya kaawa", coffeeStandAge: "Emyaka y'emiti ya kaawa", canopyShadeCover: "Ekisiikirize ky'ebishaka", standaloneSmallholder: "Omuriimi muto arikwetegyeka", descriptionAgronomicNotes: "Ebirikukwata aha musiri / amagezi g'eby'obuhingi", cancel: "Sazaamu", registering: "Neeteerwa...", saveFarmRecord: "Bika ebiwandiiko by'omusiri", addFieldToFarm: "Yongeraho ekicweka aha", searchDistrictDirectory: "Zaana omu rutonde rwa disiturikiti",
    latestForecastLoading: "Neetunga obwire obwaherukire...", liveWeatherFallback: "Obwire obubikire nari obubarirwe nibwoorekwa ahabw'okuba omuheereza w'obwire atarikukora.", liveForecast: "Obwire obwa hati kuruga Open-Meteo, bwahindwirwe", lastAvailableUpdate: "Okugaruka okuherukire kuboneka", feelsLike: "Nikihurirwa nka", rainProbability24h: "Ekyesigika ky'enkuba omu sa'a 24", relativeHumidityLabel: "Obunnyogovu bw'empewo", windSpeed: "Amaani g'empewo", fieldWaterBalance: "Oburinganiza bw'amaizi omu musiri n'okurondoola ekyanda", estimatedDailyMoisture: "Obunnyogovu bw'itaka obubarirwe buri eizooba", reason: "Ensonga", relevantConditions: "Embeera ezikwata aha nsonga", suggestedAction: "Ekikorwa ekiteirweho", supplementalIrrigation: "Teekateeka okufukirira okwongyerweho kandi obike ebisasiro aha mirandira kubika obunnyogovu.", stableMoisture: "Obunnyogovu bw'itaka buri gye. Ebihingwa ebirikurya enkuba bifite amaizi agamara.", extendedPlanning: "Entebeekanisa y'obwire buraingwa", sevenDayForecast: "Obwire bw'eby'obuhingi bw'ebiro mushanju", hourlyForecast: "Nibuhindurwa buri sa'a kuruga omu byuma by'obwire eby'omu kiikaro", today: "Eizioba", tomorrow: "Nyenkya",
    filterSeverity: "Sunsura oburemeezi", allSeverities: "Oburemeezi bwona", criticalOnly: "Oburemeezi bukuru bonka", high: "Ahaiguru", medium: "Hagati", low: "Ahaansi", activeHazards: "Oburemeezi obwetaaga okufaaho", noActiveAlerts: "Tihariho kurabura okukora", addFarmMonitor: "Yongeraho omusiri otandike okugurondoola", weatherAlertsChecked: "Okurabura kw'obwire nikureebwa waaguraho omwanya ogu. Ebivuddemu bya BCTB ebirikureetera oburemeezi bwingi nibyongerwaho waaba ohayo okukebera.", addFarmLocation: "Yongeraho omusiri ogufite ekifo ekibikire kugira ngu AgriSense ekebera obwire bw'omu kiikaro.", acknowledge: "Kakasa", resolve: "Maraho", acknowledged: "Kikakasirwe", resolved: "Kimariirwe", alertDetails: "Ebirikukwata aha kurabura",
    showJournalFor: "Yoreka ebiwandiiko bya", journalReady: "Ebiwandiiko by'omusiri gwawe byeteekateekire", addFarmJournalHelp: "Sooka oyongyereho omusiri, reero oteekaho ebicweka kandi ohandiike okusara, okurondoola, ebikozesibwa, abakozi n'okusharura.", setUpFarm: "Teekaho omusiri", localJournalNotice: "Ebiwandiiko nibibikwa aha kyuma eki kandi tibirikuhindurwa aha byuma ebindi.", operationsLogged: "Emirimo ehandiikirwe", activeSeasonTracking: "Okurondoola omwaka nikukora", inputLabourInvestment: "Ebisente by'ebikozesibwa n'abakozi", plantingRuns: "Emirundi y'okubiba", cropPhenologyReferences: "Eby'okureberaho by'okukura kw'ebihingwa", chronologicalOperations: "Emirimo omu nsengeka y'ebiro", fieldLogTimeline: "Ebiwandiiko by'emirimo omu biro", noActivities: "Tihariho mirimo y'omusiri ogu ehandiikirwe", recordFirstActivityHelp: "Handiika omulimo gwawe ogw'okubanza okureeta ebyafaayo by'omwaka gw'omusiri ogwo.", recordFirstActivity: "Handiika omulimo ogw'okubanza", recordFarmActivity: "Handiika omulimo gw'omusiri", activitySubtitle: "Handiika ekikorwa ky'okurabirira omusiri kubika ebyafaayo by'eby'obuhingi.", activityTitle: "Eiziina ry'omulimo", applied: "Kikozirwe", labour: "Abakozi", field: "Ekicweka", activityType: "Ekika ky'omulimo", activityDate: "Eizooba", inputName: "Eiziina ry'ekikozesibwa", quantity: "Obungi", unit: "Ekigereranyo", costUgx: "Ebisente (UGX)", labourCount: "Omuhendo gw'abakozi", notes: "Ebiwandiiko", saveActivity: "Bika omulimo", planting: "Okubiba", pruning: "Okusara", scouting: "Okurondoola", harvest: "Okusharura", weeding: "Okurima omu byatsi", fertilizing: "Okuteekamu ebigimusa", spraying: "Okufuuyira", otherActivity: "Ekindi",
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
  t: { ...TRANSLATIONS.en, ...PAGE_TRANSLATIONS.en } as TranslationDictionary,
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
        t: { ...TRANSLATIONS.en, ...TRANSLATIONS[language], ...PAGE_TRANSLATIONS.en, ...PAGE_TRANSLATIONS[language] } as TranslationDictionary,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
