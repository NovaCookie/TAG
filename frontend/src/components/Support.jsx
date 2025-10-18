// components/Support.js
import React, { useState } from "react";
// import { useAuth } from "../context/AuthContext";
import Layout from "./layout/Layout";

const Support = () => {
  // const { user } = useAuth();
  const [formData, setFormData] = useState({
    nomComplet: "",
    email: "",
    sujet: "",
    message: "",
    urgent: false,
  });
  const [openFaq, setOpenFaq] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Formulaire soumis:", formData);
    alert("Votre message a été envoyé au support !");
    setFormData({
      nomComplet: "",
      email: "",
      sujet: "",
      message: "",
      urgent: false,
    });
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const supportCards = [
    {
      icon: "📚",
      title: "Centre d'aide",
      description:
        "Consultez notre base de connaissances complète avec des guides détaillés et des tutoriels.",
      link: "#",
      linkText: "Accéder au centre d'aide",
    },
    {
      icon: "📝",
      title: "Documentation",
      description:
        "Accédez à la documentation technique complète de l'application TAG.",
      link: "#",
      linkText: "Voir la documentation",
    },
    {
      icon: "❓",
      title: "FAQ",
      description:
        "Trouvez des réponses aux questions fréquemment posées sur l'utilisation de l'application.",
      link: "#faq",
      linkText: "Voir les FAQ",
    },
  ];

  const faqItems = [
    {
      question: "Comment créer un nouveau dossier juridique ?",
      answer:
        "Pour créer un nouveau dossier, allez dans la section 'Mes dossiers' et cliquez sur le bouton 'Nouveau dossier'. Remplissez les informations requises et assignez le dossier à un juriste si nécessaire.",
    },
    {
      question: "Comment contacter un juriste directement ?",
      answer:
        "Utilisez la messagerie intégrée dans l'application. Allez dans la section 'Messagerie', sélectionnez le juriste concerné et envoyez-lui un message. Vous pouvez également joindre des documents à votre message.",
    },
    {
      question: "Comment réinitialiser mon mot de passe ?",
      answer:
        "Sur la page de connexion, cliquez sur 'Mot de passe oublié'. Entrez votre adresse email et suivez les instructions envoyées par email pour réinitialiser votre mot de passe.",
    },
    {
      question: "Comment exporter des documents juridiques ?",
      answer:
        "Dans la fiche d'un dossier, cliquez sur le document que vous souhaitez exporter. Utilisez le bouton de téléchargement pour exporter le document au format PDF ou utilisez l'option d'impression.",
    },
  ];

  const contactMethods = [
    {
      icon: "📧",
      title: "Email",
      details: ["support@tag.gl", "Réponse sous 24h"],
    },
    {
      icon: "📞",
      title: "Téléphone",
      details: ["+299 34 56 78", "Lun-Ven, 9h-17h"],
    },
    {
      icon: "💬",
      title: "Chat en direct",
      details: [
        "Disponible pendant les heures de bureau",
        "Connectez-vous pour accéder au chat",
      ],
    },
  ];

  const SupportCard = ({ card }) => (
    <div className="card card-rounded p-6 transition-transform hover:-translate-y-1 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl mb-5">
        {card.icon}
      </div>
      <h3 className="text-lg font-semibold text-primary mb-3">{card.title}</h3>
      <p className="text-tertiary text-sm leading-relaxed mb-4 flex-1">
        {card.description}
      </p>
      <a
        href={card.link}
        className="text-primary font-medium flex items-center gap-2 hover:text-primary-light transition-colors"
      >
        {card.linkText}
        <span>→</span>
      </a>
    </div>
  );

  const FAQItem = ({ faq, index }) => (
    <div className="pb-6 border-b border-light last:border-b-0 last:pb-0">
      <h3
        onClick={() => toggleFaq(index)}
        className="text-secondary font-semibold mb-3 cursor-pointer flex justify-between items-center"
      >
        {faq.question}
        <span className="text-primary text-lg">
          {openFaq === index ? "−" : "+"}
        </span>
      </h3>
      {openFaq === index && (
        <p className="text-tertiary text-sm leading-relaxed pr-8">
          {faq.answer}
        </p>
      )}
    </div>
  );

  const ContactMethod = ({ method }) => (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg flex-shrink-0">
        {method.icon}
      </div>
      <div>
        <h4 className="text-secondary font-semibold mb-1">{method.title}</h4>
        {method.details.map((detail, idx) => (
          <p key={idx} className="text-tertiary text-sm">
            {detail}
          </p>
        ))}
      </div>
    </div>
  );

  return (
    <Layout activePage="support">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-primary mb-3">Support</h1>
        <p className="text-secondary text-lg leading-relaxed">
          Besoin d'aide ? Consultez notre centre d'assistance pour trouver des
          réponses à vos questions ou contactez notre équipe de support.
        </p>
      </div>

      {/* Support Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {supportCards.map((card, index) => (
          <SupportCard key={index} card={card} />
        ))}
      </div>

      {/* FAQ Section */}
      <section className="card card-rounded p-6 mb-10">
        <h2 className="text-xl font-semibold text-primary mb-6 pb-4 border-b border-light">
          Questions fréquemment posées
        </h2>
        <div className="space-y-6">
          {faqItems.map((faq, index) => (
            <FAQItem key={index} faq={faq} index={index} />
          ))}
        </div>
      </section>

      {/* Contact Form */}
      <section className="card card-rounded p-6">
        <h2 className="text-xl font-semibold text-primary mb-6 pb-4 border-b border-light">
          Contactez notre support
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-secondary text-sm font-medium mb-2">
                Nom complet
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-light rounded-lg focus:outline-none focus:border-primary bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-dark-primary"
                placeholder="Votre nom complet"
                value={formData.nomComplet}
                onChange={(e) =>
                  handleInputChange("nomComplet", e.target.value)
                }
                required
              />
            </div>
            <div>
              <label className="block text-secondary text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 border border-light rounded-lg focus:outline-none focus:border-primary bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-dark-primary"
                placeholder="Votre adresse email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() =>
                setFormData({
                  nomComplet: "",
                  email: "",
                  sujet: "",
                  message: "",
                  urgent: false,
                })
              }
              className="bg-light text-primary border border-light rounded-lg px-6 py-3 font-medium hover:bg-light-gray transition-colors dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="bg-primary text-white rounded-lg px-6 py-3 font-medium hover:bg-primary-light transition-colors"
            >
              Envoyer le message
            </button>
          </div>
        </form>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 pt-8 border-t border-light">
          {contactMethods.map((method, index) => (
            <ContactMethod key={index} method={method} />
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default Support;
