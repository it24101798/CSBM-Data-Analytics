const {
  LOCATION_COORDINATES,
  LOCATION_ALIASES,
} = require("./locationCoordinates");

const normalizeText = (value) => String(value ?? "").trim();

const TITLE_CASE_EXCEPTIONS = ["of", "and", "the"];

const toTitleCase = (text) => {
  return String(text || "")
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word, index) => {
      if (index > 0 && TITLE_CASE_EXCEPTIONS.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
};

const normalizeLocationKey = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[.,/\\]+/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const cleanAddress = (value) => {
  return normalizeText(value)
    .replace(/\n/g, " ")
    .replace(/\d+/g, " ")
    .replace(/[()]/g, " ")
    .replace(/[.;:/\\|]+/g, ",")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const splitAddressParts = (value) => {
  return cleanAddress(value)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
};

const getAllCandidatePhrases = (rawValue) => {
  const cleaned = cleanAddress(rawValue);
  if (!cleaned) return [];

  const parts = splitAddressParts(cleaned);
  const candidates = new Set();

  parts.forEach((part) => {
    const normalizedPart = normalizeLocationKey(part);
    if (normalizedPart) candidates.add(normalizedPart);

    const words = normalizedPart.split(" ").filter(Boolean);

    // add last 1 to 4 word phrases from each part for better matching
    for (let size = 1; size <= 4; size += 1) {
      if (words.length >= size) {
        const phrase = words.slice(-size).join(" ");
        if (phrase) candidates.add(phrase);
      }
    }

    // also add full sliding phrases up to 4 words
    for (let i = 0; i < words.length; i += 1) {
      for (let size = 1; size <= 4; size += 1) {
        if (i + size <= words.length) {
          const phrase = words.slice(i, i + size).join(" ");
          if (phrase) candidates.add(phrase);
        }
      }
    }
  });

  const cleanedWords = normalizeLocationKey(cleaned).split(" ").filter(Boolean);

  for (let size = 1; size <= 4; size += 1) {
    if (cleanedWords.length >= size) {
      const tailPhrase = cleanedWords.slice(-size).join(" ");
      if (tailPhrase) candidates.add(tailPhrase);
    }
  }

  return Array.from(candidates);
};

const findCanonicalLocationKey = (rawValue) => {
  const normalizedRaw = normalizeLocationKey(rawValue);
  if (!normalizedRaw) return "";

  // 1. exact direct coordinate key
  if (LOCATION_COORDINATES[normalizedRaw]) {
    return normalizedRaw;
  }

  // 2. exact alias
  if (LOCATION_ALIASES[normalizedRaw]) {
    return LOCATION_ALIASES[normalizedRaw];
  }

  const candidates = getAllCandidatePhrases(rawValue);

  // 3. exact candidate match against alias list
  for (const candidate of candidates) {
    if (LOCATION_ALIASES[candidate]) {
      return LOCATION_ALIASES[candidate];
    }
  }

  // 4. exact candidate match against coordinate keys
  for (const candidate of candidates) {
    if (LOCATION_COORDINATES[candidate]) {
      return candidate;
    }
  }

  // 5. substring match against aliases
  const aliasKeys = Object.keys(LOCATION_ALIASES);
  for (const candidate of candidates) {
    const aliasMatch = aliasKeys.find(
      (alias) => candidate.includes(alias) || alias.includes(candidate)
    );
    if (aliasMatch) {
      return LOCATION_ALIASES[aliasMatch];
    }
  }

  // 6. substring match against coordinate keys
  const coordinateKeys = Object.keys(LOCATION_COORDINATES);
  for (const candidate of candidates) {
    const directMatch = coordinateKeys.find(
      (key) => candidate.includes(key) || key.includes(candidate)
    );
    if (directMatch) {
      return directMatch;
    }
  }

  return "";
};

const pickFallbackLocation = (rawValue) => {
  const parts = splitAddressParts(rawValue);

  if (parts.length > 0) {
    const last = parts[parts.length - 1];
    if (last) return toTitleCase(last);
  }

  const words = cleanAddress(rawValue).split(" ").filter(Boolean);

  if (words.length >= 2) {
    return toTitleCase(words.slice(-2).join(" "));
  }

  if (words.length === 1) {
    return toTitleCase(words[0]);
  }

  return "";
};

const normalizeSriLankaLocation = (rawValue) => {
  if (!normalizeText(rawValue)) return "";

  const canonicalKey = findCanonicalLocationKey(rawValue);
  if (canonicalKey) {
    return toTitleCase(canonicalKey);
  }

  return pickFallbackLocation(rawValue);
};

const buildLocationCounts = (values = []) => {
  const counts = {};

  values.forEach((value) => {
    const normalized = normalizeSriLankaLocation(value);
    if (!normalized) return;
    counts[normalized] = (counts[normalized] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

module.exports = {
  normalizeSriLankaLocation,
  buildLocationCounts,
  normalizeLocationKey,
};