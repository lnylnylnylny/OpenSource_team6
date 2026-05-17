# OpenSource_team6

# 주식 차트 예측 및 학습용 퀴즈 웹/앱

### 팀명 : 6픈소스
|이나영|이재희|이우진|황태하|
|---|---|---|---|
|팀장|팀원|팀원|팀원|
|[lnylnylnylny](https://github.com/lnylnylnylny)|[ij5](https://github.com/ij5)|[mathlike1105](https://github.com/mathlike1105)|[taehatae](https://github.com/taehatae)|

사용 스택  
frontend : React  
backend : flask  
AI : Python
Database: PostgreSQL

### 규칙 정리

1. 함수 선언
   - 화살표 함수 (Arrow Function) 사용
2. 폴더명
   - 소문자 + kebab-case
3. 컴포넌트 파일명
   - 대문자 + PascalCase
   - 컴포넌트의 폴더명과 동일하게 작성
4. 유틸함수 파일명
   - 소문자 + camelCase

### 커밋 메시지 / 브랜치 명칭

- feat: 새로운 기능 추가
- fix: 버그 수정
- docs: 문서 수정
- refactor: 코드 리팩토링

### 폴더 구조 요약

| 폴더 이름     | 역할                        |
| ------------- | --------------------------- |
| `api/`        | API 요청 관련 코드          |
| `assets/`     | 이미지, 아이콘 등 정적 자원 |
| `components/` | 재사용 가능한 UI 컴포넌트   |
| `pages/`      | 라우팅되는 페이지 컴포넌트  |
| `utils/`      | 유틸리티 함수               |
| `store/`      | 상태 관리 관련 코드         |
| `types/`      | TypeScript 타입 정의        |

## Contribution

초기 시작 시 repository 클론 후 `.env` 파일을 수정한 뒤, 다음 명령어를 실행하여 개발 환경을 설정하세요.

데이터베이스 스키마(구조) 관리를 용이하게 하기 위해 `alembic` 마이그레이션 라이브러리를 사용합니다.

백엔드의 경우 `alembic.ini.example` 파일을 기반으로 `alembic.ini` 파일을 새로 생성한 뒤, `sqlalchemy.url`에 백엔드 `.env`의 `DB_URL2` 값으로 변경하세요.

### Frontend
```bash
cd frontend/
bun i
bun run dev
```

### Backend

```bash
cd backend/
uv sync
uv run uvicorn main:app # or uv run fastapi dev
```

### Database

데이터베이스 구조를 최신 상태로 유지하기 위해 pull 이후에 아래 명령어를 실행하세요.

```bash
cd backend/
uv run alembic upgrade head
```

또한 테이블 수정/추가 시 `model` 폴더 내에서 작업해주세요. 

새로 테이블을 추가했다면 `model/__init__.py` 파일에서 해당 클래스를 import해줘야 합니다.

마지막으로 데이터베이스 스키마에 변경 사항이 있을 경우, 커밋 전 반드시 다음 명령어를 사용하여 마이그레이션 파일을 만들어주세요.

```bash
uv run alembic revision --autogenerate -m "테이블 변경 내역 요약"
```
