export const consentContent = {
  title: "연구 참여 안내 및 동의서",
  paragraphs: [
    {
      heading: "연구 목적",
      body: ["본 연구는 AI 기반 여행 계획 서비스를 이용하는 과정에서 사용자가 느끼는 경험과 인식을 알아보기 위해 진행됩니다."],
    },
    {
      heading: "소요 시간",
      body: [
        "전체 실험 참여에는 약 15-20분이 소요됩니다. 실험 종료 후 일부 참가자에게는 추가 인터뷰 참여를 요청드릴 수 있습니다.",
      ],
    },
    {
      heading: "참여 절차",
      body: ["참가자는 AI 기반 여행 계획 서비스를 이용한 여행 계획 과업과 관련 설문을 수행하게 됩니다."],
    },
    {
      heading: "자발적 참여",
      body: [
        "연구 참여는 전적으로 자발적입니다. 참여를 원하지 않으시면 연구를 시작하지 않아도 되며, 참여 중에도 언제든지 중단할 수 있습니다. 참여를 거부하거나 중단하더라도 어떠한 불이익도 없습니다. 연구 참여 완료 이후에도 아래 연구자 연락처로 요청하시면 본인의 자료를 삭제해 드립니다.",
      ],
    },
    {
      heading: "개인정보 수집 및 비밀 보장",
      body: [
        "본 연구는 학술 연구 목적으로만 수행되며, 수집된 자료는 연구 목적 외의 용도로 사용되지 않습니다. 본 연구에서는 연령대, 성별 및 설문 응답을 수집하며, 이름·연락처 없이 익명의 참가자 코드로만 관리되어 개인을 식별할 수 없습니다.",
        "설문 마지막에는 희망하시는 분에 한해 사후 인터뷰 참여 의향을 별도로 여쭙습니다. 참여 의향이 있다고 응답하신 경우에만 인터뷰 대상자 선정 및 연락을 위해 이름과 연락처를 추가로 수집하며, 해당 목적으로만 사용되고 연구진만 접근할 수 있는 공간에 안전하게 보관됩니다. 참여 의향을 밝히지 않으셔도 본 연구 참여에는 전혀 영향이 없습니다. 주민등록번호 등 그 밖의 민감한 개인정보는 수집하지 않습니다.",
        "수집된 자료는 연구 분석, 학술 발표 및 논문 작성에 활용될 수 있으며, 연구 결과는 개인을 식별할 수 없는 형태로만 보고됩니다. 수집된 자료는 연구 종료 후 3년 동안 안전하게 보관한 뒤 폐기됩니다.",
      ],
    },
    {
      heading: "예상되는 위험",
      body: ["본 연구 참여로 인해 예상되는 신체적 위험은 없습니다. 연구 참여 과정에서 불편함을 느끼는 경우 언제든지 참여를 중단할 수 있습니다."],
    },
    {
      heading: "문의처",
      body: [
        "본 연구에 대해 궁금한 점이 있거나 연구 참여와 관련하여 문의 사항이 있는 경우 아래 연구자에게 연락하실 수 있습니다.",
        "연구자　박윤경",
        "소속　연세대학교 정보대학원 / axlab",
      ],
      // Rendered as a real mailto <a> (see ConsentScreen.tsx) rather than
      // plain body text — the only paragraph that needs a live link, so a
      // dedicated field here beats teaching every paragraph to parse
      // markdown-style link syntax for this one case.
      email: "ykpark@yonsei.ac.kr",
    },
  ],
  // Only 2 checkboxes now — the old 3rd ("나는 이름·연락처 등 개인정보의
  // 수집·이용에 동의합니다.") is gone. That consent isn't blanket/upfront
  // anymore: it's captured contextually by the interview_consent question
  // itself, right where name/contact are actually about to be asked for
  // (see data/questionnaire.ts's preSurveyItems) — a separate checkbox
  // here would just be redundant with (and easy to drift out of sync
  // with) that in-context choice.
  checkboxes: [
    "나는 본 연구의 목적, 절차, 예상 소요 시간, 개인정보 처리 방식 및 참여 중단 가능성에 대한 설명을 읽고 이해했습니다.",
    "나는 본 연구에 자발적으로 참여하는 것에 동의합니다.",
  ],
  continueLabel: "동의하고 계속하기",
};

export const introductionContent = {
  title: "실험 진행 안내",
  points: [
    "본 실험에서는 총 3번의 여행 계획을 진행합니다.",
    "각 여행 계획에서는 서로 다른 여행지를 대상으로 AI 여행 도우미와 함께 여행 일정을 구성하게 됩니다.",
    "각 여행 계획이 끝난 후에는 방금 경험한 여행 계획 방식에 대한 간단한 설문에 응답해 주세요.",
  ],
  // Rendered as its own emphasized callout (see IntroductionScreen.tsx),
  // deliberately styled differently from the bullet list above — this is
  // the one line asking for a specific mindset while doing the task, not
  // another fact about the study's structure, so it shouldn't just read as
  // a 4th bullet.
  note: "실제로 해당 여행을 떠난다고 생각하고 진행해 주세요.",
  continueLabel: "실험 시작하기",
};
