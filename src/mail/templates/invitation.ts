import { SendInvitationMailDto } from '../dto/send-invitation-mail.dto';

export function invitationTemplate(dto: SendInvitationMailDto): string {
  return `
<!DOCTYPE html>
<html>
  <body
    style="
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.6;
      color: #1f2937;
    "
  >
    <h2>You're invited to join a deal</h2>

    <p>
      <strong>${dto.inviterName}</strong>
      has invited you to join
      <strong>${dto.dealTitle}</strong>.
    </p>

    <p>
      Click the button below to view the invitation.
    </p>

    <p>
      <a
        href="${dto.invitationUrl}"
        style="
          background:#2563eb;
          color:#fff;
          padding:12px 20px;
          text-decoration:none;
          border-radius:6px;
        "
      >
        View Invitation
      </a>
    </p>

    <p>
      If the button doesn't work, copy this link into your browser:
    </p>

    <p>
      ${dto.invitationUrl}
    </p>

    <hr />

    <small>
      DealRoom
    </small>
  </body>
</html>
  `;
}
