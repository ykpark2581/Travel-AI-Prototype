# 설문 응답 저장 — Google Forms 연결 설정 (파일럿용)

> 이 문서는 **파일럿(pilot 브랜치)** 전용 구글 폼 설정 안내입니다 — 본실험(main
> 브랜치)은 완전히 별도의 구글 폼/시트를 쓰며, 이 문서가 다루는 내용과 무관합니다.
> 필드 이름 대부분은 본실험과 같지만, **`PreInterviewConsent`(사후 인터뷰 참여 의향)
> 필드가 아예 없고**, 대신 파일럿 소감을 묻는 `Pilot*` 필드 6개가 새로 추가된 점이
> 본실험과 다릅니다 — 파일럿 참가자에게는 사후 인터뷰를 안내하거나 묻지 않습니다.

참가자가 설문(사전 설문 1회 + 조건별 3회 + 최종 종합 1회, 총 5회)을 제출할 때마다 이
프로토타입이 자동으로 Google Form에 응답을 보냅니다. 응답은 폼의 "응답" 탭 또는 연결된
스프레드시트에 쌓이며, 스프레드시트는 결과적으로 아래와 같은 형태가 됩니다
(참가자 1명당 5행 — 사전 설문 1행 + 조건 3행 + 최종 1행):

| ParticipantName | timestamp | type | Q1 | … | Q10 | PreGender | … | PreAiTrust | Final_satisfaction | Final_satisfaction_reason | Final_improvement_feedback | PilotConfusingItems | PilotConfusingItemsDetail | PilotConfusingSteps | PilotConfusingStepsDetail | PilotImprovementSuggestion | PilotDuration | PreContact |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| K7QX2M9P | … | presurvey |  |  |  | 여성 | … | 5 |  |  |  |  |  |  |  |  |  |  |
| K7QX2M9P | … | mixed | 5 | … | 4 |  |  |  |  |  |  |  |  |  |  |  |  |  |
| K7QX2M9P | … | human | 4 | … | 3 |  |  |  |  |  |  |  |  |  |  |  |  |  |
| K7QX2M9P | … | ai | 6 | … | 5 |  |  |  |  |  |  |  |  |  |  |  |  |  |
| K7QX2M9P | … | final |  |  |  |  |  |  | 인간+AI 혼합 유형 | 탐색 과정이 재미있어서... | 가끔 추천 이유가 궁금했어요 | 있었다 | mc3 문항이 헷갈렸어요 | 없었다 |  | 체크리스트 간격을 좀 더 줬으면 | 20분 이상~30분 미만 | 010-1234-5678 |

> **`PreContact`는 이 프로토타입 전체에서 유일하게 실제 개인식별정보(휴대전화 번호)가
> 들어가는 필드**입니다 — 나머지 모든 데이터(`ParticipantName` 포함)는 처음부터 익명
> 설계입니다. 사전 설문이 아니라 **최종 설문(`final`) 행에서만** 채워지고, 참여 보상(모바일
> 상품권) 지급을 위해 **모든 참가자에게 필수**로 받습니다. 시트 접근 권한을 연구진으로만
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
  문항은 1~7 숫자 그대로 들어갑니다. 조건 행/최종 행에서는 비어 있습니다.
- `Final_satisfaction`/`Final_satisfaction_reason`/`Final_improvement_feedback`은 최종
  설문(`finalSurveyItems`의 fs1/fs2/fs3 — 세 가지 여행 계획 방식에 대한 선호/이유/아쉬운
  점)에 대응하며, 다른 모든 행에서는 비어 있습니다. `Final_satisfaction`은 자유 서술이
  아니라 **"인간주도 유형" / "인간+AI 혼합 유형" / "AI주도 유형" 중 하나를 고르는
  객관식**입니다 — 선택지 문구가 바뀌면 폼 쪽도 반드시 같이 바꿔야 합니다.
- `Pilot*`(6개)는 파일럿 소감 설문(`pilotSurveyItems`)에 대응하며, 최종 행에서만 채워집니다
  — 자세한 매핑은 아래 "파일럿 소감 설문 필드 매핑" 참고.
