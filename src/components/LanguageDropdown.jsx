import { useTranslation } from '../hooks/useTranslation';

export default function LanguageSelector() {
  const { language, changeLanguage } = useTranslation();

  const toggleLanguage = () => {
    const newLang = language === 'es' ? 'en' : 'es';
    changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
      title={language === 'es' ? 'Cambiar a inglés' : 'Switch to Spanish'}
    >
      <span className="text-lg">{language === 'es' ? '🇪🇸' : '🇺🇸'}</span>
      <span className="uppercase font-bold">{language}</span>
    </button>
  );
}