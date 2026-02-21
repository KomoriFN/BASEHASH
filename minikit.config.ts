const ROOT_URL = "https://basehash.vercel.app";

export const minikitConfig = {
  // Это будет заполнено после верификации на шаге 5
  accountAssociation: {
    "header": "eyJmaWQiOjE0ODUyNjksInR5cGUiOiJhdXRoIiwia2V5IjoiMHhlMGRlOTM5MTU1YzI0MzU2RUU3QjQ2NDJBM2IzRTFGNGMwN2UxNzUwIn0",
    "payload": "eyJkb21haW4iOiJiYXNlaGFzaC52ZXJjZWwuYXBwIn0",
    "signature": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABqbU4RNiWSApGzRoTXfjdn1xpPCb84byTta2akj7PE4k_n2_RrCb4bCcCzxgrOOequQYQ0nFWb_NBipYAGlF91gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAl8ZgIay2xclZzG8RWZzuWvO8j9R0fus3XxDee9lRlVy8FAAAAEwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD3eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoib2NySVl4V3BIQ3VGMjk0akRjTnhQTk82RmZpZi1wRmNZaEhQVGhjdDRLOCIsIm9yaWdpbiI6Imh0dHBzOi8va2V5cy5jb2luYmFzZS5jb20iLCJjcm9zc09yaWdpbiI6ZmFsc2UsIm90aGVyX2tleXNfY2FuX2JlX2FkZGVkX2hlcmUiOiJkbyBub3QgY29tcGFyZSBjbGllbnREYXRhSlNPTiBhZ2FpbnN0IGEgdGVtcGxhdGUuIFNlZSBodHRwczovL2dvby5nbC95YWJQZXgifQAAAAAAAAAAAA"
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