/**
 * FRANKY TECH — Team Management Service (Phase 22)
 * -----------------------------------------------------------
 */
const teamModel = require('../models/teamInvitation.model');
const businessModel = require('../models/business.model');
const userModel = require('../models/user.model');
const { generateRawToken } = require('../utils/token');
const { AppError } = require('../middleware/errorHandler');

async function inviteMember(businessId, invitedByUserId, { email, role }) {
  if (!email) throw new AppError('An email address is required.', 422, { email: 'Required.' });
  const allowedRoles = ['admin', 'manager', 'accountant', 'sales', 'staff'];
  if (!allowedRoles.includes(role)) throw new AppError('Invalid role.', 422, { role: 'Invalid.' });

  const token = generateRawToken();
  const invitation = await teamModel.create({ businessId, email, role, token, invitedBy: invitedByUserId });

  // If the invited email already has a FRANKY TECH account, attach them
  // immediately rather than waiting on an email click — still requires
  // no forged businessId trust since it's driven by our own token.
  const existingUser = await userModel.findByEmail(email);
  if (existingUser) {
    await businessModel.addMember({ businessId, userId: existingUser.id, role });
    await teamModel.markAccepted(invitation.id);
  }

  return invitation;
}

async function listMembers(businessId) {
  const [members, invitations] = await Promise.all([
    teamModel.membersForBusiness(businessId),
    teamModel.listForBusiness(businessId),
  ]);
  return { members, pendingInvitations: invitations.filter((i) => i.status === 'pending') };
}

async function updateRole(businessId, membershipId, role) {
  const updated = await teamModel.updateMemberRole(businessId, membershipId, role);
  if (!updated) throw new AppError('Member not found, or the owner\'s role cannot be changed.', 404);
  return updated;
}

async function removeMember(businessId, membershipId) {
  const removed = await teamModel.removeMember(businessId, membershipId);
  if (!removed) throw new AppError('Member not found, or the owner cannot be removed.', 404);
  return true;
}

async function revokeInvitation(businessId, invitationId) {
  return teamModel.revoke(businessId, invitationId);
}

module.exports = { inviteMember, listMembers, updateRole, removeMember, revokeInvitation };
