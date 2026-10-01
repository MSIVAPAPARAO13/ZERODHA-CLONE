const express = require("express");
const router = express.Router();
const organizationController = require("../controllers/organizationController");

router.post("/", (req, res, next) => organizationController.createOrganization(req, res, next));
router.get("/", (req, res, next) => organizationController.getUserOrganizations(req, res, next));
router.get("/:id", (req, res, next) => organizationController.getOrganizationById(req, res, next));
router.post("/:id/invitations", (req, res, next) => organizationController.inviteMember(req, res, next));
router.patch("/:id/members/:memberId", (req, res, next) => organizationController.updateMemberRole(req, res, next));
router.delete("/:id/members/:memberId", (req, res, next) => organizationController.removeMember(req, res, next));

module.exports = router;
