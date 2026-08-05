# 설문 응답 저장 — Google Forms 연결 설정

참가자가 설문(조건별 3회 + 최종 종합 1회, 총 4회)을 제출할 때마다 이 프로토타입이
자동으로 Google Form에 응답을 보냅니다. 응답은 폼의 "응답" 탭 또는 연결된
스프레드시트에 쌓입니다. (Apps Script 웹 앱 방식은 계정 보안 설정 때문에 공개
배포가 막혀서 Google Forms로 전환했습니다 — Forms는 원래 익명 공개 제출용으로
설계되어 있어 이런 권한 문제가 없습니다.)

## 1. Google Form 만들기

새 Google Form을 만들고, **아래 9개 필드를 순서대로 "단답형(short answer)"**으로
추가합니다. 질문 문구는 자유롭게 적으셔도 되고, 필드 이름만 맞으면 됩니다 (실제로는
필드의 `entry.XXXXXXX` ID만 사용되므로 라벨 자체는 프로토타입 동작에 영향 없음):

1. pid
2. timestamp
3. block
4. condition
5. destination
6. conditionOrder
7. likedActivityCount
8. likedRestaurantCount
9. answers_json ← 설문 문항 응답 전체가 JSON 문자열 하나로 여기 들어갑니다 (문항별로 필드를 따로 만들 필요 없음)

각 필드는 "필수" 표시를 **끄는 것을 추천**합니다 — 조건별 설문(block 1~3)에는
`condition`/`destination`/`likedActivityCount`/`likedRestaurantCount`가 채워지고
`conditionOrder`는 비어 있고, 최종 설문(block "final")에는 반대로
`conditionOrder`만 채워지고 나머지는 비어 있기 때문입니다.

## 2. 필드 ID(entry.XXXXXXX) 알아내기

1. 방금 만든 각 필드에 아무 값이나 입력해 채웁니다 (예: pid에 "test").
2. 우측 상단 **⋮(더보기 메뉴) → "사전 채우기 링크 받기"** 클릭.
3. **"링크 받기"** 클릭 → 나온 긴 URL을 복사합니다.
4. 이 URL을 저에게 그대로 전달해주세요 — `entry.123456=test&entry.234567=...` 형태로
   각 필드의 ID가 값과 함께 들어있어서, 제가 순서(1~9번 필드 입력값 기준)로 어떤
   `entry.XXXXXXX`가 어떤 필드인지 매칭해서 코드에 반영하겠습니다.

## 3. 제출 주소(action URL) 확인

폼 응답은 `.../viewform`이 아니라 `.../formResponse` 주소로 제출합니다. 2번에서 받은
사전 채우기 링크의 도메인 부분(`https://docs.google.com/forms/d/e/{formId}/`)에
`formResponse`를 붙인 주소를 제가 자동으로 구성합니다 — 별도로 안 알려주셔도 됩니다.

## 4. 동작 확인

1. 위 정보를 받으면 제가 `src/lib/surveyFormFields.ts`에 실제 값을 채워넣습니다.
2. `?preview=human` 등으로 프로토타입에 들어가 조건 하나를 끝까지 진행합니다.
3. 조건 종료 설문을 제출합니다.
4. Google Form의 "응답" 탭에 새 응답이 생겼는지 확인합니다.

## 참고: 데이터가 유실되지 않도록

- 매 제출은 최대 2번까지 자동 재시도합니다.
- 그래도 실패하면 참가자의 브라우저에 대기열로 저장해두고, **다음 설문 제출 시점에 자동으로 다시 시도**합니다 (조건 1의 제출이 실패해도 조건 2 설문을 제출할 때 같이 재전송을 시도합니다).
- 단, 마지막 설문(최종 종합)이 실패하면 더 이상 재시도할 다음 제출 기회가 없으므로, 배포 전에 반드시 파일럿 테스트로 정상 동작을 확인해주세요.
