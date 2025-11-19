import React, { useState, useMemo, useRef, useEffect } from 'react';
import { EduApp, AppCategory, UserRole, EducationStage, Language } from './types';
import { APP_DATA } from './constants';
import { AppCard } from './components/AppCard';
import { AppDetailModal } from './components/AppDetailModal';
import { Search, Filter, BookOpen, Languages, ChevronDown, Check, X } from 'lucide-react';
import { getTranslation } from './translations';

// --- Multi Select Component ---
interface MultiSelectProps {
  label: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}

const MultiSelectDropdown: React.FC<MultiSelectProps> = ({ 
  label, 
  options, 
  selectedValues, 
  onChange, 
  placeholder 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-bold text-ikasnova-blue uppercase tracking-wider mb-2 ml-1">
        {label}
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 bg-white border rounded-xl text-base transition-all duration-200
          ${isOpen ? 'border-ikasnova-light ring-2 ring-ikasnova-light/20' : 'border-slate-200 hover:border-ikasnova-light'}
        `}
      >
        <span className={`truncate ${selectedValues.length === 0 ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
          {selectedValues.length === 0 
            ? placeholder 
            : `${selectedValues.length} ${label}`}
        </span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-80 overflow-y-auto custom-scrollbar">
          <div className="p-2">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <div
                  key={option.value}
                  onClick={() => toggleOption(option.value)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg transition-colors text-base
                    ${isSelected ? 'bg-ikasnova-blue/10 text-ikasnova-blue font-medium' : 'text-slate-600 hover:bg-slate-50'}
                  `}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0
                    ${isSelected ? 'bg-ikasnova-blue border-ikasnova-blue' : 'border-slate-300 bg-white'}
                  `}>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </div>
                  {option.label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('es');
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  
  const [selectedApp, setSelectedApp] = useState<EduApp | null>(null);

  const t = getTranslation(language);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'es' ? 'eu' : 'es');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedStages([]);
    setSelectedRoles([]);
    setSelectedPrices([]);
  };

  const filteredApps = useMemo(() => {
    return APP_DATA.filter(app => {
      const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            app.description.es.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            app.description.eu.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(app.category);
      
      // For stages (array vs array), check if there is ANY intersection
      const matchesStage = selectedStages.length === 0 || app.stages.some(s => selectedStages.includes(s));
      
      const matchesRole = selectedRoles.length === 0 || selectedRoles.some(role => {
         if (app.targetAudience === UserRole.BOTH) return true;
         return app.targetAudience === role;
      });

      const matchesPrice = selectedPrices.length === 0 || selectedPrices.includes(app.priceModel);
      
      return matchesSearch && matchesCategory && matchesStage && matchesRole && matchesPrice;
    });
  }, [searchTerm, selectedCategories, selectedStages, selectedRoles, selectedPrices]);

  // Option Generators
  const categoryOptions = Object.values(AppCategory).map(c => ({ value: c, label: t.categories[c] }));
  const stageOptions = Object.values(EducationStage).map(s => ({ value: s, label: t.stages[s] }));
  const roleOptions = Object.values(UserRole).map(r => ({ value: r, label: t.roles[r] }));
  const priceOptions = ['Gratis', 'Freemium', 'Pago'].map(p => ({ 
    value: p, 
    label: p === 'Gratis' ? t.card.free : p === 'Freemium' ? t.card.freemium : t.card.paid 
  }));

  const activeFilterCount = selectedCategories.length + selectedStages.length + selectedRoles.length + selectedPrices.length;

  return (
    <div className="min-h-screen bg-ikasnova-gray font-sans">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-ikasnova-blue to-ikasnova-light p-2.5 rounded-xl shadow-lg">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-ikasnova-blue tracking-tighter uppercase leading-none">{t.title}</h1>
              <p className="text-sm font-medium text-slate-500 tracking-wide hidden sm:block mt-1">{t.subtitle}</p>
            </div>
          </div>
          
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ikasnova-blue text-white hover:bg-blue-700 font-bold text-base shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95"
            aria-label="Change language"
          >
            <Languages className="w-5 h-5" />
            <span>{language === 'es' ? 'EUSKARA' : 'CASTELLANO'}</span>
          </button>
        </div>
      </header>

      {/* Hero Search Section */}
      <div className="bg-ikasnova-blue relative z-10">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
        
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl sm:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
              {t.heroTitle}
            </h2>
            <p className="text-sky-100 text-xl sm:text-2xl font-light max-w-3xl mx-auto">
              {t.heroSubtitle}
            </p>
          </div>
          
          {/* Search & Filter Box */}
          <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-2xl shadow-ikasnova-blue/20 border border-white/50 backdrop-blur-xl relative z-20">
            {/* Text Search */}
            <div className="mb-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Search className="h-6 w-6 text-ikasnova-light" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ikasnova-light/50 focus:border-ikasnova-light transition-all text-xl shadow-inner"
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Grid of Multi-Selects */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <MultiSelectDropdown 
                label={t.filters.stage}
                options={stageOptions}
                selectedValues={selectedStages}
                onChange={setSelectedStages}
                placeholder={t.filters.selectOptions}
              />
              <MultiSelectDropdown 
                label={t.filters.category}
                options={categoryOptions}
                selectedValues={selectedCategories}
                onChange={setSelectedCategories}
                placeholder={t.filters.selectOptions}
              />
              <MultiSelectDropdown 
                label={t.filters.role}
                options={roleOptions}
                selectedValues={selectedRoles}
                onChange={setSelectedRoles}
                placeholder={t.filters.selectOptions}
              />
              <MultiSelectDropdown 
                label={t.filters.price}
                options={priceOptions}
                selectedValues={selectedPrices}
                onChange={setSelectedPrices}
                placeholder={t.filters.selectOptions}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-8 py-16 relative z-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
           <div className="flex items-center gap-4">
             <span className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 text-3xl font-bold text-ikasnova-blue min-w-[3.5rem] text-center">
               {filteredApps.length}
             </span>
             <h2 className="text-xl font-bold text-slate-600 uppercase tracking-wide">
              {t.results.found}
             </h2>
           </div>
           
           {(activeFilterCount > 0 || searchTerm !== '') && (
              <button 
                onClick={clearFilters}
                className="flex items-center gap-2 text-base text-ikasnova-accent hover:text-pink-700 font-bold uppercase tracking-wide transition-colors px-6 py-3 rounded-xl hover:bg-pink-50 border border-transparent hover:border-pink-100"
              >
                <X className="w-5 h-5" />
                {t.filters.clear}
              </button>
           )}
        </div>
        
        {filteredApps.length > 0 ? (
          /* Changed grid: max 3 columns to allow wider cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredApps.map(app => (
              <AppCard 
                key={app.id} 
                app={app} 
                language={language}
                onClick={setSelectedApp} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-32">
            <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <Filter className="w-16 h-16 text-slate-400" />
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-3">{t.results.none}</h3>
            <p className="text-xl text-slate-500 mb-8">{t.results.noneDesc}</p>
            <button 
              onClick={clearFilters}
              className="bg-ikasnova-blue text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-ikasnova-blue/30 hover:bg-blue-700 transition-all transform hover:scale-105"
            >
              {t.filters.clear}
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-3 mb-4 text-ikasnova-blue font-bold text-2xl tracking-tight">
            <BookOpen className="w-8 h-8" />
            {t.title}
          </div>
          <p className="text-slate-500 text-base">
            © {new Date().getFullYear()} - Designed for Teachers
          </p>
        </div>
      </footer>

      {/* Detail Modal */}
      {selectedApp && (
        <AppDetailModal 
          app={selectedApp} 
          language={language}
          onClose={() => setSelectedApp(null)} 
        />
      )}
    </div>
  );
};

export default App;