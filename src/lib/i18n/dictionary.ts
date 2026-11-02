import type { Locale } from "./types";

export type Dictionary = {
  meta: { title: string; description: string };
  common: { appName: string; appTagline: string; yes: string; no: string };
  nav: { allApplications: string; logout: string };
  login: {
    heading: string;
    subheading: string;
    usernameLabel: string;
    passwordLabel: string;
    submitIdle: string;
    submitPending: string;
    errorMissingFields: string;
    errorInvalidCredentials: string;
  };
  dashboard: {
    heading: string;
    subheading: (name: string) => string;
    avgDecisionTime: string;
    returnedRate: string;
    totalApplications: string;
    noData: string;
    daysSuffix: (n: number) => string;
    actionNeededHeading: (count: number) => string;
    emptyQueue: string;
    ageLabel: (age: number) => string;
    viewLink: string;
  };
  applicationsList: {
    heading: string;
    subheading: string;
    lastUpdated: string;
    ageLabel: (age: number) => string;
  };
  applicationDetail: {
    backToQueue: string;
    ageGender: (age: number, gender: string) => string;
    detailsHeading: string;
    address: string;
    aadhaar: string;
    bankAccount: string;
    monthlyIncome: string;
    spouseDeceasedConfirmed: string;
    remarried: string;
    eligibilityHeading: string;
    eligibleMessage: (categoryLabel: string) => string;
    closedMessage: (stageLabel: string) => string;
    notYourQueueMessage: (stageLabel: string) => string;
    historyHeading: string;
    noHistory: string;
    aiAssistedEdited: string;
    aiAssistedUnedited: string;
    applicationNotFoundError: string;
    remarksRequiredError: string;
    actionNotAllowedError: string;
  };
  actionPanel: {
    aiHelpHeading: string;
    aiHelpDisclaimer: string;
    documentCheckButton: string;
    documentCheckPending: string;
    fieldNotesLabel: string;
    fieldNotesPlaceholder: string;
    draftReportButton: string;
    draftReportPending: string;
    caseSummaryButton: string;
    draftSuffix: string;
    copyToRemarks: string;
    actionHeading: string;
    remarksLabel: string;
  };
  gender: Record<"ஆண்" | "பெண்", string>;
  urgency: { urgent: string; attention: string; normal: string };
  aiSource: { live: string; offline: string };
};

