import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.vfs = pdfFonts.vfs;

export class PDFExporter {
  constructor() {
    this.docDefinition = {
      content: [],
      defaultStyle: { fontSize: 10 },
      styles: {
        header: { fontSize: 16, bold: true, margin: [0, 5] },
        subheader: { fontSize: 14, bold: true, margin: [0, 5] },
        tableHeader: { bold: true, fillColor: "#2980B9", color: "white" },
      },
    };
  }

  addHeader(title, subtitle, filters = {}) {
    const date = new Date().toLocaleDateString("fr-FR");

    this.docDefinition.content.push(
      { text: "TAG - Statistiques Avancées", style: "header" },
      { text: title, style: "subheader" },
      { text: subtitle, margin: [0, 0, 0, 5] },
      { text: `Généré le ${date}`, italics: true, margin: [0, 0, 0, 10] }
    );

    if (Object.keys(filters).length > 0) {
      const filterLines = Object.entries(filters)
        .filter(([, value]) => value)
        .map(([key, value]) => `${key} : ${value}`);
      if (filterLines.length) {
        this.docDefinition.content.push({
          text: ["Filtres appliqués :\n", ...filterLines.join("\n")],
          margin: [0, 0, 0, 10],
        });
      }
    }

    return this;
  }

  addSummary(stats) {
    const resume = stats.resume;
    const body = [
      ["Indicateur", "Valeur"],
      ["Communes actives", resume.totalCommunes],
      ["Interventions totales", resume.totalInterventions],
      ["Thèmes utilisés", resume.totalThemes],
      ["Satisfaction globale", `${resume.satisfactionGlobale}/5`],
    ];

    this.docDefinition.content.push({
      text: "Résumé général",
      bold: true,
      margin: [0, 5, 0, 5],
    });
    this.docDefinition.content.push({
      table: { headerRows: 1, widths: ["*", "*"], body },
      layout: "lightHorizontalLines",
      margin: [0, 0, 0, 10],
    });

    return this;
  }

  addTable(title, data, columns) {
    this.docDefinition.content.push({
      text: title,
      bold: true,
      margin: [0, 5, 0, 5],
    });

    if (!data || data.length === 0) {
      this.docDefinition.content.push({
        text: "Aucune donnée disponible",
        italics: true,
        margin: [0, 0, 0, 10],
      });
      return this;
    }

    const body = [
      columns,
      ...data.map((row) => columns.map((col) => row[col] || "")),
    ];

    this.docDefinition.content.push({
      table: { headerRows: 1, widths: Array(columns.length).fill("*"), body },
      layout: "lightHorizontalLines",
      margin: [0, 0, 0, 10],
    });

    return this;
  }

  generate(filename = "statistiques-tag.pdf") {
    pdfMake.createPdf(this.docDefinition).download(filename);
  }

  exportAdvancedStats(statistiques, filtres = {}) {
    this.addHeader(
      "Statistiques avancées des interventions",
      "Tableaux de bord quantitatifs de l'activité TAG",
      filtres
    );

    this.addSummary(statistiques);

    // Questions par commune
    this.addTable(
      "Questions par Commune",
      statistiques.questionsParCommune.map((commune) => ({
        Commune: commune.commune,
        Population: commune.population?.toLocaleString() || "N/A",
        Questions: commune.nb_questions,
        Répondues: commune.questions_repondues || 0,
        "Taux réponse": commune.taux_reponse
          ? `${commune.taux_reponse}%`
          : "0%",
        Satisfaction: commune.satisfaction_moyenne
          ? `${commune.satisfaction_moyenne}/5`
          : "N/A",
      })),
      [
        "Commune",
        "Population",
        "Questions",
        "Répondues",
        "Taux réponse",
        "Satisfaction",
      ]
    );

    // Questions par thème
    this.addTable(
      "Questions par Thème",
      statistiques.questionsParTheme.map((theme) => ({
        Thème: theme.theme,
        Questions: theme.nb_questions,
        Part: theme.pourcentage ? `${theme.pourcentage}%` : "0%",
        Satisfaction: theme.satisfaction_moyenne
          ? `${theme.satisfaction_moyenne}/5`
          : "N/A",
        Évaluations: theme.nb_evaluations || 0,
      })),
      ["Thème", "Questions", "Part", "Satisfaction", "Évaluations"]
    );

    // Répartition par strate
    this.addTable(
      "Répartition par Strate de Commune",
      statistiques.questionsParStrate.map((strate) => ({
        Strate: strate.strate,
        Communes: strate.nb_communes,
        Questions: strate.nb_questions,
        Part: strate.pourcentage ? `${strate.pourcentage}%` : "0%",
        Satisfaction: strate.satisfaction_moyenne
          ? `${strate.satisfaction_moyenne}/5`
          : "N/A",
      })),
      ["Strate", "Communes", "Questions", "Part", "Satisfaction"]
    );

    // Satisfaction par commune
    this.addTable(
      "Satisfaction par Commune",
      statistiques.satisfactionParCommune.map((commune) => ({
        Commune: commune.commune,
        "Note moyenne": `${commune.satisfaction_moyenne}/5`,
        Évaluations: commune.nb_evaluations,
        "Taux évaluation": commune.taux_evaluation
          ? `${commune.taux_evaluation}%`
          : "0%",
      })),
      ["Commune", "Note moyenne", "Évaluations", "Taux évaluation"]
    );

    // Satisfaction par strate
    this.addTable(
      "Satisfaction par Strate",
      statistiques.satisfactionParStrate.map((strate) => ({
        Strate: strate.strate,
        Satisfaction: `${strate.satisfaction_moyenne}/5`,
        Échantillon: strate.nb_evaluations,
        "Note min": strate.note_min || "N/A",
        "Note max": strate.note_max || "N/A",
      })),
      ["Strate", "Satisfaction", "Échantillon", "Note min", "Note max"]
    );

    this.generate();
    return this;
  }
}

export default PDFExporter;
