export const regions = [
  { id: 'asia', name: '亚洲', icon: '🌏' },
  { id: 'europe', name: '欧洲', icon: '🏰' },
  { id: 'north-america', name: '北美洲', icon: '🗽' },
  { id: 'south-america', name: '南美洲', icon: '🌎' },
  { id: 'oceania', name: '大洋洲', icon: '🏝️' },
  { id: 'africa', name: '非洲', icon: '🦁' },
  { id: 'middle-east', name: '中东', icon: '🕌' },
];

export const countries = [
  // 亚洲
  { code: 'cn', name: '中国', region: 'asia', flag: '🇨🇳', lang: 'zh' },
  { code: 'jp', name: '日本', region: 'asia', flag: '🇯🇵', lang: 'ja' },
  { code: 'kr', name: '韩国', region: 'asia', flag: '🇰🇷', lang: 'ko' },
  { code: 'in', name: '印度', region: 'asia', flag: '🇮🇳', lang: 'en' },
  { code: 'id', name: '印度尼西亚', region: 'asia', flag: '🇮🇩', lang: 'en' },
  { code: 'th', name: '泰国', region: 'asia', flag: '🇹🇭', lang: 'th' },
  { code: 'my', name: '马来西亚', region: 'asia', flag: '🇲🇾', lang: 'en' },
  { code: 'ph', name: '菲律宾', region: 'asia', flag: '🇵🇭', lang: 'en' },
  { code: 'sg', name: '新加坡', region: 'asia', flag: '🇸🇬', lang: 'en' },
  { code: 'pk', name: '巴基斯坦', region: 'asia', flag: '🇵🇰', lang: 'en' },
  { code: 'hk', name: '香港', region: 'asia', flag: '🇭🇰', lang: 'zh' },
  { code: 'tw', name: '台湾', region: 'asia', flag: '🇹🇼', lang: 'zh' },
  { code: 'vn', name: '越南', region: 'asia', flag: '🇻🇳', lang: 'vi' },

  // 欧洲
  { code: 'gb', name: '英国', region: 'europe', flag: '🇬🇧', lang: 'en' },
  { code: 'de', name: '德国', region: 'europe', flag: '🇩🇪', lang: 'de' },
  { code: 'fr', name: '法国', region: 'europe', flag: '🇫🇷', lang: 'fr' },
  { code: 'it', name: '意大利', region: 'europe', flag: '🇮🇹', lang: 'it' },
  { code: 'es', name: '西班牙', region: 'europe', flag: '🇪🇸', lang: 'es' },
  { code: 'ru', name: '俄罗斯', region: 'europe', flag: '🇷🇺', lang: 'ru' },
  { code: 'nl', name: '荷兰', region: 'europe', flag: '🇳🇱', lang: 'nl' },
  { code: 'pl', name: '波兰', region: 'europe', flag: '🇵🇱', lang: 'pl' },
  { code: 'be', name: '比利时', region: 'europe', flag: '🇧🇪', lang: 'nl' },
  { code: 'se', name: '瑞典', region: 'europe', flag: '🇸🇪', lang: 'sv' },
  { code: 'no', name: '挪威', region: 'europe', flag: '🇳🇴', lang: 'no' },
  { code: 'at', name: '奥地利', region: 'europe', flag: '🇦🇹', lang: 'de' },
  { code: 'ch', name: '瑞士', region: 'europe', flag: '🇨🇭', lang: 'de' },
  { code: 'ro', name: '罗马尼亚', region: 'europe', flag: '🇷🇴', lang: 'ro' },
  { code: 'gr', name: '希腊', region: 'europe', flag: '🇬🇷', lang: 'el' },
  { code: 'dk', name: '丹麦', region: 'europe', flag: '🇩🇰', lang: 'da' },
  { code: 'cz', name: '捷克', region: 'europe', flag: '🇨🇿', lang: 'cs' },
  { code: 'pt', name: '葡萄牙', region: 'europe', flag: '🇵🇹', lang: 'pt' },
  { code: 'ie', name: '爱尔兰', region: 'europe', flag: '🇮🇪', lang: 'en' },
  { code: 'fi', name: '芬兰', region: 'europe', flag: '🇫🇮', lang: 'fi' },
  { code: 'ua', name: '乌克兰', region: 'europe', flag: '🇺🇦', lang: 'uk' },
  { code: 'hu', name: '匈牙利', region: 'europe', flag: '🇭🇺', lang: 'hu' },
  { code: 'sk', name: '斯洛伐克', region: 'europe', flag: '🇸🇰', lang: 'sk' },

  // 北美洲
  { code: 'us', name: '美国', region: 'north-america', flag: '🇺🇸', lang: 'en' },
  { code: 'ca', name: '加拿大', region: 'north-america', flag: '🇨🇦', lang: 'en' },
  { code: 'mx', name: '墨西哥', region: 'north-america', flag: '🇲🇽', lang: 'es' },

  // 南美洲
  { code: 'br', name: '巴西', region: 'south-america', flag: '🇧🇷', lang: 'pt' },
  { code: 'ar', name: '阿根廷', region: 'south-america', flag: '🇦🇷', lang: 'es' },
  { code: 'co', name: '哥伦比亚', region: 'south-america', flag: '🇨🇴', lang: 'es' },
  { code: 'cl', name: '智利', region: 'south-america', flag: '🇨🇱', lang: 'es' },

  // 大洋洲
  { code: 'au', name: '澳大利亚', region: 'oceania', flag: '🇦🇺', lang: 'en' },
  { code: 'nz', name: '新西兰', region: 'oceania', flag: '🇳🇿', lang: 'en' },

  // 非洲
  { code: 'eg', name: '埃及', region: 'africa', flag: '🇪🇬', lang: 'ar' },
  { code: 'ng', name: '尼日利亚', region: 'africa', flag: '🇳🇬', lang: 'en' },
  { code: 'za', name: '南非', region: 'africa', flag: '🇿🇦', lang: 'en' },
  { code: 'ma', name: '摩洛哥', region: 'africa', flag: '🇲🇦', lang: 'ar' },

  // 中东
  { code: 'sa', name: '沙特阿拉伯', region: 'middle-east', flag: '🇸🇦', lang: 'ar' },
  { code: 'ae', name: '阿联酋', region: 'middle-east', flag: '🇦🇪', lang: 'ar' },
  { code: 'il', name: '以色列', region: 'middle-east', flag: '🇮🇱', lang: 'he' },
  { code: 'tr', name: '土耳其', region: 'middle-east', flag: '🇹🇷', lang: 'tr' },
  { code: 'ir', name: '伊朗', region: 'middle-east', flag: '🇮🇷', lang: 'fa' },
];

export function getCountryByCode(code) {
  return countries.find(country => country.code === code);
}

export function getCountriesByRegion(regionId) {
  return countries.filter(country => country.region === regionId);
}

export function getRegionById(regionId) {
  return regions.find(region => region.id === regionId);
}

export function getAllRegionsWithCountries() {
  return regions.map(region => ({
    ...region,
    countries: getCountriesByRegion(region.id),
  }));
}
