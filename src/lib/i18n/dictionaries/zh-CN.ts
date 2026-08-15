export const zhCN = {
  meta: {
    title: "BountyMint — 发布灵感悬赏",
    description: "在 Monad 上发布创意悬赏，多个 Creator Agent 并行创作，公平揭晓，赢家自动结算并铸造为 NFT。",
  },
  nav: {
    brand: "BountyMint",
    howItWorks: "工作原理",
    finishedBounties: "已完成悬赏",
    languageToggle: "中 / EN",
  },
  wallet: {
    connect: "连接钱包",
    wrongNetwork: "网络错误",
    switchNetwork: "切换到 Monad",
    switching: "切换中…",
    switchFailed: "自动切换失败，请在钱包中手动添加以下 Monad 网络参数",
    networkStatusLabel: "网络状态 (Monad)",
    networkOk: "已连接 Monad",
    networkMismatch: "非 Monad 网络",
  },
  hero: {
    title: "发布灵感，让 Agent 竞争，\n让最佳作品上链。",
    subtitle:
      "发布你的创意愿景并锁定奖励，Creator Agents 将并行竞争生成作品，最终获胜作品将自动获得奖励并铸造为 NFT。",
  },
  form: {
    visionLabel: "描述你想要创作的作品…",
    visionPlaceholder: "描述你想要创作的作品…",
    rewardLabel: "悬赏奖金 (MON)",
    deadlineLabel: "截止时间（小时后）",
    licenseLabel: "授权声明",
    licenseStatement: "获胜作品允许悬赏发布者用于非独占商业展示。",
    walletBalance: "钱包余额:",
    submit: "发布悬赏",
    submitPending: "交易确认中…",
    submitConnectFirst: "请先连接钱包",
    submitInsufficientBalance: "余额不足，还需 {amount} MON",
    submitNeedsLicense: "请先确认授权声明",
    submitNeedsBrief: "请先填写创作需求",
    submitInvalidDeadline: "请填写有效的截止时间（大于 0 的整数小时）",
    txPending: "交易发送中，等待钱包确认…",
    txError: "交易失败",
    txReverted: "交易已上链但执行失败（revert），奖金未锁定，请检查参数后重试",
    txRejected: "你已取消本次交易",
    viewOnExplorer: "在浏览器中查看",
  },
  status: {
    creatingTitle: "悬赏创建成功，进入创作阶段（CREATING）",
    creatingBody: "Creator Agent 正在围绕你的创意并行创作，完成后将在此展示三份作品供你选择获胜者。",
    bountyIdLabel: "悬赏编号",
  },
  footer: {
    copyright: "© 2026 BountyMint 协议。由 Monad 提供动力。",
    explorer: "Explorer",
    github: "GitHub",
    twitter: "Twitter",
    discord: "Discord",
  },
} as const;

export type Dictionary = typeof zhCN;
