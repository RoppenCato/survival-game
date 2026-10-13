// node -r seedrand.js ... : Math.random from a seed (RSEED), so a rare thing in a test can be played again
var a = (+process.env.RSEED || 1) >>> 0;
Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
