type LanguageCode = "en" | "zh";

const translations = {
  en: {
    appSubtitle: "Player-Driven Bounty System for EVE Frontier",
    language: { switch: "Switch Language" },
    sort: {
      title: "Sort By",
      totalReward: "Total Reward",
      perKillReward: "Per Kill Reward",
      timeRemaining: "Time Remaining"
    },
    wallet: {
      connect: "Connect EVE Vault",
      disconnect: "Disconnect",
      connected: "Connected",
      disconnected: "Not Connected",
      statusLabel: "Wallet",
      connectViaPublish: "Connect EVE Vault from Publish Bounty",
      noRoles: "No wallet character found in the identity world",
      selectedRole: "Selected Role",
      mirrorReady: "Simulation Mirror Ready",
      mirrorMissing: "Simulation Mirror Missing"
    },
    taskList: {
      title: "Active Bounties",
      noTasks: "No active bounties found",
      loading: "Loading...",
      total: "Total Bounties"
    },
    createBounty: {
      title: "Publish Bounty",
      button: "Publish Bounty",
      targetUID: "Enter Character UID",
      targetUIDPlaceholder: "Enter character UID",
      targetLookupLoading: "Searching identity-world character...",
      targetLookupInvalid: "Character UID must be a positive integer.",
      targetLookupMissing: "No identity-world character found for this UID.",
      targetLookupError: "Character lookup failed: {message}",
      targetLookupFound: "Target Character",
      targetLookupName: "Name",
      targetLookupTenant: "Tenant",
      targetLookupObjectId: "Object ID",
      rewardAmount: "Reward Amount",
      rewardAmountPlaceholder: "Enter reward amount",
      lossType: "Kill Type",
      lossTypeShip: "Ship",
      lossTypeBuilding: "Building",
      tokenType: "Token Type",
      tokenTypeCustom: "Custom",
      customCoinTypePlaceholder: "Enter coin type",
      customCoinTypeHint: "Legacy EVE coin type hint: {coinType}",
      customCoinTypeLoading: "Loading coin metadata...",
      customCoinTypeResolved: "Coin metadata loaded: {decimals} decimals",
      customCoinTypeMissing: "Coin metadata was not found for this type.",
      customCoinTypeError: "Coin metadata lookup failed: {message}",
      walletBalanceLoading: "Loading wallet balance...",
      walletBalanceError: "Wallet balance lookup failed: {message}",
      killCountLabel: "Required Kills",
      perKillReward: "Per Kill Reward",
      timeframe: "Time Frame",
      timeframeHint: "Complete {count} kills within {days} days, {reward} per kill",
      futureKillerLabel: "Set bounty for my future killer",
      futureKillerHint: "Reward triggers automatically when you die",
      futureKillerAutoGenerate: "Auto-generate after death",
      remarks: "Remarks",
      remarksPlaceholder: "Describe target background or intent (max 64 bytes)",
      remarksLimitEn: "Max 64 bytes",
      submit: "Publish Bounty",
      cancel: "Cancel",
      minDays: "Minimum 7 days",
      maxDays: "Maximum 365 days",
      minKills: "Single",
      maxKills: "Multi"
    },
    taskCard: {
      target: "Target",
      insured: "Insured Character",
      totalReward: "Total",
      perKillReward: "Per Kill",
      progress: "Progress",
      killProgress: "{completed} / {total} Kills",
      deadline: "Deadline",
      timeRemaining: "Remaining",
      statusActive: "Active",
      statusClaimable: "Claimable",
      statusExpired: "Expired",
      statusRefundable: "Refundable",
      futureKiller: "Future Killer",
      awaitingKiller: "Awaiting Killer Lock",
      futureKillerHint: "This bounty will lock onto whoever kills {insured} ({uid}).",
      triggerCondition: "Trigger Condition",
      claimReward: "Claim Reward",
      refundReward: "Refund",
      claimable: "Claimable",
      mirrorRequired: "Connected world character required",
      characterUnknown: "Unknown Character",
      loadingCharacter: "Loading character...",
      lookupFailed: "Character lookup failed",
      lossType: "Kill Type",
      lossTypeAny: "Any",
      lossTypeShip: "Ship",
      lossTypeBuilding: "Building",
      uid: "UID",
      tenant: "Tenant",
      objectId: "Object ID"
    },
    killmail: {
      title: "Emit Killmail",
      subtitle: "Development trigger path for the simulation world",
      duelTitle: "Cosmic Duel",
      duelSubtitle: "Resolve the duel, then emit a killmail from your world contract",
      duelRunning: "Battle Live",
      duelStandby: "Standby",
      playerOne: "Player One",
      targetUID: "Opponent UID",
      targetUIDPlaceholder: "Enter opponent UID",
      targetLookupLoading: "Searching simulation-world character...",
      targetLookupInvalid: "Opponent UID must be a positive integer.",
      targetLookupMissing: "No simulation-world character found for this UID.",
      targetLookupError: "Character lookup failed: {message}",
      targetLookupFound: "Opponent Locked",
      targetLookupObjectId: "Object ID",
      controlsTitle: "Controls",
      worldConfig: "World Config",
      worldPackage: "World Package",
      killmailRegistry: "Killmail Registry",
      adminAcl: "Admin ACL",
      controlP1Move: "P1 Move: W A S D",
      controlP1Shoot: "P1 Fire: Space",
      controlP2Move: "P2 Move: Arrow Keys",
      controlP2Shoot: "P2 Fire: Enter",
      startDuel: "Start Duel",
      startHint: "P1 is your connected character. P2 must be resolved from UID before the duel starts.",
      preMatchMessage: "Load both characters and launch the fight.",
      winnerMessage: "{winner} wins. Ship loss killmail will be emitted automatically.",
      emitting: "Emitting killmail transaction...",
      emitSuccess: "Killmail emitted successfully.",
      transactionHash: "Transaction Hash",
      viewOnExplorer: "View in Block Explorer",
      emitError: "Killmail emit failed: {message}",
      emitErrorFallback: "Unknown error",
      missingReporter: "Simulation mirror character is required before starting the duel.",
      restart: "Duel Again",
      killerId: "Killer Item ID",
      victimId: "Victim Item ID",
      lossType: "Loss Type",
      solarSystemId: "Solar System ID",
      killmailId: "Killmail Item ID",
      killTimestamp: "Kill Timestamp",
      submit: "Emit Killmail",
      ship: "Ship",
      structure: "Structure"
    },
    feed: {
      title: "Recent Killmail Feed",
      empty: "No killmail events found yet."
    },
    common: {
      close: "Close",
      days: "Days"
    },
    validation: {
      targetUIDRequired: "Character UID is required",
      targetUIDInvalid: "Character UID must be a positive integer",
      rewardAmountPositive: "Reward must be positive",
      customCoinTypeRequired: "Custom coin type is required",
      customCoinTypeInvalid: "Coin type must be in 0x...::module::type format",
      customCoinTypeMetadataMissing: "Coin metadata must be resolved before publishing",
      killCountRange: "Kill count must be between 1 and 1000",
      timeframeRange: "Timeframe must be between 7 and 365 days",
      remarksLength: "Remarks exceed 64 bytes"
    }
  },
  zh: {
    appSubtitle: "EVE Frontier 玩家驱动型赏金系统",
    language: { switch: "切换语言" },
    sort: {
      title: "排序方式",
      totalReward: "总奖励",
      perKillReward: "单次击杀奖励",
      timeRemaining: "剩余时间"
    },
    wallet: {
      connect: "连接 EVE Vault",
      disconnect: "断开连接",
      connected: "已连接",
      disconnected: "未连接",
      statusLabel: "钱包",
      connectViaPublish: "请通过发布悬赏连接 EVE Vault",
      noRoles: "当前身份 world 下没有查询到角色",
      selectedRole: "当前角色",
      mirrorReady: "测试角色已就绪",
      mirrorMissing: "测试角色缺失"
    },
    taskList: {
      title: "当前悬赏",
      noTasks: "当前没有有效悬赏",
      loading: "加载中...",
      total: "总悬赏数"
    },
    createBounty: {
      title: "发布悬赏",
      button: "发布悬赏",
      targetUID: "输入角色 UID",
      targetUIDPlaceholder: "输入角色 UID",
      targetLookupLoading: "正在查询 identity world 角色...",
      targetLookupInvalid: "角色 UID 必须为正整数",
      targetLookupMissing: "当前 UID 没有查询到对应的 identity world 角色",
      targetLookupError: "角色查询失败：{message}",
      targetLookupFound: "目标角色",
      targetLookupName: "名称",
      targetLookupTenant: "租户",
      targetLookupObjectId: "对象 ID",
      rewardAmount: "奖励金额",
      rewardAmountPlaceholder: "输入奖励金额",
      lossType: "击杀类型",
      lossTypeShip: "舰船",
      lossTypeBuilding: "建筑",
      tokenType: "代币类型",
      tokenTypeCustom: "自定义",
      customCoinTypePlaceholder: "输入 coin type",
      customCoinTypeHint: "旧版 EVE coin type 提示：{coinType}",
      customCoinTypeLoading: "正在读取 coin metadata...",
      customCoinTypeResolved: "已读取 coin metadata：{decimals} 位精度",
      customCoinTypeMissing: "没有查询到这个 coin type 的 metadata。",
      customCoinTypeError: "Coin metadata 查询失败：{message}",
      walletBalanceLoading: "正在读取钱包余额...",
      walletBalanceError: "钱包余额查询失败：{message}",
      killCountLabel: "所需击杀次数",
      perKillReward: "单次击杀奖励",
      timeframe: "时间范围",
      timeframeHint: "在 {days} 天内完成 {count} 次击杀，每次奖励 {reward}",
      futureKillerLabel: "为未来击杀我的人设置悬赏",
      futureKillerHint: "死亡后自动生成新的普通悬赏",
      futureKillerAutoGenerate: "死亡后自动生成",
      remarks: "备注",
      remarksPlaceholder: "描述目标背景或垃圾话（最多 64 字节）",
      remarksLimitEn: "最多 64 字节",
      submit: "发布悬赏",
      cancel: "取消",
      minDays: "最短 7 天",
      maxDays: "最长 365 天",
      minKills: "单杀",
      maxKills: "多杀"
    },
    taskCard: {
      target: "目标",
      insured: "被保角色",
      totalReward: "总计",
      perKillReward: "单次",
      progress: "进度",
      killProgress: "{completed} / {total} 次击杀",
      deadline: "截止时间",
      timeRemaining: "剩余",
      statusActive: "进行中",
      statusClaimable: "可领取",
      statusExpired: "已过期",
      statusRefundable: "可退款",
      futureKiller: "死亡反转",
      awaitingKiller: "待锁定未来凶手",
      futureKillerHint: "当 {insured}（{uid}）被击杀后，这张通缉会自动锁定凶手。",
      triggerCondition: "触发条件",
      claimReward: "领取奖励",
      refundReward: "退款",
      claimable: "可领取",
      mirrorRequired: "需要已连接的 world 角色",
      characterUnknown: "未知角色",
      loadingCharacter: "正在查询角色...",
      lookupFailed: "角色查询失败",
      lossType: "击杀类型",
      lossTypeAny: "全部",
      lossTypeShip: "舰船",
      lossTypeBuilding: "建筑",
      uid: "UID",
      tenant: "租户",
      objectId: "对象 ID"
    },
    killmail: {
      title: "发送 Killmail",
      subtitle: "测试 world 的开发触发入口",
      duelTitle: "Cosmic Duel",
      duelSubtitle: "完成对战后，从你的 world contract 自动发送 killmail",
      duelRunning: "战斗中",
      duelStandby: "待命",
      playerOne: "玩家一",
      targetUID: "对手 UID",
      targetUIDPlaceholder: "输入对手 UID",
      targetLookupLoading: "正在查询测试 world 角色...",
      targetLookupInvalid: "对手 UID 必须为正整数",
      targetLookupMissing: "当前 UID 没有查询到对应的测试 world 角色",
      targetLookupError: "角色查询失败：{message}",
      targetLookupFound: "对手已锁定",
      targetLookupObjectId: "对象 ID",
      controlsTitle: "操作说明",
      worldConfig: "World 配置",
      worldPackage: "World Package",
      killmailRegistry: "Killmail Registry",
      adminAcl: "Admin ACL",
      controlP1Move: "P1 移动：W A S D",
      controlP1Shoot: "P1 开火：空格",
      controlP2Move: "P2 移动：方向键",
      controlP2Shoot: "P2 开火：回车",
      startDuel: "开始对战",
      startHint: "P1 固定为当前连接角色，P2 需要先通过 UID 查询到角色后才能开始。",
      preMatchMessage: "加载双方角色后即可开始战斗。",
      winnerMessage: "{winner} 获胜，将自动发送 ship 类型 killmail。",
      emitting: "正在发送 killmail 交易...",
      emitSuccess: "Killmail 发送成功。",
      transactionHash: "交易 Hash",
      viewOnExplorer: "在区块浏览器查看",
      emitError: "Killmail 发送失败：{message}",
      emitErrorFallback: "未知错误",
      missingReporter: "开始对战前必须先拿到当前角色的测试 world 镜像。",
      restart: "再来一局",
      killerId: "Killer Item ID",
      victimId: "Victim Item ID",
      lossType: "损失类型",
      solarSystemId: "星系 ID",
      killmailId: "Killmail Item ID",
      killTimestamp: "击杀时间戳",
      submit: "发送 Killmail",
      ship: "舰船",
      structure: "建筑"
    },
    feed: {
      title: "最近 Killmail Feed",
      empty: "当前还没有 killmail 事件。"
    },
    common: {
      close: "关闭",
      days: "天"
    },
    validation: {
      targetUIDRequired: "角色 UID 不能为空",
      targetUIDInvalid: "角色 UID 必须为正整数",
      rewardAmountPositive: "奖励必须大于 0",
      customCoinTypeRequired: "自定义 coin type 不能为空",
      customCoinTypeInvalid: "Coin type 格式必须是 0x...::module::type",
      customCoinTypeMetadataMissing: "发布前必须先成功读取 coin metadata",
      killCountRange: "击杀次数必须在 1 到 1000 之间",
      timeframeRange: "时限必须在 7 到 365 天之间",
      remarksLength: "备注超过 64 字节"
    }
  }
} as const;

function getByPath(language: LanguageCode, key: string): string {
  const parts = key.split(".");
  let value: unknown = translations[language];
  for (const part of parts) {
    if (!value || typeof value !== "object" || !(part in value)) {
      return key;
    }
    value = (value as Record<string, unknown>)[part];
  }
  return typeof value === "string" ? value : key;
}

export function getTranslation(language: LanguageCode, key: string) {
  return getByPath(language, key);
}

export function formatMessage(language: LanguageCode, key: string, params: Record<string, string | number>) {
  let template = getTranslation(language, key);
  for (const [name, value] of Object.entries(params)) {
    template = template.replace(`{${name}}`, String(value));
  }
  return template;
}

export function loadLanguagePreference(): LanguageCode {
  if (typeof window === "undefined") {
    return "en";
  }

  const saved = window.localStorage.getItem("bounty-board.language");
  return saved === "zh" ? "zh" : "en";
}

export function saveLanguagePreference(language: LanguageCode) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("bounty-board.language", language);
  }
}

export function toggleLanguage(current: LanguageCode): LanguageCode {
  return current === "en" ? "zh" : "en";
}
