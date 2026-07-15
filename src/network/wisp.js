const currentUrl = new URL(window.location.href);
const wsProtocol = currentUrl.protocol === 'https:' ? 'wss:' : 'ws:';

export const wispConfig = { 
  "wss_routes": [ // feel free to change wss routes, remove non local, or remove local routes, or add alterear indexes
    {
      "name": "local-wisp",
      "route": `${wsProtocol}//${currentUrl.host}/`, // local wisp (only host when a server side is present)
      "priority": 0
    },
    {
      "name": "anura-wisp",
      "route": "wss://anura.pro/", // non-local wisp (calls for fallback)
      "priority": 1
    },
    {
      "name": "mercuryworkshop-wisp",
      "route": "wss://wisp.mercurywork.shop/", // non-local wisp (calls for fallback)
      "priority": 2
    }
  ]
};
