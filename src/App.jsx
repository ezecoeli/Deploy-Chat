import { LanguageProvider } from './hooks/useTranslation.jsx';
import Login from './components/Login.jsx';

function App() {
  return (
    <LanguageProvider>
      <div className="min-h-screen flex items-center justify-center bg-black relative">
        <Login />
      </div>
    </LanguageProvider>
  );
}

export default App;

