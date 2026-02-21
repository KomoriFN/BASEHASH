const ROOT_URL = "https://basehash.vercel.app";

export const minikitConfig = {
  // Это будет заполнено после верификации на шаге 5
  accountAssociation: {
    "header": "",
    "payload": "",
    "signature": ""
  },
  miniapp: {
    version: "1",
    name: "BASEHASH",
    subtitle: "Mine & Earn BH",
    description: "Mine BASEHASH tokens, compete for blocks, and upgrade your mining operation in this mini app on Base.",
    screenshotUrls: [
      `${ROOT_URL}/screenshot1.png`,
      `${ROOT_URL}/screenshot2.png`,
      `${ROOT_URL}/screenshot3.png`
    ],
    iconUrl: `${ROOT_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "games",
    tags: ["mining", "crypto", "game", "base", "bitcoin"],
    heroImageUrl: `${ROOT_URL}/hero.png`,
    tagline: "MINING GAME",
    ogTitle: "BASEHASH - Mining Game on Base",
    ogDescription: "Mine tokens, find blocks, and upgrade your rig in this mining game.",
    ogImageUrl: `${ROOT_URL}/og-image.png`,
    noindex: false,
  },
} as const;