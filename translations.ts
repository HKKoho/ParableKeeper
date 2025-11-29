export type Language = 'en' | 'zh';

export interface Translations {
  // Role Select Screen
  gameTitle: string;
  gameSubtitle: string;
  roles: {
    pastor: {
      name: string;
      description: string;
    };
    deacon: {
      name: string;
      description: string;
    };
    member: {
      name: string;
      description: string;
    };
  };
  stats: {
    speed: string;
    teach: string;
    service: string;
    greet: string;
  };

  // Game Screen
  hud: {
    score: string;
    timeRemaining: string;
    visitorsInService: string;
  };
  instructions: string;
  legendButton: string;

  // Game Over Screen
  gameOver: {
    title: string;
    seedsRooted: string;
    lostToWorld: string;
    pastoralWord: string;
    reflecting: string;
    playAgain: string;
  };

  // Challenge
  challenge: {
    title: string;
    verifyPrompt: string;
    question: string;
    yesButton: string;
    noButton: string;
    speedInfo: string;
    statsInfo: string;
  };

  // Legend
  legend: {
    title: string;
    close: string;
    visitorTypes: {
      title: string;
      unknown: {
        name: string;
        description: string;
      };
      path: {
        name: string;
        description: string;
      };
      rock: {
        name: string;
        description: string;
      };
      thorns: {
        name: string;
        description: string;
      };
      good: {
        name: string;
        description: string;
      };
    };
    playerRoles: {
      title: string;
      pastor: {
        name: string;
        description: string;
      };
      deacon: {
        name: string;
        description: string;
      };
      member: {
        name: string;
        description: string;
      };
    };
    visitorNeeds: {
      title: string;
      description: string;
      greet: {
        name: string;
        description: string;
      };
      teach: {
        name: string;
        description: string;
      };
      service: {
        name: string;
        description: string;
      };
    };
    hudElements: {
      title: string;
      score: {
        name: string;
        description: string;
      };
      time: {
        name: string;
        description: string;
      };
      visitors: {
        name: string;
        description: string;
      };
      patienceBar: {
        name: string;
        description: string;
      };
    };
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    gameTitle: "The Sower",
    gameSubtitle: '"A sower went out to sow..."\nChoose your role to tend the flock. Keep the hearts of the newcomers to church from the birds, the rocks, and the thorns.',
    roles: {
      pastor: {
        name: "Pastor",
        description: "Strong teaching. Good at deeply rooting Good Soil and Rocks."
      },
      deacon: {
        name: "Deacon",
        description: "Lead correctly. Counseling to remove Thorns (experience of life's problems)."
      },
      member: {
        name: "Member",
        description: "High energy. Best at catching those on the Path before they leave."
      }
    },
    stats: {
      speed: "SPEED",
      teach: "TEACH",
      service: "SERVICE",
      greet: "GREET"
    },
    hud: {
      score: "Score",
      timeRemaining: "Time Remaining",
      visitorsInService: "in service"
    },
    instructions: "Click the ground to move. Click people to minister to them. Different souls need different care. Keep their hearts full!",
    legendButton: "Legend",
    gameOver: {
      title: "Service Concluded",
      seedsRooted: "Seeds Rooted",
      lostToWorld: "Lost to the World",
      pastoralWord: "Pastoral Word",
      reflecting: "Reflecting...",
      playAgain: "Preach Again"
    },
    challenge: {
      title: "Distraction!",
      verifyPrompt: "To refocus on newcomers, verify this statement:",
      question: "Is this from the Bible?",
      yesButton: "Yes, it's Biblical",
      noButton: "No, it's fake",
      speedInfo: "Correct answers increase your movement speed!",
      statsInfo: "Current speed boost: +{boost}% | Correct: {correct}"
    },
    legend: {
      title: "Game Legend",
      close: "Close",
      visitorTypes: {
        title: "Visitor Types (Parable of the Sower)",
        unknown: {
          name: "Unknown (Not Yet Revealed)",
          description: "Interact with visitors to reveal their soul type"
        },
        path: {
          name: "Path",
          description: "Easily distracted, leaves quickly if not greeted"
        },
        rock: {
          name: "Rock (Rocky Ground)",
          description: "Needs teaching to withstand trials and testing"
        },
        thorns: {
          name: "Thorns",
          description: "Distracted by cares of life, needs regular service"
        },
        good: {
          name: "Good Soil",
          description: "Receptive and grows well with teaching"
        }
      },
      playerRoles: {
        title: "Player Roles",
        pastor: {
          name: "Pastor",
          description: "Excellent at teaching, good overall ministry"
        },
        deacon: {
          name: "Deacon",
          description: "Excellent at service, caring for practical needs"
        },
        member: {
          name: "Member",
          description: "Excellent at greeting and welcoming newcomers"
        }
      },
      visitorNeeds: {
        title: "Visitor Needs (Urgent!)",
        description: "When a visitor has a need, an icon will bounce above their head:",
        greet: {
          name: "Greet",
          description: "Needs a warm welcome and acknowledgment"
        },
        teach: {
          name: "Teach",
          description: "Needs biblical teaching or guidance"
        },
        service: {
          name: "Service",
          description: "Needs practical help or care"
        }
      },
      hudElements: {
        title: "HUD Elements",
        score: {
          name: "Score",
          description: "Points earned from satisfied visitors"
        },
        time: {
          name: "Time Remaining",
          description: "Time left in the service (turns red when low)"
        },
        visitors: {
          name: "Visitors Count",
          description: "Number of people currently in service"
        },
        patienceBar: {
          name: "Patience Bar",
          description: "Shows visitor's patience (green = good, red = critical)"
        }
      }
    }
  },
  zh: {
    gameTitle: "撒種的人",
    gameSubtitle: '「有一個撒種的出去撒種......」\n選擇你的角色來照顧羊群。保守初到教會之人的心遠離飛鳥、石頭和荊棘。',
    roles: {
      pastor: {
        name: "牧師",
        description: "教導能力強。擅長深植好土和磐石之心。"
      },
      deacon: {
        name: "執事",
        description: "正確引領。擅長輔導除去荊棘（生活問題的經驗）。"
      },
      member: {
        name: "會友",
        description: "精力充沛。最擅長在路旁的人離開前接觸他們。"
      }
    },
    stats: {
      speed: "速度",
      teach: "教導",
      service: "服事",
      greet: "問候"
    },
    hud: {
      score: "分數",
      timeRemaining: "剩餘時間",
      visitorsInService: "人參加聚會"
    },
    instructions: "點擊地面移動。點擊人群來服事他們。不同的靈魂需要不同的關懷。保守他們的心！",
    legendButton: "圖例說明",
    gameOver: {
      title: "聚會結束",
      seedsRooted: "種子紮根",
      lostToWorld: "失落於世界",
      pastoralWord: "牧養之言",
      reflecting: "思考中...",
      playAgain: "再次傳道"
    },
    challenge: {
      title: "受到干擾！",
      verifyPrompt: "為了重新專注於新來的人，請驗證此陳述：",
      question: "這是出自聖經嗎？",
      yesButton: "是，這是聖經",
      noButton: "否，這是假的",
      speedInfo: "正確答案會增加你的移動速度！",
      statsInfo: "目前速度加成：+{boost}% | 正確：{correct}"
    },
    legend: {
      title: "遊戲圖例",
      close: "關閉",
      visitorTypes: {
        title: "訪客類型（撒種的比喻）",
        unknown: {
          name: "未知（尚未揭示）",
          description: "與訪客互動以揭示他們的靈魂類型"
        },
        path: {
          name: "路旁",
          description: "容易分心，若不問候會迅速離開"
        },
        rock: {
          name: "磐石（石頭地）",
          description: "需要教導才能承受試煉和考驗"
        },
        thorns: {
          name: "荊棘",
          description: "被生活憂慮分心，需要定期服事"
        },
        good: {
          name: "好土",
          description: "樂於接受，在教導下成長良好"
        }
      },
      playerRoles: {
        title: "玩家角色",
        pastor: {
          name: "牧師",
          description: "擅長教導，整體服事能力良好"
        },
        deacon: {
          name: "執事",
          description: "擅長服事，照顧實際需要"
        },
        member: {
          name: "會友",
          description: "擅長問候和歡迎新來的人"
        }
      },
      visitorNeeds: {
        title: "訪客需求（緊急！）",
        description: "當訪客有需求時，圖示會在他們頭上跳動：",
        greet: {
          name: "問候",
          description: "需要溫暖的歡迎和關注"
        },
        teach: {
          name: "教導",
          description: "需要聖經教導或指引"
        },
        service: {
          name: "服事",
          description: "需要實際幫助或關懷"
        }
      },
      hudElements: {
        title: "介面元素",
        score: {
          name: "分數",
          description: "從滿意的訪客獲得的分數"
        },
        time: {
          name: "剩餘時間",
          description: "聚會剩餘時間（低時變紅）"
        },
        visitors: {
          name: "訪客數量",
          description: "目前參加聚會的人數"
        },
        patienceBar: {
          name: "耐心條",
          description: "顯示訪客的耐心（綠色 = 良好，紅色 = 危急）"
        }
      }
    }
  }
};
