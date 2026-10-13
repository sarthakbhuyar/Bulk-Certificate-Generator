/**
 * Predefined Certificate Template Vector Engine
 * Generates high-resolution vector SVG certificates (1200x850 aspect ratio 1.414 standard landscape diploma)
 * with customizable themes, guilloche seal, authentic border artwork, and verification security marks.
 */

export interface CertificateParams {
  certificateId: string;
  verificationHash: string;
  recipientName: string;
  recipientEmail?: string;
  eventName: string;
  organizationName: string;
  issueDate: string;
  signatoryName: string;
  signatoryTitle: string;
  score?: string;
  theme?: 'royal_gold' | 'executive_navy' | 'academic_emerald' | 'modern_tech';
}

const THEME_PALETTES = {
  royal_gold: {
    bgFrom: '#0f172a',
    bgTo: '#020617',
    paperBg: '#fffdfa',
    innerBorder: '#d4af37',
    outerBorder: '#b38f28',
    sealGold1: '#fef08a',
    sealGold2: '#eab308',
    sealGold3: '#a16207',
    primaryText: '#1e293b',
    titleColor: '#854d0e',
    nameColor: '#0f172a',
    badgeRibbon: '#b45309',
    accentLine: '#d4af37',
  },
  executive_navy: {
    bgFrom: '#030712',
    bgTo: '#0f172a',
    paperBg: '#f8fafc',
    innerBorder: '#1e3a8a',
    outerBorder: '#3b82f6',
    sealGold1: '#93c5fd',
    sealGold2: '#3b82f6',
    sealGold3: '#1d4ed8',
    primaryText: '#1e293b',
    titleColor: '#1e3a8a',
    nameColor: '#0f172a',
    badgeRibbon: '#1d4ed8',
    accentLine: '#60a5fa',
  },
  academic_emerald: {
    bgFrom: '#022c22',
    bgTo: '#064e3b',
    paperBg: '#fbfdfb',
    innerBorder: '#065f46',
    outerBorder: '#047857',
    sealGold1: '#6ee7b7',
    sealGold2: '#10b981',
    sealGold3: '#047857',
    primaryText: '#134e4a',
    titleColor: '#065f46',
    nameColor: '#022c22',
    badgeRibbon: '#047857',
    accentLine: '#34d399',
  },
  modern_tech: {
    bgFrom: '#09090b',
    bgTo: '#18181b',
    paperBg: '#fafafa',
    innerBorder: '#6366f1',
    outerBorder: '#8b5cf6',
    sealGold1: '#c4b5fd',
    sealGold2: '#8b5cf6',
    sealGold3: '#6d28d9',
    primaryText: '#18181b',
    titleColor: '#4f46e5',
    nameColor: '#09090b',
    badgeRibbon: '#7c3aed',
    accentLine: '#818cf8',
  },
};

