import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  en: {
    // Auth
    appName: "Secret Santa",
    welcome: "Welcome back!",
    joinFun: "Join the holiday fun!",
    createAccount: "Create Account",
    loginButton: "Log In",
    loginAction: "Log In",
    signupAction: "Sign Up",
    username: "Username",
    nickname: "Nickname (Optional)",
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
    
    // NotificationContext
    waitTitle: "Wait a second...",
    cancel: "Cancel",
    confirm: "Yes, Continue",
    error: "Error",
    success: "Success",

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
    enterNameError: "Please enter a name",
    createEventError: "Error creating event: ",
    invalidCode: "Invalid Code",
    eventStartedError: "Event has already started!",
    defaultEventName: "Secret Santa Event",
    
    // Lobby
    code: "Code",
    budget: "Budget",
    description: "Description",
    date: "Date",
    giftingTo: "You are gifting to",
    theirWishlist: "Their Wishlist",
    noWishlist: "They didn't ask for anything specific! Get creative! 🎨",
    participants: "Participants",
    hostTag: "Host",
    coHostTag: "Co-Host",
    spectatorTag: "Spectator",
    yourWishlistTitle: "Your Wishlist",
    wishlistHelp: "Help your Secret Santa by listing things you like!",
    wishlistPlaceholder: "I love outer clothing, sci-fi books, and gadgets...",
    saveWishlist: "Save Wishlist",
    startEvent: "START EVENT",
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
    lobbySettings: "Lobby Settings",
    updateSettings: "Update Settings",
    saveLobby: "Save Settings",
    saveNickname: "Save Nickname",
    editProfile: "Edit Profile",
    spectatorMode: "Spectator Mode",
    spectatorModeHelp: "Spectators can watch but won't give or receive gifts.",
    promoteToCoHost: "Promote to Co-Host",
    demoteToMember: "Demote to Member",
    kioskMode: "Kiosk Mode",
    wishlistUpdated: "Wishlist updated!",
    nicknameUpdated: "Nickname updated!",
    updateFailed: "Update failed. You might not have permission.",
    eventSettingsUpdated: "Event settings updated!",
    promoted: "Promoted to Co-Host!",
    demoted: "Demoted to Member",
    constraintsSaved: "Constraints saved!",
    confirmRemove: "Are you sure you want to remove {name}?",
    unableToRemove: "Unable to remove participant.",
    participantRemoved: "Participant removed.",
    confirmStart: "This will lock the room and draw names. It cannot be undone!",
    eventStarted: "Event Started! Good luck!",
    confirmReset: "Are you sure? This will RESET all matches and send everyone back to the lobby.",
    eventReset: "Event reset! Constraints can be modified now.",
    noLimit: "No Limit",
    tbd: "TBD",
    hostManageSelfWarning: "You can only edit your nickname here. Ask the host for other changes!",
    
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
    clickToReveal: "CLICK TO REVEAL",
    tapToPeek: "Tap to peek at your target",
    kioskPassTo: "Pass device to",
    iAm: "I am",
    gotIt: "Got it!",
    allRevealed: "All done! Everyone has seen their target.",
    kioskAdminError: "Only admins can use Kiosk Mode",
    queueError: "Error loading queue",
    noTargetError: "User has no target!",
    
    // Modal & General
    chooseLanguage: "Choose your language",
    english: "English",
    indonesia: "Indonesia",
    loading: "Loading...",
  },
  id: {
    // Auth
    appName: "Secret Santa",
    welcome: "Selamat datang!",
    joinFun: "Bergabunglah dengan kami!",
    createAccount: "Buat Akun Baru",
    loginButton: "Masuk",
    loginAction: "Masuk",
    signupAction: "Daftar",
    username: "Nama User",
    nickname: "Nama Panggilan (Opsional)",
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

    // NotificationContext
    waitTitle: "Tunggu sebentar...",
    cancel: "Batal",
    confirm: "Ya, Lanjutkan",
    error: "Kesalahan",
    success: "Berhasil",

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
    enterNameError: "Mohon masukkan nama",
    createEventError: "Gagal membuat event: ",
    invalidCode: "Kode Tidak Valid",
    eventStartedError: "Event sudah dimulai!",
    defaultEventName: "Event Secret Santa",

    // Lobby
    code: "Kode",
    budget: "Budget",
    description: "Deskripsi",
    date: "Tanggal",
    giftingTo: "Anda memberi kado untuk",
    theirWishlist: "Wishlist Mereka",
    noWishlist: "Mereka tidak meminta sesuatu yang spesifik! Berkreasilah! 🎨",
    participants: "Peserta",
    hostTag: "Host",
    coHostTag: "Co-Host",
    spectatorTag: "Penonton",
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
    lobbySettings: "Pengaturan Lobby",
    updateSettings: "Update Pengaturan",
    saveLobby: "Simpan Pengaturan",
    saveNickname: "Simpan Nama Panggilan",
    editProfile: "Edit Profil",
    spectatorMode: "Mode Penonton",
    spectatorModeHelp: "Penonton bisa melihat chat tapi tidak ikut tukar kado.",
    promoteToCoHost: "Jadikan Co-Host",
    demoteToMember: "Jadikan Member Biasa",
    kioskMode: "Mode Kiosk",
    wishlistUpdated: "Wishlist diperbarui!",
    nicknameUpdated: "Nama panggilan diperbarui!",
    updateFailed: "Gagal memperbarui. Anda mungkin tidak memiliki izin.",
    eventSettingsUpdated: "Pengaturan event diperbarui!",
    promoted: "Dipromosikan menjadi Co-Host!",
    demoted: "Diturunkan menjadi Member",
    constraintsSaved: "Batasan disimpan!",
    confirmRemove: "Apakah Anda yakin ingin menghapus {name}?",
    unableToRemove: "Tidak dapat menghapus peserta.",
    participantRemoved: "Peserta dihapus.",
    confirmStart: "Ini akan mengunci room dan mengundi nama. Tidak bisa dibatalkan!",
    eventStarted: "Event Dimulai! Semoga beruntung!",
    confirmReset: "Apakah Anda yakin? Ini akan MERESET semua pasangan dan mengembalikan semua orang ke lobby.",
    eventReset: "Event di-reset! Batasan bisa diubah sekarang.",
    noLimit: "Tidak Terbatas",
    tbd: "Akan Ditentukan",
    hostManageSelfWarning: "Anda hanya bisa mengedit nama panggilan di sini. Minta host untuk perubahan lain!",

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
    clickToReveal: "KLIK UNTUK MELIHAT",
    tapToPeek: "Ketuk untuk mengintip target Anda",
    kioskPassTo: "Berikan HP ke",
    iAm: "Saya adalah",
    gotIt: "Mengerti!",
    allRevealed: "Selesai! Semua orang sudah melihat targetnya.",
    kioskAdminError: "Hanya admin yang bisa menggunakan Mode Kiosk",
    queueError: "Gagal memuat antrian",
    noTargetError: "User tidak memiliki target!",

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

  const t = (key, args = {}) => {
    let text = translations[language][key] || key;
    // Simple replacements for arguments like {name}
    Object.keys(args).forEach(arg => {
      text = text.replace(new RegExp(`{${arg}}`, 'g'), args[arg]);
    });
    return text;
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