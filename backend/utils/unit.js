const UNIT_ALIASES = {
  nos: ["nos", "no", "number", "each"],
  sqm: ["sqm", "sq.m", "square metre", "sqmt", "m2", "sq metre"],
  m: ["m", "meter", "metre", "mt"],
  km: ["km", "kilometer", "kilometre"],
  kg: ["kg", "kilogram", "kgs", "kg."],
  litre: ["litre", "liter", "ltr", "lt"],
  set: ["set", "sets"],
  job: ["job", "l.s", "ls", "lump sum"],
  unit: ["unit"],
  pair: ["pair", "pairs"],
  bundle: ["bundle", "bundles"],
};

const normalizeRawUnit = (unit = "") => {
  if (!unit) return "";
  const cleaned = unit
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ");

  for (const [canonical, aliases] of Object.entries(UNIT_ALIASES)) {
    if (aliases.includes(cleaned)) {
      return canonical;
    }
  }

  return cleaned.split(" ")[0];
};

export const normalizeUnit = (unit) => normalizeRawUnit(unit);

export const isCountableUnit = (unit = "") => {
  const normalized = normalizeUnit(unit);
  return ["nos", "set", "pair", "bundle", "unit"].includes(normalized);
};

export default {
  normalizeUnit,
  isCountableUnit,
};
