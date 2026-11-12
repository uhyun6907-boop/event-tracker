# 이벤트 트래커 (Event Tracker)

은행·증권 프로모션 이벤트를 **단계별 체크리스트**로 관리하는 모바일용 PWA입니다.
A mobile-first PWA for tracking bank/securities promotion events as step-by-step checklists.

- 🔗 **앱 주소 / Live:** https://uhyun6907-boop.github.io/event-tracker/
- 단계 체크, 리워드 합계(금액형 + 주식·쿠폰 같은 기타 리워드), 시점/마감, 메모, 링크
- 진행 중 / 완료 상태: 모든 단계를 체크하면 자동으로 **완료**, 하나라도 해제하면 **진행 중**으로 바뀝니다. 직접 바꿀 수도 있어요.
- 오프라인에서도 동작합니다 (서비스 워커 캐시).

## 데이터 저장 / Data storage

모든 데이터는 기기 브라우저의 **localStorage**(`event-tracker:v1` 키)에만 저장되고 서버로 전송되지 않습니다.
처음 실행하면 예시 이벤트 3개가 들어가며, 이후에는 저장된 데이터를 덮어쓰지 않습니다.
앱을 지우거나 사이트 데이터를 삭제하면 기록도 사라지므로, 상단 **⋯ 메뉴 → 백업 내보내기 / 가져오기**(JSON)로 백업해 두세요.

All data stays in `localStorage` on your device; nothing is sent anywhere. Use **⋯ → 백업 내보내기 / 가져오기** to export or import a JSON backup.

## 홈 화면에 설치 / Install

**iPhone (Safari)**
1. Safari에서 위 주소를 엽니다.
2. 하단 **공유** 버튼 → **홈 화면에 추가**를 누릅니다.

**Android (Chrome)**
1. Chrome에서 위 주소를 엽니다.
2. **⋮ 메뉴 → 앱 설치**(또는 **홈 화면에 추가**)를 누릅니다.

## 개발 / Development

빌드 과정 없는 정적 사이트(vanilla HTML/CSS/JS)입니다. No build step needed.

```bash
python3 -m http.server 8000   # http://localhost:8000
```

| 파일 | 설명 |
| --- | --- |
| `index.html` | 앱 셸, 다이얼로그 |
| `styles.css` | 스타일 (다크 테마, safe-area 대응) |
| `app.js` | 상태 관리, 렌더링, localStorage |
| `sw.js` | 서비스 워커 (앱 셸 프리캐시, cache-first) |
| `manifest.json` | 웹 앱 매니페스트 |

**배포 시 주의:** 앱 파일을 수정하면 `sw.js`의 `CACHE_VERSION`(예: `v1` → `v2`)을 올려야 설치된 앱이 새 버전을 받습니다.
When you change any app file, bump `CACHE_VERSION` in `sw.js` so installed copies pick up the update.

모든 경로가 상대 경로(`./`)라서 GitHub Pages 하위 경로(`/event-tracker/`)에서도 그대로 동작합니다.
