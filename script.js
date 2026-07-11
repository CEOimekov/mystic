const codeForm = document.getElementById("codeForm");
const accessCodeInput = document.getElementById("accessCode");
const codeDigits = document.querySelectorAll(".code-digit");
const codeError = document.getElementById("codeError");
const status = document.getElementById("status");
const helpNameBtn = document.getElementById("helpNameBtn");
const helpNamePanel = document.getElementById("helpNamePanel");
const helpNameInput = document.getElementById("helpNameInput");
const helpNameSave = document.getElementById("helpNameSave");
const helpNameStatus = document.getElementById("helpNameStatus");
const timerEl = document.getElementById("timer");
const breakTimerEl = document.getElementById("breakTimer");
const hideBtn = document.querySelector(".timer-hide");
const questionPickerBtn = document.getElementById("questionPickerBtn");
const questionPickerMenu = document.getElementById("questionPickerMenu");
const questionPickerGrid = document.querySelector(".question-picker__grid");
const questionPickerClose = document.querySelector(".question-picker__close");
const questionPickerLabel = questionPickerBtn?.querySelector(".question-picker__label");
const questionNumberEl = document.querySelector(".question-number");
const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
const directionsBtn = document.getElementById("directionsBtn");
const directionsOverlay = document.getElementById("directionsOverlay");
const directionsModal = directionsOverlay?.querySelector(".directions-modal");
const directionsClose = directionsOverlay?.querySelector(".directions-close");
const desmosCalculatorBtn = document.querySelector(".math-tool--calculator");
const breakTestingLinks = document.querySelectorAll(".break-link[href^='math.html']");
const reviewGrid = document.getElementById("reviewGrid");
const reviewBackBtn = document.getElementById("reviewBackBtn");
const reviewNextBtn = document.getElementById("reviewNextBtn");
const reviewPageBtn = document.querySelector(".question-picker__review-btn");
const reviewChip = document.querySelector(".review-chip");
const userNameEls = document.querySelectorAll(".user-name");
const breakNameEl = document.querySelector(".break-name");
const editableNameEl = document.querySelector(".user-name[data-editable-name]");
const ANSWERS_STORAGE_KEY = "examAnswers";
const REVIEW_MARKS_STORAGE_KEY = "reviewMarks";
const REMAINING_STORAGE_KEY = "examRemainingSeconds";
const MODULE_STORAGE_KEY = "examModule";
const BREAK_END_STORAGE_KEY = "breakEndTime";
const MATH_END_STORAGE_KEY = "mathEndTime";
const MATH_NATIVE_END_STORAGE_KEYS = ["mathNativeEnd_math1", "mathNativeEnd_math2"];
const MATH_STAGE_KEY = "mathStage";
const REVIEW_CONTEXT_KEY = "reviewContext";
const WAIT_TARGET_KEY = "waitTarget";
const USER_NAME_KEY = "userName";
const BLUEBOOK_STUDENT_NAME_KEY = "bluebookStudentName";
const BLUEBOOK_STUDENT_EMAIL_KEY = "bluebookStudentEmail";
const TELEGRAM_ENDPOINT = "https://mystic-wine.vercel.app/api/submit";
const URL_CACHE_BUST = "v=20260711-ronaldo1";
const WAIT_PAGE_URL = withCacheBust("wait.html");
const BREAK_PAGE_URL = withCacheBust("break.html");
const WAIT_DURATION_MS = 3500;
const BREAK_DURATION_SECONDS = 10 * 60;
const COMPACT_OPTION_THRESHOLD = 95;
const isReviewPage = document.body.classList.contains("review-page");
const isWaitPage = document.body.classList.contains("wait-page");
const isMathPage = document.body.classList.contains("math-page");
const isBreakPage = document.body.classList.contains("break-page");
const reviewTotalFromPage = Number(document.body.dataset.reviewTotal);
const REVIEW_QUESTION_TOTAL = Number.isFinite(reviewTotalFromPage) && reviewTotalFromPage > 0
  ? reviewTotalFromPage
  : null;
const reviewContextFromPage = document.body.dataset.reviewContext || null;

const moduleFromPath = window.location.pathname.endsWith("exam2.html")
  ? 2
  : window.location.pathname.endsWith("exam.html")
    ? 1
    : null;

if (moduleFromPath) {
  localStorage.setItem(MODULE_STORAGE_KEY, String(moduleFromPath));
}

const mathStageFromPath = window.location.pathname.endsWith("math2.html")
  ? 2
  : window.location.pathname.endsWith("math.html")
    ? 1
    : null;

if (mathStageFromPath) {
  localStorage.setItem(MATH_STAGE_KEY, String(mathStageFromPath));
}

