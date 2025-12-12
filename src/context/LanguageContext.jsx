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
    
    // Dashboard
    dashboard: "Dashboard",
    signOut: "Sign Out",
    hostEventTitle: "Host an Event",
    hostEventDesc: "Create a new Secret Santa room, set a budget, and invite friends.",
    createNewGroup: "Create New Group",
    joinEventTitle: "Join an Event",
    joinEventDesc: "Enter the 6-digit code provided by your group host.",
    joinButton: "Join",
    yourEvents: "Your Events",
    noEvents: "You haven't joined any events yet.",
    enterLobby: "Enter Lobby",
    createLobbyModalTitle: "Create New Lobby",
    lobbyNameLabel: "Lobby Name",
    lobbyNamePlaceholder: "e.g. Family Party 2025",
    budgetLabel: "Budget (Optional)",
    budgetPlaceholder: "e.g. 100k - 250k",
    createAndJoin: "Create & Join",
    
    // Lobby
    code: "Code",
    budget: "Budget",
    giftingTo: "You are gifting to",
    theirWishlist: "Their Wishlist",
    noWishlist: "They didn't ask for anything specific! Get creative! 🎨",
    participants: "Participants",
    hostTag: "Host",
    yourWishlistTitle: "Your Wishlist",
    wishlistHelp: "Help your Secret Santa by listing things you like!",
    wishlistPlaceholder: "I love outer clothing, sci-fi books, and gadgets...",
    saveWishlist: "Save Wishlist",
    startEvent: "START EVENT (HOST ONLY)",
    startEventHelp: "Only click this when everyone has joined!",
    manage: "Manage",
    exclusionGroup: "Exclusion Group",
    exclusionGroupHelp: "Cannot match with others in same group (e.g. \"Couple\").",
    strictPool: "Strict Inclusion Pool",
    strictPoolHelp: "Can ONLY match with others in this pool (e.g. \"Kids\").",
    specificExclusions: "Specific Exclusions",
    specificExclusionsHelp: "Select people this user CANNOT draw.",
    saveConstraints: "Save Constraints",
    removeParticipant: "Remove Participant",
    
    // Reveal
    secretTarget: "Your Target",
    spinText: "The names are loaded. Spin to find out!",
    spinButton: "SPIN TO REVEAL",
    spinning: "Spinning...",
    backToLobby: "Back to Lobby",
    hostControls: "Host Controls",
    resetEvent: "Reset Event (Unlock Lobby)",
    loadingSecret: "Loading secret info...",
    unknown: "Unknown",

    // Modal & General
    chooseLanguage: "Choose your language",
    english: "English",
    indonesia: "Indonesia",
    loading: "Loading...",
  },
  id: {
    // Auth
    welcome: "Selamat datang!",
    joinFun: "Bergabunglah dengan kami!",
    createAccount: "Buat Akun Baru",
    loginButton: "Masuk",
    loginAction: "Masuk",
    signupAction: "Daftar",
    username: "Nama User",
    password: "Kata Sandi",
    processing: "Memproses...",
    back: "Kembali",
    authErrorSignup: "Nama User mungkin sudah dipakai atau tidak valid.",
    authErrorLogin: "Nama User atau kata sandi salah.",
    
    // Auth Toggle / Descriptions
    orLogin: "Sudah punya akun? Masuk saja",
    orSignup: "Belum punya akun? Daftar sekarang",
    useExisting: "Gunakan akun yang sudah ada",
    createNew: "Buat akun baru untuk memulai",

    // Dashboard
    dashboard: "Menu Utama",
    signOut: "Keluar",
    hostEventTitle: "Buat Event",
    hostEventDesc: "Buat lobby Secret Santa, atur budget, dan undang teman.",
    createNewGroup: "Buat Grup Baru",
    joinEventTitle: "Gabung Event",
    joinEventDesc: "Masukkan 6 digit kode yang diberikan oleh host.",
    joinButton: "Gabung",
    yourEvents: "Event Anda",
    noEvents: "Anda belum bergabung dengan event apa pun.",
    enterLobby: "Lihat Lobby",
    createLobbyModalTitle: "Buat Lobi Baru",
    lobbyNameLabel: "Nama Lobi",
    lobbyNamePlaceholder: "cth. Pesta Keluarga 2025",
    budgetLabel: "Anggaran (Opsional)",
    budgetPlaceholder: "cth. 100rb - 250rb",
    createAndJoin: "Buat & Gabung",

    // Lobby
    code: "Kode",
    budget: "Budget",
    giftingTo: "Anda memberi kado untuk",
    theirWishlist: "Wishlist Mereka",
    noWishlist: "Mereka tidak meminta sesuatu yang spesifik! Berkreasilah! 🎨",
    participants: "Peserta",
    hostTag: "Host",
    yourWishlistTitle: "Wishlist Anda",
    wishlistHelp: "Bantu Secret Santa Anda dengan mencantumkan hal-hal yang Anda sukai!",
    wishlistPlaceholder: "Saya suka baju outer, buku sci-fi, dan gadget...",
    saveWishlist: "Simpan Wishlist",
    startEvent: "MULAI EVENT",
    startEventHelp: "Klik ini hanya jika semua orang sudah bergabung!",
    manage: "Pengaturan",
    exclusionGroup: "Grup Pengecualian",
    exclusionGroupHelp: "Tidak bisa mendapat orang lain di grup yang sama (cth. \"Pasangan\").",
    strictPool: "Grup Sendiri",
    strictPoolHelp: "HANYA bisa mendapat orang lain di grup ini (cth. \"Anak-anak\").",
    specificExclusions: "Pengecualian Khusus",
    specificExclusionsHelp: "Pilih orang yang TIDAK BISA didapatkan user ini.",
    saveConstraints: "Simpan Batasan",
    removeParticipant: "Hapus Peserta",

    // Reveal
    secretTarget: "Target Anda",
    spinText: "Lobby dimulai. Putar untuk melihat siapa yang anda beri kado!",
    spinButton: "PUTAR RODA!",
    spinning: "Memutar...",
    backToLobby: "Kembali ke Lobby",
    hostControls: "Kontrol Host",
    resetEvent: "Atur Ulang Lobby",
    loadingSecret: "Memuat info rahasia...",
    unknown: "Tidak Diketahui",

    // Modal & General
    chooseLanguage: "Pilih Bahasa Anda",
    english: "Inggris",
    indonesia: "Indonesia",
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