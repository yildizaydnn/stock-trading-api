const accountService = require('../services/account.service');
const asyncHandler = require('../middleware/asyncHandler');

const getById = asyncHandler(async (req, res) => {
  const account = await accountService.getAccountById(req.params.id);

  if (!account) {
    return res.status(404).json({ error: 'Hesap bulunamadı' });
  }

  res.json(account);
});

module.exports = { getById };