export function generateCertificateSvg(params: CertificateParams): string {
  const theme = THEME_PALETTES[params.theme || 'royal_gold'];
  const certId = params.certificateId || `CERT-${Date.now()}`;
  const verificationHash = params.verificationHash || 'VERIF-7F9A1B2C8D';
  const scoreText = params.score ? `Grade / Score: ${params.score}` : '';

  // Minimal SVG QR code simulation matrix for certificate verification
  const qrBlocks = generateQrPattern(verificationHash);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 850" width="100%" height="100%">
  <defs>
    <linearGradient id="sealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.sealGold1}" />
      <stop offset="50%" stop-color="${theme.sealGold2}" />
      <stop offset="100%" stop-color="${theme.sealGold3}" />
    </linearGradient>

    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.outerBorder}" />
      <stop offset="50%" stop-color="${theme.innerBorder}" />
      <stop offset="100%" stop-color="${theme.outerBorder}" />
    </linearGradient>

    <filter id="shadowFilter" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-opacity="0.18" flood-color="#000" />
    </filter>

    <pattern id="guilloche" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 0,20 Q 10,0 20,20 T 40,20" fill="none" stroke="${theme.accentLine}" stroke-width="0.5" stroke-opacity="0.25" />
      <path d="M 20,0 Q 40,10 20,20 T 20,40" fill="none" stroke="${theme.accentLine}" stroke-width="0.5" stroke-opacity="0.15" />
    </pattern>
  </defs>

  <!-- Background Base -->
  <rect width="1200" height="850" fill="${theme.paperBg}" />

  <!-- Subtle Parchment Texture / Pattern Overlay -->
  <rect x="20" y="20" width="1160" height="810" fill="url(#guilloche)" />

  <!-- Outer Ornate Frame -->
  <rect x="25" y="25" width="1150" height="800" fill="none" stroke="url(#borderGrad)" stroke-width="4" rx="6" />
  <rect x="35" y="35" width="1130" height="780" fill="none" stroke="${theme.innerBorder}" stroke-width="1.5" stroke-dasharray="6,4" />
  <rect x="42" y="42" width="1116" height="766" fill="none" stroke="url(#borderGrad)" stroke-width="2" />

  <!-- Corner Flourishes -->
  <!-- Top Left -->
  <g transform="translate(42, 42)">
    <path d="M 0 0 L 50 0 M 0 0 L 0 50 M 8 8 L 35 8 M 8 8 L 8 35" stroke="${theme.accentLine}" stroke-width="2" fill="none" />
    <circle cx="14" cy="14" r="4" fill="${theme.sealGold2}" />
  </g>
  <!-- Top Right -->
  <g transform="translate(1158, 42)">
    <path d="M 0 0 L -50 0 M 0 0 L 0 50 M -8 8 L -35 8 M -8 8 L -8 35" stroke="${theme.accentLine}" stroke-width="2" fill="none" />
    <circle cx="-14" cy="14" r="4" fill="${theme.sealGold2}" />
  </g>
  <!-- Bottom Left -->
  <g transform="translate(42, 808)">
    <path d="M 0 0 L 50 0 M 0 0 L 0 -50 M 8 -8 L 35 -8 M 8 -8 L 8 -35" stroke="${theme.accentLine}" stroke-width="2" fill="none" />
    <circle cx="14" cy="-14" r="4" fill="${theme.sealGold2}" />
  </g>
  <!-- Bottom Right -->
  <g transform="translate(1158, 808)">
    <path d="M 0 0 L -50 0 M 0 0 L 0 -50 M -8 -8 L -35 -8 M -8 -8 L -8 -35" stroke="${theme.accentLine}" stroke-width="2" fill="none" />
    <circle cx="-14" cy="-14" r="4" fill="${theme.sealGold2}" />
  </g>

  <!-- Organization Header -->
  <text x="600" y="110" font-family="'Cinzel', 'Times New Roman', serif" font-size="20" font-weight="700" letter-spacing="4" fill="${theme.titleColor}" text-anchor="middle">
    ${escapeXml(params.organizationName.toUpperCase())}
  </text>
  
  <line x1="450" y1="125" x2="750" y2="125" stroke="${theme.accentLine}" stroke-width="1.5" />
  <circle cx="600" cy="125" r="3" fill="${theme.sealGold3}" />

  <!-- Main Certificate Title -->
  <text x="600" y="180" font-family="'Cinzel', 'Times New Roman', serif" font-size="38" font-weight="800" letter-spacing="6" fill="${theme.titleColor}" text-anchor="middle">
    CERTIFICATE OF RECOGNITION
  </text>

  <!-- Subtitle -->
  <text x="600" y="222" font-family="'Inter', sans-serif" font-size="14" font-weight="500" letter-spacing="3" fill="#64748b" text-anchor="middle">
    THIS PRESTIGIOUS CREDENTIAL IS PROUDLY CONFERRED UPON
  </text>

  <!-- Recipient Name (Star Attraction) -->
  <text x="600" y="305" font-family="'Playfair Display', Georgia, serif" font-style="italic" font-size="52" font-weight="700" fill="${theme.nameColor}" text-anchor="middle">
    ${escapeXml(params.recipientName)}
  </text>
  
  <!-- Underline under recipient name -->
  <path d="M 320 330 Q 600 338 880 330" fill="none" stroke="${theme.accentLine}" stroke-width="2" />

  <!-- Completion Statement -->
  <text x="600" y="375" font-family="'Inter', sans-serif" font-size="15" font-weight="400" fill="#475569" text-anchor="middle">
    for distinguished participation and fulfillment of all academic and practical requirements in
  </text>

  <!-- Event / Course Name -->
  <text x="600" y="425" font-family="'Cinzel', 'Times New Roman', serif" font-size="26" font-weight="700" fill="${theme.titleColor}" text-anchor="middle">
    ${escapeXml(params.eventName)}
  </text>

  <!-- Optional Score or Distinction Note -->
  ${
    scoreText
      ? `<text x="600" y="465" font-family="'Inter', sans-serif" font-size="15" font-weight="600" fill="#059669" text-anchor="middle">
    ${escapeXml(scoreText)}
  </text>`
      : ''
  }

  <!-- Seal of Authenticity Medallion (Center Bottom) -->
  <g transform="translate(600, 595)" filter="url(#shadowFilter)">
    <!-- Medallion Ribbon Wings -->
    <path d="M -30 20 L -45 90 L -15 75 L 0 90 L 0 20 Z" fill="${theme.badgeRibbon}" />
    <path d="M 30 20 L 45 90 L 15 75 L 0 90 L 0 20 Z" fill="${theme.badgeRibbon}" />
    
    <!-- Starburst scalloped rim -->
    <circle cx="0" cy="0" r="54" fill="url(#sealGrad)" />
    <circle cx="0" cy="0" r="48" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.8" />
    <circle cx="0" cy="0" r="44" fill="url(#sealGrad)" />
    <circle cx="0" cy="0" r="42" fill="none" stroke="#78350f" stroke-width="1" stroke-dasharray="2,2" />

    <!-- Seal Icon Graphic -->
    <polygon points="0,-22 6,-8 22,-8 10,2 14,18 0,8 -14,18 -10,2 -22,-8 -6,-8" fill="#ffffff" opacity="0.9" />
    
    <!-- Seal Text -->
    <text x="0" y="30" font-family="'Cinzel', sans-serif" font-size="8" font-weight="800" letter-spacing="1.5" fill="#78350f" text-anchor="middle">
      VERIFIED • AUTHENTIC
    </text>
  </g>

  <!-- Left: Issue Date and Signatory 1 -->
  <g transform="translate(180, 610)">
    <line x1="0" y1="40" x2="260" y2="40" stroke="#94a3b8" stroke-width="1.5" />
    <text x="130" y="30" font-family="'Inter', sans-serif" font-size="14" font-weight="600" fill="#1e293b" text-anchor="middle">
      ${escapeXml(params.issueDate)}
    </text>
    <text x="130" y="60" font-family="'Cinzel', serif" font-size="11" font-weight="700" letter-spacing="1" fill="#64748b" text-anchor="middle">
      DATE OF ISSUANCE
    </text>
  </g>

  <!-- Right: Official Signatory Line & Digital Signature Graphic -->
  <g transform="translate(760, 610)">
    <!-- Realistic Signature simulation curve -->
    <path d="M 30 18 C 60 5, 80 40, 110 15 C 130 -2, 160 25, 190 12 C 210 2, 230 20, 240 10" 
          fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round" />
    
    <line x1="0" y1="40" x2="260" y2="40" stroke="#94a3b8" stroke-width="1.5" />
    
    <text x="130" y="58" font-family="'Playfair Display', serif" font-size="15" font-weight="700" fill="#0f172a" text-anchor="middle">
      ${escapeXml(params.signatoryName)}
    </text>
    <text x="130" y="74" font-family="'Inter', sans-serif" font-size="11" font-weight="500" fill="#64748b" text-anchor="middle">
      ${escapeXml(params.signatoryTitle)}
    </text>
  </g>

  <!-- Bottom Verification Footer & QR Code Security Token -->
  <g transform="translate(80, 750)">
    <!-- QR Code Container -->
    <g transform="translate(0, -10)">
      <rect x="0" y="0" width="46" height="46" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" rx="2" />
      ${qrBlocks}
    </g>

    <!-- Credentials metadata text -->
    <g transform="translate(60, 5)">
      <text x="0" y="6" font-family="'Fira Code', monospace" font-size="10" font-weight="600" fill="#475569">
        CERTIFICATE ID: <tspan fill="#0f172a" font-weight="700">${escapeXml(certId)}</tspan>
      </text>
      <text x="0" y="20" font-family="'Fira Code', monospace" font-size="9" font-weight="500" fill="#64748b">
        VERIFICATION HASH: <tspan fill="#2563eb">${escapeXml(verificationHash)}</tspan>
      </text>
      <text x="0" y="32" font-family="'Inter', sans-serif" font-size="8" font-weight="400" fill="#94a3b8">
        Verify authentic credential integrity at /api/certificates/verify/${escapeXml(verificationHash)}
      </text>
    </g>
  </g>

