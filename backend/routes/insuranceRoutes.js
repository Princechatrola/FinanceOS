const express = require("express");
const router = express.Router();
const {
  createInsurance,
  getInsurances,
  updateInsurance,
  deleteInsurance,
  addInsurancePayment,
} = require("../controllers/insuranceController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.route("/").post(createInsurance).get(getInsurances);
router.route("/:id").put(updateInsurance).delete(deleteInsurance);
router.route("/:id/payment").post(addInsurancePayment);

module.exports = router;
