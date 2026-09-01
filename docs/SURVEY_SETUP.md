# 설문 응답 저장 — Google Forms 연결 설정

> **PILOT 브랜치 안내**: 이 문서는 **본실험(main 브랜치)** 구글 폼 기준으로 작성되어
> 있습니다 — 아래 필드/entry ID는 본실험 폼 얘기이고, 파일럿은 완전히 별도의 새 구글
> 폼을 씁니다. 파일럿 폼에 실제로 만들어야 하는 필드 목록과 순서는
> `src/lib/surveyFormFields.ts` 파일 맨 아래 주석에 정리해 두었으니 그걸 보고
> 진행해주세요 (본실험과 필드 이름은 대부분 같지만, `PreInterviewConsent`가 없고
> `Pilot*` 필드 6개가 새로 추가된 점이 다릅니다). 폼을 다 만드신 후 "사전 채우기 링크
> 받기"로 얻은 URL을 주시면 이 파일의 `REPLACE_entry_id` 자리를 채우겠습니다 — 아래
> 설명된 워크플로우(문항마다 구분되는 값을 채운 뒤 링크 받기)는 파일럿 폼에도 동일하게
> 적용됩니다.

참가자가 설문(사전 설문 1회 + 조건별 3회 + 최종 종합 1회, 총 5회)을 제출할 때마다 이
프로토타입이 자동으로 Google Form에 응답을 보냅니다. 응답은 폼의 "응답" 탭 또는 연결된
스프레드시트에 쌓이며, 스프레드시트는 결과적으로 아래와 같은 형태가 됩니다
(참가자 1명당 5행 — 사전 설문 1행 + 조건 3행 + 최종 1행):

| ParticipantName | timestamp | type | destination | Q1 | … | Q10 | PreGender | PreAge | PreExploreBreadth | PreExploreCompare | PrePlanEarly | PrePlanDetailed | PreAiFreq | PreAiTravelFreq | PreAiTrust | Final_satisfaction | Final_satisfaction_reason | Final_improvement_feedback | PreContact | PreInterviewConsent |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| K7QX2M9P | … | presurvey |  |  |  |  | 여성 | 30대 | 5 | 6 | 4 | 3 | 월 1-3회 | 가끔 활용함 | 5 |  |  |  |  |  |
| K7QX2M9P | … | mixed | 방콕 | 5 | … | 4 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| K7QX2M9P | … | human | 베트남 | 4 | … | 3 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| K7QX2M9P | … | ai | 대만 | 6 | … | 5 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| K7QX2M9P | … | final |  |  |  |  |  |  |  |  |  |  |  |  |  | 인간+AI 혼합 유형 | 탐색 과정이 재미있어서... | 가끔 추천 이유가 궁금했어요 | 010-1234-5678 | 예, 참여할 의향이 있습니다. |