</svg>`;
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Procedural pseudo-QR code matrix to render a visually convincing QR pattern
 * matching the verification hash deterministically.
 */
function generateQrPattern(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  const rects: string[] = [];
  const size = 3;
  const offset = 4;

  // 3 Corner positioning blocks
  // Top-left
  rects.push(
    `<rect x="${offset}" y="${offset}" width="${size * 3}" height="${size * 3}" fill="#0f172a" />`,
  );
  rects.push(
    `<rect x="${offset + size}" y="${offset + size}" width="${size}" height="${size}" fill="#ffffff" />`,
  );

  // Top-right
  rects.push(
    `<rect x="${offset + 26}" y="${offset}" width="${size * 3}" height="${size * 3}" fill="#0f172a" />`,
  );
  rects.push(
    `<rect x="${offset + 26 + size}" y="${offset + size}" width="${size}" height="${size}" fill="#ffffff" />`,
  );

  // Bottom-left
  rects.push(
    `<rect x="${offset}" y="${offset + 26}" width="${size * 3}" height="${size * 3}" fill="#0f172a" />`,
  );
  rects.push(
    `<rect x="${offset + size}" y="${offset + 26 + size}" width="${size}" height="${size}" fill="#ffffff" />`,
  );

  // Procedural data dots
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      // Avoid corner squares
      if (
        (r < 4 && c < 4) ||
        (r < 4 && c > 5) ||
        (r > 5 && c < 4)
      ) {
        continue;
      }
      const val = Math.abs(Math.sin((hash + r * 13 + c * 37) * 999));
      if (val > 0.42) {
        rects.push(
          `<rect x="${offset + c * 4}" y="${offset + r * 4}" width="${size}" height="${size}" fill="#0f172a" />`,
        );
      }
    }
  }

  return rects.join('\n');
}
