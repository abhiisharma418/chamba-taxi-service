const messages = {
  en: { unauthorized: 'Unauthorized', forbidden: 'Forbidden' },
  hi: { unauthorized: 'अनधिकृत', forbidden: 'निषिद्ध' },
};

export const i18n = (req, res, next) => {
  const locale = (req.headers['x-locale'] || 'en').toLowerCase();
  req.t = (key) => messages[locale]?.[key] || messages.en[key] || key;
  next();
};