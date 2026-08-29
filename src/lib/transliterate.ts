import type { LyricLine } from '@/types';

/**
 * Checks if a string or array of lyric lines contains any Devanagari Unicode characters (U+0900 to U+097F).
 */
export function hasDevanagari(textOrLines: string | LyricLine[]): boolean {
  if (Array.isArray(textOrLines)) {
    return textOrLines.some((line) => /[\u0900-\u097F]/.test(line.text));
  }
  return /[\u0900-\u097F]/.test(textOrLines);
}

// Common Hindi musical words dictionary for natural lyric Romanization
const COMMON_LYRIC_EXCEPTIONS: Record<string, string> = {
  'है': 'hai',
  'हैं': 'hain',
  'में': 'mein',
  'हम': 'hum',
  'क्यों': 'kyun',
  'क्यूँ': 'kyun',
  'तेरी': 'teri',
  'तेरे': 'tere',
  'तेरा': 'tera',
  'मेरी': 'meri',
  'मेरे': 'mere',
  'मेरा': 'mera',
  'दिल': 'dil',
  'प्यार': 'pyaar',
  'इश्क': 'ishq',
  'इश्क़': 'ishq',
  'मोहब्बत': 'mohabbat',
  'ज़िंदगी': 'zindagi',
  'जिंदगी': 'zindagi',
  'तू': 'tu',
  'तुझे': 'tujhe',
  'मुझे': 'mujhe',
  'जाना': 'jaana',
  'सनम': 'sanam',
  'नहीं': 'nahin',
  'नही': 'nahin',
  'हो': 'ho',
  'था': 'tha',
  'थी': 'thi',
  'थे': 'the',
  'रहना': 'rahna',
  'साथ': 'saath',
  'पास': 'paas',
  'आँखों': 'aankhon',
  'आंखों': 'aankhon',
  'बात': 'baat',
  'रात': 'raat',
  'साथी': 'saathi',
  'यारा': 'yaara',
  'याद': 'yaad',
  'ख़ुदा': 'khuda',
  'खुदा': 'khuda',
  'दुआ': 'dua',
  'ख्वाब': 'khwaab',
  'ख़्वाब': 'khwaab',
  'रंग': 'rang',
  'संग': 'sang',
  'कभी': 'kabhi',
  'अभी': 'abhi',
  'सफर': 'safar',
  'हवा': 'hawa',
  'नैन': 'nain',
  'नैना': 'naina',
};

// Independent Vowels
const VOWELS: Record<string, string> = {
  'अ': 'a',
  'आ': 'aa',
  'इ': 'i',
  'ई': 'ee',
  'उ': 'u',
  'ऊ': 'oo',
  'ऋ': 'ri',
  'ॠ': 'ree',
  'ऌ': 'li',
  'ॡ': 'lee',
  'ए': 'e',
  'ऐ': 'ai',
  'ओ': 'o',
  'औ': 'au',
  'ऑ': 'o',
  'ऍ': 'e',
};

// Dependent Vowel Signs (Matras)
const MATRAS: Record<string, string> = {
  'ा': 'aa',
  'ि': 'i',
  'ी': 'ee',
  'ु': 'u',
  'ू': 'oo',
  'ृ': 'ri',
  'ॄ': 'ree',
  'ॢ': 'li',
  'ॣ': 'lee',
  'े': 'e',
  'ै': 'ai',
  'ो': 'o',
  'ौ': 'au',
  'ॉ': 'o',
  'ॅ': 'e',
};

// Consonants with base Latin equivalents
const CONSONANTS: Record<string, string> = {
  'क': 'k',
  'ख': 'kh',
  'ग': 'g',
  'घ': 'gh',
  'ङ': 'ng',
  'च': 'ch',
  'छ': 'chh',
  'ज': 'j',
  'झ': 'jh',
  'ञ': 'ny',
  'ट': 't',
  'ठ': 'th',
  'ड': 'd',
  'ढ': 'dh',
  'ण': 'n',
  'त': 't',
  'थ': 'th',
  'द': 'd',
  'ध': 'dh',
  'न': 'n',
  'प': 'p',
  'फ': 'f',
  'ब': 'b',
  'भ': 'bh',
  'म': 'm',
  'य': 'y',
  'र': 'r',
  'ल': 'l',
  'व': 'v',
  'श': 'sh',
  'ष': 'sh',
  'स': 's',
  'ह': 'h',
  'क्ष': 'ksh',
  'त्र': 'tr',
  'ज्ञ': 'gy',
  'श्र': 'shr',
  // Pre-composed Nukta consonants
  'क़': 'q',
  'ख़': 'kh',
  'ग़': 'gh',
  'ज़': 'z',
  'ड़': 'r',
  'ढ़': 'rh',
  'फ़': 'f',
  'य़': 'y',
  'ऱ': 'r',
  'ळ': 'l',
};

