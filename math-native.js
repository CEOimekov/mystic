(function () {
  const IMAGE_PATH = "precheck/static/images/";
  const stage = document.body.dataset.mathStage === "2" ? 2 : 1;
  const context = `math${stage}`;
  const moduleData = window.BLUEBOOK_QUESTION_BANKS?.[context];
  const questions = (moduleData?.questions || []).map((question) => ({
    id: question.id,
    type: question.type,
    passage: question.passage || "",
    question: normalizeQuestionHTML(question.prompt || ""),
    options: Array.isArray(question.options)
      ? question.options.map((option) => normalizeQuestionHTML(option))
      : [],
  }));
  const moduleTitle = moduleData?.title || `Section 2, Module ${stage}: Math`;
  const answerStorageKey = `examAnswers_${context}`;
  const reviewStorageKey = `reviewMarks_${context}`;
  const timerStorageKey = `mathNativeEnd_${context}`;
  const waitTargetKey = "waitTarget";
  const waitPageUrl = "wait.html?v=20260604-verbal5";
  const state = questions.map(() => ({ review: false, answer: null }));

  function getStoredStudentName() {
    return (localStorage.getItem("bluebookStudentName") || localStorage.getItem("userName") || "Student")
      .replace(/\s+/g, " ")
      .trim() || "Student";
  }

  function normalizeQuestionHTML(value) {
    return String(value || "")
      .replaceAll("/static/images/scatter-plot.png", `${IMAGE_PATH}scatter-plot.0335ee083fd0.png`)
      .replaceAll("../static/images/", IMAGE_PATH);
  }

  function readJSON(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getInitialQuestionIndex() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = Number(params.get("question"));
    if (Number.isFinite(fromQuery) && fromQuery > 0) {
      return Math.min(questions.length - 1, fromQuery - 1);
    }
    return 0;
  }

  function loadStoredState() {
    const answers = readJSON(answerStorageKey);
    const reviewMarks = readJSON(reviewStorageKey);
    state.forEach((item, index) => {
      const key = String(index + 1);
      if (Object.prototype.hasOwnProperty.call(answers, key)) {
        item.answer = answers[key];
      }
      item.review = Object.prototype.hasOwnProperty.call(reviewMarks, key);
    });
  }

  function saveAnswer(index) {
    const answers = readJSON(answerStorageKey);
    const key = String(index + 1);
    const answer = state[index]?.answer;
    if (answer === null || answer === "") {
      delete answers[key];
    } else {
      answers[key] = answer;
    }
    writeJSON(answerStorageKey, answers);
  }

  function saveReviewMark(index) {
    const marks = readJSON(reviewStorageKey);
    const key = String(index + 1);
    if (state[index]?.review) {
      marks[key] = true;
    } else {
      delete marks[key];
    }
    writeJSON(reviewStorageKey, marks);
  }

  function renderMathQuill(element) {
    if (!element) return;
    if (element.innerHTML.includes("$")) {
      element.innerHTML = element.innerHTML.replace(/\$([^$]+)\$/g, '<span class="mq-math">$1</span>');
    }
    if (!window.MQ) return;
    element.querySelectorAll(".mq-math").forEach((node) => {
      try {
        window.MQ.StaticMath(node);
      } catch (error) {
        node.textContent = node.textContent;
      }
    });
  }

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }

  const app = {
    qIdx: getInitialQuestionIndex(),
    batteryLevel: 98,
    batteryInterval: null,
    desmosCalc: null,
    isCalculatorOpen: false,
    timerIsHidden: false,
    mainTimerInterval: null,
    moduleTimeRemaining: 35 * 60,

    init() {
      if (!questions.length) return;
      loadStoredState();
      this.updateStaticLabels();
      this.startModuleTimer();
      this.renderQuestion();
      this.initDraggable();
      this.startBatteryTimer();
      this.bindDocumentHandlers();
    },

    updateStaticLabels() {
      document.querySelectorAll("[data-module-title]").forEach((element) => {
        element.textContent = moduleTitle;
      });
      document.querySelectorAll("[data-module-title-questions]").forEach((element) => {
        element.textContent = `${moduleTitle} Questions`;
      });
      document.querySelectorAll("[data-student-name]").forEach((element) => {
        element.textContent = getStoredStudentName();
      });
    },

    bindDocumentHandlers() {
      const directions = document.getElementById("modal-directions");
      directions?.addEventListener("mousedown", function (event) {
        if (event.target === this) {
          this.style.display = "none";
        }
      });

      document.addEventListener("mousedown", (event) => {
        const navModal = document.getElementById("modal-nav");
        const navContent = document.querySelector(".math-question-picker-menu");
        const navBtn = document.querySelector(".test-q-nav");
        if (navModal && navModal.style.display === "flex") {
          if (navContent && !navContent.contains(event.target) && navBtn && !navBtn.contains(event.target)) {
            this.hideNavModal();
          }
        }
      });
    },

    startBatteryTimer() {
      if (this.batteryInterval) clearInterval(this.batteryInterval);
      this.batteryInterval = setInterval(() => {
        if (this.batteryLevel > 0) {
          this.batteryLevel -= 1;
          this.updateBatteryDisplays();
        }
      }, 120000);
      this.updateBatteryDisplays();
    },

    updateBatteryDisplays() {
      document.querySelectorAll("[data-battery]").forEach((element) => {
        element.textContent = `${this.batteryLevel}%`;
      });
    },

    startModuleTimer() {
      if (this.mainTimerInterval) clearInterval(this.mainTimerInterval);
      const savedEnd = Number(localStorage.getItem(timerStorageKey));
      const endTime = Number.isFinite(savedEnd) && savedEnd > Date.now()
        ? savedEnd
        : Date.now() + 35 * 60 * 1000;
      localStorage.setItem(timerStorageKey, String(endTime));

      const tick = () => {
        this.moduleTimeRemaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        this.updateTimerDisplays();
        if (this.moduleTimeRemaining <= 0) {
          clearInterval(this.mainTimerInterval);
          this.finishModule();
        }
      };
      this.mainTimerInterval = setInterval(tick, 1000);
      tick();
    },

    updateTimerDisplays() {
      const time = formatTime(this.moduleTimeRemaining);
      document.querySelectorAll("[data-timer-text]").forEach((element) => {
        element.textContent = time;
      });
    },

    toggleTimer() {
      this.timerIsHidden = !this.timerIsHidden;
      const displayValue = this.timerIsHidden ? "none" : "block";
      const iconValue = this.timerIsHidden ? "block" : "none";
      const buttonText = this.timerIsHidden ? "Show" : "Hide";
      document.querySelectorAll("[data-timer-text]").forEach((element) => {
        element.style.display = displayValue;
      });
      document.querySelectorAll("[data-timer-icon]").forEach((element) => {
        element.style.display = iconValue;
      });
      document.querySelectorAll("[data-timer-button]").forEach((element) => {
        element.textContent = buttonText;
      });
    },

    updateQuestionPanePosition() {
      const questionPane = document.querySelector(".question-pane");
      const workspace = document.querySelector(".test-workspace");
      if (!workspace || !questionPane) return;
      const question = questions[this.qIdx];
      const isSPR = !question.options.length;
      if (!isSPR && this.isCalculatorOpen) {
        const offset = (workspace.offsetWidth - questionPane.offsetWidth) / 2 - 120;
        questionPane.style.transform = `translateX(${offset}px)`;
      } else {
        questionPane.style.transform = "translateX(0)";
      }
    },

    renderQuestion() {
      const question = questions[this.qIdx];
      if (!question) return;
      const isSPR = !question.options.length;
      const workspace = document.querySelector(".test-workspace");
      const passagePane = document.getElementById("ui-passage");
      const resizer = document.querySelector(".resizer");
      const questionPane = document.querySelector(".question-pane");
      const questionElement = document.getElementById("ui-question");
      const optionsList = document.getElementById("ui-options");
      const crossOutBtn = document.getElementById("btn-cross-out");

      workspace?.classList.add("math-mode");
      document.getElementById("ui-q-nav").textContent = `Question ${this.qIdx + 1} of ${questions.length}`;
      document.getElementById("ui-q-num").textContent = String(this.qIdx + 1);
      questionElement.innerHTML = question.question;

      if (isSPR) {
        passagePane.style.display = "block";
        passagePane.innerHTML = this.getSPRRulesHTML();
        passagePane.style.fontFamily = "Noto Serif";
        resizer.style.display = "flex";
        questionPane.style.maxWidth = "none";
        questionPane.style.margin = "0";
        questionPane.style.minWidth = "0";
        questionPane.style.transform = "none";
        questionPane.style.transition = "none";
        crossOutBtn.style.display = "none";
        optionsList.innerHTML = this.getSPRInputHTML(state[this.qIdx].answer || "");
      } else {
        passagePane.style.display = "none";
        resizer.style.display = "none";
        questionPane.style.maxWidth = "50%";
        questionPane.style.margin = "0 auto";
        questionPane.style.minWidth = "400px";
        questionPane.style.transition = "transform 0.8s ease";
        crossOutBtn.style.display = "inline-block";
        optionsList.innerHTML = "";
        question.options.forEach((optionText, index) => {
          const optionLetter = ["A", "B", "C", "D"][index];
          const row = document.createElement("div");
          row.className = "option-row";
          row.id = `opt-row-${optionLetter}`;
          row.dataset.option = optionLetter;
          row.innerHTML = `
            <div class="option-box">
              <div class="option-letter">${optionLetter}</div>
              <div class="option-text">${optionText}</div>
            </div>
            <div class="option-side">
              <button class="option-eliminate" type="button" aria-label="Eliminate option ${optionLetter}">${optionLetter}</button>
              <button class="option-undo" type="button">Undo</button>
            </div>
          `;
          optionsList.appendChild(row);
        });
        optionsList.onclick = (event) => {
          const eliminateBtn = event.target.closest(".option-eliminate");
          if (eliminateBtn && optionsList.contains(eliminateBtn)) {
            event.preventDefault();
            event.stopPropagation();
            const row = eliminateBtn.closest(".option-row");
            const option = row?.dataset.option;
            if (!row || !option) return;
            row.classList.add("option-row--eliminated");
            if (state[this.qIdx].answer === option) {
              state[this.qIdx].answer = null;
              saveAnswer(this.qIdx);
              this.syncSelections();
            }
            return;
          }

          const undoBtn = event.target.closest(".option-undo");
          if (undoBtn && optionsList.contains(undoBtn)) {
            event.preventDefault();
            event.stopPropagation();
            undoBtn.closest(".option-row")?.classList.remove("option-row--eliminated");
            return;
          }

          const row = event.target.closest(".option-row");
          if (!row || !optionsList.contains(row)) return;
          row.classList.remove("option-row--eliminated");
          this.selectOption(row.dataset.option);
        };
        this.updateQuestionPanePosition();
      }

      document.getElementById("btn-back").style.display = this.qIdx > 0 ? "inline-block" : "none";
      renderMathQuill(questionElement);
      renderMathQuill(passagePane);
      renderMathQuill(optionsList);
      this.syncSelections();
    },

    getSPRRulesHTML() {
      return `
        <div class="spr-directions">
          <h2>Student-produced response directions</h2>
          <ul>
            <li>If you find <strong>more than one correct answer</strong>, enter only one answer.</li>
            <li>You can enter up to 5 characters for a <strong>positive</strong> answer and up to 6 characters (including the negative sign) for a <strong>negative</strong> answer.</li>
            <li>If your answer is a <strong>fraction</strong> that doesn&rsquo;t fit in the provided space, enter the decimal equivalent.</li>
            <li>If your answer is a <strong>decimal</strong> that doesn&rsquo;t fit in the provided space, enter it by truncating or rounding at the fourth digit.</li>
            <li>If your answer is a <strong>mixed number</strong> (such as 3<span class="spr-inline-fraction"><sup>1</sup>&frasl;<sub>2</sub></span>), enter it as an improper fraction (7/2) or its decimal equivalent (3.5).</li>
            <li>Don&rsquo;t enter <strong>symbols</strong> such as a percent sign, comma, or dollar sign.</li>
          </ul>

          <div class="spr-examples-title">Examples</div>
          <table class="spr-examples-table">
            <thead>
              <tr>
                <th>Answer</th>
                <th>Acceptable ways to<br>enter answer</th>
                <th>Unacceptable: will<br>NOT receive credit</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="spr-answer-cell">3.5</td>
                <td class="spr-entry-cell">
                  <div>3.5</div>
                  <div>3.50</div>
                  <div>7/2</div>
                </td>
                <td class="spr-entry-cell">
                  <div>31/2</div>
                  <div>3 1/2</div>
                </td>
              </tr>
              <tr>
                <td class="spr-answer-cell">$\\frac{2}{3}$</td>
                <td class="spr-entry-cell">
                  <div>2/3</div>
                  <div>.6666</div>
                  <div>.6667</div>
                  <div>0.666</div>
                  <div>0.667</div>
                </td>
                <td class="spr-entry-cell">
                  <div>0.66</div>
                  <div>.66</div>
                  <div>0.67</div>
                  <div>.67</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    },

    getSPRInputHTML(value) {
      return `
        <div style="margin-top: 12px;">
          <input type="text" id="spr-input" maxlength="6" value="${String(value).replace(/"/g, "&quot;")}" oninput="app.setSPRAnswer(this.value)" style="width: 96px; height: 50px; font-size: 24px; border: 1px solid #1e1e1e; border-radius: 6px; padding-left: 10px; margin-bottom: 42px; font-family: 'Courier Prime'; background-image: linear-gradient(#1e1e1e, #1e1e1e); background-size: calc(100% - 20px) 1px; background-position: center bottom 8px; background-repeat: no-repeat;" />
          <br>
          <h4 style="font-size: 19px; color: #202124; font-family: 'Noto Serif'; display: inline-block;">Answer Preview:</h4>
          <div id="spr-preview" style="font-size: 22px; font-family: 'Noto Serif'; font-weight: 500; display: inline-block;">${value || ""}</div>
        </div>
      `;
    },

    setSPRAnswer(value) {
      const input = document.getElementById("spr-input");
      const clean = String(value).replace(/[^\d./-]/g, "").slice(0, 6);
      if (input && input.value !== clean) {
        input.value = clean;
      }
      state[this.qIdx].answer = /\d/.test(clean) ? clean : null;
      const previewEl = document.getElementById("spr-preview");
      if (previewEl) {
        previewEl.textContent = clean;
      }
      saveAnswer(this.qIdx);
    },

    syncSelections() {
      const current = state[this.qIdx];
      const markImage = document.getElementById("btn-mark-review");
      if (markImage) {
        markImage.src = current.review
          ? `${IMAGE_PATH}marked.e75e631e0330.svg`
          : `${IMAGE_PATH}mark.452451cb068c.svg`;
      }
      ["A", "B", "C", "D"].forEach((option) => {
        const row = document.getElementById(`opt-row-${option}`);
        if (row) {
          row.classList.toggle("selected", current.answer === option);
        }
      });
    },

    selectOption(option) {
      if (!option) return;
      state[this.qIdx].answer = state[this.qIdx].answer === option ? null : option;
      saveAnswer(this.qIdx);
      this.syncSelections();
    },

    toggleReview() {
      state[this.qIdx].review = !state[this.qIdx].review;
      saveReviewMark(this.qIdx);
      this.syncSelections();
    },

    renderNavGrid(containerId, isReviewPage = false) {
      const grid = document.getElementById(containerId);
      if (!grid) return;
      grid.innerHTML = "";
      questions.forEach((question, index) => {
        const itemState = state[index];
        const navItem = document.createElement("button");
        if (isReviewPage) {
          navItem.className = "review-grid__item";
          navItem.type = "button";
          navItem.setAttribute("role", "listitem");
          navItem.setAttribute("aria-label", `Question ${index + 1}`);
          if (itemState.answer) navItem.classList.add("is-answered");
          if (itemState.review) navItem.classList.add("is-review");
          navItem.innerHTML = `${index + 1}<span class="question-state-marker"></span>`;
        } else {
          navItem.className = "question-picker__item";
          navItem.type = "button";
          navItem.setAttribute("role", "listitem");
          navItem.setAttribute("aria-label", `Question ${index + 1}`);
          if (itemState.answer) navItem.classList.add("is-answered");
          if (index === this.qIdx) navItem.classList.add("is-current");
          if (itemState.review) navItem.classList.add("is-review");
          navItem.innerHTML = `${index + 1}<span class="question-state-marker"></span>`;
        }
        navItem.addEventListener("click", () => this.goToQuestion(index));
        grid.appendChild(navItem);
      });
    },

    hideNavModal() {
      const modal = document.getElementById("modal-nav");
      const arrow = document.getElementById("arrow");
      if (modal) modal.style.display = "none";
      if (arrow) arrow.style.transform = "rotate(0deg)";
    },

    showNavModal() {
      const modal = document.getElementById("modal-nav");
      const arrow = document.getElementById("arrow");
      if (modal.style.display !== "flex") {
        arrow.style.transform = "rotate(180deg)";
        this.renderNavGrid("nav-grid", false);
        modal.style.display = "flex";
      } else {
        this.hideNavModal();
      }
    },

    goToQuestion(index) {
      this.qIdx = Math.max(0, Math.min(questions.length - 1, index));
      this.hideNavModal();
      document.getElementById("screen-review").style.display = "none";
      document.getElementById("main-workspace").style.display = "flex";
      document.getElementById("main-bottombar").style.display = "flex";
      document.getElementById("arrow").style.transform = "rotate(0deg)";
      this.renderQuestion();
    },

    nextQuestion() {
      if (this.qIdx < questions.length - 1) {
        this.qIdx += 1;
        this.renderQuestion();
      } else {
        this.goToReview();
      }
    },

    prevQuestion() {
      if (this.qIdx > 0) {
        this.qIdx -= 1;
        this.renderQuestion();
      }
    },

    goToReview() {
      this.hideNavModal();
      document.getElementById("main-workspace").style.display = "none";
      document.getElementById("main-bottombar").style.display = "none";
      this.renderNavGrid("review-grid", true);
      document.getElementById("screen-review").style.display = "flex";
    },

    finishModule() {
      document.getElementById("screen-review").style.display = "none";
      localStorage.removeItem(timerStorageKey);
      localStorage.setItem(waitTargetKey, stage === 1 ? "math2" : "end");
      window.location.href = waitPageUrl;
    },

    toggleCalculator() {
      const modal = document.getElementById("calc-modal");
      const toolItem = document.getElementById("tool-calculator");
      if (!modal) return;
      if (modal.style.display === "flex") {
        modal.style.display = "none";
        this.isCalculatorOpen = false;
        if (toolItem) toolItem.style.borderBottom = "none";
        this.updateQuestionPanePosition();
        return;
      }
      modal.style.display = "flex";
      this.isCalculatorOpen = true;
      if (toolItem) toolItem.style.borderBottom = "2px solid #1e1e1e";
      this.updateQuestionPanePosition();
      if (!this.desmosCalc) {
        const container = document.getElementById("calculator-container");
        if (window.Desmos && container) {
          this.desmosCalc = window.Desmos.GraphingCalculator(container, {
            keypad: true,
            expressions: true,
            settingsMenu: true,
            zoomButtons: true,
          });
        } else if (container) {
          container.textContent = "Calculator could not load.";
        }
      }
    },

    initDraggable() {
      const modal = document.getElementById("calc-modal");
      const header = document.getElementById("calc-header");
      if (!modal || !header) return;
      let dragging = false;
      let startX = 0;
      let startY = 0;
      let initialX = 0;
      let initialY = 0;

      header.addEventListener("mousedown", (event) => {
        if (event.target.closest(".desmos-window-control")) return;
        dragging = true;
        header.classList.add("is-dragging");
        startX = event.clientX;
        startY = event.clientY;
        initialX = modal.offsetLeft;
        initialY = modal.offsetTop;
      });

      document.addEventListener("mousemove", (event) => {
        if (!dragging) return;
        modal.style.left = `${initialX + event.clientX - startX}px`;
        modal.style.top = `${initialY + event.clientY - startY}px`;
      });

      document.addEventListener("mouseup", () => {
        dragging = false;
        header.classList.remove("is-dragging");
      });
    },
  };

  window.app = app;
  app.init();
})();