export const dictionary: Record<Locale, Dictionary> = {
  ta: {
    meta: {
      title: "நலம் — ஓய்வூதியப் பணிப்பாய்வு",
      description: "முதுமை / விதவை உதவித்தொகை பணிப்பாய்வு கருவி",
    },
    common: { appName: "நலம்", appTagline: "ஓய்வூதியப் பணிப்பாய்வு", yes: "ஆம்", no: "இல்லை" },
    nav: { allApplications: "அனைத்து விண்ணப்பங்கள்", logout: "வெளியேறு" },
    login: {
      heading: "நலம்",
      subheading: "ஓய்வூதியப் பணிப்பாய்வு — அலுவலர் உள்நுழைவு",
      usernameLabel: "பயனர்பெயர்",
      passwordLabel: "கடவுச்சொல்",
      submitIdle: "உள்நுழைக",
      submitPending: "சரிபார்க்கிறது...",
      errorMissingFields: "பயனர்பெயர் மற்றும் கடவுச்சொல்லை நிரப்பவும்.",
      errorInvalidCredentials: "பயனர்பெயர் அல்லது கடவுச்சொல் தவறானது.",
    },
    dashboard: {
      heading: "என் பணிப்பட்டியல்",
      subheading: (name) => `${name} — கவனம் தேவையானவை முதலில் காட்டப்படுகின்றன.`,
      avgDecisionTime: "சராசரி முடிவு நேரம்",
      returnedRate: "திருப்பி அனுப்பப்பட்ட விகிதம்",
      totalApplications: "மொத்த விண்ணப்பங்கள்",
      noData: "—",
      daysSuffix: (n) => `${n.toFixed(1)} நாட்கள்`,
      actionNeededHeading: (count) => `நடவடிக்கை தேவையானவை (${count})`,
      emptyQueue: "உங்கள் பணிப்பட்டியலில் தற்போது விண்ணப்பங்கள் இல்லை.",
      ageLabel: (age) => `(வயது ${age})`,
      viewLink: "பார்க்க →",
    },
    applicationsList: {
      heading: "அனைத்து விண்ணப்பங்கள்",
      subheading:
        "தற்போதைய நிலை மற்றும் முழு வரலாற்றைக் காண — அனைத்து பணிப்பாய்வு நிலைகளிலும் உள்ள விண்ணப்பங்கள்.",
      lastUpdated: "கடைசி புதுப்பிப்பு",
      ageLabel: (age) => `(வயது ${age})`,
    },
    applicationDetail: {
      backToQueue: "← பணிப்பட்டியலுக்குத் திரும்பு",
      ageGender: (age, gender) => `வயது ${age} · ${gender}`,
      detailsHeading: "விண்ணப்ப விவரங்கள்",
      address: "முகவரி",
      aadhaar: "ஆதார் எண்",
      bankAccount: "வங்கி கணக்கு",
      monthlyIncome: "மாத வருமானம்",
      spouseDeceasedConfirmed: "கணவர் இறப்பு உறுதி",
      remarried: "மீண்டும் திருமணம்",
      eligibilityHeading: "தகுதி சரிபார்ப்பு பட்டியல்",
      eligibleMessage: (categoryLabel) => `✓ ${categoryLabel} தகுதி நிபந்தனைகள் அனைத்தும் பூர்த்தி செய்யப்பட்டுள்ளன.`,
      closedMessage: (stageLabel) => `இந்த விண்ணப்பம் முடிவு செய்யப்பட்டது (${stageLabel} நிலையில்). மேலும் நடவடிக்கை தேவையில்லை.`,
      notYourQueueMessage: (stageLabel) =>
        `இந்த விண்ணப்பம் தற்போது "${stageLabel}" நிலையில் உள்ளது — இது உங்கள் பணிப்பட்டியலின் பகுதி அல்ல.`,
      historyHeading: "வரலாறு",
      noHistory: "இதுவரை எந்த நடவடிக்கையும் பதிவாகவில்லை.",
      aiAssistedEdited: "AI உதவியுடன் (திருத்தப்பட்டது)",
      aiAssistedUnedited: "AI உதவியுடன் (மாற்றமில்லாமல்)",
      applicationNotFoundError: "விண்ணப்பம் கிடைக்கவில்லை.",
      remarksRequiredError: "குறிப்பு இல்லாமல் செயலைச் செய்ய முடியாது.",
      actionNotAllowedError: "இந்த நிலையில் இந்த செயலை இந்த பயனர் செய்ய அனுமதியில்லை.",
    },
    actionPanel: {
      aiHelpHeading: "AI உதவி",
      aiHelpDisclaimer: "இது ஒரு வரைவு மட்டுமே. நீங்கள் படித்து, திருத்தி, இறுதி முடிவை நீங்களே எடுக்க வேண்டும்.",
      documentCheckButton: "ஆவண முரண்பாடு சரிபார்ப்பு",
      documentCheckPending: "சரிபார்க்கிறது...",
      fieldNotesLabel: "கள குறிப்புகள் (சுருக்கமாக)",
      fieldNotesPlaceholder: "எ.கா: வீட்டுக்குச் சென்றேன், தாத்தா தனியாக வசிக்கிறார்...",
      draftReportButton: "அறிக்கை வரைவு உருவாக்கு",
      draftReportPending: "உருவாக்குகிறது...",
      caseSummaryButton: "வழக்கு சுருக்கம்",
      draftSuffix: "— வரைவு",
      copyToRemarks: "குறிப்பில் நகலெடு →",
      actionHeading: "நடவடிக்கை",
      remarksLabel: "குறிப்பு (கட்டாயம்)",
    },
    gender: { ஆண்: "ஆண்", பெண்: "பெண்" },
    urgency: { urgent: "அவசரம்", attention: "கவனம் தேவை", normal: "இயல்பு" },
    aiSource: { live: "AI உதவி", offline: "AI உதவி — ஆஃப்லைன் பயன்முறை" },
  },
  en: {
    meta: {
      title: "Nalam — Pension Workflow",
      description: "Old-age / widow pension scheme workflow tool",
    },
    common: { appName: "Nalam", appTagline: "Pension Workflow", yes: "Yes", no: "No" },
    nav: { allApplications: "All Applications", logout: "Log out" },
    login: {
      heading: "Nalam",
      subheading: "Pension Workflow — Officer Login",
      usernameLabel: "Username",
      passwordLabel: "Password",
      submitIdle: "Log in",
      submitPending: "Checking...",
      errorMissingFields: "Please fill in both username and password.",
      errorInvalidCredentials: "Incorrect username or password.",
    },
    dashboard: {
      heading: "My Queue",
      subheading: (name) => `${name} — items needing attention are shown first.`,
      avgDecisionTime: "Average decision time",
      returnedRate: "Returned rate",
      totalApplications: "Total applications",
      noData: "—",
      daysSuffix: (n) => `${n.toFixed(1)} days`,
      actionNeededHeading: (count) => `Needs action (${count})`,
      emptyQueue: "There are no applications in your queue right now.",
      ageLabel: (age) => `(age ${age})`,
      viewLink: "View →",
    },
    applicationsList: {
      heading: "All Applications",
      subheading: "See current status and full history — applications at every stage of the workflow.",
      lastUpdated: "Last updated",
      ageLabel: (age) => `(age ${age})`,
    },
    applicationDetail: {
      backToQueue: "← Back to queue",
      ageGender: (age, gender) => `Age ${age} · ${gender}`,
      detailsHeading: "Application Details",
      address: "Address",
      aadhaar: "Aadhaar Number",
      bankAccount: "Bank Account",
      monthlyIncome: "Monthly Income",
      spouseDeceasedConfirmed: "Spouse's Death Confirmed",
      remarried: "Remarried",
      eligibilityHeading: "Eligibility Checklist",
      eligibleMessage: (categoryLabel) => `✓ All ${categoryLabel} eligibility conditions are met.`,
      closedMessage: (stageLabel) => `This application has been decided (at ${stageLabel}). No further action is needed.`,
      notYourQueueMessage: (stageLabel) =>
        `This application is currently at "${stageLabel}" — it is not part of your queue.`,
      historyHeading: "History",
      noHistory: "No action has been recorded yet.",
      aiAssistedEdited: "AI-assisted (edited)",
      aiAssistedUnedited: "AI-assisted (unedited)",
      applicationNotFoundError: "Application not found.",
      remarksRequiredError: "This action cannot be taken without remarks.",
      actionNotAllowedError: "This user is not allowed to take this action in the current state.",
    },
    actionPanel: {
      aiHelpHeading: "AI Assist",
      aiHelpDisclaimer: "This is only a draft. Read it, edit it, and make the final decision yourself.",
      documentCheckButton: "Check document consistency",
      documentCheckPending: "Checking...",
      fieldNotesLabel: "Field notes (brief)",
      fieldNotesPlaceholder: "e.g. Visited the house, grandfather lives alone...",
      draftReportButton: "Generate report draft",
      draftReportPending: "Generating...",
      caseSummaryButton: "Case summary",
      draftSuffix: "— draft",
      copyToRemarks: "Copy to remarks →",
      actionHeading: "Action",
      remarksLabel: "Remarks (required)",
    },
    gender: { ஆண்: "Male", பெண்: "Female" },
    urgency: { urgent: "Urgent", attention: "Needs attention", normal: "Normal" },
    aiSource: { live: "AI Assist", offline: "AI Assist — offline mode" },
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionary[locale];
}

export function translateGender(rawGender: string, locale: Locale): string {
  const known = dictionary[locale].gender as Record<string, string>;
  return known[rawGender] ?? rawGender;
}
