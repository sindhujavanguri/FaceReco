export const getCurrentFinancialYear = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const startYear = month >= 4 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
};

export const formatValue = (value, fallback = 'Not available') =>
  value === null || value === undefined || value === '' ? fallback : String(value);

export const formatAmount = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'Rs. 0';
  }

  const amount = Number(value);
  return Number.isNaN(amount) ? String(value) : `Rs. ${amount.toLocaleString('en-IN')}`;
};

export const formatLabel = (key) =>
  String(key || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const getResponseData = (response) => response?.data?.data || response?.data || null;

export const asArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  if (Array.isArray(value?.list)) {
    return value.list;
  }

  if (Array.isArray(value?.records)) {
    return value.records;
  }

  if (Array.isArray(value?.items)) {
    return value.items;
  }

  if (Array.isArray(value?.hra)) {
    return value.hra;
  }

  if (Array.isArray(value?.declarations)) {
    return value.declarations;
  }

  return [];
};

export const extractFinancialYears = (response) => {
  const data = getResponseData(response);
  const years = data?.financial_years || data?.years || data?.financialYears || data;

  if (!Array.isArray(years)) {
    return [];
  }

  return years
    .map((year) => {
      if (typeof year === 'string' || typeof year === 'number') {
        return String(year);
      }

      return (
        year.financial_year ||
        year.financialYear ||
        year.year ||
        year.name ||
        year.label ||
        year.value
      );
    })
    .filter(Boolean);
};

export const getField = (item, keys, fallback = '') => {
  for (const key of keys) {
    if (item?.[key] !== null && item?.[key] !== undefined && item?.[key] !== '') {
      return item[key];
    }
  }

  return fallback;
};
