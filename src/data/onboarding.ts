// PILOT BRANCH — pilot-specific consent text the researcher sent
// separately from the main study's IRB-approved wording (see git history/
// main branch for that one). Section 8 (연구 문의) again moved out of
// `paragraphs` into its own `contactBox` below, same as main, for the same
// "standing reference at the bottom of the page" reason.
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
        "AI 기반 서비스는 사용자의 정보 탐색과 의사결정을 지원하는 다양한 상호작용 방식을 제공하고 있습니다. 본 연구는 AI 기반 여행 계획 서비스의 여러 상호작용 방식을 이용하는 과정에서 나타나는 사용자의 경험과 인식을 알아보기 위해 진행됩니다.",
        "본 파일럿 연구는 본실험에 앞서 AI 기반 여행 계획 서비스의 조건별 상호작용, 연구 절차, 안내문 및 설문 문항이 이해하기 쉽게 구성되어 있는지 확인하고, 기술적 오류와 전체 소요시간 및 개선이 필요한 사항을 점검하기 위한 예비 연구입니다. 파일럿 결과는 프로토타입과 연구 절차 및 측정도구를 수정·보완하기 위한 목적으로만 활용됩니다.",
      ],
    },
    {
      heading: "2. 연구대상자의 참여 기간, 절차 및 소요 시간",
      body: [
        "본 파일럿 연구에는 PC(데스크톱 또는 노트북)를 이용할 수 있고 생성형 AI 서비스를 사용한 경험이 있는 만 20~49세 성인 5명이 참여할 예정입니다. 파일럿 연구 참여자는 이후 본실험에 중복 참여할 수 없으며, 심층면담 대상자로도 선정되지 않습니다.",
        "귀하가 연구 참여에 동의하면 온라인으로 다음 절차를 1회 수행하게 됩니다.",
        "1. 사전설문: 기본 정보, 평소 여행 계획 방식 및 생성형 AI 사용 경험 등에 관한 문항에 응답합니다.",
        "2. 여행 계획 과업: AI 기반 여행 계획 서비스를 이용하여 서로 다른 여행지를 대상으로 인간주도, 혼합주도 및 AI주도의 세 가지 여행 계획 과업을 수행합니다.",
        "3. 조건별 사후설문: 각 여행 계획 과업이 끝날 때마다 방금 경험한 여행 계획 방식에 관한 조작확인 문항과 사용자 경험 평가 문항에 응답합니다.",
        "4. 최종 선호·종합 평가: 세 가지 방식을 모두 경험한 후 가장 선호한 방식과 그 이유 및 아쉽거나 불편했던 경험에 관한 문항에 응답합니다.",
        "5. 파일럿 적절성 평가: 설문 문항과 연구 절차의 이해 가능성, 진행 과정에서 경험한 어려움, 프로토타입의 개선 필요 사항 및 전체 소요시간에 관한 문항에 응답합니다.",
        "전체 파일럿 연구 참여에는 약 30~35분이 소요될 것으로 예상됩니다. 파일럿 연구는 웹 기반 프로토타입과 자기기입식 온라인 설문으로만 진행하며, 별도의 대면·전화·화상 면담은 실시하지 않습니다.",
      ],
    },
    {
      heading: "3. 연구대상자에게 예상되는 위험 및 이익",
      body: [
        "본 파일럿 연구는 온라인 설문과 웹 기반 프로토타입 이용으로 진행되므로 예상되는 신체적 위험은 없습니다. 다만 과업을 수행하거나 설문에 응답하는 과정에서 일시적인 피로감이나 불편함을 느낄 수 있습니다. 이 경우 언제든지 연구 참여를 중단할 수 있으며, 참여를 중단하더라도 어떠한 불이익도 없습니다.",
        "귀하가 본 연구에 참여함으로써 얻는 직접적인 개인적 이익은 없습니다. 다만 귀하의 의견은 본실험에 사용할 AI 기반 여행 계획 서비스와 연구 절차 및 설문 문항을 개선하기 위한 기초자료로 활용될 수 있습니다.",
      ],
    },
    {
      heading: "4. 연구참여에 대한 보상",
      body: [
        "파일럿 연구의 모든 과업과 설문을 완료한 참가자에게 2,000원 상당의 커피 모바일 상품권을 지급합니다. 모바일 상품권 지급을 위해 휴대전화번호를 수집합니다. 휴대전화번호는 연구자료와 구분하여 별도로 관리하며, 보상 지급 목적으로만 사용한 후 지급이 완료되면 즉시 폐기합니다.",
        "연구 참여를 중도에 중단하거나 세 가지 과업과 관련 설문 및 파일럿 적절성 평가를 모두 완료하지 않은 경우에는 보상이 지급되지 않습니다.",
      ],
    },
    {
      heading: "5. 연구 참여에 따른 손실에 대한 보상",
      body: [
        "본 파일럿 연구는 온라인 설문 및 웹 기반 프로토타입 이용으로 구성되어 있어 연구 참여에 따른 손실이나 신체적 상해가 발생할 가능성은 낮습니다. 연구 참여와 관련하여 예상하지 못한 문제가 발생하거나 추가적인 정보 및 설명이 필요한 경우 아래의 연구담당자에게 연락할 수 있습니다.",
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
        "본 파일럿 연구에서는 연령대와 성별 등의 인구통계학적 정보, 사전설문, 조건별 사후설문, 최종 선호·종합 평가, 파일럿 적절성 평가의 응답 및 프로토타입 이용 과정에서 생성된 연구자료를 수집합니다.",
        "연구자료에는 성명이나 휴대전화번호를 기록하지 않고 참가자 코드만 사용합니다. 보상 지급을 위해 수집하는 휴대전화번호는 연구자료와 분리하여 관리하며, 보상 지급이 완료된 후 즉시 폐기합니다.",
        "수집된 연구자료는 지도교수의 관리 아래 보관합니다. 종이 형태의 연구자료는 지도교수 연구실인 새천년관 418호 내 잠금장치가 있는 캐비닛에 보관합니다. 디지털 연구자료는 지도교수 컴퓨터의 암호화된 폴더에 보관하며, 연구책임자와 지도교수만 접근할 수 있습니다.",
        "파일럿 연구자료는 프로토타입, 연구 절차, 안내문 및 설문 문항의 수정·보완에만 활용하며, 본실험의 가설검증을 위한 정량자료나 심층면담의 질적 분석자료에 포함하지 않습니다.",
        "연구에서 얻어진 자료가 학위논문, 학술지 또는 학술대회 등을 통해 공개되는 경우에도 귀하의 성명이나 그 밖에 개인을 식별할 수 있는 정보는 공개하지 않습니다. 다만 관련 법령에 따라 정보 제공이 요구되는 경우에는 법률이 정한 범위에서 개인정보가 제공될 수 있습니다. 또한 모니터 요원, 점검 요원 및 연세대학교 생명윤리위원회는 연구대상자의 비밀보장을 침해하지 않는 범위에서 연구 실시 절차와 자료의 신뢰성을 검증하기 위하여 관련 연구자료를 직접 열람할 수 있습니다.",
        "파일럿 연구자료는 연구 종료 후 3년간 보관합니다. 보관기간이 종료된 후 종이자료는 분쇄하여 폐기하고, 디지털 자료는 복구할 수 없는 방법으로 영구 삭제합니다.",
      ],
    },
  ],
  // The former "8. 연구 문의" numbered section, pulled out of `paragraphs`
  // and given its own distinct callout box instead (see ConsentScreen.tsx
  // — same bordered/tinted treatment as introductionContent's note below)
  // so contact info reads as a standing reference at the bottom of the
  // page rather than just one more numbered item in the list above it. No
  // heading/number of its own on purpose. `lines` renders as
  // "{label}: {value}" pairs, in order — except an empty label, which
  // renders the value alone with no leading ": " (see ConsentScreen.tsx),
  // used here so "연세대학교 정보대학원 axlab (010-7323-2581)" and "박윤경
  // (ykpark@yonsei.ac.kr)" read as two lines under one shared "연구담당자
  // 연락처" heading rather than needing two separate headings.
  // ConsentScreen.tsx auto-links any email address found in a value (see
  // its linkifyEmail helper).
  contactBox: {
    intro: "본 연구와 관련하여 궁금한 사항이나 연구 참여 중 문제가 발생한 경우 아래 연구담당자에게 문의해 주시기 바랍니다.",
    lines: [
      { label: "연구담당자 연락처", value: "연세대학교 정보대학원 axlab (010-7323-2581)" },
      { label: "", value: "박윤경 (ykpark@yonsei.ac.kr)" },
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