> **`PreContact`는 이 프로토타입 전체에서 유일하게 실제 개인식별정보(휴대전화 번호)가
> 들어가는 필드**입니다 — 나머지 모든 데이터(`ParticipantName` 포함)는 처음부터 익명
> 설계입니다. 사전 설문이 아니라 **최종 설문(`final`) 행에서만** 채워지고, 참여 보상(모바일
> 상품권) 지급을 위해 **모든 참가자에게 필수**로 받습니다 — `PreInterviewConsent`("예,
> 참여할 의향이 있습니다."/"아니요.")도 같은 최종 행에서 채워지며, 이건 여전히 선택
> 응답입니다. 이름을 아예 수집하지 않게 되면서, 예전에 이름을 받던 바로 그 폼 질문을
> `PreInterviewConsent`로 재활용했습니다(entry ID는 그대로, 질문만 리타이틀) — 별도의
> "PreName" 필드는 이제 없습니다. 아래 "필요한 작업" 참고. 시트 접근 권한을 연구진으로만
> 제한하고, `data/onboarding.ts`의 동의서 문구가 약속한 보관 기간(연구 종료 후 3년)이
> 지나면 삭제해 주세요.

- `ParticipantName`은 이름이 아니라 **참가자가 입력하지 않는, 자동 생성된 8자리 익명
  코드**입니다(예: `K7QX2M9P`) — 동의 화면에 이름/번호를 입력하는 칸 자체가 없어서 실명이
  들어갈 여지가 없습니다. 같은 참가자의 5개 행(사전 설문 1개 + 조건 3개 + 최종 1개)은 이
  코드로만 묶입니다. 컬럼 이름은 요청하신 시트 헤더에 맞춰 그대로 "ParticipantName"으로
  뒀지만, 원하시면 "ParticipantCode" 등으로 폼 필드 라벨만 바꾸셔도 동작에는 영향 없습니다.
- `type`은 사전 설문 행에서는 `presurvey`, 조건 행에서는 내부 조건 코드(`human`/`mixed`/
  `ai`, 참가자에게는 절대 노출되지 않음), 최종 행에서는 `final`입니다.
- `Q1`~`Q10`은 조건 행에서만 채워지며, `src/data/questionnaire.ts`의 `conditionSurveyItems`
  10개 문항(mc1, mc2, mc3, dv1, dv6, dv2, dv4, dv7, dv8, dv9)에 **순서대로** 1:1 대응합니다.
  mc3(AI주도 조작 점검)은 세 조건 모두에게 동일하게 묻습니다 — 표준적인 조작 점검
  설계상 실제 조건과 무관하게 세 문항 모두 매번 채워집니다. dv9(전반적 만족도)는 가장
  마지막 문항입니다. 사전 설문/최종 행에서는 비어 있습니다.
- `PreGender`~`PreAiTrust`(9개)는 사전 설문 행에서만 채워지며, `src/data/questionnaire.ts`의
  `preSurveyItems` 9개 문항에 각각 전용 필드로 1:1 대응합니다 (아래 표). 선택형 문항
  (연령대/성별/AI 사용빈도/여행 시 AI 활용빈도)은 실제 선택한 텍스트 그대로, likert
  문항은 1~7 숫자 그대로 들어갑니다. 조건 행/최종 행에서는 비어 있습니다. 이 9개는
  전부 익명 데이터이고, 실명·연락처는 여기 없습니다 — 아래 참고.
- `Final_satisfaction`/`Final_satisfaction_reason`/`Final_improvement_feedback`은 최종
  설문(`finalSurveyItems`의 fs1/fs2/fs3)에 대응하며, 다른 모든 행에서는 비어 있습니다.
  `Final_satisfaction`은 자유 서술이 아니라 **"인간주도 유형" / "인간+AI 혼합 유형" /
  "AI주도 유형" 중 하나를 고르는 객관식**입니다 (`src/data/questionnaire.ts`의
  `finalSurveyItems`의 fs1 — 프로토타입 쪽 선택지 문구가 바뀌면 이 3개도 반드시 같이
  바꿔야 합니다, 아래 참고). 참고로 이 최종 문항만 유일하게 조건 이름을 직접 노출합니다
  — 이 시점엔 참가자가 세 조건을 모두 마친 뒤라 앞으로 남은 과업에 편향을 줄 위험이
  없기 때문입니다. `Final_improvement_feedback`(세 가지 방식을 경험하며 아쉽거나
  불편했던 점)은 fs2와 마찬가지로 자유 서술입니다.
- `PreContact`/`PreInterviewConsent`도 최종 행에서만 채워집니다 —
  `src/data/questionnaire.ts`의 `rewardSurveyItems`(phone/interview_consent), 최종
  설문(`QuestionnaireScreen.tsx`) 두 번째 단계("보상 및 사후 인터뷰 안내")의 응답입니다.
  `PreContact`는 참여 보상(모바일 상품권 지급용 휴대전화 번호)이라 **모든 참가자에게
  필수**, `PreInterviewConsent`는 그 아래 이어지는 선택 응답입니다. 필드 이름은 예전
  사전 설문 단계 때 쓰던 그대로지만("Pre" 접두어), 지금은 최종 행에서만 채워진다는 점에
  유의해주세요.

## 사전 설문(`presurvey`) 필드 매핑

| 필드 | 문항 | id (`preSurveyItems`) | 상태 |
|---|---|---|---|
| PreGender | 귀하의 성별을 선택해주세요. (여성/남성/응답하고 싶지 않음) | gender | 완료 |
| PreAge | 귀하의 연령대를 선택해주세요. (20대/30대/40대) | age | 완료 |
| PreExploreBreadth | 나는 여행을 계획할 때 여러 출처에서 다양한 정보를 찾아보는 편이다. (1~7) | explore_breadth | 완료 |
| PreExploreCompare | 나는 여행을 계획할 때 여러 선택지를 충분히 비교해보는 편이다. (1~7) | explore_compare | 완료 |
| PrePlanEarly | 나는 여행을 떠나기 오래전부터 여행 계획을 세우는 편이다. (1~7) | plan_early | 완료 |
| PrePlanDetailed | 나는 여행을 떠나기 전 여행 일정을 매우 구체적으로 계획하는 편이다. (1~7) | plan_detailed | 완료 |
| PreAiFreq | 생성형 AI 서비스 사용 빈도 | ai_freq | 완료 |
| PreAiTravelFreq | 여행 계획/정보 검색 시 생성형 AI 활용 빈도 | ai_travel_freq | 완료 |
| PreAiTrust | 생성형 AI 제안에 대한 신뢰도 (1~7) | ai_trust | 완료 |

프로토타입 화면에서는 "기본 정보"(gender~age) / "평소 여행 계획 방식"
(explore_breadth~plan_detailed) / "AI 사용 경험 및 인식"(ai_freq~ai_trust) 3개
구역으로 이 순서대로 나눠 보여주지만 (`src/data/questionnaire.ts`의 `preSurveyGroups`,
렌더링은 `SurveyForm.tsx`), 이건 순전히 화면 표시상의 구분일 뿐 — 문항 번호는 하나로
이어지고, 시트에는 각자 자기 필드에 독립적으로 저장됩니다.

문항 문구나 선택지가 바뀌면 `src/data/questionnaire.ts`의 `preSurveyItems`와 폼 양쪽을
반드시 같이 업데이트해야 합니다 — 특히 객관식 필드를 텍스트로 검증하도록 만드셨다면(예:
PreAge를 "객관식"으로 설정), 문구가 한 글자라도 다르면 제출이 거부됩니다.

## 최종 설문(`final`) 필드 매핑 — 만족도 + 보상/사후 인터뷰

`QuestionnaireScreen.tsx`가 이제 한 화면 안에서 두 단계로 나뉩니다 — "다음"을 누르기
전까지는 아무것도 제출되지 않고, 두 번째 단계의 "제출"을 눌러야 아래 5개 필드가 전부
**한 행**으로 함께 제출됩니다.

| 필드 | 문항 | id | 상태 |
|---|---|---|---|
| Final_satisfaction | 세 가지 여행 계획 방식 중 가장 선호하는 방식은 무엇이었나요? (인간주도 유형/인간+AI 혼합 유형/AI주도 유형) | fs1 (`finalSurveyItems`) | 완료 |
| Final_satisfaction_reason | 위 방식을 가장 선호한 이유는 무엇인가요? | fs2 (`finalSurveyItems`) | 완료 |
| Final_improvement_feedback | 세 가지 여행 계획 방식을 경험하면서 아쉽거나 불편했던 점이 있었다면 자유롭게 작성해 주세요. | fs3 (`finalSurveyItems`) | 완료 |
| PreContact | 모바일 상품권을 받으실 휴대전화 번호를 입력해 주세요. | phone (`rewardSurveyItems`) | 완료 |
| PreInterviewConsent | 사후 인터뷰에 참여할 의향이 있으십니까? (예, 참여할 의향이 있습니다./아니요.) | interview_consent (`rewardSurveyItems`) | **폼 수정 필요** |

### 필요한 작업: 기존 "이름을 입력해주세요." 질문을 인터뷰 동의 질문으로 리타이틀

새 질문을 추가하는 대신, 이름을 받던 그 질문 **하나를 그대로 재활용**합니다 — 이름
자체는 이제 전혀 수집하지 않으므로, 그 질문의 제목만 아래처럼 바꿔주시면 됩니다
(질문을 삭제하고 새로 만들지 마세요 — 그러면 entry ID가 바뀌어서 다시 알려주셔야
합니다):

1. 기존 "이름을 입력해주세요." 질문을 찾습니다.
2. 질문 제목을 **"사후 인터뷰에 참여할 의향이 있으십니까?"**로 바꿉니다.
3. (권장, 필수는 아님) 질문 유형을 단답형(short answer)에서 **객관식**으로 바꾸고,
   선택지를 정확히 **"예, 참여할 의향이 있습니다."** / **"아니요."**로 추가합니다 — 이
   프로토타입은 항상 이 두 문자열 중 하나만 보내므로 단답형으로 남겨둬도 정상 동작은
   하지만, 객관식으로 바꾸면 시트에 오타 없는 깔끔한 응답만 쌓입니다. 이때 선택지
   문구가 한 글자라도 다르면 Forms가 제출을 거부하니 정확히 위 문구 그대로 입력해
   주세요.
4. 이 질문이 **필수(반드시 응답)**로 설정되어 있는지 확인해 주세요 — 이 프로토타입은
   `rewardSurveyItems`의 phone/interview_consent 둘 다 항상 값을 채워서 보내므로
   필수여도 문제없지만, 혹시 새로 만든 다른 질문이 필수인데 이 프로토타입이 값을 안
   보내는 경우가 생기면 **최종 설문(가장 마지막 제출!)이 매 참가자마다 조용히
   거부**됩니다 — Forms는 이런 경우에도 200 응답을 돌려줘서 코드 쪽에서는 실패를 전혀
   감지하지 못합니다. 이미 이번 세션에서 다른 필수 필드 문구 불일치로 한 번 겪었던
   것과 정확히 같은 실패 유형이니, 폼을 수정하실 때마다 한 번씩 유의해 주세요.

entry ID는 `entry.1921088397`로 코드에 이미 반영해 뒀습니다 (질문 제목/유형을 바꿔도
Forms는 entry ID를 그대로 유지합니다) — 리타이틀만 해주시면 별도로 저에게 알려주실
내용은 없습니다.

## (선택) 순서 효과 분석용 추가 필드 4개

연구에서 조건 제시 순서의 영향까지 보고 싶다면, 아래 4개를 폼에 추가로 만들어도 됩니다 —
안 만들어도 프로토타입은 정상 동작합니다 (코드가 해당 필드를 자동으로 건너뜁니다):

- block — 이 참가자에게 몇 번째로 제시된 조건인지 (1/2/3, 사전 설문/최종 행은 비어 있음)
- conditionOrder — 이 참가자의 조건 제시 순서 전체 (예: `mixed-human-ai`, 조건 행은 비어 있음)
- likedActivityCount — 해당 조건에서 좋아요 누른 액티비티 수
- likedRestaurantCount — 해당 조건에서 좋아요 누른 식당 수
- destination — 조건 행의 목적지명 (조건 행에만 채워짐)

새 필드를 추가하면 **⋮(더보기 메뉴) → "사전 채우기 링크 받기" → "링크 받기"**로 나온
URL을 저에게 전달해주세요 — `entry.XXXXXXX` ID를 매칭해서 `src/lib/surveyFormFields.ts`에
반영하겠습니다.

## 동작 확인

1. 사전 설문을 확인하려면 `?preview=` 없이(동의 화면부터) 처음부터 진행해야 합니다 —
   `?preview=human` 등은 동의/사전 설문을 건너뛰고 바로 조건으로 들어가는 개발용
   단축키라 사전 설문 제출을 테스트할 수 없습니다. 동의 화면 → 사전 설문 제출까지 한
   번 해보고, 이후에는 `?preview=human` 등으로 조건 하나를 끝까지 진행합니다.
2. 조건 종료 설문을 제출합니다.
3. 최종 설문을 확인하려면 `?preview=survey`로 곧장 진입할 수 있습니다 — "마지막 설문"
   (fs1/fs2/fs3)에서 "다음"을 눌러도 아직 아무것도 제출되지 않으니, 이 시점에 새 응답이
   생기지 않는 게 정상입니다. 이어지는 "보상 및 사후 인터뷰 안내"(phone/
   interview_consent)까지 답하고 "제출"을 눌러야 최종 행 하나가 5개 필드
   (Final_satisfaction/Final_satisfaction_reason/Final_improvement_feedback/
   PreContact/PreInterviewConsent)를 모두 채운 채로 제출됩니다.
4. Google Form의 "응답" 탭에 새 응답이 생겼는지, 열이 위 표대로 채워졌는지 확인합니다.

## 참고: 데이터가 유실되지 않도록

- 매 제출은 최대 2번까지 자동 재시도합니다.
- 그래도 실패하면 참가자의 브라우저에 대기열로 저장해두고, **다음 설문 제출 시점에 자동으로 다시 시도**합니다 (사전 설문이나 조건 1의 제출이 실패해도 그다음 설문을 제출할 때 같이 재전송을 시도합니다).
- 단, 마지막 설문(최종 종합)이 실패하면 더 이상 재시도할 다음 제출 기회가 없으므로, 배포 전에 반드시 파일럿 테스트로 정상 동작을 확인해주세요.
