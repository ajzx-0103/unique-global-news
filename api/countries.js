const COUNTRIES = [
  { code: 'cn', name: '中国', lang: 'zh', flag: '🇨🇳' },
  { code: 'us', name: '美国', lang: 'en', flag: '🇺🇸' },
  { code: 'gb', name: '英国', lang: 'en', flag: '🇬🇧' },
  { code: 'jp', name: '日本', lang: 'ja', flag: '🇯🇵' },
  { code: 'kr', name: '韩国', lang: 'ko', flag: '🇰🇷' },
  { code: 'de', name: '德国', lang: 'de', flag: '🇩🇪' },
  { code: 'fr', name: '法国', lang: 'fr', flag: '🇫🇷' },
  { code: 'ru', name: '俄罗斯', lang: 'ru', flag: '🇷🇺' },
  { code: 'in', name: '印度', lang: 'en', flag: '🇮🇳' },
  { code: 'br', name: '巴西', lang: 'pt', flag: '🇧🇷' },
  { code: 'au', name: '澳大利亚', lang: 'en', flag: '🇦🇺' },
  { code: 'ca', name: '加拿大', lang: 'en', flag: '🇨🇦' },
  { code: 'es', name: '西班牙', lang: 'es', flag: '🇪🇸' },
  { code: 'it', name: '意大利', lang: 'it', flag: '🇮🇹' },
  { code: 'ar', name: '阿根廷', lang: 'es', flag: '🇦🇷' },
  { code: 'mx', name: '墨西哥', lang: 'es', flag: '🇲🇽' },
  { code: 'nl', name: '荷兰', lang: 'nl', flag: '🇳🇱' },
  { code: 'pl', name: '波兰', lang: 'pl', flag: '🇵🇱' },
  { code: 'se', name: '瑞典', lang: 'sv', flag: '🇸🇪' },
  { code: 'no', name: '挪威', lang: 'no', flag: '🇳🇴' },
  { code: 'ch', name: '瑞士', lang: 'de', flag: '🇨🇭' },
  { code: 'at', name: '奥地利', lang: 'de', flag: '🇦🇹' },
  { code: 'be', name: '比利时', lang: 'nl', flag: '🇧🇪' },
  { code: 'il', name: '以色列', lang: 'he', flag: '🇮🇱' },
  { code: 'sa', name: '沙特阿拉伯', lang: 'ar', flag: '🇸🇦' },
  { code: 'ae', name: '阿联酋', lang: 'ar', flag: '🇦🇪' },
  { code: 'tr', name: '土耳其', lang: 'tr', flag: '🇹🇷' },
  { code: 'za', name: '南非', lang: 'en', flag: '🇿🇦' },
  { code: 'ng', name: '尼日利亚', lang: 'en', flag: '🇳🇬' },
  { code: 'eg', name: '埃及', lang: 'ar', flag: '🇪🇬' },
  { code: 'sg', name: '新加坡', lang: 'en', flag: '🇸🇬' },
  { code: 'th', name: '泰国', lang: 'th', flag: '🇹🇭' },
  { code: 'id', name: '印度尼西亚', lang: 'en', flag: '🇮🇩' },
  { code: 'my', name: '马来西亚', lang: 'en', flag: '🇲🇾' },
  { code: 'ph', name: '菲律宾', lang: 'en', flag: '🇵🇭' },
  { code: 'vn', name: '越南', lang: 'vi', flag: '🇻🇳' },
  { code: 'nz', name: '新西兰', lang: 'en', flag: '🇳🇿' },
  { code: 'global', name: '全球', lang: 'en', flag: '🌍' }
];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const countriesWithCount = COUNTRIES.map(c => ({
    ...c,
    count: 0
  }));

  return res.status(200).json(countriesWithCount);
}
