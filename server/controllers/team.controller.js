const teamService = require('../services/team.service');

async function list(req, res, next) {
  try { res.json(await teamService.listMembers(req.business.id)); }
  catch (err) { next(err); }
}

async function invite(req, res, next) {
  try { res.status(201).json({ invitation: await teamService.inviteMember(req.business.id, req.session.user.id, req.body) }); }
  catch (err) { next(err); }
}

async function updateRole(req, res, next) {
  try { res.json({ member: await teamService.updateRole(req.business.id, req.params.membershipId, req.body.role) }); }
  catch (err) { next(err); }
}

async function remove(req, res, next) {
  try { await teamService.removeMember(req.business.id, req.params.membershipId); res.json({ success: true }); }
  catch (err) { next(err); }
}

async function revokeInvitation(req, res, next) {
  try { await teamService.revokeInvitation(req.business.id, req.params.id); res.json({ success: true }); }
  catch (err) { next(err); }
}

module.exports = { list, invite, updateRole, remove, revokeInvitation };
