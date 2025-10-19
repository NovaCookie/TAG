const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const emailService = {
  // Envoyer un email simple
  async sendEmail({ to, subject, html, text }) {
    try {
      const { data, error } = await resend.emails.send({
        from: "TAG Test <test@resend.dev>",
        to,
        subject,
        html: html || text,
        text: text || html,
      });

      if (error) {
        console.error("Erreur Resend:", error);
        throw error;
      }

      console.log("Email envoyé avec succès:", data);
      return data;
    } catch (error) {
      console.error("Erreur envoi email:", error);
      throw error;
    }
  },

  // Email de bienvenue
  async sendWelcomeEmail(user) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2c5e92;">Bienvenue sur TAG !</h1>
        <p>Bonjour ${user.prenom},</p>
        <p>Votre compte a été créé avec succès sur la plateforme TAG.</p>
        <p><strong>Rôle:</strong> ${user.role}</p>
        <p>Vous pouvez dès maintenant vous connecter et utiliser nos services.</p>
        <br>
        <p>Cordialement,<br>L'équipe TAG</p>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      subject: "Bienvenue sur TAG - Votre compte a été créé",
      html,
    });
  },

  // Email de réinitialisation de mot de passe
  async sendPasswordResetEmail(user, resetToken) {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2c5e92;">Réinitialisation de votre mot de passe</h1>
        <p>Bonjour ${user.prenom},</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe TAG.</p>
        <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #2c5e92; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; font-weight: bold;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        
        <p>Ce lien expirera dans 1 heure.</p>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; font-size: 12px; color: #718096;">
            Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.
          </p>
        </div>
        
        <p>Cordialement,<br>L'équipe TAG</p>
      </div>
    `;

    const text = `
      Réinitialisation de mot de passe TAG
      
      Bonjour ${user.prenom},
      
      Cliquez sur ce lien pour réinitialiser votre mot de passe :
      ${resetLink}
      
      Ce lien expirera dans 1 heure.
      
      Cordialement,
      L'équipe TAG
    `;

    return this.sendEmail({
      to: user.email,
      subject: "Réinitialisation de votre mot de passe - TAG",
      html,
      text,
    });
  },
};

module.exports = emailService;
