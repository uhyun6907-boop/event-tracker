/* 이벤트 트래커 — vanilla JS, localStorage only */
(function () {
  "use strict";

  const STORAGE_KEY = "event-tracker:v1";
  const DATA_VERSION = 1;
  const ALL = "all";

  /* ---------- Utilities ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);

  function uid() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    const bytes = new Uint8Array(16);
    (window.crypto || {}).getRandomValues
      ? window.crypto.getRandomValues(bytes)
      : bytes.forEach((_, i) => (bytes[i] = Math.floor(Math.random() * 256)));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /** Normalize a user-entered URL. Returns { ok, value }. Empty input is ok. */
  function normalizeUrl(input) {
    const raw = String(input || "").trim();
    if (!raw) return { ok: true, value: "" };
    const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : "https://" + raw;
    try {
      const u = new URL(withScheme);
      if (u.protocol !== "http:" && u.protocol !== "https:") return { ok: false, value: raw };
      if (!u.hostname || u.hostname.indexOf(".") === -1) return { ok: false, value: raw };
      return { ok: true, value: u.href };
    } catch (e) {
      return { ok: false, value: raw };
    }
  }

  /** Only allow http(s) links to be rendered as hrefs. */
  function safeHref(url) {
    if (!url) return "";
    try {
      const u = new URL(url);
      return u.protocol === "http:" || u.protocol === "https:" ? u.href : "";
    } catch (e) {
      return "";
    }
  }

  /**
   * Parse a Korean won amount like "1만 원", "3천 원", "10,000원", "1.2만원", "1만 2천 원".
   * Returns a number, or null if the reward is not a single plain amount.
   */
  function parseWon(text) {
    const s = String(text || "").replace(/[\s,]/g, "");
    if (!s) return null;
    const m = s.match(/^(?:(\d+(?:\.\d+)?)억)?(?:(\d+(?:\.\d+)?)만)?(?:(\d+(?:\.\d+)?)천)?(\d+)?원$/);
    if (!m || !(m[1] || m[2] || m[3] || m[4])) return null;
    const n =
      (parseFloat(m[1] || 0) * 1e8) +
      (parseFloat(m[2] || 0) * 1e4) +
      (parseFloat(m[3] || 0) * 1e3) +
      (parseInt(m[4] || 0, 10));
    return Math.round(n);
  }

  function formatWon(n) {
    return n.toLocaleString("ko-KR") + "원";
  }

  /* ---------- Seed data ---------- */
  function step(title, reward, timing, memo, url, done) {
    return { id: uid(), title, reward, timing, memo, url, done: !!done };
  }

  function seedState() {
    return {
      version: DATA_VERSION,
      selectedId: ALL,
      events: [
        {
          id: uid(),
          name: "신한 SOL LINK 계좌개설",
          sourceUrl: "https://m.blog.naver.com/ica2710/224474865018",
          status: "in_progress",
          steps: [
            step(
              "SOL LINK 계좌 개설 + 1만원 혜택 신청",
              "1만 원",
              "다음달 10일 지급 (12/10)",
              "",
              "https://nssol.shinhan.com/link.html?pr_id=VU0001R0001F01&pid=GO0601H0001F08&evtMstNo=2609220703&evtType=19&jehyuCode=PLF1",
              false
            ),
            step("신규·휴면 퀴즈 (답 3번, 3번)", "주식 1주", "", "", "", false),
            step(
              "(선택) 올리브영 통장 (페이북 또는 땡겨요 경유)",
              "9천~1.2만 원 + 최대 11만 원",
              "",
              "월 사용 조건. 페이북 경유 9천 원, 땡겨요 경유 1.2만 원.",
              "",
              false
            ),
            step(
              "(선택) 적금 30만 원 + 럭키볼 응모",
              "럭키볼 10개 → 해피콘 1만 원",
              "12월까지 럭키볼 10개",
              "급여이체 혜택 노리면 보류",
              "https://nssol.shinhan.com/link.html?pr_id=SP1301H0012F01&evntSeq=10922",
              false
            ),
            step(
              "(선택) 체크카드 발급 + 3만 원 사용",
              "1만 원",
              "11/30까지",
              "",
              "https://nssol.shinhan.com/link.html?pr_id=VU0001R0001F01&pid=GO0601H0001F04&evtMstNo=2609170701&evtType=01&jehyuCode=PLF1&PID=CO0754S0016F02&SCREEN_TYPE=F",
              false
            ),
            step(
              "(선택) 100만 원 거래 이벤트",
              "매주 추첨",
              "",
              "",
              "https://nssol.shinhan.com/link.html?pr_id=VU0001R0001F01&pid=GO0601H0001F08&evtMstNo=2609220704&evtType=19&jehyuCode=S011",
              false
            ),
            step(
              "(선택) 입고 1원 이상 + 거래 500만 원",
              "3천 원~1천만 원",
              "",
              "채권형 ETF 인정, 수수료 0.01%",
              "https://open.shinhansec.com/m/event2/260720_sollink-tesla_mo/event.jsp",
              false
            ),
            step(
              "상품 페이지 (SOL 앱)",
              "",
              "",
              "앱에서만 열리는 상품 페이지",
              "https://nssol.shinhan.com/link.html?pr_id=PR1002S0011F01&prdGubun=1&prdCode=110007601",
              false
            ),
          ],
        },
        {
          id: uid(),
          name: "KB증권 마이데이터",
          sourceUrl: "",
          status: "done",
          steps: [step("마이데이터 이벤트 참여", "", "", "", "", true)],
        },
        {
          id: uid(),
          name: "하나증권 국내주식 매수쿠폰",
          sourceUrl: "",
          status: "done",
          steps: [step("매수 체결", "쿠폰 금액", "영업일 1일 이내 예수금 입금", "", "", true)],
        },
      ],
    };
  }

  /* ---------- Persistence ---------- */
  function str(v) {
    return typeof v === "string" ? v : v == null ? "" : String(v);
  }

  function normalizeState(raw) {
    if (!raw || typeof raw !== "object" || !Array.isArray(raw.events)) return null;
    const events = raw.events
      .filter((e) => e && typeof e === "object")
      .map((e) => ({
        id: str(e.id) || uid(),
        name: str(e.name).trim() || "이름 없는 이벤트",
        sourceUrl: str(e.sourceUrl),
        status: e.status === "done" ? "done" : "in_progress",
        steps: (Array.isArray(e.steps) ? e.steps : [])
          .filter((s) => s && typeof s === "object")
          .map((s) => ({
            id: str(s.id) || uid(),
            title: str(s.title).trim() || "제목 없음",
            reward: str(s.reward),
            timing: str(s.timing),
            memo: str(s.memo),
            url: str(s.url),
            done: !!s.done,
          })),
      }));
    const selectedId = events.some((e) => e.id === raw.selectedId) ? raw.selectedId : ALL;
    return { version: DATA_VERSION, selectedId, events };
  }

  function load() {
    let saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      saved = null;
    }
    if (saved != null) {
      try {
        const parsed = normalizeState(JSON.parse(saved));
        if (parsed) return parsed;
      } catch (e) {
        /* fall through: corrupted data is kept aside below */
      }
      try {
        localStorage.setItem(STORAGE_KEY + ":corrupt-" + Date.now(), saved);
      } catch (e) {
        /* ignore */
      }
    }
    const seeded = seedState();
    persist(seeded);
    return seeded;
  }

  let saveFailedNotified = false;
  function persist(s) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      saveFailedNotified = false;
    } catch (e) {
      if (!saveFailedNotified) {
        saveFailedNotified = true;
        setTimeout(() => toast("저장 공간에 저장하지 못했어요"), 0);
      }
    }
  }

  let state = load();

  function commit() {
    persist(state);
    render();
  }

  /* ---------- Derived data ---------- */
  function getEvent(id) {
    return state.events.find((e) => e.id === id) || null;
  }

  function summarize(ev) {
    const total = ev.steps.length;
    const done = ev.steps.filter((s) => s.done).length;
    let earned = 0;
    let possible = 0;
    let numericCount = 0;
    const others = [];
    ev.steps.forEach((s) => {
      const reward = s.reward.trim();
      if (!reward) return;
      const won = parseWon(reward);
      if (won != null) {
        numericCount++;
        possible += won;
        if (s.done) earned += won;
      } else {
        others.push({ reward, done: s.done });
      }
    });
    return { total, done, earned, possible, numericCount, others };
  }

  /** Auto status rule: all steps done → 완료; a step unchecked while 완료 → 진행 중. */
  function applyAutoStatus(ev) {
    if (!ev.steps.length) return;
    const allDone = ev.steps.every((s) => s.done);
    if (allDone) ev.status = "done";
    else if (ev.status === "done") ev.status = "in_progress";
  }

  /* ---------- Rendering ---------- */
  const tabsEl = $("#tabs");
  const mainEl = $("#main");

  const ICONS = {
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    chevron: '<svg class="card-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    external:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    more: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
    edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4"/></svg>',
    trash:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
    download:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
    upload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20V9M7 14l5-5 5 5M5 4h14"/></svg>',
  };

  function statusBadge(status) {
    return status === "done"
      ? '<span class="badge badge-done">완료</span>'
      : '<span class="badge badge-progress">진행 중</span>';
  }

  function progressHtml(sum) {
    const pct = sum.total ? Math.round((sum.done / sum.total) * 100) : 0;
    return `
      <div class="progress">
        <div class="progress-meta">
          <span>진행률 <strong>${sum.done}/${sum.total}</strong> 단계</span>
          <span>${pct}%</span>
        </div>
        <div class="progress-track" role="progressbar" aria-label="진행률" aria-valuemin="0" aria-valuemax="${sum.total}" aria-valuenow="${sum.done}" aria-valuetext="${sum.total}단계 중 ${sum.done}단계 완료">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
      </div>`;
  }

  function rewardHtml(sum, maxChips) {
    let html = "";
    if (sum.numericCount) {
      html += `
        <div class="money-line">
          <span>받은 리워드</span>
          <span class="money">${formatWon(sum.earned)}</span>
          <span class="money-total">/ 총 ${formatWon(sum.possible)}</span>
        </div>`;
    }
    if (sum.others.length) {
      const limit = maxChips || sum.others.length;
      const shown = sum.others.slice(0, limit);
      const rest = sum.others.length - shown.length;
      html += `
        <div class="chips">
          <span class="chip-label">${sum.numericCount ? "기타" : "리워드"}</span>
          ${shown
            .map(
              (o) =>
                `<span class="chip${o.done ? " is-done" : ""}">${o.done ? "✓ " : ""}${esc(o.reward)}${
                  o.done ? '<span class="visually-hidden"> (완료)</span>' : ""
                }</span>`
            )
            .join("")}
          ${rest > 0 ? `<span class="chip">+${rest}개</span>` : ""}
        </div>`;
    }
    return html ? `<div class="reward-summary">${html}</div>` : "";
  }

  function renderTabs() {
    const items = [{ id: ALL, name: "전체", status: null }].concat(state.events);
    tabsEl.innerHTML = items
      .map((ev) => {
        const selected = state.selectedId === ev.id;
        const dot = ev.status ? `<span class="tab-dot${ev.status === "done" ? " is-done" : ""}" aria-hidden="true"></span>` : "";
        return `<button type="button" class="tab" role="tab" aria-selected="${selected}" data-select="${esc(ev.id)}" data-focus="tab:${esc(ev.id)}" tabindex="${selected ? 0 : -1}">${dot}<span class="tab-label">${esc(ev.name)}</span></button>`;
      })
      .join("");
    const active = tabsEl.querySelector('[aria-selected="true"]');
    if (active) {
      const left = active.offsetLeft - 16;
      const right = active.offsetLeft + active.offsetWidth - tabsEl.clientWidth + 40;
      if (tabsEl.scrollLeft > left) tabsEl.scrollLeft = left;
      else if (tabsEl.scrollLeft < right) tabsEl.scrollLeft = right;
    }
  }

  function renderOverview() {
    if (!state.events.length) {
      return `
        <section class="empty">
          <img class="empty-icon" src="./icon-192.png" alt="" width="72" height="72">
          <h2>아직 등록된 이벤트가 없어요</h2>
          <p>참여 중인 은행·증권 이벤트를 추가하고<br>단계별로 체크해 보세요.</p>
          <button type="button" class="btn btn-primary" data-action="add-event">${ICONS.plus}<span>첫 이벤트 추가</span></button>
        </section>`;
    }

    let earned = 0;
    let possible = 0;
    let active = 0;
    let finished = 0;
    const cards = state.events
      .map((ev) => {
        const sum = summarize(ev);
        earned += sum.earned;
        possible += sum.possible;
        if (ev.status === "done") finished++;
        else active++;
        return `
          <button type="button" class="event-card${ev.status === "done" ? " is-done" : ""}" data-select="${esc(ev.id)}" data-focus="card:${esc(ev.id)}" aria-label="${esc(ev.name)}, ${ev.status === "done" ? "완료" : "진행 중"}, ${sum.done}/${sum.total} 단계 완료. 자세히 보기">
            <div class="card-top">
              <h3 class="card-name">${esc(ev.name)}</h3>
              ${statusBadge(ev.status)}
            </div>
            ${progressHtml(sum)}
            ${rewardHtml(sum, 4)}
          </button>`;
      })
      .join("");

    return `
      <section class="stats" aria-label="요약">
        <div class="stat"><div class="stat-label">진행 중</div><div class="stat-value">${active}<small>개</small></div></div>
        <div class="stat"><div class="stat-label">완료</div><div class="stat-value">${finished}<small>개</small></div></div>
        <div class="stat"><div class="stat-label">받은 금액</div><div class="stat-value accent">${earned.toLocaleString("ko-KR")}<small>원</small></div></div>
      </section>
      ${possible ? `<p class="section-title">금액이 정해진 리워드 기준 · 총 ${formatWon(possible)} 중 ${formatWon(earned)} 달성</p>` : '<p class="section-title">이벤트</p>'}
      <div class="card-list">${cards}</div>`;
  }

  function renderStep(ev, s, index) {
    const href = safeHref(s.url);
    const titleId = "st-" + s.id;
    const meta = [];
    if (s.reward.trim()) meta.push(`<div class="meta-row"><span class="meta-key">리워드</span><span class="meta-val reward">${esc(s.reward)}</span></div>`);
    if (s.timing.trim()) meta.push(`<div class="meta-row"><span class="meta-key">시점</span><span class="meta-val">${esc(s.timing)}</span></div>`);
    return `
      <li class="step${s.done ? " is-done" : ""}">
        <label class="check">
          <input type="checkbox" ${s.done ? "checked" : ""} data-toggle="${esc(s.id)}" data-focus="chk:${esc(s.id)}" aria-labelledby="${titleId}" aria-describedby="${titleId}-n">
          <span class="check-box">${ICONS.check}</span>
          <span class="visually-hidden" id="${titleId}-n">${index + 1}번째 단계 완료 표시</span>
        </label>
        <div class="step-body">
          <p class="step-title" id="${titleId}">${esc(s.title)}</p>
          ${meta.length ? `<div class="step-meta">${meta.join("")}</div>` : ""}
          ${s.memo.trim() ? `<div class="step-memo">${esc(s.memo)}</div>` : ""}
          ${
            href
              ? `<div class="step-actions"><a class="btn btn-outline btn-sm link-btn" href="${esc(href)}" target="_blank" rel="noopener noreferrer">링크 ${ICONS.external}</a></div>`
              : ""
          }
        </div>
        <button type="button" class="icon-btn step-more" data-step-menu="${esc(s.id)}" data-focus="menu:${esc(s.id)}" aria-label="${esc(s.title)} 단계 메뉴" aria-haspopup="dialog">${ICONS.more}</button>
      </li>`;
  }

  function renderDetail(ev) {
    const sum = summarize(ev);
    const src = safeHref(ev.sourceUrl);
    const steps = ev.steps.length
      ? `<ol class="step-list">${ev.steps.map((s, i) => renderStep(ev, s, i)).join("")}</ol>`
      : `<div class="empty empty-sm"><p>아직 단계가 없어요. 첫 단계를 추가해 보세요.</p></div>`;

    return `
      <section class="detail-head" aria-labelledby="detailName">
        <div class="detail-top">
          ${statusBadge(ev.status)}
          <button type="button" class="btn btn-ghost btn-sm" data-action="edit-event" data-focus="edit-event">${ICONS.edit}<span>수정</span></button>
        </div>
        <h2 class="detail-name" id="detailName">${esc(ev.name)}</h2>
        ${progressHtml(sum)}
        ${rewardHtml(sum)}
        <div class="detail-links">
          <div class="segmented status-toggle" role="radiogroup" aria-label="상태" style="flex:1;min-width:200px">
            <input type="radio" id="dStatusP" name="dStatus" value="in_progress" data-status ${ev.status !== "done" ? "checked" : ""} data-focus="status:p">
            <label for="dStatusP">진행 중</label>
            <input type="radio" id="dStatusD" name="dStatus" value="done" data-status ${ev.status === "done" ? "checked" : ""} data-focus="status:d">
            <label for="dStatusD">완료</label>
          </div>
          ${src ? `<a class="btn btn-outline" href="${esc(src)}" target="_blank" rel="noopener noreferrer">원문 링크 ${ICONS.external}</a>` : ""}
        </div>
      </section>

      <p class="section-title">단계 ${sum.total}개</p>
      ${steps}

      <div class="add-step-row">
        <button type="button" class="btn btn-primary btn-block" data-action="add-step" data-focus="add-step">${ICONS.plus}<span>단계 추가</span></button>
      </div>

      <div class="danger-zone">
        <button type="button" class="btn btn-ghost" data-select="${ALL}">전체로 돌아가기</button>
        <button type="button" class="btn btn-danger-ghost" data-action="delete-event">${ICONS.trash}<span>이벤트 삭제</span></button>
      </div>`;
  }

  function render() {
    const focusKey = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.focus : null;

    if (state.selectedId !== ALL && !getEvent(state.selectedId)) state.selectedId = ALL;
    renderTabs();
    const ev = state.selectedId === ALL ? null : getEvent(state.selectedId);
    mainEl.innerHTML = ev ? renderDetail(ev) : renderOverview();
    document.title = ev ? `${ev.name} · 이벤트 트래커` : "이벤트 트래커";

    if (focusKey) {
      const target = document.querySelector(`[data-focus="${CSS.escape(focusKey)}"]`);
      if (target) target.focus({ preventScroll: true });
    }
  }

  /* ---------- Navigation ---------- */
  function select(id, opts) {
    const options = opts || {};
    if (id !== ALL && !getEvent(id)) id = ALL;
    const changed = state.selectedId !== id;
    state.selectedId = id;
    persist(state);
    if (changed && !options.fromHistory) {
      try {
        history.pushState({ sel: id }, "");
      } catch (e) {
        /* ignore */
      }
    }
    render();
    if (changed) {
      window.scrollTo(0, 0);
      if (options.focusMain) mainEl.focus({ preventScroll: true });
    }
  }

  window.addEventListener("popstate", (e) => {
    const sel = e.state && e.state.sel ? e.state.sel : ALL;
    select(sel, { fromHistory: true });
  });

  /* ---------- Dialog helpers ---------- */
  function openDialog(dlg) {
    if (typeof dlg.showModal === "function") {
      if (!dlg.open) dlg.showModal();
    } else {
      dlg.setAttribute("open", "");
    }
    document.body.classList.add("modal-open");
  }

  function closeDialog(dlg) {
    if (typeof dlg.close === "function") {
      if (dlg.open) dlg.close();
    } else {
      dlg.removeAttribute("open");
    }
  }

  document.querySelectorAll("dialog").forEach((dlg) => {
    dlg.addEventListener("close", () => {
      if (!document.querySelector("dialog[open]")) document.body.classList.remove("modal-open");
    });
    // Tap on backdrop closes
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg) closeDialog(dlg);
    });
    dlg.querySelectorAll("[data-close]").forEach((btn) => btn.addEventListener("click", () => closeDialog(dlg)));
  });

  function setFieldError(input, errEl, message) {
    const field = input.closest(".field");
    errEl.textContent = message || "";
    if (field) field.classList.toggle("has-error", !!message);
    input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  /* ---------- Confirm ---------- */
  const confirmDialog = $("#confirmDialog");
  let confirmResolve = null;

  function confirmAction(title, message, okLabel) {
    $("#confirmTitle").textContent = title;
    $("#confirmMsg").textContent = message || "";
    $("#confirmOk").textContent = okLabel || "삭제";
    openDialog(confirmDialog);
    $("#confirmCancel").focus();
    return new Promise((resolve) => {
      confirmResolve = resolve;
    });
  }

  function finishConfirm(result) {
    const r = confirmResolve;
    confirmResolve = null;
    closeDialog(confirmDialog);
    if (r) r(result);
  }

  $("#confirmOk").addEventListener("click", () => finishConfirm(true));
  $("#confirmCancel").addEventListener("click", () => finishConfirm(false));
  confirmDialog.addEventListener("close", () => {
    if (confirmResolve) finishConfirm(false);
  });

  /* ---------- Toast ---------- */
  const toastEl = $("#toast");
  let toastTimer = null;
  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  /* ---------- Event form ---------- */
  const eventDialog = $("#eventDialog");
  const eventForm = $("#eventForm");
  let editingEventId = null;

  function openEventForm(ev) {
    editingEventId = ev ? ev.id : null;
    $("#eventDialogTitle").textContent = ev ? "이벤트 수정" : "이벤트 추가";
    eventForm.reset();
    eventForm.elements.name.value = ev ? ev.name : "";
    eventForm.elements.sourceUrl.value = ev ? ev.sourceUrl : "";
    eventForm.elements.status.value = ev ? ev.status : "in_progress";
    setFieldError(eventForm.elements.name, $("#eventNameErr"), "");
    setFieldError(eventForm.elements.sourceUrl, $("#eventSourceErr"), "");
    openDialog(eventDialog);
    setTimeout(() => eventForm.elements.name.focus(), 50);
  }

  eventForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const nameInput = eventForm.elements.name;
    const urlInput = eventForm.elements.sourceUrl;
    const name = nameInput.value.trim();
    const url = normalizeUrl(urlInput.value);
    let firstInvalid = null;

    setFieldError(nameInput, $("#eventNameErr"), name ? "" : "이름을 입력해 주세요.");
    if (!name) firstInvalid = nameInput;
    setFieldError(urlInput, $("#eventSourceErr"), url.ok ? "" : "올바른 링크(https://…)를 입력해 주세요.");
    if (!url.ok && !firstInvalid) firstInvalid = urlInput;
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const status = eventForm.elements.status.value === "done" ? "done" : "in_progress";
    if (editingEventId) {
      const ev = getEvent(editingEventId);
      if (ev) {
        ev.name = name;
        ev.sourceUrl = url.value;
        ev.status = status;
      }
      closeDialog(eventDialog);
      commit();
      toast("이벤트를 수정했어요");
    } else {
      const ev = { id: uid(), name, sourceUrl: url.value, status, steps: [] };
      state.events.push(ev);
      closeDialog(eventDialog);
      select(ev.id);
      toast("이벤트를 추가했어요");
    }
  });

  eventForm.elements.name.addEventListener("input", () => {
    if (eventForm.elements.name.value.trim()) setFieldError(eventForm.elements.name, $("#eventNameErr"), "");
  });

  /* ---------- Step form ---------- */
  const stepDialog = $("#stepDialog");
  const stepForm = $("#stepForm");
  let editingStep = null; // { eventId, stepId|null }

  function openStepForm(ev, s) {
    editingStep = { eventId: ev.id, stepId: s ? s.id : null };
    $("#stepDialogTitle").textContent = s ? "단계 수정" : "단계 추가";
    stepForm.reset();
    const f = stepForm.elements;
    f.title.value = s ? s.title : "";
    f.reward.value = s ? s.reward : "";
    f.timing.value = s ? s.timing : "";
    f.memo.value = s ? s.memo : "";
    f.url.value = s ? s.url : "";
    setFieldError(f.title, $("#stepTitleErr"), "");
    setFieldError(f.url, $("#stepUrlErr"), "");
    openDialog(stepDialog);
    setTimeout(() => f.title.focus(), 50);
  }

  stepForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!editingStep) return;
    const f = stepForm.elements;
    const title = f.title.value.trim();
    const url = normalizeUrl(f.url.value);
    let firstInvalid = null;

    setFieldError(f.title, $("#stepTitleErr"), title ? "" : "제목을 입력해 주세요.");
    if (!title) firstInvalid = f.title;
    setFieldError(f.url, $("#stepUrlErr"), url.ok ? "" : "올바른 링크(https://…)를 입력해 주세요.");
    if (!url.ok && !firstInvalid) firstInvalid = f.url;
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const ev = getEvent(editingStep.eventId);
    if (!ev) {
      closeDialog(stepDialog);
      return;
    }
    const data = {
      title,
      reward: f.reward.value.trim(),
      timing: f.timing.value.trim(),
      memo: f.memo.value.trim(),
      url: url.value,
    };
    if (editingStep.stepId) {
      const s = ev.steps.find((x) => x.id === editingStep.stepId);
      if (s) Object.assign(s, data);
      toast("단계를 수정했어요");
    } else {
      ev.steps.push(Object.assign({ id: uid(), done: false }, data));
      // A new unchecked step means the event is no longer fully done.
      applyAutoStatus(ev);
      toast("단계를 추가했어요");
    }
    closeDialog(stepDialog);
    commit();
  });

  stepForm.elements.title.addEventListener("input", () => {
    if (stepForm.elements.title.value.trim()) setFieldError(stepForm.elements.title, $("#stepTitleErr"), "");
  });

  /* ---------- Action sheet ---------- */
  const actionDialog = $("#actionDialog");
  const actionList = $("#actionList");
  let actionHandlers = [];

  function openActions(title, actions) {
    $("#actionDialogTitle").textContent = title;
    actionHandlers = actions;
    actionList.innerHTML = actions
      .map(
        (a, i) =>
          `<button type="button" class="action-item${a.danger ? " danger" : ""}" data-action-index="${i}" ${a.disabled ? "disabled" : ""}>${a.icon || ""}<span>${esc(a.label)}</span></button>`
      )
      .join("");
    openDialog(actionDialog);
    const first = actionList.querySelector("button:not([disabled])");
    if (first) first.focus();
  }

  actionList.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action-index]");
    if (!btn) return;
    const action = actionHandlers[Number(btn.dataset.actionIndex)];
    closeDialog(actionDialog);
    if (action && typeof action.run === "function") action.run();
  });

  function openStepMenu(ev, stepId) {
    const idx = ev.steps.findIndex((s) => s.id === stepId);
    if (idx < 0) return;
    const s = ev.steps[idx];
    openActions(s.title, [
      { label: "수정", icon: ICONS.edit, run: () => openStepForm(ev, s) },
      { label: "위로 이동", icon: ICONS.up, disabled: idx === 0, run: () => moveStep(ev, idx, -1) },
      { label: "아래로 이동", icon: ICONS.down, disabled: idx === ev.steps.length - 1, run: () => moveStep(ev, idx, 1) },
      {
        label: "삭제",
        icon: ICONS.trash,
        danger: true,
        run: async () => {
          const ok = await confirmAction("단계를 삭제할까요?", `"${s.title}"\n삭제하면 되돌릴 수 없어요.`);
          if (!ok) return;
          ev.steps = ev.steps.filter((x) => x.id !== s.id);
          applyAutoStatus(ev);
          commit();
          toast("단계를 삭제했어요");
        },
      },
    ]);
  }

  function moveStep(ev, idx, delta) {
    const to = idx + delta;
    if (to < 0 || to >= ev.steps.length) return;
    const [item] = ev.steps.splice(idx, 1);
    ev.steps.splice(to, 0, item);
    commit();
  }

  /* ---------- Backup ---------- */
  function exportBackup() {
    const json = JSON.stringify(state, null, 2);
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const filename = `event-tracker-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
    const blob = new Blob([json], { type: "application/json" });

    let file = null;
    try {
      file = new File([blob], filename, { type: "application/json" });
    } catch (e) {
      file = null;
    }
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: "이벤트 트래커 백업" }).catch(() => {});
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("백업 파일을 저장했어요");
  }

  const importInput = $("#importFile");
  importInput.addEventListener("change", async () => {
    const file = importInput.files && importInput.files[0];
    importInput.value = "";
    if (!file) return;
    let next = null;
    try {
      next = normalizeState(JSON.parse(await file.text()));
    } catch (e) {
      next = null;
    }
    if (!next) {
      toast("백업 파일을 읽을 수 없어요");
      return;
    }
    const ok = await confirmAction(
      "백업을 불러올까요?",
      `이벤트 ${next.events.length}개를 불러옵니다.\n현재 데이터는 모두 대체돼요.`,
      "불러오기"
    );
    if (!ok) return;
    state = next;
    state.selectedId = ALL;
    commit();
    toast("백업을 불러왔어요");
  });

  /* ---------- Global event delegation ---------- */
  $("#addEventBtn").addEventListener("click", () => openEventForm(null));

  $("#menuBtn").addEventListener("click", () => {
    openActions("데이터 관리", [
      { label: "백업 내보내기 (JSON)", icon: ICONS.download, run: exportBackup },
      { label: "백업 가져오기", icon: ICONS.upload, run: () => importInput.click() },
    ]);
  });

  // Keyboard navigation for tabs (arrow keys)
  tabsEl.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const tabs = Array.from(tabsEl.querySelectorAll(".tab"));
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
    select(next.dataset.select);
    const t = tabsEl.querySelector(`[data-select="${CSS.escape(next.dataset.select)}"]`);
    if (t) t.focus();
  });

  document.addEventListener("click", async (e) => {
    const selectBtn = e.target.closest("[data-select]");
    if (selectBtn) {
      select(selectBtn.dataset.select, { focusMain: selectBtn.classList.contains("event-card") });
      return;
    }

    const actionBtn = e.target.closest("[data-action]");
    if (actionBtn) {
      const ev = getEvent(state.selectedId);
      switch (actionBtn.dataset.action) {
        case "add-event":
          openEventForm(null);
          break;
        case "edit-event":
          if (ev) openEventForm(ev);
          break;
        case "add-step":
          if (ev) openStepForm(ev, null);
          break;
        case "delete-event":
          if (!ev) break;
          if (
            await confirmAction(
              "이벤트를 삭제할까요?",
              `"${ev.name}"과(와) 단계 ${ev.steps.length}개가 모두 삭제돼요.\n되돌릴 수 없어요.`
            )
          ) {
            state.events = state.events.filter((x) => x.id !== ev.id);
            select(ALL);
            toast("이벤트를 삭제했어요");
          }
          break;
      }
      return;
    }

    const menuBtn = e.target.closest("[data-step-menu]");
    if (menuBtn) {
      const ev = getEvent(state.selectedId);
      if (ev) openStepMenu(ev, menuBtn.dataset.stepMenu);
    }
  });

  mainEl.addEventListener("change", (e) => {
    const ev = getEvent(state.selectedId);
    if (!ev) return;

    const toggle = e.target.closest("[data-toggle]");
    if (toggle) {
      const s = ev.steps.find((x) => x.id === toggle.dataset.toggle);
      if (!s) return;
      const before = ev.status;
      s.done = toggle.checked;
      applyAutoStatus(ev);
      commit();
      if (before !== ev.status) toast(ev.status === "done" ? "모든 단계 완료! 🎉" : "진행 중으로 변경했어요");
      return;
    }

    if (e.target.matches("[data-status]")) {
      ev.status = e.target.value === "done" ? "done" : "in_progress";
      commit();
    }
  });

  /* ---------- Boot ---------- */
  try {
    history.replaceState({ sel: state.selectedId }, "");
  } catch (e) {
    /* ignore */
  }
  render();

  // Keep multiple open tabs/windows in sync
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    try {
      const next = normalizeState(JSON.parse(e.newValue));
      if (next) {
        next.selectedId = state.selectedId;
        state = next;
        render();
      }
    } catch (err) {
      /* ignore */
    }
  });

  /* ---------- Service worker ---------- */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      const hadController = !!navigator.serviceWorker.controller;
      let reloaded = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        // Reload once when an updated worker takes over (not on first install).
        if (!hadController || reloaded) return;
        reloaded = true;
        window.location.reload();
      });
      navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {});
    });
  }
})();
