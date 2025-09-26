import config from '../config/index.js';

export const publicConfig = (_req, res) => {
  const emailEnabled = Boolean(config.smtp?.host && config.smtp?.user && config.smtp?.pass);
  res.json({ ok: true, emailEnabled });
};

export default { publicConfig }; 