- `PreContact`도 최종 행에서만 채워집니다 — `src/data/questionnaire.ts`의
  `rewardSurveyItems`(phone), 최종 설문(`QuestionnaireScreen.tsx`) 마지막 단계("보상
  안내")의 응답입니다. 필드 이름은 예전 사전 설문 단계 때 쓰던 그대로지만("Pre" 접두어),
  지금은 최종 행에서만 채워진다는 점에 유의해주세요.

## 사전 설문(`presurvey`) 필드 매핑

| 필드 | 문항 | id (`preSurveyItems`) |
|---|---|---|
| PreGender | 귀하의 성별을 선택해주세요. (여성/남성/응답하고 싶지 않음) | gender |
| PreAge | 귀하의 연령대를 선택해주세요. (20대/30대/40대) | age |
| PreExploreBreadth | 나는 여행을 계획할 때 여러 출처에서 다양한 정보를 찾아보는 편이다. (1~7) | explore_breadth |
| PreExploreCompare | 나는 여행을 계획할 때 여러 선택지를 충분히 비교해보는 편이다. (1~7) | explore_compare |
| PrePlanEarly | 나는 여행을 떠나기 오래전부터 여행 계획을 세우는 편이다. (1~7) | plan_early |
| PrePlanDetailed | 나는 여행을 떠나기 전 여행 일정을 매우 구체적으로 계획하는 편이다. (1~7) | plan_detailed |
| PreAiFreq | 생성형 AI 서비스 사용 빈도 | ai_freq |
| PreAiTravelFreq | 여행 계획/정보 검색 시 생성형 AI 활용 빈도 | ai_travel_freq |
| PreAiTrust | 생성형 AI 제안에 대한 신뢰도 (1~7) | ai_trust |

프로토타입 화면에서는 "기본 정보"(gender~age) / "평소 여행 계획 방식"
(explore_breadth~plan_detailed) / "AI 사용 경험 및 인식"(ai_freq~ai_trust) 3개
구역으로 이 순서대로 나눠 보여주지만 (`src/data/questionnaire.ts`의 `preSurveyGroups`,
렌더링은 `SurveyForm.tsx`), 이건 순전히 화면 표시상의 구분일 뿐 — 문항 번호는 하나로
이어지고, 시트에는 각자 자기 필드에 독립적으로 저장됩니다.

## 최종 설문(`final`) 필드 매핑 — 만족도 + 파일럿 소감 + 보상

`QuestionnaireScreen.tsx`가 한 화면 안에서 세 단계로 나뉩니다 — "다음"/"다음"을 누르기
전까지는 아무것도 제출되지 않고, 세 번째 단계의 "제출"을 눌러야 아래 필드가 전부
**한 행**으로 함께 제출됩니다.

**1단계 — 세 가지 방식에 대한 만족도**

| 필드 | 문항 | id |
|---|---|---|
| Final_satisfaction | 세 가지 여행 계획 방식 중 가장 선호하는 방식은 무엇이었나요? (인간주도 유형/인간+AI 혼합 유형/AI주도 유형) | fs1 (`finalSurveyItems`) |
| Final_satisfaction_reason | 위 방식을 가장 선호한 이유는 무엇인가요? | fs2 (`finalSurveyItems`) |
| Final_improvement_feedback | 세 가지 여행 계획 방식을 경험하면서 아쉽거나 불편했던 점이 있었다면 자유롭게 작성해 주세요. | fs3 (`finalSurveyItems`) |

**2단계 — 파일럿 소감** (파일럿 전용, 본실험 폼에는 없는 필드들)

| 필드 | 문항 | id (`pilotSurveyItems`) | 비고 |
|---|---|---|---|
| PilotConfusingItems | 설문 문항을 이해하거나 응답하는 데 어려운 부분이 있었습니까? (없었다/있었다) | pilot_confusing_items | 필수 |
| PilotConfusingItemsDetail | '있었다'를 선택한 경우, 어떤 문항이 어려웠는지 적어주십시오. | pilot_confusing_items 항목의 followUp | 선택 |
| PilotConfusingSteps | 연구를 진행하면서 다음에 무엇을 해야 하는지 이해하기 어렵거나 헷갈린 순간이 있었습니까? (없었다/있었다) | pilot_confusing_steps | 필수 |
| PilotConfusingStepsDetail | '있었다'를 선택한 경우, 어느 단계에서 어떤 점이 어려웠는지 적어주십시오. | pilot_confusing_steps 항목의 followUp | 선택 |
| PilotImprovementSuggestion | 프로토타입 또는 연구 절차에서 수정하거나 개선할 필요가 있다고 느낀 부분이 있다면 자유롭게 적어주십시오. | pilot_improvement_suggestion | 선택 |
| PilotDuration | 이번 파일럿 연구의 전체 과정을 완료하는 데 대략 얼마나 걸렸습니까? (20분 미만/20분 이상~30분 미만/30분 이상~40분 미만/40분 이상~50분 미만/50분 이상) | pilot_duration | 필수 |

"선택" 표시된 두 필드(`*Detail`)는 화면에서도 실제로 선택 응답입니다 — 참가자가
비워두고 제출해도 정상 처리되며, 그 경우 시트의 해당 칸은 그냥 빈 채로 남습니다. 다만
폼 자체에는 이 필드가 반드시 존재해야 하므로(참가자가 답을 입력하면 어딘가로는 가야
하니까), 폼 만드실 때 **필수 응답으로 설정하지 마세요** — 그 외에는 일반 단답형/서술형
필드로 만들면 됩니다. `PilotConfusingItems`/`PilotConfusingSteps`/`PilotDuration`은
정확히 위 괄호 안 선택지 문구 그대로 객관식으로 만들어 주세요 — 문구가 한 글자라도
다르면 Forms가 제출을 거부합니다.

**3단계 — 보상**

| 필드 | 문항 | id |
|---|---|---|
| PreContact | 모바일 상품권을 받으실 휴대전화 번호를 입력해 주세요. | phone (`rewardSurveyItems`) |

파일럿에는 사후 인터뷰 관련 질문이 전혀 없습니다 — 본실험과 달리 이 단계는 전화번호
하나로 끝입니다.

## (선택) 순서 효과 분석용 추가 필드 4개

연구에서 조건 제시 순서의 영향까지 보고 싶다면, 아래 4개를 폼에 추가로 만들어도 됩니다 —
안 만들어도 프로토타입은 정상 동작합니다 (코드가 해당 필드를 자동으로 건너뜁니다):

- block — 이 참가자에게 몇 번째로 제시된 조건인지 (1/2/3, 사전 설문/최종 행은 비어 있음)
- conditionOrder — 이 참가자의 조건 제시 순서 전체 (예: `mixed-human-ai`, 조건 행은 비어 있음)
- likedActivityCount — 해당 조건에서 좋아요 누른 액티비티 수
- likedRestaurantCount — 해당 조건에서 좋아요 누른 식당 수
- destination — 조건 행의 목적지명 (조건 행에만 채워짐)

## 폼 만드는 법 요약

1. 위 필드들을 새 Google Form에 만듭니다 (필드 이름/순서는 자유 — entry ID로 매칭하니
   시트 헤더 이름 자체는 원하는 대로 바꾸셔도 됩니다).
2. 폼의 **⋮(더보기 메뉴) → "사전 채우기 링크 받기"**로 들어가, 만든 문항 전부를 각자
   구분되는 값으로 한 번씩 채운 뒤 "링크 받기"를 누릅니다.
3. 나온 URL을 저에게 전달해주세요 — URL의 querystring에 담긴 `entry.XXXXXXX` ID들을
   읽어서 `src/lib/surveyFormFields.ts`의 `REPLACE_entry_id` 자리를 전부 채우겠습니다.

## 동작 확인

1. 사전 설문을 확인하려면 `?preview=` 없이(동의 화면부터) 처음부터 진행해야 합니다 —
   `?preview=human` 등은 동의/사전 설문을 건너뛰고 바로 조건으로 들어가는 개발용
   단축키라 사전 설문 제출을 테스트할 수 없습니다. 동의 화면 → 사전 설문 제출까지 한
   번 해보고, 이후에는 `?preview=human` 등으로 조건 하나를 끝까지 진행합니다.
2. 조건 종료 설문을 제출합니다.
3. 최종 설문을 확인하려면 `?preview=survey`로 곧장 진입할 수 있습니다 — "마지막 설문"
   (fs1/fs2/fs3) → "파일럿 참여 소감"(pilot_*)에서 "다음"을 눌러도 아직 아무것도
   제출되지 않으니, 이 시점에 새 응답이 생기지 않는 게 정상입니다. 이어지는 "보상
   안내"(phone)까지 답하고 "제출"을 눌러야 최종 행 하나가 위 표의 필드를 모두 채운
   채로 제출됩니다.
4. Google Form의 "응답" 탭에 새 응답이 생겼는지, 열이 위 표대로 채워졌는지 확인합니다.

## 참고: 데이터가 유실되지 않도록

- 매 제출은 최대 2번까지 자동 재시도합니다.
- 그래도 실패하면 참가자의 브라우저에 대기열로 저장해두고, **다음 설문 제출 시점에 자동으로 다시 시도**합니다 (사전 설문이나 조건 1의 제출이 실패해도 그다음 설문을 제출할 때 같이 재전송을 시도합니다).
- 단, 마지막 설문(최종 종합)이 실패하면 더 이상 재시도할 다음 제출 기회가 없으므로, 배포 전에 반드시 파일럿 테스트로 정상 동작을 확인해주세요.
