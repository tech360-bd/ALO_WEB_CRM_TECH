// smtp-mailer is the patched Nodemailer npm alias, isolated from next-auth's optional v7 peer.
declare module 'smtp-mailer' {
  import nodemailer from 'nodemailer';
  export default nodemailer;
}
