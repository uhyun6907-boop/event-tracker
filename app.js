/* 이벤트 트래커 — vanilla JS, localStorage only */
(function () {
  "use strict";

  const STORAGE_KEY = "event-tracker:v1";
  const CORRUPT_KEY_PREFIX = STORAGE_KEY + ":corrupt-";
  const DATA_VERSION = 2;
  const ALL = "all";
  const STATUS_LABEL = { in_progress: "진행 중", done: "완료" };

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

  function parseBelowTenThousand(part) {
    const m = part.match(/^(?:(\d+(?:\.\d+)?)천)?(\d+(?:\.\d+)?)?$/);
    if (!m || !(m[1] || m[2])) return null;
    return parseFloat(m[1] || 0) * 1e3 + parseFloat(m[2] || 0);
  }

  function parseWon(text) {
    const s = String(text || "").replace(/[\s,]/g, "").replace(/^₩/, "").replace(/원$/, "");
    const m = s.match(/^(?:([^억만]+)억)?(?:([^억만]+)만)?([^억만]*)$/);
    if (!m || !(m[1] || m[2] || m[3])) return null;
    const [eok, man, rest] = [m[1], m[2], m[3]].map((part) => (part ? parseBelowTenThousand(part) : 0));
    if (eok == null || man == null || rest == null) return null;
    return Math.round(eok * 1e8 + man * 1e4 + rest);
  }

  function formatWon(n) {
    return n.toLocaleString("ko-KR") + "원";
  }

  function step(title, reward, timing, memo, url, done) {
    return { id: uid(), title, reward, timing, memo, url, done: !!done };
  }

  function seedState() {
    return {
      version: DATA_VERSION,
      events: [
        {
          id: uid(),
          name: "신한 SOL LINK 계좌개설",
          sourceUrl: "https://m.blog.naver.com/ica2710/224474865018",
          manualStatus: null,
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
          manualStatus: null,
          steps: [step("마이데이터 이벤트 참여", "", "", "", "", true)],
        },
        {
          id: uid(),
          name: "하나증권 국내주식 매수쿠폰",
          sourceUrl: "",
          manualStatus: null,
          steps: [step("매수 체결", "쿠폰 금액", "영업일 1일 이내 예수금 입금", "", "", true)],
        },
      ],
    };
  }

  function str(v) {
    return typeof v === "string" ? v : v == null ? "" : String(v);
  }

  function stepStatus(ev) {
    return ev.steps.length && ev.steps.every((s) => s.done) ? "done" : "in_progress";
  }

  function statusOf(ev) {
    return ev.manualStatus || stepStatus(ev);
  }

  function setManualStatus(ev, status) {
    ev.manualStatus = status !== stepStatus(ev) ? status : null;
  }

  function changeSteps(ev, steps) {
    ev.steps = steps;
    ev.manualStatus = null;
  }

  function normalizeState(raw) {
    if (!raw || typeof raw !== "object" || !Array.isArray(raw.events)) return null;
    const events = raw.events
      .filter((e) => e && typeof e === "object")
      .map((e) => {
        const ev = {
          id: str(e.id) || uid(),
          name: str(e.name).trim() || "이름 없는 이벤트",
          sourceUrl: str(e.sourceUrl),
          manualStatus: null,
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
        };
        const savedStatus = "manualStatus" in e ? e.manualStatus : e.status;
        if (savedStatus === "done" || savedStatus === "in_progress") setManualStatus(ev, savedStatus);
        return ev;
      });
    return { version: DATA_VERSION, events };
  }

  function parseState(json) {
    try {
      return normalizeState(JSON.parse(json));
    } catch (e) {
      return null;
    }
  }

  function backUpCorrupt(saved) {
    const existing = Object.keys(localStorage).find(
      (key) => key.startsWith(CORRUPT_KEY_PREFIX) && localStorage.getItem(key) === saved
    );
    if (existing) return existing;
    const key = CORRUPT_KEY_PREFIX + Date.now();
    try {
      localStorage.setItem(key, saved);
      return key;
    } catch (e) {
      return null;
    }
  }

  function load() {
    let saved;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return { state: { version: DATA_VERSION, events: [] }, problem: { kind: "unavailable" } };
    }
    if (saved == null) {
      const seeded = seedState();
      persist(seeded);
      return { state: seeded, problem: null };
    }
    const parsed = parseState(saved);
    if (parsed) return { state: parsed, problem: null };
    return { state: { version: DATA_VERSION, events: [] }, problem: { kind: "corrupt", backupKey: backUpCorrupt(saved) } };
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

  const loaded = load();
  let state = loaded.state;

  function commit() {
    persist(state);
    render();
  }

  function getEvent(id) {
    return state.events.find((e) => e.id === id) || null;
  }

  function hashFor(id) {
    return id === ALL ? "" : "#" + encodeURIComponent(id);
  }

  function selectedEvent() {
    return state.events.find((e) => hashFor(e.id) === location.hash) || null;
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
    return `<span class="badge ${status === "done" ? "badge-done" : "badge-progress"}">${STATUS_LABEL[status]}</span>`;
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
    const current = selectedEvent();
    const items = [{ id: ALL, name: "전체", status: null }].concat(
      state.events.map((ev) => ({ id: ev.id, name: ev.name, status: statusOf(ev) }))
    );
    tabsEl.innerHTML = items
      .map((ev) => {
        const selected = (current ? current.id : ALL) === ev.id;
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
        const status = statusOf(ev);
        earned += sum.earned;
        possible += sum.possible;
        if (status === "done") finished++;
        else active++;
        return `
          <button type="button" class="event-card${status === "done" ? " is-done" : ""}" data-select="${esc(ev.id)}" data-focus="card:${esc(ev.id)}" aria-label="${esc(ev.name)}, ${STATUS_LABEL[status]}, ${sum.done}/${sum.total} 단계 완료. 자세히 보기">
            <div class="card-top">
              <h3 class="card-name">${esc(ev.name)}</h3>
              ${statusBadge(status)}
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
    const status = statusOf(ev);
    const src = safeHref(ev.sourceUrl);
    const steps = ev.steps.length
      ? `<ol class="step-list">${ev.steps.map((s, i) => renderStep(ev, s, i)).join("")}</ol>`
      : `<div class="empty empty-sm"><p>아직 단계가 없어요. 첫 단계를 추가해 보세요.</p></div>`;

    return `
      <section class="detail-head" aria-labelledby="detailName">
        <div class="detail-top">
          ${statusBadge(status)}
          <button type="button" class="btn btn-ghost btn-sm" data-action="edit-event" data-focus="edit-event">${ICONS.edit}<span>수정</span></button>
        </div>
        <h2 class="detail-name" id="detailName">${esc(ev.name)}</h2>
        ${progressHtml(sum)}
        ${rewardHtml(sum)}
        <div class="detail-links">
          <div class="segmented status-toggle" role="radiogroup" aria-label="상태" style="flex:1;min-width:200px">
            <input type="radio" id="dStatusP" name="dStatus" value="in_progress" data-status ${status === "in_progress" ? "checked" : ""} data-focus="status:p">
            <label for="dStatusP">진행 중</label>
            <input type="radio" id="dStatusD" name="dStatus" value="done" data-status ${status === "done" ? "checked" : ""} data-focus="status:d">
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

    renderTabs();
    const ev = selectedEvent();
    mainEl.innerHTML = ev ? renderDetail(ev) : renderOverview();
    document.title = ev ? `${ev.name} · 이벤트 트래커` : "이벤트 트래커";

    if (focusKey) {
      const target = document.querySelector(`[data-focus="${CSS.escape(focusKey)}"]`);
      if (target) target.focus({ preventScroll: true });
    }
  }

  function select(id, options = {}) {
    const hash = hashFor(id);
    const changed = location.hash !== hash;
    if (changed) history.pushState(null, "", hash || location.pathname + location.search);
    render();
    if (changed) {
      window.scrollTo(0, 0);
      if (options.focusMain) mainEl.focus({ preventScroll: true });
    }
  }

  window.addEventListener("hashchange", () => {
    render();
    window.scrollTo(0, 0);
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

  function validateTitleAndUrl(titleInput, titleErr, titleMessage, urlInput, urlErr) {
    const title = titleInput.value.trim();
    const url = normalizeUrl(urlInput.value);
    setFieldError(titleInput, titleErr, title ? "" : titleMessage);
    setFieldError(urlInput, urlErr, url.ok ? "" : "올바른 링크(https://…)를 입력해 주세요.");
    const firstInvalid = !title ? titleInput : !url.ok ? urlInput : null;
    if (firstInvalid) {
      firstInvalid.focus();
      return null;
    }
    return { title, url: url.value };
  }

  function clearRequiredErrorOnInput(input, errEl) {
    input.addEventListener("input", () => {
      if (input.value.trim()) setFieldError(input, errEl, "");
    });
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

  const eventDialog = $("#eventDialog");
  const eventForm = $("#eventForm");
  let editingEventId = null;

  function openEventForm(ev) {
    editingEventId = ev ? ev.id : null;
    $("#eventDialogTitle").textContent = ev ? "이벤트 수정" : "이벤트 추가";
    eventForm.reset();
    eventForm.elements.name.value = ev ? ev.name : "";
    eventForm.elements.sourceUrl.value = ev ? ev.sourceUrl : "";
    eventForm.elements.status.value = ev ? statusOf(ev) : "in_progress";
    setFieldError(eventForm.elements.name, $("#eventNameErr"), "");
    setFieldError(eventForm.elements.sourceUrl, $("#eventSourceErr"), "");
    openDialog(eventDialog);
    setTimeout(() => eventForm.elements.name.focus(), 50);
  }

  eventForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const fields = validateTitleAndUrl(
      eventForm.elements.name,
      $("#eventNameErr"),
      "이름을 입력해 주세요.",
      eventForm.elements.sourceUrl,
      $("#eventSourceErr")
    );
    if (!fields) return;

    const status = eventForm.elements.status.value === "done" ? "done" : "in_progress";
    if (editingEventId) {
      const ev = getEvent(editingEventId);
      if (ev) {
        ev.name = fields.title;
        ev.sourceUrl = fields.url;
        setManualStatus(ev, status);
      }
      closeDialog(eventDialog);
      commit();
      toast("이벤트를 수정했어요");
    } else {
      const ev = { id: uid(), name: fields.title, sourceUrl: fields.url, manualStatus: null, steps: [] };
      setManualStatus(ev, status);
      state.events.push(ev);
      persist(state);
      closeDialog(eventDialog);
      select(ev.id);
      toast("이벤트를 추가했어요");
    }
  });

  clearRequiredErrorOnInput(eventForm.elements.name, $("#eventNameErr"));

  const stepDialog = $("#stepDialog");
  const stepForm = $("#stepForm");
  let editingStep = null;

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
    const fields = validateTitleAndUrl(f.title, $("#stepTitleErr"), "제목을 입력해 주세요.", f.url, $("#stepUrlErr"));
    if (!fields) return;

    const ev = getEvent(editingStep.eventId);
    if (!ev) {
      closeDialog(stepDialog);
      return;
    }
    const data = {
      title: fields.title,
      reward: f.reward.value.trim(),
      timing: f.timing.value.trim(),
      memo: f.memo.value.trim(),
      url: fields.url,
    };
    if (editingStep.stepId) {
      const s = ev.steps.find((x) => x.id === editingStep.stepId);
      if (s) Object.assign(s, data);
      toast("단계를 수정했어요");
    } else {
      changeSteps(ev, ev.steps.concat(Object.assign({ id: uid(), done: false }, data)));
      toast("단계를 추가했어요");
    }
    closeDialog(stepDialog);
    commit();
  });

  clearRequiredErrorOnInput(stepForm.elements.title, $("#stepTitleErr"));

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
          changeSteps(ev, ev.steps.filter((x) => x.id !== s.id));
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
    const next = parseState(await file.text());
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
    persist(state);
    select(ALL);
    toast("백업을 불러왔어요");
  });

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
      const ev = selectedEvent();
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
            persist(state);
            select(ALL);
            toast("이벤트를 삭제했어요");
          }
          break;
      }
      return;
    }

    const menuBtn = e.target.closest("[data-step-menu]");
    if (menuBtn) {
      const ev = selectedEvent();
      if (ev) openStepMenu(ev, menuBtn.dataset.stepMenu);
    }
  });

  mainEl.addEventListener("change", (e) => {
    const ev = selectedEvent();
    if (!ev) return;

    const toggle = e.target.closest("[data-toggle]");
    if (toggle) {
      const before = statusOf(ev);
      changeSteps(
        ev,
        ev.steps.map((s) => (s.id === toggle.dataset.toggle ? Object.assign({}, s, { done: toggle.checked }) : s))
      );
      commit();
      const after = statusOf(ev);
      if (before !== after) toast(after === "done" ? "모든 단계 완료! 🎉" : "진행 중으로 변경했어요");
      return;
    }

    if (e.target.matches("[data-status]")) {
      setManualStatus(ev, e.target.value === "done" ? "done" : "in_progress");
      commit();
    }
  });

  async function reportLoadProblem(problem) {
    if (problem.kind === "unavailable") {
      toast("저장 공간을 읽지 못했어요. 이번 변경은 저장되지 않을 수 있어요");
      return;
    }
    const where = problem.backupKey
      ? `원래 데이터는 "${problem.backupKey}" 키에 그대로 보관했어요.`
      : "원래 데이터를 따로 보관하지 못했어요. 새로 저장하기 전까지는 원래 자리에 남아 있어요.";
    const restore = await confirmAction(
      "저장된 데이터를 읽지 못했어요",
      `${where}\n예시 데이터로 덮어쓰지 않았어요. 백업 파일이 있으면 불러와 주세요.`,
      "백업 가져오기"
    );
    if (restore) importInput.click();
  }

  render();
  if (loaded.problem) reportLoadProblem(loaded.problem);

  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    const next = parseState(e.newValue);
    if (!next) {
      toast("다른 창에서 저장한 데이터를 읽지 못했어요");
      return;
    }
    state = next;
    render();
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      const hadController = !!navigator.serviceWorker.controller;
      let reloaded = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!hadController || reloaded) return;
        reloaded = true;
        window.location.reload();
      });
      navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {});
    });
  }
})();
