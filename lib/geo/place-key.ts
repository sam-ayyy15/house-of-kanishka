/**
 * How place and state names are compared: lower case, letters and digits only, with the usual
 * variations folded together ("Andaman & Nicobar Islands" = "Andaman and Nicobar",
 * "Orissa" = "Odisha", "NCT of Delhi" = "Delhi"). Pure: shared by the data script and the server.
 */
export const placeKey = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');

const STATE_ALIASES: Record<string, string> = {
  orissa: 'odisha',
  pondicherry: 'puducherry',
  uttaranchal: 'uttarakhand',
  nctofdelhi: 'delhi',
  nationalcapitalterritoryofdelhi: 'delhi',
  newdelhi: 'delhi',
  andamanandnicobarislands: 'andamanandnicobar',
  dadraandnagarhaveli: 'dadraandnagarhavelianddamananddiu',
  damananddiu: 'dadraandnagarhavelianddamananddiu',
  jandk: 'jammuandkashmir',
};

export const stateKey = (name: string) => {
  const k = placeKey(name);
  return STATE_ALIASES[k] ?? k;
};
