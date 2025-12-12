import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  en: {
    // Auth
    welcome: "Welcome back!",
    joinFun: "Join the holiday fun!",
    createAccount: "Create Account",
    loginButton: "Log In",
    loginAction: "Log In",
    signupAction: "Sign Up",
    username: "Username",
    password: "Password",
    processing: "Processing...",
    back: "Back",
    authErrorSignup: "Username might be taken or invalid.",
    authErrorLogin: "Invalid username or password.",
    
    // Auth Toggle / Descriptions
    orLogin: "Already have an account? Log In instead",
    orSignup: "Don't have an account? Sign Up instead",
    useExisting: "Use existing account",
    createNew: "Create a new account",
    
    // Modal
    chooseLanguage: "Choose your language",
    english: "English",
    indonesia: "Indonesia",
    
    // General
    loading: "Loading...",
  },
  id: {
    // Auth
    welcome: "Selamat datang kembali!",
    joinFun: "Bergabunglah dalam kemeriahan liburan!",
    createAccount: "Buat Akun Baru",
    loginButton: "Masuk",
    loginAction: "Masuk",
    signupAction: "Daftar",
    username: "Nama Pengguna",
    password: "Kata Sandi",
    processing: "Memproses...",
    back: "Kembali",
    authErrorSignup: "Nama pengguna mungkin sudah dipakai atau tidak valid.",
    authErrorLogin: "Nama pengguna atau kata sandi salah.",
    
    // Auth Toggle / Descriptions
    orLogin: "Sudah punya akun? Masuk saja",
    orSignup: "Belum punya akun? Daftar sekarang",
    useExisting: "Gunakan akun yang sudah ada",
    createNew: "Buat akun baru untuk memulai",

    // Modal
    chooseLanguage: "Pilih Bahasa Anda",
    english: "Inggris",
    indonesia: "Indonesia",

    // General
    loading: "Memuat...",
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang) {
      setLanguage(savedLang);
    } else {
      setShowModal(true);
    }
  }, []);

  const selectLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('appLanguage', lang);
    setShowModal(false);
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'id' : 'en';
    selectLanguage(newLang);
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: selectLanguage, toggleLanguage, t }}>
      {children}
      
      {/* Language Selection Modal */}
      {showModal && (
        <div className="modal-overlay" style={{zIndex: 9999}}>
          <div className="modal-content" style={{textAlign: 'center', maxWidth: '400px'}}>
            <h2 style={{marginTop: 0}}>🌐</h2>
            <h3>{translations[language].chooseLanguage}</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px'}}>
              <button 
                className="primary-action" 
                onClick={() => selectLanguage('en')}
              >
                🇺🇸 English
              </button>
              <button 
                className="primary-action" 
                onClick={() => selectLanguage('id')}
                style={{backgroundColor: '#fff', color: '#333', border: '2px solid #eee'}}
              >
                🇮🇩 Indonesia
              </button>
            </div>
          </div>
        </div>
      )}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);