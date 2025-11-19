import React, { useState, useEffect } from 'react';
import { EduApp, AIReview, Language, AppCategory } from '../types';
import { X, Globe, CheckCircle, AlertCircle, Sparkles, Shield, Lock, FileText, UserCheck, Users, Download, BrainCircuit, Gamepad2, Palette, ClipboardList, CheckSquare, MessageCircle, Layers } from 'lucide-react';
import { analyzeAppWithGemini } from '../services/geminiService';
import { getTranslation } from '../translations';
import { jsPDF } from "jspdf";

interface AppDetailModalProps {
  app: EduApp;
  language: Language;
  onClose: () => void;
}

// Helper to clean text for PDF (Latin-1 support in jsPDF default fonts)
const cleanText = (text: string) => {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/•/g, '-')
    // Keep printable ASCII, newlines, and Latin-1 Supplement (for accents like á, ñ, etc.)
    // Range: 00-7F (ASCII) and A0-FF (Latin-1 Supplement)
    .replace(/[^\x00-\x7F\xA0-\xFF\n\r]/g, ' ');
};

export const AppDetailModal: React.FC<AppDetailModalProps> = ({ app, language, onClose }) => {
  const [analysis, setAnalysis] = useState<AIReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = getTranslation(language);

  // --- Image Handling Logic (Same as AppCard) ---
  const [imgSrc, setImgSrc] = useState<string>(app.iconUrl);
  const [showPlaceholder, setShowPlaceholder] = useState(false);

  useEffect(() => {
    setImgSrc(app.iconUrl);
    setShowPlaceholder(false);
  }, [app.iconUrl]);

  const handleImgError = () => {
    if (imgSrc === app.iconUrl) {
      // First fallback: Try Google Favicon service using the website domain
      try {
        const domain = new URL(app.website).hostname;
        setImgSrc(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
      } catch (e) {
        setShowPlaceholder(true);
      }
    } else {
      // Second fallback: If Google fails, show the category placeholder
      setShowPlaceholder(true);
    }
  };

  const renderCategoryPlaceholder = () => {
    let icon;
    let iconClass;

    switch (app.category) {
      case AppCategory.GAMIFICATION:
        icon = <Gamepad2 className="w-8 h-8" strokeWidth={1.5} />;
        iconClass = "text-orange-600 bg-orange-50";
        break;
      case AppCategory.CONTENT_CREATION:
        icon = <Palette className="w-8 h-8" strokeWidth={1.5} />;
        iconClass = "text-pink-600 bg-pink-50";
        break;
      case AppCategory.MANAGEMENT:
        icon = <ClipboardList className="w-8 h-8" strokeWidth={1.5} />;
        iconClass = "text-slate-600 bg-slate-50";
        break;
      case AppCategory.ASSESSMENT:
        icon = <CheckSquare className="w-8 h-8" strokeWidth={1.5} />;
        iconClass = "text-emerald-600 bg-emerald-50";
        break;
      case AppCategory.COLLABORATION:
        icon = <MessageCircle className="w-8 h-8" strokeWidth={1.5} />;
        iconClass = "text-indigo-600 bg-indigo-50";
        break;
      default: // OTHER
        icon = <Layers className="w-8 h-8" strokeWidth={1.5} />;
        iconClass = "text-cyan-600 bg-cyan-50";
        break;
    }

    return (
      <div className={`w-full h-full flex items-center justify-center ${iconClass}`}>
        {icon}
      </div>
    );
  };
  // --------------------------------------------

  useEffect(() => {
    let isMounted = true;

    const generateAnalysis = async () => {
      setLoading(true);
      setError(null);
      setAnalysis(null);
      
      try {
        const result = await analyzeAppWithGemini(app, language);
        if (isMounted) {
          setAnalysis(result);
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setError(t.modal.error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    generateAnalysis();

    return () => {
      isMounted = false;
    };
  }, [app, language]);

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      const margin = 20;
      let yPos = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const contentWidth = pageWidth - (margin * 2);

      // Colors
      const blueColor = '#005eb8';
      const grayColor = '#475569';

      // --- HEADER ---
      doc.setTextColor(blueColor);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(cleanText(app.name), margin, yPos);
      yPos += 10;

      doc.setTextColor(grayColor);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`${t.modal.reportDate}: ${new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'eu-ES')}`, margin, yPos);
      yPos += 5;
      doc.setTextColor(blueColor);
      doc.textWithLink(cleanText(app.website), margin, yPos, { url: app.website });
      yPos += 15;

      // --- APP INFO ---
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      
      // Description
      doc.setFont("helvetica", "bold");
      doc.text(cleanText(t.modal.about), margin, yPos);
      yPos += 7;
      doc.setFont("helvetica", "normal");
      const descLines = doc.splitTextToSize(cleanText(app.description[language]), contentWidth);
      doc.text(descLines, margin, yPos);
      yPos += (descLines.length * 6) + 5;

      // Details Table-like structure
      const details = [
        `${t.filters.category}: ${t.categories[app.category]}`,
        `${t.filters.role}: ${t.roles[app.targetAudience]}`,
        `${t.card.minAge}: ${app.minAge ? app.minAge + '+' : '-'}`,
        `${t.filters.stage}: ${app.stages.map(s => t.stages[s]).join(', ')}`
      ];

      details.forEach(line => {
          const splitLine = doc.splitTextToSize(cleanText(line), contentWidth);
          doc.text(splitLine, margin, yPos);
          yPos += (splitLine.length * 6);
      });
      yPos += 10;

      // --- FEATURES ---
      doc.setFont("helvetica", "bold");
      doc.text(cleanText(t.modal.features), margin, yPos);
      yPos += 7;
      doc.setFont("helvetica", "normal");
      const featuresList = app.features[language].join(', ');
      const featureLines = doc.splitTextToSize(cleanText(featuresList), contentWidth);
      doc.text(featureLines, margin, yPos);
      yPos += (featureLines.length * 6) + 10;

      // --- AI ANALYSIS ---
      if (analysis) {
          // Page break check
          if (yPos > 220) { doc.addPage(); yPos = 20; }

          doc.setTextColor(blueColor);
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text(cleanText(t.modal.aiAnalysis), margin, yPos);
          yPos += 10;

          doc.setTextColor(0, 0, 0);
          doc.setFontSize(12);

          // Pedagogical Summary
          doc.setFont("helvetica", "bold");
          doc.text(cleanText(t.modal.summary), margin, yPos);
          yPos += 7;
          doc.setFont("helvetica", "normal");
          const sumLines = doc.splitTextToSize(cleanText(analysis.summary), contentWidth);
          doc.text(sumLines, margin, yPos);
          yPos += (sumLines.length * 6) + 5;

          // Tips and Activities
          if (yPos > 240) { doc.addPage(); yPos = 20; }
          
          doc.setFont("helvetica", "bold");
          doc.text(cleanText(t.modal.teacherTip), margin, yPos);
          yPos += 7;
          doc.setFont("helvetica", "normal");
          const tipLines = doc.splitTextToSize(cleanText(analysis.teacherTip), contentWidth);
          doc.text(tipLines, margin, yPos);
          yPos += (tipLines.length * 6) + 5;

          doc.setFont("helvetica", "bold");
          doc.text(cleanText(t.modal.studentActivity), margin, yPos);
          yPos += 7;
          doc.setFont("helvetica", "normal");
          const actLines = doc.splitTextToSize(cleanText(analysis.studentActivity), contentWidth);
          doc.text(actLines, margin, yPos);
          yPos += (actLines.length * 6) + 10;


          // Privacy
          if (yPos > 220) { doc.addPage(); yPos = 20; }
          doc.setFont("helvetica", "bold");
          doc.text(cleanText(t.modal.privacyTitle), margin, yPos);
          yPos += 7;
          
          doc.setFont("helvetica", "normal");
          const privacyStatus = analysis.privacy.gdprCompliant ? t.modal.compliant : t.modal.notCompliant;
          doc.text(cleanText(`${t.modal.gdpr}: ${privacyStatus}`), margin, yPos);
          yPos += 6;
          
          doc.text(cleanText(`${t.modal.ageWarning}: ${analysis.privacy.ageWarning}`), margin, yPos);
          yPos += 6;

          const privSumLines = doc.splitTextToSize(cleanText(`${t.modal.privacySummary}: ${analysis.privacy.complianceSummary}`), contentWidth);
          doc.text(privSumLines, margin, yPos);
          yPos += (privSumLines.length * 6) + 5;
          
          const dataLines = doc.splitTextToSize(cleanText(`${t.modal.dataCollection}: ${analysis.privacy.dataCollected}`), contentWidth);
          doc.text(dataLines, margin, yPos);
          yPos += (dataLines.length * 6) + 5;

          // Pros & Cons
          if (yPos > 230) { doc.addPage(); yPos = 20; }
          
          doc.setFont("helvetica", "bold");
          doc.text(cleanText(t.modal.pros), margin, yPos);
          yPos += 6;
          doc.setFont("helvetica", "normal");
          analysis.pros.forEach(p => {
              const pLines = doc.splitTextToSize(cleanText(`- ${p}`), contentWidth);
              doc.text(pLines, margin, yPos);
              yPos += (pLines.length * 6);
          });
          yPos += 5;

          doc.setFont("helvetica", "bold");
          doc.text(cleanText(t.modal.cons), margin, yPos);
          yPos += 6;
          doc.setFont("helvetica", "normal");
          analysis.cons.forEach(c => {
              const cLines = doc.splitTextToSize(cleanText(`- ${c}`), contentWidth);
              doc.text(cLines, margin, yPos);
              yPos += (cLines.length * 6);
          });
      } else {
        // Footer if no analysis
        yPos += 20;
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.setTextColor(grayColor);
        doc.text(cleanText("(Informe básico generado sin análisis detallado de IA)"), margin, yPos);
      }

      doc.save(`${app.name.replace(/\s+/g, '_')}_Report.pdf`);
    } catch (e) {
      console.error("Error generating PDF", e);
      alert("Error al generar el PDF. Por favor, inténtalo de nuevo.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Image container with fallback logic */}
            <div className="w-20 h-20 rounded-2xl shadow-sm bg-white border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {!showPlaceholder ? (
                <img 
                  src={imgSrc} 
                  alt={app.name} 
                  onError={handleImgError}
                  className="w-full h-full object-contain p-2" 
                />
              ) : (
                renderCategoryPlaceholder()
              )}
            </div>

            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-1">{app.name}</h2>
              <div className="flex items-center gap-4">
                <a 
                    href={app.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-base text-indigo-600 hover:underline flex items-center gap-1.5 font-medium"
                >
                    {t.modal.visit} <Globe className="w-4 h-4" />
                </a>
                {/* Download PDF Button */}
                <button 
                    onClick={handleDownloadPDF}
                    disabled={loading} 
                    className="text-base text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    title={loading ? t.modal.consulting : t.modal.downloadPdf}
                >
                    {loading ? (
                      <div className="animate-spin w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full"></div>
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">{t.modal.downloadPdf}</span>
                </button>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Column: Basic Info */}
          <div className="lg:col-span-1 space-y-8">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">{t.modal.about}</h3>
              <p className="text-lg text-slate-600 leading-relaxed">{app.description[language]}</p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">{t.modal.features}</h3>
              <ul className="space-y-3">
                {app.features[language].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-base text-slate-600">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-900 mb-4 text-base">{t.modal.details}</h4>
              <div className="space-y-3 text-base">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t.filters.category}</span>
                  <span className="font-semibold text-slate-700 text-right">{t.categories[app.category]}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t.filters.role}</span>
                  <span className="font-semibold text-slate-700 text-right">{t.roles[app.targetAudience]}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t.card.minAge}</span>
                  <span className="font-semibold text-slate-700 text-right">{app.minAge ? `${app.minAge}+` : '-'}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-500 pt-1">{t.filters.stage}</span>
                  <div className="flex flex-wrap justify-end gap-1.5 max-w-[60%]">
                    {app.stages.map(s => (
                      <span key={s} className="text-sm bg-slate-200 px-2 py-0.5 rounded text-slate-700 font-medium">
                        {t.stages[s]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Analysis */}
          <div className="lg:col-span-2">
            <div className="bg-indigo-50 rounded-3xl p-8 border border-indigo-100 h-full">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-7 h-7 text-indigo-600" />
                  <h3 className="text-2xl font-bold text-indigo-900">{t.modal.aiAnalysis}</h3>
                </div>
              </div>

              {loading && (
                <div className="flex flex-col items-center justify-center h-80 text-indigo-800">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mb-6"></div>
                  <p className="animate-pulse text-lg font-medium">{t.modal.consulting}</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-600 p-6 rounded-xl flex items-center gap-3 text-lg font-medium">
                  <AlertCircle className="w-6 h-6" />
                  {error}
                </div>
              )}

              {analysis && (
                <div className="space-y-8 animate-fadeIn">
                  {/* Privacy Section */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 ring-1 ring-indigo-50/50">
                    <h4 className="font-bold text-slate-900 mb-5 flex items-center gap-2.5 text-lg border-b border-slate-100 pb-3">
                      <Shield className="w-6 h-6 text-indigo-600" /> 
                      {t.modal.privacyTitle}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <div className="flex items-center gap-2.5 mb-2">
                          <Lock className="w-5 h-5 text-slate-500" />
                          <span className="text-sm font-bold text-slate-500 uppercase">{t.modal.gdpr}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          {analysis.privacy.gdprCompliant ? (
                             <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : (
                             <AlertCircle className="w-6 h-6 text-amber-600" />
                          )}
                          <span className={`font-bold text-lg ${analysis.privacy.gdprCompliant ? 'text-green-700' : 'text-amber-700'}`}>
                            {analysis.privacy.gdprCompliant ? t.modal.compliant : t.modal.notCompliant}
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <div className="flex items-center gap-2.5 mb-2">
                          <UserCheck className="w-5 h-5 text-slate-500" />
                          <span className="text-sm font-bold text-slate-500 uppercase">{t.modal.ageWarning}</span>
                        </div>
                        <p className="text-base font-medium text-slate-700">{analysis.privacy.ageWarning}</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                       <div>
                          <span className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2 mb-2">
                             <FileText className="w-4 h-4" /> {t.modal.privacySummary}
                          </span>
                          <p className="text-base text-slate-700 leading-relaxed">
                            {analysis.privacy.complianceSummary}
                          </p>
                       </div>
                       <div>
                          <span className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2 mb-2">
                             <Users className="w-4 h-4" /> {t.modal.dataCollection}
                          </span>
                          <p className="text-base text-slate-700 leading-relaxed">
                            {analysis.privacy.dataCollected}
                          </p>
                       </div>
                    </div>
                  </div>

                  {/* Pedagogical Analysis */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100">
                    <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2.5 text-lg">
                      <BrainCircuit className="w-5 h-5" /> {t.modal.summary}
                    </h4>
                    <p className="text-slate-700 text-base leading-relaxed">{analysis.summary}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                      <h4 className="font-bold text-emerald-900 mb-3 text-base">{t.modal.teacherTip}</h4>
                      <p className="text-emerald-800 text-base leading-relaxed">{analysis.teacherTip}</p>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                      <h4 className="font-bold text-blue-900 mb-3 text-base">{t.modal.studentActivity}</h4>
                      <p className="text-blue-800 text-base leading-relaxed">{analysis.studentActivity}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-bold text-slate-900 mb-4 text-base flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                        {t.modal.pros}
                      </h4>
                      <ul className="space-y-3">
                        {analysis.pros.map((pro, idx) => (
                          <li key={idx} className="text-base text-slate-600 flex items-start gap-3">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-4 text-base flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                        {t.modal.cons}
                      </h4>
                      <ul className="space-y-3">
                        {analysis.cons.map((con, idx) => (
                          <li key={idx} className="text-base text-slate-600 flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-amber-500 mt-1 flex-shrink-0" />
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};