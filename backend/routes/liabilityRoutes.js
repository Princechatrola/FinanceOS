const express = require("express");
const router = express.Router();
const {
  createLiability,
  getLiabilities,
  updateLiability,
  deleteLiability,
  addLiabilityPayment,
} = require("../controllers/liabilityController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.route("/").post(createLiability).get(getLiabilities);
router.route("/:id").put(updateLiability).delete(deleteLiability);
router.route("/:id/payment").post(addLiabilityPayment);

module.exports = router;
