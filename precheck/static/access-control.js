(function () {
  const CACHE_BUST = "v=20260711-ronaldo1";
  const SESSION_KEYS = [
    "bluebookStudentEmail",
    "bluebookStudentName",
    "userName",
    "examAnswers",
    "reviewMarks",
    "examRemainingSeconds",
    "examModule",
    "breakEndTime",
    "mathEndTime",
    "mathStage",
    "reviewContext",
    "waitTarget",
    "examEndTime",
    "mathNativeEnd_math1",
    "mathNativeEnd_math2"
  ];
  const SESSION_PREFIXES = [
    "examAnswers_",
    "reviewMarks_"
  ];

  function compactLookupValue(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function getStudentEmailKey(value) {
    return String(value || "").replace(/\s+/g, "").trim().toLowerCase();
  }

  function getAllowedRecordByEmail(email) {
    const records = window.BLUEBOOK_STUDENT_RECORDS || {};
    const byEmail = records.byEmail || {};
    const storedEmail = getStudentEmailKey(email);
    if (!storedEmail) return null;

    const compactEmail = compactLookupValue(storedEmail);
    const compactEmailRecord = Object.keys(byEmail).find((recordEmail) => {
      const compactRecordEmail = compactLookupValue(recordEmail);
      const compactRecordLocal = compactLookupValue(recordEmail.split("@")[0]);
      return compactEmail === compactRecordEmail ||
        (compactRecordLocal.length > 4 && compactEmail.startsWith(compactRecordLocal));
    });

    return byEmail[storedEmail] || byEmail[compactEmailRecord] || null;
  }

  function clearAccessSession() {
    SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (SESSION_PREFIXES.some((prefix) => key && key.startsWith(prefix))) {
        localStorage.removeItem(key);
      }
    }
  }

  function hasAuthorizedSession() {
    return Boolean(getAllowedRecordByEmail(localStorage.getItem("bluebookStudentEmail")));
  }

  function isPublicPrecheckPage() {
    const path = window.location.pathname.replace(/\/+$/, "");
    return path === "/precheck" ||
      path === "/precheck/index.html" ||
      path === "/precheck/cb_login" ||
      path === "/precheck/cb_login/index.html";
  }

  function redirectToSignin() {
    const target = new URL(`/precheck/index.html?${CACHE_BUST}`, window.location.origin);
    if (window.location.href === target.href) return;
    window.location.replace(target.href);
  }

  function enforceAuthorizedSession() {
    if (isPublicPrecheckPage()) return true;
    if (hasAuthorizedSession()) return true;
    clearAccessSession();
    redirectToSignin();
    return false;
  }

  window.BLUEBOOK_ACCESS_CONTROL = {
    clearAccessSession,
    enforceAuthorizedSession,
    getAllowedRecordByEmail,
    hasAuthorizedSession
  };

  enforceAuthorizedSession();
})();
