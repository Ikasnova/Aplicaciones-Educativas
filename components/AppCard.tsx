import React, { useState, useEffect } from 'react';
import { EduApp, Language, AppCategory } from '../types';
import { ExternalLink, User, GraduationCap, Users, Shield, Lock, Tag, Gamepad2, Palette, ClipboardList, CheckSquare, MessageCircle, Layers } from 'lucide-react';
import { getTranslation } from '../translations';

interface AppCardProps {
  app: EduApp;
  language: Language;
  onClick: (app: EduApp) => void;
}

export const AppCard: React.FC<AppCardProps> = ({ app, language, onClick }) => {
  const t = getTranslation(language);
  
  // State to manage image source chain: 'original' -> 'google' -> 'placeholder'
  const [imgSrc, setImgSrc] = useState<string>(app.iconUrl);
  const [showPlaceholder, setShowPlaceholder] = useState(false);

  // Reset state when app changes
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

  const getRoleIcon = () => {
    switch (app.targetAudience) {
      case 'Docente': return <User className="w-4 h-4" />;
      case 'Alumnado': return <GraduationCap className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getPriceLabel = () => {
    if (app.priceModel === 'Gratis') return t.card.free;
    if (app.priceModel === 'Pago') return t.card.paid;
    return t.card.freemium;
  };

  const getAgeStyle = (age: number) => {
    if (age >= 14) {
        return {
            className: "bg-rose-50 text-rose-800 border-rose-200 ring-rose-100",
            icon: <Lock className="w-3.5 h-3.5" strokeWidth={2.5} />
        };
    }
    return {
        className: "bg-emerald-50 text-emerald-800 border-emerald-200 ring-emerald-100",
        icon: <Shield className="w-3.5 h-3.5" strokeWidth={2.5} />
    };
  };

  // Category-based placeholder generator
  const renderCategoryPlaceholder = () => {
    let icon;
    let bgClass;
    let iconClass;

    switch (app.category) {
      case AppCategory.GAMIFICATION:
        icon = <Gamepad2 className="w-10 h-10" strokeWidth={1.5} />;
        bgClass = "bg-gradient-to-br from-orange-100 to-amber-100";
        iconClass = "text-orange-600";
        break;
      case AppCategory.CONTENT_CREATION:
        icon = <Palette className="w-10 h-10" strokeWidth={1.5} />;
        bgClass = "bg-gradient-to-br from-pink-100 to-rose-100";
        iconClass = "text-pink-600";
        break;
      case AppCategory.MANAGEMENT:
        icon = <ClipboardList className="w-10 h-10" strokeWidth={1.5} />;
        bgClass = "bg-gradient-to-br from-slate-100 to-gray-200";
        iconClass = "text-slate-600";
        break;
      case AppCategory.ASSESSMENT:
        icon = <CheckSquare className="w-10 h-10" strokeWidth={1.5} />;
        bgClass = "bg-gradient-to-br from-emerald-100 to-teal-100";
        iconClass = "text-emerald-600";
        break;
      case AppCategory.COLLABORATION:
        icon = <MessageCircle className="w-10 h-10" strokeWidth={1.5} />;
        bgClass = "bg-gradient-to-br from-indigo-100 to-violet-100";
        iconClass = "text-indigo-600";
        break;
      default: // OTHER
        icon = <Layers className="w-10 h-10" strokeWidth={1.5} />;
        bgClass = "bg-gradient-to-br from-cyan-100 to-sky-100";
        iconClass = "text-cyan-600";
        break;
    }

    return (
      <div className={`w-full h-full ${bgClass} flex items-center justify-center`}>
        <div className={`${iconClass}`}>
          {icon}
        </div>
      </div>
    );
  };

  return (
    <div 
      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full group transform hover:-translate-y-1"
      onClick={() => onClick(app)}
    >
      {/* Header Image Area */}
      <div className="h-40 bg-gradient-to-br from-indigo-50 to-blue-50 relative overflow-hidden flex-shrink-0">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
        
        {/* Logo Container */}
        <div className="absolute bottom-[-24px] left-6 w-24 h-24 rounded-2xl shadow-md bg-white border-[4px] border-white overflow-hidden flex items-center justify-center z-10">
          {!showPlaceholder ? (
            <img 
              src={imgSrc} 
              alt={app.name} 
              onError={handleImgError}
              className="w-full h-full object-contain p-3" 
            />
          ) : (
            renderCategoryPlaceholder()
          )}
        </div>
        
        {/* Top Right Badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-10">
          <span className={`px-3 py-1 text-xs font-bold rounded-lg border shadow-sm backdrop-blur-md tracking-wide uppercase
            ${app.priceModel === 'Gratis' ? 'bg-white/95 text-emerald-800 border-emerald-200' : 
              app.priceModel === 'Pago' ? 'bg-white/95 text-red-800 border-red-200' : 'bg-white/95 text-amber-800 border-amber-200'}`}>
            {getPriceLabel()}
          </span>
          
          {(app.minAge !== null && app.minAge !== undefined) && (
            (() => {
              const style = getAgeStyle(app.minAge);
              return (
                <span className={`px-3 py-1 text-xs font-bold rounded-lg border shadow-sm flex items-center gap-1.5 backdrop-blur-md ${style.className}`}>
                  {style.icon}
                  <span>+{app.minAge}</span>
                </span>
              );
            })()
          )}
        </div>
      </div>
      
      {/* Body Content */}
      <div className="pt-9 pb-6 px-6 flex-grow flex flex-col">
        
        {/* Category Badge */}
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <Tag className="w-3 h-3" />
            {t.categories[app.category]}
          </span>
        </div>

        <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-indigo-700 transition-colors tracking-tight leading-tight">
          {app.name}
        </h3>
        
        <p className="text-base text-slate-600 mb-5 line-clamp-2 leading-relaxed">
          {app.description[language]}
        </p>

        {/* Features Tags (Limit to 3) */}
        <div className="flex flex-wrap gap-2 mb-5">
          {app.features[language].slice(0, 3).map((feature, idx) => (
            <span key={idx} className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200">
              {feature}
            </span>
          ))}
          {app.features[language].length > 3 && (
            <span className="text-xs font-medium text-slate-400 px-1 py-1">...</span>
          )}
        </div>

        {/* Stages Info */}
        <div className="mt-auto pt-4 border-t border-slate-100">
          <div className="flex flex-wrap gap-1 mb-3">
            {app.stages.slice(0, 4).map((stage) => (
              <span key={stage} className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                {t.stages[stage].slice(0, 3)}
              </span>
            ))}
             {app.stages.length > 4 && (
              <span className="text-[10px] font-bold text-slate-400 px-1 py-1">+</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              {getRoleIcon()}
              {t.roles[app.targetAudience]}
            </span>
            <span className="text-sm text-indigo-700 font-bold flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
              {t.card.viewDetails} <ExternalLink className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