// Combining Nukta mappings (\u093C)
const NUKTA_COMBINATIONS: Record<string, string> = {
  'क\u093C': 'क़',
  'ख\u093C': 'ख़',
  'ग\u093C': 'ग़',
  'ज\u093C': 'ज़',
  'ड\u093C': 'ड़',
  'ढ\u093C': 'ढ़',
  'फ\u093C': 'फ़',
  'य\u093C': 'य़',
  'र\u093C': 'ऱ',
  'ल\u093C': 'ळ',
};

const NUMBERS: Record<string, string> = {
  '०': '0',
  '१': '1',
  '२': '2',
  '३': '3',
  '४': '4',
  '५': '5',
  '६': '6',
  '७': '7',
  '८': '8',
  '९': '9',
};

function isDevanagari(char: string): boolean {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return code >= 0x0900 && code <= 0x097F;
}

/**
 * Normalizes Devanagari text by resolving decomposed combining characters (Nukta \u093C, Anusvara \u0902).
 */
function normalizeDevanagari(text: string): string {
  let normalized = text;
  for (const [seq, precomposed] of Object.entries(NUKTA_COMBINATIONS)) {
    normalized = normalized.split(seq).join(precomposed);
  }
  return normalized;
}

/**
 * Transliterates a single Hindi word from Devanagari to Romanized Hinglish.
 */
function transliterateWord(word: string): string {
  const cleanWord = normalizeDevanagari(word.trim());

  // 1. Direct dictionary match for common musical terms
  if (COMMON_LYRIC_EXCEPTIONS[cleanWord]) {
    return COMMON_LYRIC_EXCEPTIONS[cleanWord];
  }

  let result = '';
  const len = cleanWord.length;

  for (let i = 0; i < len; i++) {
    const char = cleanWord[i];
    const nextChar = i + 1 < len ? cleanWord[i + 1] : '';
    const twoChar = char + nextChar;

    // Numbers
    if (NUMBERS[char]) {
      result += NUMBERS[char];
      continue;
    }

    // Two-character precomposed or conjuncts
    if (CONSONANTS[twoChar]) {
      result += CONSONANTS[twoChar];
      i++;
      const following = i + 1 < len ? cleanWord[i + 1] : '';

      if (following === '्') {
        i++;
      } else if (MATRAS[following]) {
        result += MATRAS[following];
        i++;
      } else if (following === 'ं' || following === 'ँ' || following === '\u0902') {
        result += 'a';
      } else if (following && isDevanagari(following)) {
        result += 'a';
      }
      continue;
    }

    // Independent Vowels
    if (VOWELS[char]) {
      result += VOWELS[char];
      continue;
    }

    // Consonants
    if (CONSONANTS[char]) {
      result += CONSONANTS[char];

      if (nextChar === '्') {
        // Virama/Halant suppresses vowel
        i++;
      } else if (MATRAS[nextChar]) {
        // Matra replaces inherent 'a'
        result += MATRAS[nextChar];
        i++;
      } else if (nextChar === 'ं' || nextChar === 'ँ' || nextChar === '\u0902') {
        // Anusvara/Chandrabindu directly after consonant
        result += 'a';
      } else if (nextChar && isDevanagari(nextChar) && !MATRAS[nextChar] && nextChar !== '्') {
        // Inter-syllabic inherent vowel
        result += 'a';
      }
      continue;
    }

    // Standalone Matras
    if (MATRAS[char]) {
      result += MATRAS[char];
      continue;
    }

    // Modifiers
    if (char === 'ं' || char === 'ँ' || char === '\u0902') {
      result += 'n';
      continue;
    }
    if (char === 'ः') {
      result += 'h';
      continue;
    }
    if (char === '्') {
      continue;
    }
    if (char === '।' || char === '॥') {
      result += '.';
      continue;
    }

    result += char;
  }

  return result;
}

/**
 * Transliterates a full line of text containing Devanagari into Hinglish.
 */
export function transliterateDevanagariToHinglish(text: string): string {
  if (!text) return '';
  if (!hasDevanagari(text)) return text;

  // Split while preserving whitespace and punctuation
  const tokens = text.split(/(\s+|[.,!?'"()[\]{}:;~|\\/]+)/);

  return tokens
    .map((token) => {
      if (hasDevanagari(token)) {
        return transliterateWord(token);
      }
      return token;
    })
    .join('');
}

/**
 * Transliterates an array of LyricLine objects while maintaining precise timestamps.
 */
export function transliterateLyricLines(lines: LyricLine[]): LyricLine[] {
  return lines.map((line) => ({
    time: line.time,
    text: transliterateDevanagariToHinglish(line.text),
  }));
}