function withCacheBust(url) {
  if (!url || url.includes(URL_CACHE_BUST)) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${URL_CACHE_BUST}`;
}

function cleanStudentName(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function compactLookupValue(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getStudentLookupKey(value) {
  return cleanStudentName(value).replace(/[._-]+/g, " ").toLowerCase();
}

function getStudentRecord(studentName) {
  const records = window.BLUEBOOK_STUDENT_RECORDS || {};
  const byEmail = records.byEmail || {};
  const byName = records.byName || {};
  const storedEmail = String(localStorage.getItem(BLUEBOOK_STUDENT_EMAIL_KEY) || "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
  const compactEmail = compactLookupValue(storedEmail);
  const compactEmailRecord = Object.keys(byEmail).find((email) => {
    const compactRecordEmail = compactLookupValue(email);
    const compactRecordLocal = compactLookupValue(email.split("@")[0]);
    return compactEmail === compactRecordEmail
      || (compactRecordLocal.length > 4 && compactEmail.startsWith(compactRecordLocal));
  });
  return byEmail[storedEmail]
    || byEmail[compactEmailRecord]
    || byName[getStudentLookupKey(studentName)]
    || null;
}

function getCanonicalStudentName(value) {
  const cleanName = cleanStudentName(value);
  const record = getStudentRecord(cleanName);
  return cleanStudentName(record?.fullName || cleanName);
}

function getStoredStudentName() {
  return getCanonicalStudentName(
    localStorage.getItem(BLUEBOOK_STUDENT_NAME_KEY) || localStorage.getItem(USER_NAME_KEY) || ""
  );
}

function saveStudentName(name) {
  const cleanName = cleanStudentName(name);
  if (!cleanName) return "";
  localStorage.setItem(BLUEBOOK_STUDENT_NAME_KEY, cleanName);
  localStorage.setItem(USER_NAME_KEY, cleanName);
  return cleanName;
}

if (userNameEls.length || breakNameEl) {
  const defaultUserName = editableNameEl?.textContent?.trim()
    || userNameEls[0]?.textContent?.trim()
    || breakNameEl?.textContent?.trim()
    || "";
  const storedName = getStoredStudentName();
  if (storedName) {
    saveStudentName(storedName);
    userNameEls.forEach((el) => {
      el.textContent = storedName;
    });
    if (breakNameEl) {
      breakNameEl.textContent = storedName;
    }
  } else if (defaultUserName) {
    saveStudentName(defaultUserName);
  }
  if (editableNameEl) {
    editableNameEl.setAttribute("contenteditable", "true");
    editableNameEl.setAttribute("spellcheck", "false");
    editableNameEl.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      editableNameEl.blur();
    });
    editableNameEl.addEventListener("blur", () => {
      const next = getCanonicalStudentName(editableNameEl.textContent || "");
      if (!next) {
        if (defaultUserName) {
          const fallbackName = getCanonicalStudentName(defaultUserName);
          userNameEls.forEach((el) => {
            el.textContent = fallbackName;
          });
          if (breakNameEl) {
            breakNameEl.textContent = fallbackName;
          }
          saveStudentName(fallbackName);
        } else {
          localStorage.removeItem(USER_NAME_KEY);
          localStorage.removeItem(BLUEBOOK_STUDENT_NAME_KEY);
        }
        return;
      }
      saveStudentName(next);
      userNameEls.forEach((el) => {
        el.textContent = next;
      });
      if (breakNameEl) {
        breakNameEl.textContent = next;
      }
    });
  }
}

function applyStoredName(name) {
  const studentName = getCanonicalStudentName(name);
  if (!studentName) return;
  saveStudentName(studentName);
  userNameEls.forEach((el) => {
    el.textContent = studentName;
  });
  if (breakNameEl) {
    breakNameEl.textContent = studentName;
  }
}

function getCurrentUserName() {
  const draftName = getCanonicalStudentName(helpNameInput?.value || "");
  if (draftName) return draftName;

  const storedName = getStoredStudentName();
  if (storedName) return storedName;

  return getCanonicalStudentName(editableNameEl?.textContent
    || userNameEls[0]?.textContent
    || breakNameEl?.textContent
    || "");
}

function sendTelegramText(text) {
  const normalized = String(text || "").trim();
  if (!normalized) return Promise.resolve(false);

  return fetch(TELEGRAM_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: normalized }),
    keepalive: true,
  })
    .then((response) => response.ok)
    .catch(() => false);
}

if (helpNameBtn && helpNamePanel && helpNameInput && helpNameSave) {
  const setHelpStatus = (message, isError = false) => {
    if (!helpNameStatus) return;
    helpNameStatus.textContent = message;
    helpNameStatus.classList.toggle("is-error", isError);
  };

  const closeHelpName = () => {
    helpNamePanel.hidden = true;
    helpNamePanel.style.display = "none";
    helpNameBtn.setAttribute("aria-expanded", "false");
  };

  const openHelpName = () => {
    helpNamePanel.hidden = false;
    helpNamePanel.style.display = "block";
    helpNameBtn.setAttribute("aria-expanded", "true");
    helpNameInput.focus();
  };

  const storedName = getStoredStudentName();
  if (storedName) {
    helpNameInput.value = storedName;
  }

  helpNameBtn.addEventListener("click", () => {
    if (helpNamePanel.hidden) {
      openHelpName();
    } else {
      closeHelpName();
    }
  });

  helpNameSave.addEventListener("click", () => {
    const name = getCanonicalStudentName(helpNameInput.value);
    if (!name) {
      setHelpStatus("Enter a name.", true);
      return;
    }
    saveStudentName(name);
    userNameEls.forEach((el) => {
      el.textContent = name;
    });
    if (breakNameEl) {
      breakNameEl.textContent = name;
    }
    setHelpStatus("Saved.");
    closeHelpName();
  });

  helpNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      helpNameSave.click();
    }
    if (event.key === "Escape") {
      closeHelpName();
    }
  });

  document.addEventListener("click", (event) => {
    if (helpNamePanel.hidden) return;
    if (helpNamePanel.contains(event.target) || helpNameBtn.contains(event.target)) return;
    closeHelpName();
  });
}

function getCurrentModule() {
  const stored = Number(localStorage.getItem(MODULE_STORAGE_KEY));
  if (Number.isFinite(stored) && stored > 0) return stored;
  return 1;
}

function getMathStage() {
  const stored = Number(localStorage.getItem(MATH_STAGE_KEY));
  if (Number.isFinite(stored) && stored > 0) return stored;
  return 1;
}

function getStoredMathStage() {
  const raw = localStorage.getItem(MATH_STAGE_KEY);
  if (!raw) return null;
  const value = Number(raw);
  if (Number.isFinite(value) && value > 0) return value;
  return null;
}

function setReviewContext(context) {
  localStorage.setItem(REVIEW_CONTEXT_KEY, context);
}

function getAnswersContext() {
  if (reviewContextFromPage) return reviewContextFromPage;
  if (isReviewPage) {
    const stored = localStorage.getItem(REVIEW_CONTEXT_KEY);
    if (stored) return stored;
  }
  if (isMathPage) return `math${getMathStage()}`;
  const moduleNumber = getCurrentModule();
  return `reading${moduleNumber}`;
}

function getAnswersStorageKey(context = getAnswersContext()) {
  if (!context) return ANSWERS_STORAGE_KEY;
  return `${ANSWERS_STORAGE_KEY}_${context}`;
}

function getReviewMarksStorageKey(context = getAnswersContext()) {
  if (!context) return REVIEW_MARKS_STORAGE_KEY;
  return `${REVIEW_MARKS_STORAGE_KEY}_${context}`;
}

function setWaitTarget(target) {
  if (target) {
    localStorage.setItem(WAIT_TARGET_KEY, target);
  } else {
    localStorage.removeItem(WAIT_TARGET_KEY);
  }
}

function prepareMathModuleOneFromBreak() {
  setWaitTarget(null);
  localStorage.removeItem(MATH_END_STORAGE_KEY);
  MATH_NATIVE_END_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });
  localStorage.setItem(MATH_STAGE_KEY, "1");
}

function getReviewUrl() {
  if (isMathPage) {
    return withCacheBust(getMathStage() === 2 ? "review4.html" : "review3.html");
  }
  return withCacheBust(getCurrentModule() === 2 ? "review2.html" : "review.html");
}

if (isReviewPage && reviewContextFromPage) {
  setReviewContext(reviewContextFromPage);
}

const EXAM_DURATION_SECONDS = 32 * 60;
const MATH_QUESTION_TOTAL = 22;
const DEFAULT_PROMPT =
  "Which choice completes the text with the most logical and precise word or phrase?";
const QUESTION_BANK = [
  {
    "passage": "Artist Marilyn Dingle’s intricate, coiled baskets are ______ sweetgrass and palmetto palm. Following a Gullah technique that originated in West Africa, Dingle skillfully winds a thin palm frond around a bunch of sweetgrass with the help of a “sewing bone” to create the basket’s signature look that no factory can reproduce.",
    "prompt": "Which choice completes the text with the most logical and precise word or phrase?",
    "options": [
      "indicated by",
      "handmade from",
      "represented by",
      "collected with"
    ]
  },
  {
    "passage": "The invention in 1958 of the integrated circuit (or microchip) radically altered the semiconductor industry. In fact, some historians argue that it fundamentally ______ the industry by enabling it to take advantage of mass production methods for the first time.",
    "prompt": "Which choice completes the text with the most logical and precise word or phrase?",
    "options": [
      "overwhelmed",
      "bypassed",
      "obstructed",
      "transformed"
    ]
  },
  {
    "passage": "Botanist Al Kovaleski has pointed out that maple trees already thrive in a wide variety of climates and thus may ______ changes in climate better than some other tree species do. The alterations maples may undergo in response to a changing climate are likely to be relatively small and easily achieved.",
    "prompt": "Which choice completes the text with the most logical and precise word or phrase?",
    "options": [
      "relocate from",
      "refer to",
      "originate from",
      "adapt to"
    ]
  },
  {
    "passage": "The following text is adapted from Nathaniel Hawthorne’s 1837 story “Dr. Heidegger’s Experiment.” The main character, a physician, is experimenting with rehydrating a dried flower. At first [the rose] lay lightly on the surface of the fluid, appearing to imbibe none of its moisture. Soon, however, a singular change began to be visible. The crushed and dried petals stirred and assumed a deepening tinge of crimson, as if the flower were reviving from a deathlike slumber.",
    "prompt": "As used in the text, what does the phrase “a singular” most nearly mean?",
    "options": [
      "A lonely",
      "A disagreeable",
      "An acceptable",
      "An extraordinary"
    ]
  },
  {
    "passage": "Rejecting the premise that the literary magazine Ebony and Topaz (1927) should present a unified vision of Black American identity, editor Charles S. Johnson fostered his contributors’ diverse perspectives by promoting their authorial autonomy. Johnson’s self-effacement diverged from the editorial stances of W.E.B. Du Bois and Alain Locke, whose decisions for their publications were more ______.",
    "prompt": "Which choice completes the text with the most logical and precise word or phrase?",
    "options": [
      "proficient",
      "dogmatic",
      "ambiguous",
      "unpretentious"
    ]
  },
  {
    "passage": "Drivers who strongly believe that the toll they must pay to use the Lewis and Clark Bridge, which spans the Ohio River to connect Indiana and Kentucky, is currently too high are unlikely to be ______ a proposal to increase the toll. Advocates for a higher toll are likely to have more success if they instead direct their arguments toward a more persuadable segment of the population.",
    "prompt": "Which choice completes the text with the most logical and precise word or phrase?",
    "options": [
      "receptive to",
      "apprised of",
      "incensed by",
      "cited in"
    ]
  },
  {
    "passage": "According to a team of neuroeconomists from the University of Zurich, ease of decision making may be linked to communication between two brain regions, the prefrontal cortex and the parietal cortex. Individuals tend to be more decisive if the information flow between the regions is intensified, whereas they make choices more slowly when information flow is ______.",
    "prompt": "Which choice completes the text with the most logical and precise word or phrase?",
    "options": [
      "reduced",
      "evaluated",
      "determined",
      "acquired"
    ]
  },
  {
    "passage": "Artist Marilyn Dingle’s intricate, coiled baskets are ______ sweetgrass and palmetto palm. Following a Gullah technique that originated in West Africa, Dingle skillfully winds a thin palm frond around a bunch of sweetgrass with the help of a “sewing bone” to create the basket’s signature look that no factory can reproduce.",
    "prompt": "Which choice completes the text with the most logical and precise word or phrase?",
    "options": [
      "indicated by",
      "handmade from",
      "represented by",
      "collected with"
    ]
  },
  {
    "passage": "The invention in 1958 of the integrated circuit (or microchip) radically altered the semiconductor industry. In fact, some historians argue that it fundamentally ______ the industry by enabling it to take advantage of mass production methods for the first time.",
    "prompt": "Which choice completes the text with the most logical and precise word or phrase?",
    "options": [
      "overwhelmed",
      "bypassed",
      "obstructed",
      "transformed"
    ]
  },
  {
    "passage": "Botanist Al Kovaleski has pointed out that maple trees already thrive in a wide variety of climates and thus may ______ changes in climate better than some other tree species do. The alterations maples may undergo in response to a changing climate are likely to be relatively small and easily achieved.",
    "prompt": "Which choice completes the text with the most logical and precise word or phrase?",
    "options": [
      "relocate from",
      "refer to",
      "originate from",
      "adapt to"
    ]
  },
  {
    "passage": "The following text is adapted from Nathaniel Hawthorne’s 1837 story “Dr. Heidegger’s Experiment.” The main character, a physician, is experimenting with rehydrating a dried flower. At first [the rose] lay lightly on the surface of the fluid, appearing to imbibe none of its moisture. Soon, however, a singular change began to be visible. The crushed and dried petals stirred and assumed a deepening tinge of crimson, as if the flower were reviving from a deathlike slumber.",
    "prompt": "As used in the text, what does the phrase “a singular” most nearly mean?",
    "options": [
      "A lonely",
      "A disagreeable",
      "An acceptable",
      "An extraordinary"
    ]
  },
  {
    "passage": "Rejecting the premise that the literary magazine Ebony and Topaz (1927) should present a unified vision of Black American identity, editor Charles S. Johnson fostered his contributors’ diverse perspectives by promoting their authorial autonomy. Johnson’s self-effacement diverged from the editorial stances of W.E.B. Du Bois and Alain Locke, whose decisions for their publications were more ______.",
    "prompt": "Which choice completes the text with the most logical and precise word or phrase?",
    "options": [
      "proficient",
      "dogmatic",
      "ambiguous",
      "unpretentious"
    ]
  },
  {
    "passage": "“How lifelike are they?” Many computer animators prioritize this question as they strive to create ever more realistic environments and lighting. Generally, while characters in computer-animated films appear highly exaggerated, environments and lighting are carefully engineered to mimic reality. But some animators, such as Pixar’s Sanjay Patel, are focused on a different question. Rather than asking first whether the environments and lighting they’re creating are convincingly lifelike, Patel and others are asking whether these elements reflect their films’ unique stories.",
    "prompt": "Which choice best describes the function of the underlined question in the text as a whole?",
    "options": [
      "It reflects a primary goal that many computer animators have for certain components of the animations they produce.",
      "It represents a concern of computer animators who are more interested in creating unique backgrounds and lighting effects than realistic ones.",
      "It conveys the uncertainty among many computer animators about how to create realistic animations using current technology.",
      "It illustrates a reaction that audiences typically have to the appearance of characters created by computer animators."
    ]
  },
  {
    "passage": "The field of study called affective neuroscience seeks instinctive, physiological causes for feelings such as pleasure or displeasure. Because these sensations are linked to a chemical component (for example, the release of the neurotransmitter dopamine in the brain when one receives or expects a reward), they can be said to have a partly physiological basis. These processes have been described in mammals, but Jingnan Huang and his colleagues have recently observed that some behaviors of honeybees (such as foraging) are also motivated by a dopamine-based signaling process.",
    "prompt": "What choice best describes the main purpose of the text?",
    "options": [
      "It describes an experimental method of measuring the strength of physiological responses in humans.",
      "It illustrates processes by which certain insects can express how they are feeling.",
      "It summarizes a finding suggesting that some mechanisms in the brains of certain insects resemble mechanisms in mammalian brains.",
      "It presents research showing that certain insects and mammals behave similarly when there is a possibility of a reward for their actions."
    ]
  },
  {
    "passage": "During the World War II era, some Mexican American women adopted a striking new look called pachuca style. They wore altered men’s jackets or zoot suits (wide-legged, long-coated suits) and dramatic makeup, and they combed their hair into high, rounded shapes. Some people criticized pachuca style, saying it was dangerous and women should dress traditionally. But historians see things differently. They see pachuca style as a form of rebellion against the era’s rigid social expectations for women. They say that it showed a desire for self-expression and freedom on the part of women who adopted the style.",
    "prompt": "According to the text, how do historians view pachuca style?",
    "options": [
      "They think that pachuca style was such a popular trend that it continues to influence fashion in the United States to the present day.",
      "They think that pachuca style was a way for some Mexican American women to express themselves and resist strict social expectations.",
      "They think that pachuca style was celebrated because it enabled some Mexican American women to show their support for the United States during World War II.",
      "They think that pachuca style was similar to other fashion trends that different groups of women adopted in the same period."
    ]
  },
  {
    "passage": "Utah is home to Pando, a colony of about 47,000 quaking aspen trees that all share a single root system. Pando is one of the largest single organisms by mass on Earth, but ecologists are worried that its growth is declining in part because of grazing by animals. The ecologists say that strong fences could prevent deer from eating young trees and help Pando start thriving again.",
    "prompt": "According to the text, why are ecologists worried about Pando?",
    "options": [
      "It isn’t growing at the same rate it used to.",
      "It isn’t producing young trees anymore.",
      "It can’t grow into new areas because it is blocked by fences.",
      "Its root system can’t support many more new trees."
    ]
  },
  {
    "passage": "Although many transposons, DNA sequences that move within an organism’s genome through shuffling or duplication, have become corrupted and inactive over time, those from the long interspersed nuclear elements (LINE) family appear to remain active in the genomes of some species. In humans, they are functionally important within the hippocampus, a brain structure that supports complex cognitive processes. When the results of molecular analysis of two species of octopus—an animal known for its intelligence—were announced in 2022, the confirmation of a LINE transposon in Octopus vulgaris and Octopus bimaculoides genomes prompted researchers to hypothesize that that transposon family is tied to a species’ capacity for advanced cognition.",
    "prompt": "Which finding, if true, would most directly support the researchers’ hypothesis?",
    "options": [
      "The LINE transposon in O. vulgaris and O. bimaculoides genomes is active in an octopus brain structure that functions similarly to the human hippocampus.",
      "The human genome contains multiple transposons from the LINE family that are all primarily active in the hippocampus.",
      "A consistent number of copies of LINE transposons is present across the genomes of most octopus species, with few known corruptions.",
      "O. vulgaris and O. bimaculoides have smaller brains than humans do relative to body size, but their genomes contain sequences from a wider variety of transposon families."
    ]
  },
  {
    "passage": "To understand how temperature change affects microorganism-mediated cycling of soil nutrients in alpine ecosystems, Eva Kaštovská et al. collected plant-soil cores in the Tatra Mountains at elevations around 2,100 meters and transplanted them to elevations of 1,700–1,800 meters, where the mean air temperature was warmer by 2°C. Microorganism-mediated nutrient cycling was accelerated in the transplanted cores; crucially, microorganism community composition was unchanged, allowing Kaštovská et al. to attribute the acceleration to temperature-induced increases in microorganism activity.",
    "prompt": "It can most reasonably be inferred from the text that the finding about the microorganism community composition was important for which reason?",
    "options": [
      "It provided preliminary evidence that microorganism-mediated nutrient cycling was accelerated in the transplanted cores.",
      "It suggested that temperature-induced changes in microorganism activity may be occurring at increasingly high elevations.",
      "It ruled out a potential alternative explanation for the acceleration in microorganism-mediated nutrient cycling.",
      "It clarified that microorganism activity levels in the plant-soil cores varied depending on which microorganisms comprised the community."
    ]
  },
  {
    "passage": "Generations of mystery and horror ______ have been influenced by the dark, gothic stories of celebrated American author Edgar Allan Poe (1809–1849).",
    "prompt": "Which choice completes the text so that it conforms to the conventions of Standard English?",
    "options": [
      "writers",
      "writers,",
      "writers—",
      "writers;"
    ]
  },
  {
    "passage": "The radiation that ______ during the decay of radioactive atomic nuclei is known as gamma radiation.",
    "prompt": "Which choice completes the text so that it conforms to the conventions of Standard English?",
    "options": [
      "occurs",
      "have occurred",
      "occur",
      "are occurring"
    ]
  },
  {
    "passage": "The Mission 66 initiative, which was approved by Congress in 1956, represented a major investment in the infrastructure of overburdened national ______ it prioritized physical improvements to the parks’ roads, utilities, employee housing, and visitor facilities while also establishing educational programming for the public.",
    "prompt": "Which choice completes the text so that it conforms to the conventions of Standard English?",
    "options": [
      "parks and",
      "parks",
      "parks;",
      "parks,"
    ]
  },
  {
    "passage": "A recent study tracked the number of bee species present in twenty-seven New York apple orchards over a ten-year period. ______ found that when wild growth near an orchard was cleared, the number of different bee species visiting the orchard decreased.",
    "prompt": "Which choice completes the text so that it conforms to the conventions of Standard English?",
    "options": [
      "Entomologist Heather Grab:",
      "Entomologist, Heather Grab,",
      "Entomologist Heather Grab",
      "Entomologist Heather Grab,"
    ]
  },
  {
    "passage": "The prime meridian, the global indicator of zero degrees longitude established in 1884, was originally determined using astronomically derived coordinates. ______ as decades passed, new calculations would reveal increasingly precise coordinates, yet the prime meridian remained unchanged; it wasn’t until the 1980s that, spurred by improved geodetic data, the prime meridian was officially moved—roughly one hundred meters east.",
    "prompt": "Which choice completes the text with the most logical transition?",
    "options": [
      "Specifically,",
      "To that end,",
      "Again and again,",
      "Granted,"
    ]
  },
  {
    "passage": "Notes\n- Bhosale’s team studied bird nests, which are uniquely flexible yet cohesive engineered structures.\n- The team used laboratory models that simulated the arrangement of flexible sticks.\n- The researchers analyzed the points where sticks touched one another.\n- After analyzing the points where sticks touched, the researchers found that the structures became stiffer when pressure was applied.",
    "prompt": "The student wants to present the primary aim of the research study. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    "options": [
      "Bhosale’s team wanted to better understand the mechanics behind bird nests’ uniquely flexible yet cohesive structural properties.",
      "The researchers used laboratory models that simulated the arrangement of flexible sticks and analyzed the points where sticks touched one another.",
      "After analyzing the points where sticks touched, the researchers found that the structures became stiffer when pressure was applied.",
      "As analyzed by Bhosale’s team, bird nests are uniquely flexible yet cohesive engineered structures."
    ]
  },
  {
    "passage": "Researchers have documented that some migratory birds navigate using stars. ______, other species rely on Earth’s magnetic field to orient themselves during long flights.",
    "prompt": "Which choice completes the text with the most logical transition?",
    "options": [
      "Lastly,",
      "Then,",
      "Similarly,",
      "For example,"
    ]
  },
  {
    "passage": "Samuel Coleridge-Taylor was a prominent classical music composer from England who toured the US three times in the early 1900s. The child of a West African father and an English mother, Coleridge-Taylor emphasized his mixed-race ancestry. For example, he referred to himself as Anglo-African. ______ he incorporated the sounds of traditional African music into his classical music compositions.",
    "prompt": "Which choice completes the text with the most logical transition?",
    "options": [
      "In addition,",
      "Actually,",
      "However,",
      "Regardless,"
    ]
  },
  {
    "passage": "In her poetry collection Thomas and Beulah, Rita Dove interweaves the titular characters’ personal stories with broader historical narratives. She places Thomas’s journey from the American South to the Midwest in the early 1900s within the larger context of the Great Migration. ______ Dove sets events from Beulah’s personal life against the backdrop of the US Civil Rights Movement.",
    "prompt": "Which choice completes the text with the most logical transition?",
    "options": [
      "Specifically,",
      "Thus,",
      "Regardless,",
      "Similarly,"
    ]
  }
];

const MATH_QUESTION_BANK = [
  {
    "passage": "",
    "prompt": "25(x - n) = 25y + 25n. One of the equations in a system of two linear equations is given, where n is a positive constant. The system has no solution. Which equation could be the second equation in this system?",
    "options": ["25(x - n) = 25y + 25n", "y = x - 2n + 3", "y = -x + 2n", "y = x - 2n"]
  },
  {
    "passage": "",
    "prompt": "Solve for x: 4x + 7 = 3x + 19.",
    "options": ["12", "-12", "26", "4"]
  },
  {
    "passage": "",
    "prompt": "If 3a - 2b = 11 and a + b = 7, what is the value of a?",
    "options": ["5", "3", "7", "9"]
  },
  {
    "passage": "",
    "prompt": "Solve the inequality: 5 - 2x \u2264 1.",
    "options": ["x \u2265 2", "x \u2264 2", "x \u2265 -2", "x \u2264 -2"]
  },
  {
    "passage": "",
    "prompt": "An item costs $50. After a 20% increase and then a 20% decrease, what is the final price?",
    "options": ["$48", "$50", "$52", "$40"]
  },
  {
    "passage": "",
    "prompt": "One solution of x^2 - 9x + 20 = 0 is 4. What is the other solution?",
    "options": ["5", "-5", "10", "20"]
  },
  {
    "passage": "",
    "prompt": "If f(x) = 2x^2 - 3x + 1, find f(-2).",
    "options": ["15", "5", "-15", "9"]
  },
  {
    "passage": "",
    "prompt": "What is the slope of the line through (-3, 4) and (1, -2)?",
    "options": ["-3/2", "3/2", "-2/3", "2/3"]
  },
  {
    "passage": "",
    "prompt": "A line has slope 4 and passes through (2, 5). Which equation represents the line?",
    "options": ["y = 4x - 3", "y = 4x + 3", "y = -4x + 3", "y = -4x - 3"]
  },
  {
    "passage": "",
    "prompt": "Simplify: (3^2)(3^5).",
    "options": ["2187", "729", "6561", "243"]
  },
  {
    "passage": "",
    "prompt": "If |2x - 5| = 9, what is the sum of the solutions for x?",
    "options": ["5", "-5", "7", "-2"]
  },
  {
    "passage": "",
    "prompt": "If k is positive and 2x + k = 0, what is x in terms of k?",
    "options": ["-k/2", "k/2", "2k", "-2k"]
  },
  {
    "passage": "",
    "prompt": "A circle has circumference 12\u03c0. What is the radius of the circle?",
    "options": ["6", "12", "3", "24"]
  },
  {
    "passage": "",
    "prompt": "A rectangle has perimeter 50 and length 15. What is its area?",
    "options": ["150", "250", "300", "100"]
  },
  {
    "passage": "",
    "prompt": "A right triangle has legs 9 and 12. What is the area of the triangle?",
    "options": ["54", "108", "45", "72"]
  },
  {
    "passage": "",
    "prompt": "The ratio of boys to girls in a class is 3:5. If there are 32 students, how many are boys?",
    "options": ["12", "20", "15", "8"]
  },
  {
    "passage": "",
    "prompt": "The average of 6 numbers is 14. If five of the numbers sum to 70, what is the sixth number?",
    "options": ["14", "12", "10", "16"]
  },
  {
    "passage": "",
    "prompt": "For the function y = ax + b, when x increases by 4, y increases by 12. What is a?",
    "options": ["3", "4", "12", "16"]
  },
  {
    "passage": "",
    "prompt": "If 2/x = 0.5, what is the value of x?",
    "options": ["4", "2", "1", "8"]
  },
  {
    "passage": "",
    "prompt": "If 2^x = 1/8, what is the value of x?",
    "options": ["-3", "3", "-1/3", "1/3"]
  },
  {
    "passage": "",
    "prompt": "A car travels 180 miles in 3 hours at a constant speed. What is its speed in miles per hour?",
    "options": ["60", "90", "45", "30"]
  },
  {
    "passage": "",
    "prompt": "A figure has an area of 6,192 square inches. What is the area, in square feet, of this figure? (1 foot = 12 inches)",
    "options": ["38", "43", "48", "51"]
  }
];

const IMPORTED_QUESTION_MODULES = window.BLUEBOOK_QUESTION_BANKS || {};
const LEGACY_QUESTION_BANKS = {
  reading1: QUESTION_BANK,
  reading2: QUESTION_BANK,
  math1: MATH_QUESTION_BANK,
  math2: MATH_QUESTION_BANK,
};

function getQuestionBankForContext(context = getAnswersContext()) {
  const importedModule = IMPORTED_QUESTION_MODULES[context];
  if (importedModule?.questions?.length) {
    return importedModule.questions;
  }
  return LEGACY_QUESTION_BANKS[context] || QUESTION_BANK;
}

function getQuestionTotalForContext(context = getAnswersContext()) {
  const bank = getQuestionBankForContext(context);
  if (bank.length) return bank.length;
  return context?.startsWith("math") ? MATH_QUESTION_TOTAL : QUESTION_BANK.length;
}

const QUESTION_TOTAL = getQuestionTotalForContext();
const FALLBACK_QUESTION = {
  passage: "Question text will be added here later.",
  prompt: DEFAULT_PROMPT,
  options: ["Option A", "Option B", "Option C", "Option D"],
};
const passageEl = document.querySelector(".passage");
const questionTextEl = document.querySelector(".question-text");
const optionListEl = document.querySelector(".option-list");
const optionTextEls = document.querySelectorAll(".option-text");
const abcBtn = document.querySelector(".abc-btn");
let sprPanelEl = null;

function getStoredAnswers() {
  try {
    const raw = localStorage.getItem(getAnswersStorageKey());
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch (error) {
    return {};
  }
  return {};
}

function getStoredReviewMarks(context = getAnswersContext()) {
  try {
    const raw = localStorage.getItem(getReviewMarksStorageKey(context));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch (error) {
    return {};
  }
  return {};
}

function setStoredAnswer(questionNumber, choice) {
  if (!Number.isFinite(questionNumber)) return;
  const answers = getStoredAnswers();
  answers[String(questionNumber)] = choice;
  localStorage.setItem(getAnswersStorageKey(), JSON.stringify(answers));
  updateQuestionPickerState();
  updateReviewGrid();
}

function clearStoredAnswer(questionNumber) {
  if (!Number.isFinite(questionNumber)) return;
  const answers = getStoredAnswers();
  delete answers[String(questionNumber)];
  localStorage.setItem(getAnswersStorageKey(), JSON.stringify(answers));
  updateQuestionPickerState();
  updateReviewGrid();
}

function setStoredReviewMark(questionNumber, marked) {
  if (!Number.isFinite(questionNumber)) return;
  const marks = getStoredReviewMarks();
  if (marked) {
    marks[String(questionNumber)] = true;
  } else {
    delete marks[String(questionNumber)];
  }
  localStorage.setItem(getReviewMarksStorageKey(), JSON.stringify(marks));
  updateReviewChip(questionNumber);
  updateQuestionPickerState();
  updateReviewGrid();
}

function getQuestionUrlForContext(context, questionNumber) {
  const safeQuestion = Math.max(1, Number(questionNumber) || 1);
  if (context === "math1") return withCacheBust(`math.html?question=${safeQuestion}`);
  if (context === "math2") return withCacheBust(`math2.html?question=${safeQuestion}`);
  if (context === "reading2") return withCacheBust(`exam2.html?question=${safeQuestion}`);
  return withCacheBust(`exam.html?question=${safeQuestion}`);
}

function resetExamProgress() {
  ["reading1", "reading2", "math1", "math2"].forEach((context) => {
    localStorage.removeItem(getAnswersStorageKey(context));
    localStorage.removeItem(getReviewMarksStorageKey(context));
  });
  localStorage.removeItem(ANSWERS_STORAGE_KEY);
  localStorage.removeItem(REVIEW_MARKS_STORAGE_KEY);
  localStorage.removeItem(REMAINING_STORAGE_KEY);
  localStorage.removeItem("examEndTime");
  localStorage.removeItem(BREAK_END_STORAGE_KEY);
  localStorage.removeItem(MATH_END_STORAGE_KEY);
  MATH_NATIVE_END_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });
  localStorage.removeItem(MATH_STAGE_KEY);
  localStorage.removeItem(REVIEW_CONTEXT_KEY);
  localStorage.removeItem(WAIT_TARGET_KEY);
  localStorage.setItem(MODULE_STORAGE_KEY, "1");
}

function getCurrentQuestionNumber() {
  if (questionPickerBtn?.dataset.currentQuestion) {
    const value = Number(questionPickerBtn.dataset.currentQuestion);
    if (Number.isFinite(value) && value > 0) return value;
  }
  if (questionNumberEl) {
    const value = Number(questionNumberEl.textContent);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return null;
}

function updateReviewGrid() {
  if (!reviewGrid) return;
  const context = getAnswersContext();
  const answers = getStoredAnswers();
  const marks = getStoredReviewMarks(context);
  const items = reviewGrid.querySelectorAll(".review-grid__item");
  items.forEach((item) => {
    const key = item.dataset.question || item.textContent?.trim();
    const answered = key && Object.prototype.hasOwnProperty.call(answers, key);
    const marked = key && Object.prototype.hasOwnProperty.call(marks, key);
    item.classList.toggle("is-answered", answered);
    item.classList.toggle("is-review", marked);
  });
}

const getCodeFromDigits = () =>
  Array.from(codeDigits)
    .map((input) => input.value)
    .join("");

const syncHiddenCode = () => {
  if (!accessCodeInput) return;
  if (codeDigits.length) {
    accessCodeInput.value = getCodeFromDigits();
  }
};

if (codeDigits.length) {
  codeDigits.forEach((input, index) => {
    input.addEventListener("input", () => {
      const digitsOnly = input.value.replace(/\D/g, "");
      input.value = digitsOnly.slice(-1);
      if (input.value && index < codeDigits.length - 1) {
        codeDigits[index + 1].focus();
      }
      syncHiddenCode();
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Backspace" && !input.value && index > 0) {
        codeDigits[index - 1].focus();
      }
      if (event.key === "ArrowLeft" && index > 0) {
        codeDigits[index - 1].focus();
      }
      if (event.key === "ArrowRight" && index < codeDigits.length - 1) {
        codeDigits[index + 1].focus();
      }
    });

    input.addEventListener("paste", (event) => {
      const paste = event.clipboardData?.getData("text") ?? "";
      const digits = paste.replace(/\D/g, "").slice(0, codeDigits.length);
      if (!digits) return;
      event.preventDefault();
      digits.split("").forEach((char, offset) => {
        if (codeDigits[offset]) codeDigits[offset].value = char;
      });
      const lastIndex = Math.min(digits.length, codeDigits.length) - 1;
      if (codeDigits[lastIndex]) codeDigits[lastIndex].focus();
      syncHiddenCode();
    });
  });
}

// ---- форма ввода кода ----
if (codeForm && accessCodeInput && codeError && status) {
  codeForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (codeDigits.length) {
      syncHiddenCode();
    }
    const code = accessCodeInput.value.trim();

    if (!/^[0-9]{6}$/.test(code)) {
      codeError.hidden = false;
      status.textContent = "Enter all 6 digits to continue.";
      return;
    }

    const endTime = Date.now() + EXAM_DURATION_SECONDS * 1000;
    const userName = getCurrentUserName();
    if (userName) {
      saveStudentName(userName);
      applyStoredName(userName);
    }

    resetExamProgress();
    localStorage.setItem("examEndTime", String(endTime));
    localStorage.setItem(REMAINING_STORAGE_KEY, String(EXAM_DURATION_SECONDS));

    codeError.hidden = true;
    status.textContent = `Code accepted: ${code}. Starting the exam...`;
    accessCodeInput.value = "";
    if (codeDigits.length) {
      codeDigits.forEach((input) => {
        input.value = "";
      });
    }
    accessCodeInput.blur();
    if (code) {
      const telegramMessage = userName
        ? `Имя пользователя: ${userName}\nКод: ${code}`
        : `Код: ${code}`;
      await sendTelegramText(telegramMessage);
    }
    setTimeout(() => {
      window.location.href = withCacheBust("exam.html");
    }, 200);
  });
}

// ---- таймер ----
if (timerEl) {
  const timerKey = isMathPage ? MATH_END_STORAGE_KEY : "examEndTime";
  const mathStage = isMathPage ? getMathStage() : null;
  const onExpire = isMathPage
    ? () => setWaitTarget(mathStage === 1 ? "math2" : "end")
    : null;
  startExamTimer(timerEl, {
    freeze: false,
    storageKey: timerKey,
    onExpire,
  });
}

if (breakTimerEl) {
  startBreakTimer(breakTimerEl);
}

if (breakTestingLinks.length) {
  breakTestingLinks.forEach((link) => {
    link.addEventListener("click", () => {
      prepareMathModuleOneFromBreak();
    });
  });
}

function getStoredRemainingSeconds() {
  const raw = localStorage.getItem(REMAINING_STORAGE_KEY);
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return value;
}

function storeRemainingSecondsFromEndTime() {
  const savedEndRaw = localStorage.getItem("examEndTime");
  if (!savedEndRaw) return;
  const savedEnd = Number(savedEndRaw);
  if (!Number.isFinite(savedEnd)) return;
  const remainingSeconds = Math.max(0, Math.floor((savedEnd - Date.now()) / 1000));
  localStorage.setItem(REMAINING_STORAGE_KEY, String(remainingSeconds));
}

function scheduleWaitRedirect(endTime) {
  const remainingMs = endTime - Date.now();
  if (!Number.isFinite(remainingMs)) return;
  if (remainingMs <= 0) {
    window.location.href = WAIT_PAGE_URL;
    return;
  }
  setTimeout(() => {
    window.location.href = WAIT_PAGE_URL;
  }, remainingMs);
}

function startExamTimer(
  el,
  { freeze = false, storageKey = "examEndTime", onExpire = null } = {}
) {
  const savedEndRaw = localStorage.getItem(storageKey);
  const savedEnd = savedEndRaw ? Number(savedEndRaw) : null;
  const hasSavedEnd = Number.isFinite(savedEnd);
  const isExpired = hasSavedEnd && savedEnd <= Date.now();
  const allowReset = storageKey === MATH_END_STORAGE_KEY && getMathStage() === 1;
  const shouldReset = (!hasSavedEnd || (isExpired && allowReset)) && !freeze;
  const fallbackEnd = Date.now() + EXAM_DURATION_SECONDS * 1000;
  const endTime = shouldReset ? fallbackEnd : (hasSavedEnd ? savedEnd : fallbackEnd);

  if (shouldReset) {
    localStorage.setItem(storageKey, String(endTime));
  }

  if (freeze) {
    const storedSeconds = getStoredRemainingSeconds();
    const remainingSeconds = storedSeconds ?? Math.max(0, Math.floor((endTime - Date.now()) / 1000));
    el.textContent = formatTime(Math.max(0, remainingSeconds));
    el.classList.toggle("timer--warning", remainingSeconds <= 5 * 60);
    if (hasSavedEnd) {
      scheduleWaitRedirect(endTime);
    }
    return;
  }

  const tick = () => {
    const remainingMs = endTime - Date.now();
    if (remainingMs <= 0) {
      el.textContent = "00:00";
      el.classList.add("timer--warning");
      localStorage.setItem(REMAINING_STORAGE_KEY, "0");
      clearInterval(intervalId);
      if (typeof onExpire === "function") {
        onExpire();
      }
      window.location.href = WAIT_PAGE_URL;
      return;
    }
    const remainingSeconds = Math.floor(remainingMs / 1000);
    localStorage.setItem(REMAINING_STORAGE_KEY, String(remainingSeconds));
    el.textContent = formatTime(remainingSeconds);
    el.classList.toggle("timer--warning", remainingSeconds <= 5 * 60);
  };

  const intervalId = setInterval(tick, 1000);
  tick();
}

function startBreakTimer(el) {
  const savedEnd = Number(localStorage.getItem(BREAK_END_STORAGE_KEY));
  const endTime = Number.isFinite(savedEnd) && savedEnd > Date.now()
    ? savedEnd
    : Date.now() + BREAK_DURATION_SECONDS * 1000;

  if (!Number.isFinite(savedEnd) || savedEnd <= Date.now()) {
    localStorage.setItem(BREAK_END_STORAGE_KEY, String(endTime));
  }

  const tick = () => {
    const remainingMs = endTime - Date.now();
    if (remainingMs <= 0) {
      el.textContent = "00:00";
      clearInterval(intervalId);
      localStorage.removeItem(BREAK_END_STORAGE_KEY);
      prepareMathModuleOneFromBreak();
      window.location.href = withCacheBust("math.html");
      return;
    }
    const remainingSeconds = Math.floor(remainingMs / 1000);
    el.textContent = formatTime(remainingSeconds);
  };

  const intervalId = setInterval(tick, 1000);
  tick();
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

if (hideBtn && timerEl) {
  hideBtn.addEventListener("click", () => {
    const hidden = timerEl.hasAttribute("hidden");
    if (hidden) {
      timerEl.removeAttribute("hidden");
      hideBtn.textContent = "Hide";
    } else {
      timerEl.setAttribute("hidden", "true");
      hideBtn.textContent = "Show";
    }
  });
}

// ---- окно Directions ----
if (directionsBtn && directionsOverlay) {
  let isDirectionsOpen = false;

  const setDirectionsOpen = (open) => {
    isDirectionsOpen = open;
    directionsOverlay.hidden = !open;
    directionsBtn.setAttribute("aria-expanded", String(open));
    const caret = directionsBtn.querySelector(".caret");
    if (caret) caret.classList.toggle("open", open);
    document.body.classList.toggle("modal-open", open);
    if (open) {
      directionsModal?.focus();
    } else {
      directionsBtn.focus();
    }
  };

  directionsBtn.addEventListener("click", () => {
    setDirectionsOpen(!isDirectionsOpen);
  });

  if (directionsClose) {
    directionsClose.addEventListener("click", () => {
      setDirectionsOpen(false);
    });
  }

  directionsOverlay.addEventListener("click", (event) => {
    if (event.target === directionsOverlay) {
      setDirectionsOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isDirectionsOpen) {
      setDirectionsOpen(false);
    }
  });

  setDirectionsOpen(true);
}

if (desmosCalculatorBtn) {
  let calcModal = null;
  let desmosCalc = null;
  let lastFocusedBeforeDesmos = null;

  const closeDesmosCalculator = () => {
    if (!calcModal) return;
    calcModal.style.display = "none";
    if (lastFocusedBeforeDesmos && typeof lastFocusedBeforeDesmos.focus === "function") {
      lastFocusedBeforeDesmos.focus();
    }
  };

  const createCalculatorModal = () => {
    const modal = document.createElement("div");
    modal.id = "calc-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-label", "Desmos calculator");
    modal.setAttribute("aria-modal", "false");
    modal.tabIndex = -1;
    modal.innerHTML = `
      <div id="calc-header">
        <span class="calc-header__title">Calculator</span>
        <button class="calc-header__close" type="button" aria-label="Close calculator">Close</button>
      </div>
      <div id="calculator-container"></div>
    `;
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector(".calc-header__close");
    const header = modal.querySelector("#calc-header");
    closeBtn?.addEventListener("click", closeDesmosCalculator);

    if (header) {
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let startLeft = 0;
      let startTop = 0;

      const moveModal = (clientX, clientY) => {
        const nextLeft = startLeft + clientX - startX;
        const nextTop = startTop + clientY - startY;
        const maxLeft = Math.max(0, window.innerWidth - modal.offsetWidth);
        const maxTop = Math.max(0, window.innerHeight - modal.offsetHeight);
        modal.style.left = `${Math.min(maxLeft, Math.max(0, nextLeft))}px`;
        modal.style.top = `${Math.min(maxTop, Math.max(0, nextTop))}px`;
        modal.style.right = "auto";
      };

      header.addEventListener("pointerdown", (event) => {
        if (event.target === closeBtn) return;
        isDragging = true;
        header.classList.add("is-dragging");
        header.setPointerCapture(event.pointerId);
        const rect = modal.getBoundingClientRect();
        startX = event.clientX;
        startY = event.clientY;
        startLeft = rect.left;
        startTop = rect.top;
      });

      header.addEventListener("pointermove", (event) => {
        if (!isDragging) return;
        moveModal(event.clientX, event.clientY);
      });

      const stopDragging = (event) => {
        if (!isDragging) return;
        isDragging = false;
        header.classList.remove("is-dragging");
        header.releasePointerCapture(event.pointerId);
      };

      header.addEventListener("pointerup", stopDragging);
      header.addEventListener("pointercancel", stopDragging);
    }

    return modal;
  };

  const openDesmosCalculator = () => {
    lastFocusedBeforeDesmos = document.activeElement;
    calcModal = calcModal || createCalculatorModal();
    calcModal.style.display = "flex";

    if (!desmosCalc) {
      const calculatorContainer = calcModal.querySelector("#calculator-container");
      if (calculatorContainer && window.Desmos?.GraphingCalculator) {
        desmosCalc = window.Desmos.GraphingCalculator(calculatorContainer, {
          keypad: true,
          expressions: true,
          settingsMenu: true,
        });
      } else if (calculatorContainer) {
        calculatorContainer.textContent = "Calculator could not load. Check access to desmos.com.";
        calculatorContainer.classList.add("calculator-container--error");
      }
    } else if (typeof desmosCalc.resize === "function") {
      desmosCalc.resize();
    }

    calcModal.focus();
  };

  const toggleDesmosCalculator = () => {
    if (calcModal && calcModal.style.display === "flex") {
      closeDesmosCalculator();
      return;
    }
    openDesmosCalculator();
  };

  window.toggleCalculator = toggleDesmosCalculator;
  desmosCalculatorBtn.addEventListener("click", toggleDesmosCalculator);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && calcModal && calcModal.style.display === "flex") {
      closeDesmosCalculator();
    }
  });
}

// ---- ползунок на центральной линии ----
const divider = document.querySelector(".divider");
const dividerHandle = divider?.querySelector(".divider-handle");

if (divider && dividerHandle) {
  let isDragging = false;
  let activePointerId = null;

  const updateHandlePosition = (clientY) => {
    const dividerRect = divider.getBoundingClientRect();
    const handleRect = dividerHandle.getBoundingClientRect();
    const halfHandle = handleRect.height / 2;
    const minY = dividerRect.top + halfHandle;
    const maxY = dividerRect.bottom - halfHandle;
    const clampedY = Math.min(maxY, Math.max(minY, clientY));
    const top = clampedY - dividerRect.top;
    dividerHandle.style.top = `${top}px`;
  };

  dividerHandle.addEventListener("pointerdown", (event) => {
    isDragging = true;
    activePointerId = event.pointerId;
    dividerHandle.setPointerCapture(event.pointerId);
    updateHandlePosition(event.clientY);
  });

  dividerHandle.addEventListener("pointermove", (event) => {
    if (!isDragging || event.pointerId !== activePointerId) return;
    updateHandlePosition(event.clientY);
  });

  const stopDragging = (event) => {
    if (!isDragging || event.pointerId !== activePointerId) return;
    isDragging = false;
    activePointerId = null;
    dividerHandle.releasePointerCapture(event.pointerId);
  };

  dividerHandle.addEventListener("pointerup", stopDragging);
  dividerHandle.addEventListener("pointercancel", stopDragging);
}

// ---- список вопросов внизу ----
if (questionPickerBtn && questionPickerMenu) {
  let currentQuestion = getInitialQuestion();

  questionPickerBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const isOpen = questionPickerMenu.classList.contains("is-open");
    setPickerVisibility(!isOpen);
  });

  if (questionPickerClose) {
    questionPickerClose.addEventListener("click", () => {
      setPickerVisibility(false);
    });
  }

  document.addEventListener("click", (event) => {
    if (!questionPickerMenu.classList.contains("is-open")) return;
    if (questionPickerMenu.contains(event.target) || questionPickerBtn.contains(event.target)) {
      return;
    }
    setPickerVisibility(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!questionPickerMenu.classList.contains("is-open")) return;
    setPickerVisibility(false);
  });

  if (questionPickerGrid && questionPickerGrid.children.length === 0) {
    for (let i = 1; i <= QUESTION_TOTAL; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "question-picker__item";
      btn.textContent = String(i);
      btn.dataset.question = String(i);
      btn.setAttribute("aria-label", `Question ${i}`);
      btn.addEventListener("click", () => {
        setCurrentQuestion(i);
        setPickerVisibility(false);
      });
      const marker = document.createElement("span");
      marker.className = "question-state-marker";
      marker.setAttribute("aria-hidden", "true");
      btn.appendChild(marker);
      questionPickerGrid.appendChild(btn);
    }
  }

  setCurrentQuestion(currentQuestion);
  updateQuestionPickerState();

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      const activeQuestion = getCurrentQuestionNumber() || currentQuestion;
      setCurrentQuestion(activeQuestion - 1);
    });
  }

if (nextBtn) {
  let isAdvancingQuestion = false;
  const goToNextQuestion = (event) => {
    event?.preventDefault();
    event?.stopPropagation();
    if (isAdvancingQuestion) return;
    isAdvancingQuestion = true;
    let shouldResetAdvanceLock = true;
    try {
      const activeQuestion = getCurrentQuestionNumber() || currentQuestion;
      currentQuestion = Math.min(QUESTION_TOTAL, Math.max(1, activeQuestion));
      if (currentQuestion >= QUESTION_TOTAL) {
        shouldResetAdvanceLock = false;
        const context = getAnswersContext();
        setReviewContext(context);
        if (!isMathPage) {
          storeRemainingSecondsFromEndTime();
        }
        window.location.href = getReviewUrl();
        return;
      }
      setCurrentQuestion(currentQuestion + 1);
    } finally {
      if (shouldResetAdvanceLock) {
        window.setTimeout(() => {
          isAdvancingQuestion = false;
        }, 0);
      }
    }
  };

  window.bluebookVerbalNextQuestion = goToNextQuestion;
  nextBtn.addEventListener("click", goToNextQuestion);
}

  function setCurrentQuestion(value) {
    currentQuestion = Math.min(QUESTION_TOTAL, Math.max(1, value));
    if (questionNumberEl) questionNumberEl.textContent = String(currentQuestion);
    if (questionPickerLabel) {
      questionPickerLabel.textContent = `Question ${currentQuestion} of ${QUESTION_TOTAL}`;
    } else if (questionPickerBtn) {
      const textNode = Array.from(questionPickerBtn.childNodes).find(
        (node) => node.nodeType === Node.TEXT_NODE
      );
      if (textNode) {
        textNode.textContent = `Question ${currentQuestion} of ${QUESTION_TOTAL} `;
      }
    }
    if (questionPickerBtn) {
      questionPickerBtn.setAttribute(
        "aria-label",
        `Question ${currentQuestion} of ${QUESTION_TOTAL}`
      );
      questionPickerBtn.dataset.currentQuestion = String(currentQuestion);
    }
    updateQuestionPickerCurrent(currentQuestion);
    renderQuestion(currentQuestion);
  }
}

function setPickerVisibility(visible) {
  if (!questionPickerMenu || !questionPickerBtn) return;
  if (visible) {
    questionPickerMenu.hidden = false;
    questionPickerMenu.classList.add("is-open");
  } else {
    questionPickerMenu.classList.remove("is-open");
    questionPickerMenu.hidden = true;
  }
  questionPickerBtn.setAttribute("aria-expanded", String(visible));

  const caret = questionPickerBtn.querySelector(".caret");
  if (caret) {
    caret.classList.toggle("open", visible);
  }
}

function getInitialQuestion() {
  const urlParams = new URLSearchParams(window.location.search);
  const fromQuery = Number(urlParams.get("question"));
  if (Number.isFinite(fromQuery) && fromQuery > 0) return fromQuery;
  if (questionNumberEl) {
    const value = Number(questionNumberEl.textContent);
    if (Number.isFinite(value) && value > 0) return value;
  }
  if (questionPickerLabel) {
    const match = questionPickerLabel.textContent.match(/Question\s+(\d+)/i);
    if (match) {
      const value = Number(match[1]);
      if (Number.isFinite(value) && value > 0) return value;
    }
  }
  return 1;
}

function updateQuestionPickerCurrent(current) {
  if (!questionPickerGrid) return;
  const items = questionPickerGrid.querySelectorAll(".question-picker__item");
  items.forEach((item) => item.classList.remove("is-current"));
  const activeItem = questionPickerGrid.querySelector(
    `.question-picker__item[data-question="${current}"]`
  );
  if (activeItem) activeItem.classList.add("is-current");
}

function updateQuestionPickerState() {
  if (!questionPickerGrid) return;
  const context = getAnswersContext();
  const answers = getStoredAnswers();
  const marks = getStoredReviewMarks(context);
  const items = questionPickerGrid.querySelectorAll(".question-picker__item");
  items.forEach((item) => {
    const key = item.dataset.question || item.textContent?.trim();
    const answered = key && Object.prototype.hasOwnProperty.call(answers, key);
    const marked = key && Object.prototype.hasOwnProperty.call(marks, key);
    item.classList.toggle("is-answered", answered);
    item.classList.toggle("is-review", marked);
  });
}

function updateReviewChip(questionNumber = getCurrentQuestionNumber()) {
  if (!reviewChip || !questionNumber) return;
  const marks = getStoredReviewMarks();
  const marked = Object.prototype.hasOwnProperty.call(marks, String(questionNumber));
  reviewChip.classList.toggle("is-marked", marked);
  reviewChip.setAttribute("aria-pressed", String(marked));
}

function sanitizeRichHTML(html) {
  const template = document.createElement("template");
  template.innerHTML = html;
  template.content.querySelectorAll("script, iframe, object, embed, link, meta").forEach((el) => {
    el.remove();
  });
  template.content.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith("on") || value.startsWith("javascript:")) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return template.innerHTML;
}

function buildRichHTML(value, { renderMath = isMathPage } = {}) {
  let html = String(value ?? "");
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    html = html.replace(/\n/g, "<br>");
  }
  if (renderMath && html.includes("$")) {
    html = html.replace(/\$([^$]+)\$/g, '<span class="mq-math">$1</span>');
  }
  return sanitizeRichHTML(html);
}

function renderMathQuill(root) {
  if (!root || !window.MQ) return;
  root.querySelectorAll(".mq-math").forEach((el) => {
    if (el.dataset.mathquillRendered) return;
    try {
      window.MQ.StaticMath(el);
      el.dataset.mathquillRendered = "true";
    } catch (error) {
      el.textContent = el.textContent;
    }
  });
}

function setRichHTML(el, value, options) {
  if (!el) return;
  el.innerHTML = buildRichHTML(value, options);
  renderMathQuill(el);
}

function ensureStudentProducedPanel() {
  if (sprPanelEl) return sprPanelEl;
  if (!optionListEl) return null;
  sprPanelEl = document.createElement("div");
  sprPanelEl.className = "spr-answer-panel";
  sprPanelEl.hidden = true;
  sprPanelEl.innerHTML = `
    <div class="spr-answer-panel__directions">
      <h3>Student-produced response</h3>
      <p>Enter your answer in the box.</p>
    </div>
    <label class="spr-answer-label" for="sprAnswerInput">Answer</label>
    <input id="sprAnswerInput" class="spr-answer-input" type="text" inputmode="decimal" maxlength="6" autocomplete="off" />
    <div class="spr-answer-preview" aria-live="polite">
      <span>Answer Preview:</span>
      <strong class="spr-answer-preview__value"></strong>
    </div>
  `;
  optionListEl.insertAdjacentElement("afterend", sprPanelEl);

  const input = sprPanelEl.querySelector(".spr-answer-input");
  const preview = sprPanelEl.querySelector(".spr-answer-preview__value");
  input?.addEventListener("input", () => {
    const nextValue = input.value.replace(/[^\d./-]/g, "").slice(0, 6);
    if (input.value !== nextValue) {
      input.value = nextValue;
    }
    if (preview) {
      preview.textContent = nextValue;
    }
    const currentQuestion = getCurrentQuestionNumber();
    if (!currentQuestion) return;
    if (/\d/.test(nextValue)) {
      setStoredAnswer(currentQuestion, nextValue);
    } else {
      clearStoredAnswer(currentQuestion);
    }
  });

  return sprPanelEl;
}

function renderStudentProducedAnswer(savedAnswer) {
  const panel = ensureStudentProducedPanel();
  if (!panel) return;
  const input = panel.querySelector(".spr-answer-input");
  const preview = panel.querySelector(".spr-answer-preview__value");
  const value = typeof savedAnswer === "string" ? savedAnswer : "";
  if (input) {
    input.value = value;
  }
  if (preview) {
    preview.textContent = value;
  }
}

function renderQuestion(index) {
  const bank = getQuestionBankForContext();
  const data = bank[index - 1] || FALLBACK_QUESTION;
  const options = Array.isArray(data.options) ? data.options : [];
  const isStudentProduced = isMathPage && options.length === 0;
  const answers = getStoredAnswers();
  const savedChoice = answers[String(index)];

  if (passageEl && !isMathPage) {
    setRichHTML(passageEl, data.passage, { renderMath: false });
  }
  if (questionTextEl) {
    setRichHTML(questionTextEl, data.prompt, { renderMath: isMathPage });
  }

  if (abcBtn) {
    abcBtn.hidden = isStudentProduced;
  }

  if (optionListEl) {
    optionListEl.hidden = isStudentProduced;
    optionListEl.setAttribute("aria-hidden", String(isStudentProduced));
    const useCompact = options.some(
      (option) => typeof option === "string" && option.length >= COMPACT_OPTION_THRESHOLD
    );
    optionListEl.classList.toggle("option-list--compact", useCompact);
  }

  const optionItems = document.querySelectorAll(".option");
  optionItems.forEach((option, i) => {
    option.hidden = isStudentProduced || i >= options.length;
    option.classList.remove("option--selected", "option--eliminated");
    const radio = option.querySelector('input[type="radio"]');
    if (radio) {
      const selected = !isStudentProduced && radio.value === savedChoice;
      radio.checked = selected;
      option.classList.toggle("option--selected", selected);
    }
  });

  if (optionTextEls.length) {
    optionTextEls.forEach((el, i) => {
      setRichHTML(el, options[i] || "", { renderMath: isMathPage });
    });
  }

  const sprPanel = ensureStudentProducedPanel();
  if (sprPanel) {
    sprPanel.hidden = !isStudentProduced;
  }
  if (isStudentProduced) {
    renderStudentProducedAnswer(savedChoice);
  }

  updateReviewChip(index);
}

if (reviewChip) {
  reviewChip.setAttribute("role", "button");
  reviewChip.setAttribute("tabindex", "0");
  updateReviewChip();

  const toggleReviewMark = () => {
    const currentQuestion = getCurrentQuestionNumber();
    if (!currentQuestion) return;
    const marks = getStoredReviewMarks();
    const marked = Object.prototype.hasOwnProperty.call(marks, String(currentQuestion));
    setStoredReviewMark(currentQuestion, !marked);
  };

  reviewChip.addEventListener("click", toggleReviewMark);
  reviewChip.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    toggleReviewMark();
  });
}

// ---- варианты ответов ----
const optionLabels = document.querySelectorAll(".option");

if (optionLabels.length) {
  optionLabels.forEach((option) => {
    const eliminateBtn = option.querySelector(".option-eliminate");
    const undoBtn = option.querySelector(".option-undo");
    const radio = option.querySelector('input[type="radio"]');

    option.addEventListener("click", (e) => {
      if (e.target === eliminateBtn || e.target === undoBtn) return;

      optionLabels.forEach((opt) => opt.classList.remove("option--selected"));
      option.classList.remove("option--eliminated");
      option.classList.add("option--selected");
      if (radio) radio.checked = true;

      const currentQuestion = getCurrentQuestionNumber();
      if (radio && currentQuestion) {
        setStoredAnswer(currentQuestion, radio.value);
      }
    });

    if (eliminateBtn) {
      eliminateBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        option.classList.add("option--eliminated");
        option.classList.remove("option--selected");
        if (radio) radio.checked = false;
      });
    }

    if (undoBtn) {
      undoBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        option.classList.remove("option--eliminated");
      });
    }
  });
}

if (reviewBackBtn) {
  reviewBackBtn.addEventListener("click", () => {
    const storedMathStage = getStoredMathStage();
    const context = reviewContextFromPage
      || localStorage.getItem(REVIEW_CONTEXT_KEY)
      || (storedMathStage ? `math${storedMathStage}` : null);
    if (context === "math1") {
      window.location.href = withCacheBust(`math.html?question=${getQuestionTotalForContext("math1")}`);
      return;
    }
    if (context === "math2") {
      window.location.href = withCacheBust(`math2.html?question=${getQuestionTotalForContext("math2")}`);
      return;
    }
    window.location.href = getQuestionUrlForContext(context, getQuestionTotalForContext(context));
  });
}

if (reviewNextBtn) {
  reviewNextBtn.addEventListener("click", () => {
    const storedMathStage = getStoredMathStage();
    const context = reviewContextFromPage
      || localStorage.getItem(REVIEW_CONTEXT_KEY)
      || (storedMathStage ? `math${storedMathStage}` : null);
    if (context === "math1") {
      setWaitTarget("math2");
    } else if (context === "math2") {
      setWaitTarget("end");
    } else if (context === "reading2") {
      setWaitTarget("break");
    } else {
      setWaitTarget(null);
    }
    window.location.href = WAIT_PAGE_URL;
  });
}

if (reviewPageBtn) {
  reviewPageBtn.addEventListener("click", () => {
    const context = getAnswersContext();
    setReviewContext(context);
    if (!isMathPage) {
      storeRemainingSecondsFromEndTime();
    }
    window.location.href = getReviewUrl();
  });
}

// ---- review grid (review.html) ----
if (reviewGrid && reviewGrid.children.length === 0) {
  const total = REVIEW_QUESTION_TOTAL || QUESTION_TOTAL;
  const context = getAnswersContext();
  for (let i = 1; i <= total; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "review-grid__item";
    btn.textContent = String(i);
    btn.dataset.question = String(i);
    btn.setAttribute("aria-label", `Question ${i}`);
    btn.addEventListener("click", () => {
      window.location.href = getQuestionUrlForContext(context, i);
    });
    const marker = document.createElement("span");
    marker.className = "question-state-marker";
    marker.setAttribute("aria-hidden", "true");
    btn.appendChild(marker);
    reviewGrid.appendChild(btn);
  }
}

if (reviewGrid) {
  updateReviewGrid();
}

if (isWaitPage) {
  setTimeout(() => {
    const waitTarget = localStorage.getItem(WAIT_TARGET_KEY);
    if (waitTarget === "math2") {
      setWaitTarget(null);
      const endTime = Date.now() + EXAM_DURATION_SECONDS * 1000;
      localStorage.setItem(MATH_END_STORAGE_KEY, String(endTime));
      localStorage.setItem(MATH_STAGE_KEY, "2");
      localStorage.removeItem(getAnswersStorageKey("math1"));
      window.location.href = withCacheBust("math2.html");
      return;
    }
    if (waitTarget === "end") {
      setWaitTarget(null);
      localStorage.removeItem(getAnswersStorageKey("math2"));
      window.location.href = withCacheBust("end.html");
      return;
    }
    if (waitTarget === "break") {
      setWaitTarget(null);
      window.location.href = BREAK_PAGE_URL;
      return;
    }
    const moduleNumber = getCurrentModule();
    if (moduleNumber === 1) {
      const endTime = Date.now() + EXAM_DURATION_SECONDS * 1000;
      localStorage.setItem("examEndTime", String(endTime));
      localStorage.setItem(REMAINING_STORAGE_KEY, String(EXAM_DURATION_SECONDS));
      localStorage.removeItem(getAnswersStorageKey("reading1"));
      localStorage.setItem(MODULE_STORAGE_KEY, "2");
      window.location.href = withCacheBust("exam2.html");
      return;
    }
    window.location.href = BREAK_PAGE_URL;
  }, WAIT_DURATION_MS);
}
