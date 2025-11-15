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

  // Email de confirmation de changement d'email
  async sendEmailConfirmation({ user, newEmail, confirmationToken }) {
    const confirmationLink = `${process.env.FRONTEND_URL}/confirm-email?token=${confirmationToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2c5e92;">Confirmation de votre nouvelle adresse email</h1>
        <p>Bonjour ${user.prenom},</p>
        <p>Votre adresse email sur la plateforme TAG a été modifiée.</p>
        <p><strong>Nouvelle adresse:</strong> ${newEmail}</p>
        
        <p>Pour confirmer cette modification, cliquez sur le lien ci-dessous :</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmationLink}" 
             style="background-color: #2c5e92; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; font-weight: bold;">
            Confirmer mon adresse email
          </a>
        </div>
        
        <p>Ce lien expirera dans 24 heures.</p>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; font-size: 12px; color: #718096;">
            Si vous n'avez pas demandé cette modification, veuillez contacter l'administrateur.
          </p>
        </div>
        
        <p>Cordialement,<br>L'équipe TAG</p>
      </div>
    `;

    const text = `
      Confirmation de modification d'email - TAG
      
      Bonjour ${user.prenom},
      
      Votre adresse email a été modifiée pour : ${newEmail}
      
      Cliquez sur ce lien pour confirmer :
      ${confirmationLink}
      
      Ce lien expirera dans 24 heures.
      
      Cordialement,
      L'équipe TAG
    `;

    return this.sendEmail({
      to: newEmail,
      subject: "Confirmation de votre nouvelle adresse email - TAG",
      html,
      text,
    });
  },

  // Notification de changement de mot de passe
  async sendPasswordChangedNotification(user) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2c5e92;">Votre mot de passe a été modifié</h1>
        <p>Bonjour ${user.prenom},</p>
        <p>Votre mot de passe sur la plateforme TAG a été modifié avec succès.</p>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; font-size: 12px; color: #718096;">
            Si vous n'avez pas effectué cette modification, veuillez contacter immédiatement l'administrateur.
          </p>
        </div>
        
        <p>Cordialement,<br>L'équipe TAG</p>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      subject: "Votre mot de passe a été modifié - TAG",
      html,
    });
  },

  // Email de notification pour nouvelle réponse (à la commune)
  async sendNewResponseNotification(user, intervention, juriste) {
    const interventionLink = `${process.env.FRONTEND_URL}/interventions/${intervention.id}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2c5e92;">Votre question a reçu une réponse</h1>
        <p>Bonjour ${user.prenom},</p>
        <p>Le juriste <strong>${juriste.prenom} ${
      juriste.nom
    }</strong> a répondu à votre question :</p>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #2c5e92;">${
            intervention.titre
          }</h3>
          <p style="margin: 0; color: #4a5568;">${
            intervention.description
              ? intervention.description.substring(0, 200) + "..."
              : ""
          }</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${interventionLink}" 
             style="background-color: #2c5e92; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; font-weight: bold;">
            Voir la réponse complète
          </a>
        </div>
        
        <p><strong>N'oubliez pas de noter cette réponse</strong> une fois que vous l'avez consultée !</p>
        
        <p>Cordialement,<br>L'équipe TAG</p>
      </div>
    `;

    const text = `
      Nouvelle réponse - TAG
      
      Bonjour ${user.prenom},
      
      Le juriste ${juriste.prenom} ${juriste.nom} a répondu à votre question : "${intervention.titre}"
      
      Consultez la réponse ici : ${interventionLink}
      
      N'oubliez pas de noter cette réponse !
      
      Cordialement,
      L'équipe TAG
    `;

    return this.sendEmail({
      to: user.email,
      subject: `Réponse reçue - ${intervention.titre}`,
      html,
      text,
    });
  },

  // Email de notification pour nouvelle notation (au juriste)
  async sendNewRatingNotification(user, intervention, commune, note) {
    const interventionLink = `${process.env.FRONTEND_URL}/interventions/${intervention.id}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2c5e92;">Votre réponse a été notée</h1>
        <p>Bonjour ${user.prenom},</p>
        <p>La commune <strong>${
          commune.nom
        }</strong> a évalué votre réponse à la question :</p>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #2c5e92;">${
            intervention.titre
          }</h3>
          <div style="display: flex; align-items: center; gap: 5px;">
            <span>Note :</span>
            ${this.renderStars(note)}
            <span style="margin-left: 10px; font-weight: bold;">${note}/5</span>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${interventionLink}" 
             style="background-color: #2c5e92; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; font-weight: bold;">
            Voir les détails
          </a>
        </div>
        
        <p>Cordialement,<br>L'équipe TAG</p>
      </div>
    `;

    const text = `
      Nouvelle évaluation - TAG
      
      Bonjour ${user.prenom},
      
      La commune ${commune.nom} a noté votre réponse à "${intervention.titre}" : ${note}/5
      
      Voir les détails : ${interventionLink}
      
      Cordialement,
      L'équipe TAG
    `;

    return this.sendEmail({
      to: user.email,
      subject: `Évaluation reçue - ${note}/5 pour "${intervention.titre}"`,
      html,
      text,
    });
  },

  // Email de notification pour nouvelle question (aux juristes)
  async sendNewQuestionNotification(juristes, intervention, commune) {
    const interventionLink = `${process.env.FRONTEND_URL}/interventions/${intervention.id}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2c5e92;">Nouvelle question reçue</h1>
        <p>Une nouvelle question a été posée par la commune <strong>${
          commune.nom
        }</strong> :</p>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #2c5e92;">${
            intervention.titre
          }</h3>
          <p style="margin: 0; color: #4a5568;">${
            intervention.description
              ? intervention.description.substring(0, 200) + "..."
              : ""
          }</p>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #718096;">
            Thème : ${intervention.theme?.designation || "Non spécifié"}
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${interventionLink}" 
             style="background-color: #2c5e92; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; font-weight: bold;">
            Répondre à cette question
          </a>
        </div>
        
        <p>Cordialement,<br>L'équipe TAG</p>
      </div>
    `;

    const text = `
      Nouvelle question - TAG
      
      La commune ${commune.nom} a posé une nouvelle question : "${
      intervention.titre
    }"
      
      Thème : ${intervention.theme?.designation || "Non spécifié"}
      
      Répondre ici : ${interventionLink}
      
      Cordialement,
      L'équipe TAG
    `;

    // Envoyer à tous les juristes
    const emailPromises = juristes.map((juriste) =>
      this.sendEmail({
        to: juriste.email,
        subject: `Nouvelle question - ${intervention.titre}`,
        html,
        text,
      })
    );

    return Promise.all(emailPromises);
  },

  // Helper pour afficher les étoiles
  renderStars(note) {
    let stars = "";
    for (let i = 1; i <= 5; i++) {
      if (i <= note) {
        stars += "⭐";
      } else {
        stars += "☆";
      }
    }
    return stars;
  },
};

module.exports = emailService;
