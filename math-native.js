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
  const state = questions.map(() => ({ review: false, answer: null }));

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
        element.textContent = localStorage.getItem("userName") || "Student";
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
          row.addEventListener("click", () => this.selectOption(optionLetter));
          row.innerHTML = `
            <div class="option-box">
              <div class="option-letter">${optionLetter}</div>
              <div class="option-text">${optionText}</div>
            </div>
          `;
          optionsList.appendChild(row);
        });
        this.updateQuestionPanePosition();
      }

      document.getElementById("btn-back").style.display = this.qIdx > 0 ? "inline-block" : "none";
      this.syncSelections();
      renderMathQuill(questionElement);
      renderMathQuill(passagePane);
      renderMathQuill(optionsList);
    },

    getSPRRulesHTML() {
      return `
        <div style="padding: 20px; font-family: 'Noto Serif', serif; color: #1e1e1e">
          <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; margin-left: -20px; padding-left: 0;">Student-produced response directions</h2>
          <ul style="font-size: 15px; margin-bottom: 24px; margin-left: 24px; line-height: 1.5; font-family: 'Noto Serif', serif;">
            <li>If you find <b>more than one correct answer</b>, enter only one answer.</li>
            <li>You can enter up to 5 characters for a <b>positive</b> answer and up to 6 characters for a <b>negative</b> answer.</li>
            <li>If your answer is a <b>fraction</b> that doesn't fit, enter the decimal equivalent.</li>
            <li>If your answer is a <b>decimal</b> that doesn't fit, truncate or round at the fourth digit.</li>
            <li>If your answer is a <b>mixed number</b>, enter it as an improper fraction or decimal.</li>
            <li>Don't enter <b>symbols</b> such as a percent sign, comma, or dollar sign.</li>
          </ul>
          <div style="text-align: center; width: 100%; margin-bottom: 4px; font-size: 15px;">Examples</div>
          <table class="spr-table" style="width: 70%; border-collapse: collapse; font-size: 14px; margin: 0 auto; color: #1e1e1e;">
            <tr>
              <th style="border: 1px solid #505050; padding: 24px 12px; font-weight: 500; font-size: 15px; text-align: center;"><br>Answer</th>
              <th style="border: 1px solid #505050; padding: 24px 4px; font-weight: 500; font-size: 15px; text-align: center;">Acceptable ways to<br>enter answer</th>
              <th style="border: 1px solid #505050; padding: 24px 4px; font-weight: 500; font-size: 15px; text-align: center;">Unacceptable: will<br>NOT receive credit</th>
            </tr>
            <tr>
              <td style="border: 1px solid #505050; padding: 36px; text-align: center; font-weight: 500;">$3.5$</td>
              <td style="border: 1px solid #505050; padding: 24px 18px 24px 54px; text-align: left; font-family: monospace;"><p>3.5</p><br><p>3.50</p><br><p>7/2</p></td>
              <td style="border: 1px solid #505050; padding: 24px 18px 24px 54px; text-align: left; font-family: monospace;"><p>31/2</p><br><p>3 1/2</p></td>
            </tr>
            <tr>
              <td style="border: 1px solid #505050; padding: 36px; text-align: center; font-weight: 500;">$\\frac{2}{3}$</td>
              <td style="border: 1px solid #505050; padding: 24px 18px 24px 54px; text-align: left; font-family: monospace;"><p>2/3</p><br><p>.666</p><br><p>.667</p><br><p>0.666</p><br><p>0.667</p></td>
              <td style="border: 1px solid #505050; padding: 24px 18px 24px 54px; text-align: left; font-family: monospace;"><p>0.66</p><br><p>.66</p><br><p>0.67</p><br><p>.67</p></td>
            </tr>
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
      document.getElementById("screen-loading").style.display = "flex";
      localStorage.removeItem(timerStorageKey);
      setTimeout(() => {
        window.location.href = stage === 1 ? "math2.html" : "end.html";
      }, 700);
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
