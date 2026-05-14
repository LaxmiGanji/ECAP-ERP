const router = require("express").Router();
const {
  loginHandler,
  registerHandler,
  updateHandler,
  deleteHandler,
} = require("../../controllers/Transport/credential.controller");

router.post("/login", loginHandler);
router.post("/register", registerHandler);
router.put("/update/:id", updateHandler);
router.delete("/delete/:id", deleteHandler);

module.exports = router;

