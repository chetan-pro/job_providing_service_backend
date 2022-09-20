const router = require('express').Router()
const { commonAuth,validateCompanyOrCandidate } = require('../../middlewares/api')
const ChatController = require('../../controllers/api/ChatController')

// chat
router.post("/send-message", commonAuth, ChatController.sendMessage);
router.get("/get-messages", commonAuth, ChatController.getMessage);
router.get("/get-unseen-messages-count", commonAuth, ChatController.unseenMessages);
router.get("/get-all-contacts",commonAuth , ChatController.getAllContacts);
router.post("/seen-message", commonAuth, ChatController.seenMessage);
router.post("/create-channel", commonAuth, ChatController.createChannel);
router.post("/delete-message", commonAuth, ChatController.deleteMessage);

module.exports = router;