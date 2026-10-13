// Smart college and symposium query matcher with alias resolution

const COLLEGE_ALIASES: Record<string, string[]> = {
  psg: ['psg', 'psg tech', 'psg college'],
  kct: ['kct', 'kumaraguru'],
  kumaraguru: ['kumaraguru', 'kct'],
  skcet: ['skcet', 'sri krishna', 'skct'],
  krishna: ['sri krishna', 'skcet', 'skct'],
  kpr: ['kpr'],
  kongu: ['kongu'],
  cit: ['cit', 'coimbatore institute of technology'],
  gct: ['gct', 'government college of technology'],
  bit: ['bit', 'bannari', 'bannari amman'],
  bannari: ['bannari', 'bit'],
  anna: ['anna university', 'ceg', 'mit'],
  ceg: ['ceg', 'guindy', 'anna university'],
  mit: ['mit', 'chromepet', 'madras institute'],
  srm: ['srm', 'srmist'],
  ssn: ['ssn'],
  vsb: ['vsb'],
  veltech: ['veltech', 'vel tech'],
  peri: ['peri'],
  sona: ['sona'],
  tce: ['tce', 'thiagarajar'],
  thiagarajar: ['thiagarajar', 'tce'],
  srec: ['srec', 'ramakrishna'],
  hindusthan: ['hindusthan', 'hindustan'],
  nit: ['nit', 'nitt', 'national institute of technology'],
  iit: ['iit', 'iitm', 'indian institute of technology'],
  vit: ['vit', 'vellore institute of technology'],
  amrita: ['amrita'],
  saranathan: ['saranathan'],
  kln: ['kln'],
  saveetha: ['saveetha'],
  sairam: ['sairam'],
  rmk: ['rmk'],
  ngp: ['ngp', 'n.g.p'],
  rathinam: ['rathinam'],
  excel: ['excel'],
  info: ['info institute'],
  bms: ['bms', 'bmsce'],
  rv: ['rvce', 'rv college'],
};

export function matchesEventQuery(
  event: {
    college: string;
    title: string;
    city: string;
    category?: string;
    department?: string;
    about?: string;
  },
  rawQuery: string
): boolean {
  if (!rawQuery) return true;
  const q = rawQuery.trim().toLowerCase();
  if (q === 'all' || q === 'all locations' || q === 'all colleges') return true;

  // Clean strings by replacing punctuation
  const cleanQ = q.replace(/[\(\)\[\],.'"-]/g, ' ').replace(/\s+/g, ' ').trim();
  const text = `${event.college} ${event.title} ${event.city} ${event.category || ''} ${event.department || ''} ${event.about || ''}`
    .toLowerCase()
    .replace(/[\(\)\[\],.'"-]/g, ' ');

  // Direct substring
  if (text.includes(cleanQ) || cleanQ.includes(text)) {
    return true;
  }

  // Tokenize query words
  const queryTerms = cleanQ.split(/\s+/).filter(Boolean);

  // Check alias expansion
  for (const term of queryTerms) {
    if (COLLEGE_ALIASES[term]) {
      const hasAliasMatch = COLLEGE_ALIASES[term].some((alias) => text.includes(alias));
      if (hasAliasMatch) return true;
    }
  }

  // Check if every non-generic query term matches
  const meaningfulTerms = queryTerms.filter(
    (t) => !['college', 'institute', 'technology', 'engineering', 'university', 'campus', 'fest'].includes(t)
  );

  if (meaningfulTerms.length > 0) {
    return meaningfulTerms.every((term) => text.includes(term));
  }

  return queryTerms.some((term) => text.includes(term));
}
