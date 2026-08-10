# ◆ ??? ◆

정적 웹페이지 기반 방치형(비밀 해금형) 게임입니다.

## GitHub Pages 배포 방법

1. 새 GitHub 저장소를 만듭니다 (예: `secret-corn`).
2. `index.html`, `style.css`, `game.js` 세 파일을 저장소 루트에 업로드합니다.
3. 저장소 **Settings → Pages**로 이동합니다.
4. **Source**를 `Deploy from a branch`로 설정하고, 브랜치는 `main`, 폴더는 `/ (root)`로 선택 후 저장합니다.
5. 잠시 후 `https://<사용자명>.github.io/<저장소명>/` 주소로 접속하면 게임이 열립니다.

## 파일 구성

- `index.html` — 페이지 구조
- `style.css` — 비주얼(다크·금빛 톤)
- `game.js` — 게임 로직 (1초당 옥수수 1개 획득, 저장은 브라우저 localStorage 사용)

## 참고

- 데이터는 플레이어의 브라우저(localStorage)에만 저장됩니다. 서버나 별도 DB는 필요 없습니다.
- 콘텐츠 잠금 해제 조건은 코드 안에 존재하지만, 플레이어가 스스로 찾아내도록 설계되어 있습니다.
