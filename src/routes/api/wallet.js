const router = require('express').Router()
const { commonAuth } = require('../../middlewares/api')
const WalletController = require('../../controllers/api/walletController')

// wallet
router.get("/get-wallet-amount", commonAuth, WalletController.getWalletAmount);
router.get("/get-wallet-transaction", commonAuth, WalletController.getWalletTransaction);

module.exports = router;