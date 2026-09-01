// Transcribed from the researcher's IRB-approved "온라인 설명문" (연세대학교
// 생명윤리위원회), section 2's item counts corrected to match the actual
// instrument — the source PDF said 사전 설문 "총 10문항" and 조건별 설문
// "8문항", but data/questionnaire.ts's preSurveyItems/conditionSurveyItems
// both have 9 (confirmed correct by the researcher — mc3 was re-added to
// conditionSurveyItems after the PDF was originally drafted, see that
// array's own comment). Everything else here still matches the PDF word for
// word, except section 8 (연구 문의), which moved out of `paragraphs` into
// its own `contactBox` below (still the same words, just a different
// container). The source PDF itself still reads 10/8 — get it amended to
// 9/9 with the IRB to keep the formally-approved document in sync with
// what participants actually see here.
export const consentContent = {
  title: "연구 참여 안내 및 동의서",
  paragraphs: [
    {
      heading: "",
      body: ["안녕하세요. 본 연구에 참여해주셔서 감사합니다.", "연구 참가 시작 전, 본 연구에 대해 설명드리도록 하겠습니다."],
    },
    {
      heading: "1. 연구의 배경과 목적",
      body: [
        "AI 기반 서비스는 사용자의 정보 탐색과 의사결정을 지원하는 다양한 상호작용 방식을 제공하고 있습니다. 본 연구는 AI 기반 여행 계획 서비스의 여러 상호작용 방식을 이용하는 과정에서 나타나는 사용자의 경험과 인식을 알아보기 위해 진행됩니다. 연구 결과는 향후 AI 기반 여행 계획 서비스와 인간-AI 협업 인터페이스를 개선하기 위한 기초자료로 활용될 수 있습니다.",
      ],
    },
    {
      heading: "2. 연구대상자의 참여 기간, 절차 및 소요 시간",
      body: [
        "귀하는 본 설명문을 확인하기에 앞서 연령, 인터넷에 연결된 PC(데스크톱 또는 노트북) 이용 가능 여부 및 대화형 생성형 AI 서비스 사용 경험을 확인하는 총 3개의 스크리닝 문항에 응답하였습니다. 스크리닝 결과 연구대상자 선정기준을 모두 충족한 경우에만 본 연구참여자 설명문과 동의 항목이 제시됩니다. 선정기준 중 하나라도 충족하지 않은 경우에는 연구 참여 대상에 해당하지 않는다는 안내와 함께 설문이 종료되며, 이후 설명문, 동의 항목, 사전설문 및 AI 여행 플래너는 제시되지 않습니다.",
        "본 연구에는 PC(데스크탑/노트북)를 이용할 수 있고 생성형 AI 서비스를 사용해 본 경험이 있는 만 20~49세 성인 60명이 참여할 예정입니다. 귀하가 연구 참여에 동의하면 온라인으로 다음 절차를 1회 수행하게 됩니다.",
        "1. 사전 설문: 기본 정보, 평소 여행 계획 방식 및 생성형 AI 사용 경험 등에 관한 총 9문항에 응답합니다. 약 3분이 소요됩니다.",
        "2. 여행 계획 과업: AI 기반 여행 계획 서비스를 이용하여 서로 다른 여행지를 대상으로 총 3회의 여행 계획 과업을 수행합니다. 과업 수행에는 총 약 15~20분이 소요됩니다.",
        "3. 조건별 설문: 각 여행 계획 과업이 끝날 때마다 방금 경험한 여행 계획 방식에 관한 9문항에 응답합니다. 총 3회 진행되며, 약 6분이 소요됩니다.",
        "4. 최종 설문: 세 가지 방식을 모두 경험한 후 가장 만족스러웠던 방식과 그 이유에 관한 2문항에 응답합니다. 약 5분이 소요됩니다.",
        "전체 연구 참여에는 약 30분이 소요될 것으로 예상됩니다.",
        "본 실험 종료 후 사후 인터뷰 참여 의향을 밝힌 참가자 중 15명을 무작위로 선정하여 별도로 연락드립니다. 사후 인터뷰는 1회, 약 20~30분 동안 온라인으로 진행되며, 참가자가 희망하는 경우 대면으로 진행될 수 있습니다. 인터뷰 대상자에게는 인터뷰의 목적, 녹음 및 자료 활용방법을 다시 안내하고 별도의 동의를 받은 후 인터뷰를 진행합니다.",
      ],
    },
    {
      heading: "3. 연구대상자에게 예상되는 위험 및 이익",
      body: [
        "본 연구는 온라인 설문과 웹 기반 프로토타입 이용으로 진행되므로 예상되는 신체적 위험은 없습니다. 불편함을 느끼는 경우 언제든지 연구 참여를 중단할 수 있으며, 참여를 중단하더라도 어떠한 불이익도 없습니다. 연구 참여와 관련하여 추가적인 설명이 필요한 경우 연구담당자에게 문의할 수 있습니다. 귀하가 본 연구에 참여함으로써 얻는 직접적인 개인적 이익은 없습니다. 향후 AI 기반 서비스의 사용자 경험과 협업 인터페이스를 개선하는 데 기초자료로 활용될 수 있습니다.",
      ],
    },
    {
      heading: "4. 연구참여에 대한 보상",
      body: [
        "본 실험의 모든 과업과 설문을 완료한 참가자에게 2,000원 상당의 커피 모바일 상품권을 지급합니다. 모바일 상품권 지급을 위해 휴대전화 번호를 수집합니다. 휴대전화 번호는 연구자료와 구분하여 별도로 보관하며, 상품권 지급 목적으로만 사용한 후 지급이 완료되면 즉시 폐기합니다.",
        "다만 사후 인터뷰 참여 의향을 밝힌 경우에는 해당 휴대전화 번호를 인터뷰 대상자 선정 및 일정 안내를 위해서도 사용합니다. 인터뷰 대상자로 선정되어 인터뷰를 완료한 참가자에게는 5,000원 상당의 커피 모바일 상품권을 추가로 지급하며, 연락과 보상 지급이 모두 완료된 후 휴대전화 번호를 즉시 폐기합니다.",
        "연구 참여를 중도에 중단하거나 세 가지 과업과 관련 설문을 모두 완료하지 않은 경우에는 본 실험 보상이 지급되지 않습니다. 사후 인터뷰 역시 인터뷰를 완료하지 않은 경우에는 인터뷰 보상이 지급되지 않습니다.",
      ],
    },
    {
      heading: "5. 연구 참여에 따른 손실에 대한 보상",
      body: [
        "본 연구는 온라인 설문 및 웹 기반 프로토타입 이용으로 구성되어 있어 연구 참여에 따른 손실이나 신체적 상해가 발생할 가능성은 낮습니다. 연구 참여와 관련하여 예상하지 못한 문제가 발생하거나 추가적인 정보 및 설명이 필요한 경우 아래의 연구담당자에게 연락할 수 있습니다.",
      ],
    },
    {
      heading: "6. 참여 철회 및 중지 보장",
      body: [
        "연구 참여는 전적으로 자발적입니다. 귀하는 연구에 참여하지 않을 수 있으며, 연구 참여 도중에도 언제든지 참여를 중단하거나 철회할 수 있습니다. 참여를 거부하거나 중단하더라도 어떠한 불이익도 없습니다.",
        "연구 수행 도중 참여를 철회하면 해당 시점까지 수집된 귀하의 연구자료는 분석에 사용하지 않고 삭제합니다. 연구 완료 후에도 자료 삭제를 원하는 경우 연구담당자에게 참가자 코드를 제시하여 삭제를 요청할 수 있습니다. 다만 연구자료가 개인을 식별할 수 없는 형태로 완전히 익명화되어 해당 자료를 확인할 수 없게 된 이후에는 개별 자료의 확인 및 삭제가 어려울 수 있습니다.",
      ],
    },
    {
      heading: "7. 개인정보와 비밀 보장에 관한 사항",
      body: [
        "본 연구에서는 연령대와 성별 등의 인구통계학적 정보, 사전·조건별·최종 설문 응답 및 프로토타입 이용 과정에서 생성된 연구자료를 수집합니다. 사후 인터뷰 대상자로 선정된 경우에는 인터뷰 녹음파일과 녹취자료가 추가로 수집됩니다.",
        "연구자료에는 이름을 기록하지 않으며, 참가자 코드로 관리합니다. 이름, 주민등록번호 및 그 밖의 민감정보는 수집하지 않습니다. 보상 지급과 사후 인터뷰 연락을 위해 수집하는 휴대전화 번호는 연구자료와 구분하여 별도로 관리합니다.",
        "전자 연구자료는 암호를 설정한 연구책임자의 PC에 저장하며, 연구책임자만 접근할 수 있도록 관리합니다. 인터뷰 녹음파일과 녹취자료는 개인을 식별할 수 있는 내용을 삭제하거나 참가자 코드로 대체하여 보관합니다.",
        "수집된 연구자료는 연구 분석, 학술 발표 및 학위논문 작성에 활용될 수 있으며, 연구 결과는 개인을 식별할 수 없는 형태로만 공개됩니다. 연구자료는 연구 종료 후 3년간 보관한 뒤 복구할 수 없는 방법으로 영구 삭제하며, 인쇄자료가 있는 경우 파쇄하여 폐기합니다.",
        "법령에 따라 필요한 경우 개인정보가 제공될 수 있습니다. 또한 연구 수행과 자료의 신뢰성을 검증하기 위해 모니터링 요원, 점검자 및 연세대학교 생명윤리위원회가 관련 규정에서 정한 범위 안에서 연구대상자의 비밀을 침해하지 않는 방식으로 연구 관련 기록을 열람할 수 있습니다.",
      ],
    },
  ],
  // The former "8. 연구 문의" numbered section, pulled out of `paragraphs`
  // and given its own distinct callout box instead (see ConsentScreen.tsx
  // — same bordered/tinted treatment as introductionContent's note below)
  // so contact info reads as a standing reference at the bottom of the
  // page rather than just one more numbered item in the list above it. No
  // heading/number of its own on purpose. `lines` renders as
  // "{label}: {value}" pairs, in order; ConsentScreen.tsx auto-links any
  // email address found in a value (see its linkifyEmail helper).
  contactBox: {
    intro: "본 연구와 관련하여 궁금한 사항이나 연구 참여 중 문제가 발생한 경우 아래 연구담당자에게 문의해 주시기 바랍니다.",
    lines: [
      { label: "연구자", value: "박윤경" },
      { label: "소속", value: "연세대학교 정보대학원 / axlab" },
      { label: "문의처", value: "ykpark@yonsei.ac.kr" },
      { label: "연구대상자 권리 정보에 관한 문의처", value: "연세대학교 생명윤리위원회 (02-2123-5143)" },
    ],
  },
  // Matches the source document's own consent table exactly — two items,
  // both required ("모든 항목에 동의하셔야 연구에 참여하실 수 있습니다."),
  // rendered here as checkboxes rather than the PDF's 동의한다/동의하지
  // 않는다 two-column radio layout since a single "check to agree" per item
  // says the same thing with less UI.
  checkboxes: [
    "본 연구의 연구 목적을 이해하고 연구에 참여하기를 희망합니다.",
    "연구 도중 자유롭게 참여를 철회할 수 있음을 이해하였습니다.",
  ],
  continueLabel: "동의하고 계속하기",
};

export const introductionContent = {
  title: "실험 진행 안내",
  points: [
    "본 실험에서는 총 3번의 여행 계획을 진행합니다.",
    "각 여행 계획에서는 서로 다른 여행지를 대상으로 AI 여행 플래너와 함께 여행 일정을 구성하게 됩니다.",
    "각 여행 계획이 끝난 후에는 방금 경험한 여행 계획 방식에 대한 간단한 설문에 응답하며, 모든 여행 계획이 끝난 후에는 간단한 마무리 설문이 진행됩니다.",
    "실험 진행 중 제시되는 후보와 최종 일정에 대한 추가 검색이나 수정 기능은 제공되지 않습니다.",
  ],
  // Rendered as its own emphasized callout (see IntroductionScreen.tsx),
  // deliberately styled differently from the bullet list above — this is
  // the one line asking for a specific mindset while doing the task, not
  // another fact about the study's structure, so it shouldn't just read as
  // a 5th bullet.
  note: "실제로 해당 여행을 떠난다고 생각하고 자연스럽게 진행해 주세요.",
  continueLabel: "실험 시작하기",
};
