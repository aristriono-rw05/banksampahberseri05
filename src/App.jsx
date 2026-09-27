// src/App.jsx
import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  History, 
  Search, 
  Camera, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Image as ImageIcon,
  Users,
  Building2,
  ShieldCheck,
  UserCheck,
  Lock,
  LogOut,
  Tag,
  Plus,
  MapPin,
  ChevronRight,
  Wallet,
  ExternalLink,
  FileText,
  Printer,
  Calendar,
  Crown,
  Edit2,
  X,
  Key,
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import { 
  tambahNasabah, 
  getAllNasabah, 
  cariNasabahMulti, 
  inputSetorSampah, 
  inputPenarikanSaldo,
  getRiwayatTransaksi,
  getAllTransaksi,
  getKategoriSampah,
  tambahKategoriSampah,
  hapusKategoriSampah,
  updateKategoriSampah,
  updateNasabah,
  hapusNasabah,
  updateTransaksi,
  hapusTransaksi,
  getPasswords,       
  updatePassword      
} from './services/BankService';
import { compressImage } from './utils/compressImage';

export default function App() {
  const [activeRole, setActiveRole] = useState('user');

  const [currentRoleLoggedIn, setCurrentRoleLoggedIn] = useState(
    sessionStorage.getItem('userRole') || null
  );
  const [passwordInput, setPasswordInput] = useState('');

  // State Data Master
  const [daftarNasabah, setDaftarNasabah] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [semuaTransaksi, setSemuaTransaksi] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pesan, setPesan] = useState({ tipe: '', teks: '' });

  // State Modal
  const [editNasabahModal, setEditNasabahModal] = useState(null);
  const [editKategoriModal, setEditKategoriModal] = useState(null);
  const [editTransaksiModal, setEditTransaksiModal] = useState(null);
  const [modalFoto, setModalFoto] = useState(null);
  const [gantiPasswordModal, setGantiPasswordModal] = useState(false);
  const [lupaPasswordModal, setLupaPasswordModal] = useState(false);
  const [whatsappModal, setWhatsappModal] = useState(null); // State untuk pop-up kirim WA transaksi terakhir

  // Form State
  const [formKategori, setFormKategori] = useState({ nama: '', harga: '' });
  const [formNasabah, setFormNasabah] = useState({ nama: '', rt: '01', no_hp: '' });
  const [formSetor, setFormSetor] = useState({ nasabahId: '', kategoriNama: '', hargaCustom: '', berat_kg: '', fotoBase64: '' });
  const [previewFoto, setPreviewFoto] = useState('');
  const [formTarik, setFormTarik] = useState({ nasabahId: '', jumlahPenarikan: '', keterangan: '' });
  
  // State Form Ganti Password
  const [formPassword, setFormPassword] = useState({ lama: '', baru: '', konfirmasi: '' });

  // Filter & User Search
  const [filterLaporan, setFilterLaporan] = useState({ dariTanggal: '', sampaiTanggal: '' });
  const [keywordCari, setKeywordCari] = useState('');
  const [hasilCariList, setHasilCariList] = useState([]);
  const [nasabahAktif, setNasabahAktif] = useState(null);
  const [riwayatUser, setRiwayatUser] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const nasabah = await getAllNasabah();
      setDaftarNasabah(nasabah || []);
      const katDB = await getKategoriSampah();
      setKategoriList(katDB || []);
      const trxDB = await getAllTransaksi();
      setSemuaTransaksi(trxDB || []);
    } catch (err) {
      tampilkanPesan('error', 'Gagal memuat data dari database.');
    } finally {
      setLoading(false);
    }
  };

  const tampilkanPesan = (tipe, teks) => {
    setPesan({ tipe, teks });
    setTimeout(() => setPesan({ tipe: '', teks: '' }), 4000);
  };

  // --- HANDLER LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const passwordsDB = await getPasswords();
      if (passwordInput === passwordsDB.superadmin) {
        setCurrentRoleLoggedIn('superadmin');
        sessionStorage.setItem('userRole', 'superadmin');
        tampilkanPesan('success', 'Berhasil Login sebagai Super Admin!');
        setPasswordInput('');
      } else if (passwordInput === passwordsDB.admin) {
        setCurrentRoleLoggedIn('admin');
        sessionStorage.setItem('userRole', 'admin');
        tampilkanPesan('success', 'Berhasil Login sebagai Admin!');
        setPasswordInput('');
      } else {
        tampilkanPesan('error', 'Password Salah! Akses Ditolak.');
      }
    } catch (err) {
      tampilkanPesan('error', 'Terjadi kesalahan sistem login.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentRoleLoggedIn(null);
    sessionStorage.removeItem('userRole');
    setActiveRole('user');
    tampilkanPesan('success', 'Berhasil Keluar dari Sistem.');
  };

  // --- HANDLER GANTI PASSWORD ---
  const handleGantiPassword = async (e) => {
    e.preventDefault();
    if (formPassword.baru !== formPassword.konfirmasi) return tampilkanPesan('error', 'Konfirmasi password baru tidak cocok!');
    if (formPassword.baru.length < 6) return tampilkanPesan('error', 'Password baru minimal 6 karakter!');

    setLoading(true);
    try {
      const passwordsDB = await getPasswords();
      const passSaatIni = currentRoleLoggedIn === 'superadmin' ? passwordsDB.superadmin : passwordsDB.admin;

      if (formPassword.lama !== passSaatIni) {
        setLoading(false);
        return tampilkanPesan('error', 'Password lama salah!');
      }

      const res = await updatePassword(currentRoleLoggedIn, formPassword.baru);
      if (res.success) {
        tampilkanPesan('success', 'Password berhasil diubah!');
        setGantiPasswordModal(false);
        setFormPassword({ lama: '', baru: '', konfirmasi: '' });
      } else {
        tampilkanPesan('error', 'Gagal merubah password.');
      }
    } finally { setLoading(false); }
  };

  // --- KELOLA KATEGORI ---
  const handleTambahKategori = async (e) => {
    e.preventDefault();
    if (!formKategori.nama || !formKategori.harga) return tampilkanPesan('error', 'Wajib diisi!');
    setLoading(true);
    try {
      const res = await tambahKategoriSampah({ nama: formKategori.nama, harga: Number(formKategori.harga) });
      if (res.success) {
        tampilkanPesan('success', `Jenis sampah "${formKategori.nama}" ditambahkan!`);
        setFormKategori({ nama: '', harga: '' });
        loadData();
      }
    } finally { setLoading(false); }
  };

  const handleSaveEditKategori = async (e) => {
    e.preventDefault();
    if (!editKategoriModal) return;
    setLoading(true);
    try {
      const res = await updateKategoriSampah(editKategoriModal.id, { nama: editKategoriModal.nama, harga: Number(editKategoriModal.harga) });
      if (res.success) { tampilkanPesan('success', 'Berhasil diperbarui!'); setEditKategoriModal(null); loadData(); }
    } finally { setLoading(false); }
  };

  const handleHapusKategori = async (id, nama) => {
    if (currentRoleLoggedIn !== 'superadmin') return tampilkanPesan('error', 'Akses ditolak!');
    if (window.confirm(`Yakin menghapus "${nama}"?`)) {
      setLoading(true);
      try {
        const res = await hapusKategoriSampah(id);
        if (res.success) { tampilkanPesan('success', 'Berhasil dihapus.'); loadData(); }
      } finally { setLoading(false); }
    }
  };

  // --- KELOLA NASABAH ---
  const handleTambahNasabah = async (e) => {
    e.preventDefault();
    if (!formNasabah.nama.trim()) return tampilkanPesan('error', 'Nama wajib diisi!');
    setLoading(true);
    try {
      const autoNoRek = `05-${String(daftarNasabah.length + 1).padStart(3, '0')}`;
      const res = await tambahNasabah({ no_rekening: autoNoRek, nama: formNasabah.nama, rt: formNasabah.rt, no_hp: formNasabah.no_hp });
      if (res.success) {
        tampilkanPesan('success', `Berhasil! No. Rek: ${autoNoRek}`);
        setFormNasabah({ nama: '', rt: '01', no_hp: '' });
        loadData();
      }
    } finally { setLoading(false); }
  };

  const handleSaveEditNasabah = async (e) => {
    e.preventDefault();
    if (!editNasabahModal) return;
    setLoading(true);
    try {
      const res = await updateNasabah(editNasabahModal.id, { nama: editNasabahModal.nama, rt: editNasabahModal.rt, no_hp: editNasabahModal.no_hp });
      if (res.success) { tampilkanPesan('success', 'Berhasil diperbarui!'); setEditNasabahModal(null); loadData(); }
    } finally { setLoading(false); }
  };

  const handleHapusNasabah = async (id, nama) => {
    if (currentRoleLoggedIn !== 'superadmin') return tampilkanPesan('error', 'Akses ditolak!');
    if (window.confirm(`Yakin menghapus "${nama}"?`)) {
      setLoading(true);
      try {
        const res = await hapusNasabah(id);
        if (res.success) { tampilkanPesan('success', 'Berhasil dihapus.'); loadData(); }
      } finally { setLoading(false); }
    }
  };

  // --- KELOLA TRANSAKSI + NOTIFIKASI WHATSAPP ---
  const handlePilihKategori = (e) => {
    const namaSelected = e.target.value;
    const item = kategoriList.find(k => k.nama === namaSelected);
    setFormSetor(prev => ({ ...prev, kategoriNama: namaSelected, hargaCustom: item ? item.harga : '' }));
  };

  const handleFotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 800, 0.7);
        setFormSetor(prev => ({ ...prev, fotoBase64: compressed }));
        setPreviewFoto(compressed);
      } catch (err) { tampilkanPesan('error', 'Gagal memproses foto.'); }
    }
  };

  const handleSetorSampah = async (e) => {
    e.preventDefault();
    const nasabahSelected = daftarNasabah.find(n => n.id === formSetor.nasabahId);
    if (!nasabahSelected) return tampilkanPesan('error', 'Pilih nasabah!');
    if (!formSetor.berat_kg || parseFloat(formSetor.berat_kg) <= 0) return tampilkanPesan('error', 'Berat tidak valid!');
    setLoading(true);
    try {
      const berat = parseFloat(formSetor.berat_kg);
      const hargaPerKg = parseFloat(formSetor.hargaCustom);
      const totalHarga = berat * hargaPerKg;
      const saldoTerbaru = (nasabahSelected.saldo || 0) + totalHarga;

      const res = await inputSetorSampah({
        nasabah_doc_id: nasabahSelected.id,
        no_rekening: nasabahSelected.no_rekening,
        nama_nasabah: nasabahSelected.nama,
        kategori_sampah: formSetor.kategoriNama || 'Umum',
        berat_kg: berat,
        harga_per_kg: hargaPerKg,
        total_harga: totalHarga,
        foto_bukti: formSetor.fotoBase64
      });

      if (res.success) {
        tampilkanPesan('success', `Setor Rp ${totalHarga.toLocaleString('id-ID')} berhasil!`);
        
        // Siapkan data untuk prompt WhatsApp
        setWhatsappModal({
          no_hp: nasabahSelected.no_hp || '',
          nama: nasabahSelected.nama,
          no_rekening: nasabahSelected.no_rekening,
          pesan: `Halo *${nasabahSelected.nama}* (Rek: *${nasabahSelected.no_rekening}*),\n\nSetoran sampah berhasil dicatat di Bank Sampah BERSERI RW.05:\n- Jenis: ${formSetor.kategoriNama}\n- Berat: ${berat} kg\n- Penambahan Saldo: *+Rp ${totalHarga.toLocaleString('id-ID')}*\n- Total Saldo Anda Sekarang: *Rp ${saldoTerbaru.toLocaleString('id-ID')}*\n\nTerima kasih telah berpartisipasi menjaga lingkungan bersama kami! ♻️`
        });

        setFormSetor({ nasabahId: '', kategoriNama: '', hargaCustom: '', berat_kg: '', fotoBase64: '' });
        setPreviewFoto('');
        loadData();
      }
    } finally { setLoading(false); }
  };

  const handlePenarikanSaldo = async (e) => {
    e.preventDefault();
    const nasabahSelected = daftarNasabah.find(n => n.id === formTarik.nasabahId);
    if (!nasabahSelected) return tampilkanPesan('error', 'Pilih nasabah!');
    const nominal = parseFloat(formTarik.jumlahPenarikan);
    if (!nominal || nominal <= 0) return tampilkanPesan('error', 'Nominal tidak valid!');
    if (nominal > (nasabahSelected.saldo || 0)) return tampilkanPesan('error', 'Saldo tidak cukup!');
    
    setLoading(true);
    try {
      const saldoTerbaru = (nasabahSelected.saldo || 0) - nominal;
      const res = await inputPenarikanSaldo({
        nasabah_doc_id: nasabahSelected.id,
        no_rekening: nasabahSelected.no_rekening,
        nama_nasabah: nasabahSelected.nama,
        jumlah_penarikan: nominal,
        keterangan: formTarik.keterangan
      });

      if (res.success) {
        tampilkanPesan('success', `Tarik Rp ${nominal.toLocaleString('id-ID')} berhasil!`);

        // Siapkan data untuk prompt WhatsApp
        setWhatsappModal({
          no_hp: nasabahSelected.no_hp || '',
          nama: nasabahSelected.nama,
          no_rekening: nasabahSelected.no_rekening,
          pesan: `Halo *${nasabahSelected.nama}* (Rek: *${nasabahSelected.no_rekening}*),\n\nTelah dilakukan penarikan tabungan di Bank Sampah BERSERI RW.05:\n- Nominal Penarikan: *-Rp ${nominal.toLocaleString('id-ID')}*\n- Keterangan: ${formTarik.keterangan || 'Pengambilan Tabungan'}\n- Sisa Saldo Anda Sekarang: *Rp ${saldoTerbaru.toLocaleString('id-ID')}*\n\nTerima kasih.`
        });

        setFormTarik({ nasabahId: '', jumlahPenarikan: '', keterangan: '' });
        loadData();
      }
    } finally { setLoading(false); }
  };

  const handleSaveEditTransaksi = async (e) => {
    e.preventDefault();
    if (!editTransaksiModal) return;
    setLoading(true);
    try {
      const res = await updateTransaksi(editTransaksiModal.id, {
        berat_kg: Number(editTransaksiModal.berat_kg || 0),
        harga_per_kg: Number(editTransaksiModal.harga_per_kg || 0),
        total_harga: Number(editTransaksiModal.total_harga || 0),
        kategori_sampah: editTransaksiModal.kategori_sampah,
        keterangan: editTransaksiModal.keterangan || ''
      });
      if (res.success) {
        tampilkanPesan('success', 'Transaksi berhasil diubah!');
        setEditTransaksiModal(null);
        loadData();
      }
    } finally { setLoading(false); }
  };

  const handleHapusTransaksi = async (trx) => {
    if (currentRoleLoggedIn !== 'superadmin') return tampilkanPesan('error', 'Akses ditolak!');
    if (window.confirm('Hapus transaksi & kembalikan saldo nasabah?')) {
      setLoading(true);
      try {
        const res = await hapusTransaksi(trx.id, trx.nasabah_doc_id || trx.no_rekening, trx.total_harga, trx.berat_kg);
        if (res.success) { tampilkanPesan('success', 'Transaksi dihapus.'); loadData(); }
      } finally { setLoading(false); }
    }
  };

  // --- FILTER & USER SEARCH ---
  const transaksiTerdfilter = semuaTransaksi.filter((t) => {
    if (!t.tanggal?.seconds) return true;
    const tglTransaksi = new Date(t.tanggal.seconds * 1000).toISOString().split('T')[0];
    if (filterLaporan.dariTanggal && tglTransaksi < filterLaporan.dariTanggal) return false;
    if (filterLaporan.sampaiTanggal && tglTransaksi > filterLaporan.sampaiTanggal) return false;
    return true;
  });

  const totalBeratFilter = transaksiTerdfilter.reduce((acc, t) => acc + (t.berat_kg || 0), 0);
  const totalSetorFilter = transaksiTerdfilter.filter(t => t.total_harga > 0).reduce((acc, t) => acc + t.total_harga, 0);
  const totalTarikFilter = transaksiTerdfilter.filter(t => t.total_harga < 0).reduce((acc, t) => acc + Math.abs(t.total_harga), 0);

  const handleCariNasabah = async (e) => {
    e.preventDefault();
    if (!keywordCari.trim()) return;
    setLoading(true);
    try {
      setNasabahAktif(null);
      setRiwayatUser([]);
      const results = await cariNasabahMulti(keywordCari.trim());
      if (results.length === 0) {
        setHasilCariList([]);
        tampilkanPesan('error', 'Data tidak ditemukan.');
      } else if (results.length === 1) {
        setHasilCariList([]);
        pilihNasabahSpesifik(results[0]);
      } else {
        setHasilCariList(results);
      }
    } finally { setLoading(false); }
  };

  const pilihNasabahSpesifik = async (nasabah) => {
    setLoading(true);
    try {
      setNasabahAktif(nasabah);
      const riwayat = await getRiwayatTransaksi(nasabah.no_rekening);
      setRiwayatUser(riwayat || []);
    } finally { setLoading(false); }
  };

  const nasabahTarikSelected = daftarNasabah.find(n => n.id === formTarik.nasabahId);
  const totalEstimasi = (formSetor.berat_kg && formSetor.hargaCustom) ? parseFloat(formSetor.berat_kg) * parseFloat(formSetor.hargaCustom) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12 flex flex-col justify-between">
      <div>
        {/* HEADER NAVBAR */}
        <header className="bg-emerald-700 text-white shadow-lg sticky top-0 z-30 print:hidden">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-1 rounded-xl shadow-sm flex items-center justify-center w-12 h-12 overflow-hidden">
                <img src="/logo.jpg" alt="Logo BERSERI" className="w-full h-full object-contain" onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Logo"; }} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-wide">BANK SAMPAH "BERSERI"</h1>
                <p className="text-xs text-emerald-100 flex items-center gap-1"><Building2 className="w-3 h-3" /> RW.05 Kelurahan Tambakreja</p>
              </div>
            </div>

            <div className="bg-emerald-800/80 p-1 rounded-xl flex items-center shadow-inner gap-1">
              <button
                onClick={() => setActiveRole('user')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeRole === 'user' ? 'bg-white text-emerald-800 shadow-md' : 'text-emerald-100 hover:text-white'}`}
              >
                <UserCheck className="w-3.5 h-3.5" /> Cek Tabungan
              </button>

              <button
                onClick={() => setActiveRole('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeRole === 'admin' ? 'bg-white text-emerald-800 shadow-md' : 'text-emerald-100 hover:text-white'}`}
              >
                {currentRoleLoggedIn === 'superadmin' ? <Crown className="w-3.5 h-3.5 text-amber-500" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                {currentRoleLoggedIn === 'superadmin' ? 'Super Admin' : 'Admin'}
              </button>

              {currentRoleLoggedIn && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-200 bg-rose-900/40 hover:bg-rose-600 hover:text-white transition-all ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" /> Keluar
                </button>
              )}
            </div>
          </div>
        </header>

        {pesan.teks && (
          <div className="max-w-6xl mx-auto px-4 mt-4 print:hidden">
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium shadow-sm ${pesan.tipe === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'}`}>
              {pesan.tipe === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              {pesan.teks}
            </div>
          </div>
        )}

        <main className="max-w-6xl mx-auto px-4 mt-6">
          
          {/* ========================================================= */}
          {/* LOGIN FORM                                                */}
          {/* ========================================================= */}
          {activeRole === 'admin' && !currentRoleLoggedIn && (
            <div className="max-w-md mx-auto mt-8 print:hidden">
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-8 text-center relative">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Akses Pengurus</h2>
                <p className="text-xs text-slate-500 mb-6">Masukkan password pengurus untuk mengakses dashboard data tabungan.</p>
                
                <form onSubmit={handleLogin} className="space-y-4">
                  <input
                    type="password"
                    placeholder="Masukkan Password..."
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full p-3 border rounded-xl text-center font-bold tracking-widest focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition"
                  >
                    {loading ? 'Memeriksa...' : 'Masuk Dashboard'}
                  </button>
                </form>
                
                <button 
                  onClick={() => setLupaPasswordModal(true)} 
                  className="mt-5 text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center justify-center gap-1 mx-auto"
                >
                  <HelpCircle className="w-3.5 h-3.5" /> Lupa Password?
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* DASHBOARD ADMIN / SUPER ADMIN                             */}
          {/* ========================================================= */}
          {activeRole === 'admin' && currentRoleLoggedIn && (
            <div className="space-y-8">
              
              <div className="bg-white border rounded-xl p-3 flex flex-wrap justify-between items-center shadow-sm print:hidden gap-3">
                <div className="flex items-center gap-2">
                  {currentRoleLoggedIn === 'superadmin' ? (
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                      <Crown className="w-4 h-4 text-amber-600" /> Mode Super Admin Active
                    </span>
                  ) : (
                    <span className="bg-blue-100 text-blue-900 border border-blue-300 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-blue-600" /> Mode Admin Active
                    </span>
                  )}
                  <span className="text-xs text-slate-500">
                    {currentRoleLoggedIn === 'superadmin' ? 'Akses Penuh (Edit & Hapus)' : 'Hanya Input Baru'}
                  </span>
                </div>
                
                <button
                  onClick={() => setGantiPasswordModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border rounded-lg text-xs font-bold text-slate-700 transition"
                >
                  <Key className="w-3.5 h-3.5" /> Ganti Password Anda
                </button>
              </div>

              <div className="hidden print:block text-center mb-6 pb-4 border-b-2 border-slate-800">
                <h2 className="text-xl font-extrabold uppercase">LAPORAN BANK SAMPAH "BERSERI" RW.05</h2>
                <p className="text-sm font-semibold">KELURAHAN TAMBAKREJA, KECAMATAN CILACAP SELATAN</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-base mb-4 pb-2 border-b">
                      <img src="/logo.jpg" alt="Logo" className="w-6 h-6 object-contain rounded-full border" />
                      <h2>1. Setor Sampah</h2>
                    </div>
                    <form onSubmit={handleSetorSampah} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">PILIH NASABAH</label>
                        <select
                          value={formSetor.nasabahId}
                          onChange={(e) => setFormSetor({ ...formSetor, nasabahId: e.target.value })}
                          className="w-full p-2.5 border rounded-xl text-xs bg-slate-50"
                          required
                        >
                          <option value="">-- Pilih Nama / No. Rekening --</option>
                          {daftarNasabah.map((n) => <option key={n.id} value={n.id}>{n.no_rekening} - {n.nama} (RT {n.rt})</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">JENIS SAMPAH</label>
                        <select
                          value={formSetor.kategoriNama}
                          onChange={handlePilihKategori}
                          className="w-full p-2.5 border rounded-xl text-xs bg-slate-50"
                          required
                        >
                          <option value="">-- Pilih Jenis Sampah --</option>
                          {kategoriList.map((k) => <option key={k.id || k.nama} value={k.nama}>{k.nama} (Rp {k.harga.toLocaleString('id-ID')}/kg)</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">BERAT (KG)</label>
                          <input type="number" step="0.1" value={formSetor.berat_kg} onChange={(e) => setFormSetor({ ...formSetor, berat_kg: e.target.value })} className="w-full p-2.5 border rounded-xl text-xs bg-slate-50" required />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">HARGA/KG (RP)</label>
                          <input type="number" value={formSetor.hargaCustom} onChange={(e) => setFormSetor({ ...formSetor, hargaCustom: e.target.value })} className="w-full p-2.5 border rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50/50" required />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">TOTAL TAMBAHAN SALDO</label>
                        <div className="p-2.5 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 font-extrabold text-sm">+ Rp {totalEstimasi.toLocaleString('id-ID')}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">FOTO BUKTI TIMBANGAN</label>
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border rounded-xl cursor-pointer text-xs font-medium">
                            <ImageIcon className="w-3.5 h-3.5 text-blue-600" /><span>Galeri</span>
                            <input type="file" accept="image/*" onChange={handleFotoChange} className="hidden" />
                          </label>
                          <label className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border rounded-xl cursor-pointer text-xs font-medium">
                            <Camera className="w-3.5 h-3.5 text-emerald-600" /><span>Kamera</span>
                            <input type="file" accept="image/*" capture="environment" onChange={handleFotoChange} className="hidden" />
                          </label>
                          {previewFoto && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Siap</span>}
                        </div>
                      </div>
                      <button type="submit" disabled={loading} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition text-xs mt-2">
                        {loading ? 'Memproses...' : 'Simpan Transaksi Setoran'}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-rose-700 font-bold text-base mb-4 pb-2 border-b">
                      <Wallet className="w-5 h-5 text-rose-600" /><h2>2. Pengambilan Tabungan</h2>
                    </div>
                    <form onSubmit={handlePenarikanSaldo} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">PILIH NASABAH</label>
                        <select value={formTarik.nasabahId} onChange={(e) => setFormTarik({ ...formTarik, nasabahId: e.target.value })} className="w-full p-2.5 border rounded-xl text-xs bg-slate-50" required>
                          <option value="">-- Pilih Nama / No. Rekening --</option>
                          {daftarNasabah.map((n) => <option key={n.id} value={n.id}>{n.no_rekening} - {n.nama} (RT {n.rt})</option>)}
                        </select>
                      </div>
                      {nasabahTarikSelected && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                          <span className="text-[10px] text-amber-800 font-semibold block uppercase">Saldo Aktif Saat Ini</span>
                          <span className="text-lg font-black text-amber-900">Rp {(nasabahTarikSelected.saldo || 0).toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">NOMINAL PENARIKAN (RP)</label>
                        <input type="number" value={formTarik.jumlahPenarikan} onChange={(e) => setFormTarik({ ...formTarik, jumlahPenarikan: e.target.value })} className="w-full p-2.5 border rounded-xl text-xs font-bold text-rose-800 bg-rose-50/50" required />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">KETERANGAN / CATATAN</label>
                        <input type="text" value={formTarik.keterangan} onChange={(e) => setFormTarik({ ...formTarik, keterangan: e.target.value })} className="w-full p-2.5 border rounded-xl text-xs bg-slate-50" />
                      </div>
                      <button type="submit" disabled={loading} className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow transition text-xs mt-2">
                        {loading ? 'Memproses...' : 'Proses Penarikan Saldo'}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-base mb-4 pb-2 border-b">
                      <UserPlus className="w-5 h-5 text-emerald-600" /><h2>3. Pendaftaran Nasabah</h2>
                    </div>
                    <form onSubmit={handleTambahNasabah} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">NAMA LENGKAP WARGA</label>
                        <input type="text" value={formNasabah.nama} onChange={(e) => setFormNasabah({ ...formNasabah, nama: e.target.value })} className="w-full p-2.5 border rounded-xl text-xs bg-slate-50" required />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">RT (RW.05)</label>
                          <select value={formNasabah.rt} onChange={(e) => setFormNasabah({ ...formNasabah, rt: e.target.value })} className="w-full p-2.5 border rounded-xl text-xs bg-slate-50">
                            {Array.from({ length: 13 }, (_, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>RT {String(i + 1).padStart(2, '0')}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">NO. WHATSAPP / HP</label>
                          <input type="text" placeholder="0812xxxx" value={formNasabah.no_hp} onChange={(e) => setFormNasabah({ ...formNasabah, no_hp: e.target.value })} className="w-full p-2.5 border rounded-xl text-xs bg-slate-50" />
                        </div>
                      </div>
                      <button type="submit" disabled={loading} className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow transition text-xs mt-2">
                        {loading ? 'Mendaftarkan...' : 'Daftarkan Nasabah'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* MODUL KELOLA JENIS SAMPAH & HARGA ACUAN */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 print:hidden">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-lg mb-4 pb-2 border-b">
                  <Tag className="w-5 h-5" /><h2>Kelola Jenis Sampah & Harga Acuan</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1"><Plus className="w-4 h-4 text-emerald-600" />Tambah Barang Baru</h3>
                    <form onSubmit={handleTambahKategori} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">NAMA BARANG</label>
                        <input type="text" value={formKategori.nama} onChange={(e) => setFormKategori({ ...formKategori, nama: e.target.value })} className="w-full p-2 border rounded-lg text-xs bg-white" required />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">HARGA ACUAN (RP/KG)</label>
                        <input type="number" value={formKategori.harga} onChange={(e) => setFormKategori({ ...formKategori, harga: e.target.value })} className="w-full p-2 border rounded-lg text-xs bg-white" required />
                      </div>
                      <button type="submit" disabled={loading} className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow transition">+ Simpan Barang Baru</button>
                    </form>
                  </div>
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">Daftar Jenis Barang Terdaftar</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                      {kategoriList.map((k) => (
                        <div key={k.id || k.nama} className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center shadow-sm">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{k.nama}</p>
                            <p className="text-xs font-semibold text-emerald-700">Rp {Number(k.harga).toLocaleString('id-ID')} / kg</p>
                          </div>
                          {currentRoleLoggedIn === 'superadmin' && (
                            <div className="flex items-center gap-1">
                              <button onClick={() => setEditKategoriModal(k)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleHapusKategori(k.id, k.nama)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* LAPORAN PERIODIK & TABEL TRANSAKSI */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 print:border-none print:shadow-none print:p-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-lg"><FileText className="w-5 h-5 text-emerald-600 print:hidden" /><h2>Laporan Transaksi Periodik</h2></div>
                  <div className="flex flex-wrap items-center gap-3 print:hidden">
                    <div className="flex items-center gap-1 bg-slate-50 border p-1 rounded-xl text-xs">
                      <Calendar className="w-4 h-4 text-slate-400 ml-1" />
                      <input type="date" value={filterLaporan.dariTanggal} onChange={(e) => setFilterLaporan({ ...filterLaporan, dariTanggal: e.target.value })} className="p-1 bg-transparent border-none text-xs focus:outline-none" />
                      <span>s/d</span>
                      <input type="date" value={filterLaporan.sampaiTanggal} onChange={(e) => setFilterLaporan({ ...filterLaporan, sampaiTanggal: e.target.value })} className="p-1 bg-transparent border-none text-xs focus:outline-none" />
                    </div>
                    <button onClick={() => window.print()} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow flex items-center gap-2"><Printer className="w-4 h-4" /> Cetak PDF</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-xs text-emerald-800 font-semibold block">TOTAL BERAT SAMPAH</span><span className="text-xl font-extrabold text-emerald-900">{totalBeratFilter.toFixed(1)} kg</span>
                  </div>
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-xs text-emerald-800 font-semibold block">TOTAL PEMASUKAN TABUNGAN</span><span className="text-xl font-extrabold text-emerald-900">Rp {totalSetorFilter.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
                    <span className="text-xs text-rose-800 font-semibold block">TOTAL PENARIKAN SALDO</span><span className="text-xl font-extrabold text-rose-900">Rp {totalTarikFilter.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 print:bg-slate-200 border-b text-slate-600 uppercase">
                        <th className="p-2.5">Tanggal</th><th className="p-2.5">No. Rek</th><th className="p-2.5">Nama Warga</th>
                        <th className="p-2.5">Barang</th><th className="p-2.5">Berat</th><th className="p-2.5 text-right">Nominal (Rp)</th>
                        {currentRoleLoggedIn === 'superadmin' && <th className="p-2.5 text-center print:hidden">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {transaksiTerdfilter.map((t) => {
                        const isPenarikan = t.jenis_transaksi === 'penarikan' || (t.total_harga < 0);
                        return (
                          <tr key={t.id} className="hover:bg-slate-50">
                            <td className="p-2.5 text-slate-600">{t.tanggal?.seconds ? new Date(t.tanggal.seconds * 1000).toLocaleDateString('id-ID') : '-'}</td>
                            <td className="p-2.5 font-mono font-bold text-emerald-700">{t.no_rekening}</td>
                            <td className="p-2.5 font-medium text-slate-800">{t.nama_nasabah}</td>
                            <td className="p-2.5">{t.kategori_sampah}</td>
                            <td className="p-2.5 font-semibold text-slate-600">{isPenarikan ? '-' : `${t.berat_kg} kg`}</td>
                            <td className={`p-2.5 text-right font-bold ${isPenarikan ? 'text-rose-600' : 'text-emerald-700'}`}>
                              {isPenarikan ? '' : '+ '}Rp {(t.total_harga || 0).toLocaleString('id-ID')}
                            </td>
                            {currentRoleLoggedIn === 'superadmin' && (
                              <td className="p-2.5 text-center print:hidden">
                                <div className="flex justify-center items-center gap-1">
                                  <button onClick={() => setEditTransaksiModal(t)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => handleHapusTransaksi(t)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABEL DAFTAR NASABAH */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 print:hidden">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-lg"><Users className="w-5 h-5 text-emerald-600" /><h2>Daftar Nasabah Terdaftar</h2></div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold">Total: {daftarNasabah.length} Warga</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b text-xs text-slate-500 font-semibold uppercase">
                        <th className="p-3">No. Rekening</th><th className="p-3">Nama Nasabah</th><th className="p-3">Wilayah</th>
                        <th className="p-3">No. HP</th><th className="p-3">Total Sampah</th><th className="p-3 text-right">Saldo Tabungan</th>
                        {currentRoleLoggedIn === 'superadmin' && <th className="p-3 text-center">Aksi Superadmin</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {daftarNasabah.map((n) => (
                        <tr key={n.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-mono font-bold text-emerald-700">{n.no_rekening}</td>
                          <td className="p-3 font-medium text-slate-800">{n.nama}</td>
                          <td className="p-3 text-xs text-slate-500">RT {n.rt} / RW 05</td>
                          <td className="p-3 text-slate-600">{n.no_hp || '-'}</td>
                          <td className="p-3 font-semibold text-slate-700">{n.total_sampah_kg || 0} kg</td>
                          <td className="p-3 text-right font-bold text-emerald-600">Rp {(n.saldo || 0).toLocaleString('id-ID')}</td>
                          {currentRoleLoggedIn === 'superadmin' && (
                            <td className="p-3 text-center">
                              <div className="flex justify-center items-center gap-1">
                                <button onClick={() => setEditNasabahModal(n)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleHapusNasabah(n.id, n.nama)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* DASHBOARD USER / NASABAH                                  */}
          {/* ========================================================= */}
          {activeRole === 'user' && (
            <div className="space-y-6 max-w-4xl mx-auto print:hidden">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Cek Tabungan Sampah Anda</h2>
                <p className="text-xs text-slate-500 mb-6">Masukkan <strong>Nomor Rekening</strong> (Contoh: 05-001) atau <strong>Nama Anda</strong> untuk mengecek saldo.</p>
                <form onSubmit={handleCariNasabah} className="flex gap-2 max-w-md mx-auto">
                  <input type="text" placeholder="Ketik No. Rekening atau Nama..." value={keywordCari} onChange={(e) => setKeywordCari(e.target.value)} className="flex-1 p-3 border rounded-xl text-sm bg-slate-50" required />
                  <button type="submit" disabled={loading} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2 text-sm"><Search className="w-4 h-4" /> Cari</button>
                </form>
              </div>

              {hasilCariList.length > 1 && !nasabahAktif && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                  <h3 className="font-bold text-amber-900 text-base mb-1">Ditemukan {hasilCariList.length} Warga dengan Kunci "{keywordCari}"</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {hasilCariList.map((n) => (
                      <button key={n.id} onClick={() => pilihNasabahSpesifik(n)} className="p-4 bg-white border rounded-xl text-left transition flex justify-between items-center">
                        <div>
                          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">{n.no_rekening}</span>
                          <h4 className="font-bold text-slate-800 text-base mt-1">{n.nama}</h4>
                          <p className="text-xs text-slate-500">RT {n.rt} / RW 05</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {nasabahAktif && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 text-white rounded-2xl shadow-lg p-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <span className="text-xs font-mono bg-emerald-800/80 px-3 py-1 rounded-full text-emerald-200 border border-emerald-600">{nasabahAktif.no_rekening}</span>
                      <h3 className="text-2xl font-extrabold mt-2">{nasabahAktif.nama}</h3>
                      <p className="text-xs text-emerald-200 mt-1">RT {nasabahAktif.rt} / RW 05 - Kelurahan Tambakreja</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl text-right">
                      <span className="text-xs text-emerald-100 block">TOTAL SALDO TABUNGAN</span>
                      <span className="text-3xl font-black text-amber-300">Rp {(nasabahAktif.saldo || 0).toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-800 text-lg mb-4">Riwayat Transaksi Tabungan</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b text-xs text-slate-500 font-semibold uppercase">
                            <th className="p-3">Tanggal</th><th className="p-3">Keterangan</th><th className="p-3">Berat</th>
                            <th className="p-3">Nominal (Rp)</th><th className="p-3 text-center">Foto</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                          {riwayatUser.map((t) => {
                            const isPenarikan = t.jenis_transaksi === 'penarikan' || (t.total_harga < 0);
                            return (
                              <tr key={t.id} className="hover:bg-slate-50">
                                <td className="p-3 text-xs text-slate-500">{t.tanggal?.seconds ? new Date(t.tanggal.seconds * 1000).toLocaleDateString('id-ID') : '-'}</td>
                                <td className="p-3 font-medium text-slate-800">{t.kategori_sampah}</td>
                                <td className="p-3">{isPenarikan ? '-' : `${t.berat_kg} kg`}</td>
                                <td className={`p-3 font-bold ${isPenarikan ? 'text-rose-600' : 'text-emerald-600'}`}>
                                  {isPenarikan ? '' : '+ '}Rp {(t.total_harga || 0).toLocaleString('id-ID')}
                                </td>
                                <td className="p-3 text-center">
                                  {t.foto_bukti && (
                                    <button onClick={() => setModalFoto(t.foto_bukti)} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border rounded text-xs">Lihat Foto</button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* FOOTER */}
      <footer className="mt-16 bg-white border-t border-slate-200 py-8 print:hidden">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-bold text-slate-800 text-sm">Bank Sampah "BERSERI" RW.05</p>
            <p className="text-xs text-slate-500">Kelurahan Tambakreja, Kecamatan Cilacap Selatan</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://www.instagram.com/rw_05_tambakreja" target="_blank" rel="noreferrer" className="text-xs font-semibold text-slate-600 hover:text-emerald-700">Instagram @rw_05_tambakreja</a>
            <a href="https://www.tiktok.com/@rw_05_tambakreja" target="_blank" rel="noreferrer" className="text-xs font-semibold text-slate-600 hover:text-emerald-700">TikTok @rw_05_tambakreja</a>
          </div>
        </div>
      </footer>

      {/* ========================================================= */}
      {/* MODAL NOTIFIKASI WHATSAPP OTOMATIS SETELAH TRANSAKSI      */}
      {/* ========================================================= */}
      {whatsappModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-2xl text-center">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-lg mb-1">Transaksi Berhasil Disimpan!</h3>
            <p className="text-xs text-slate-500 mb-4">
              Kirimkan struk rincian transaksi & saldo terbaru ke nomor WhatsApp warga: <strong>{whatsappModal.nama}</strong>
            </p>

            <div className="p-3 bg-slate-50 border rounded-xl text-left text-xs font-mono text-slate-700 mb-4 whitespace-pre-line max-h-48 overflow-y-auto">
              {whatsappModal.pesan}
            </div>

            <div className="flex gap-2">
              <a
                href={`https://api.whatsapp.com/send?phone=${whatsappModal.no_hp.replace(/^0/, '62')}&text=${encodeURIComponent(whatsappModal.pesan)}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => setWhatsappModal(null)}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow flex items-center justify-center gap-2 transition"
              >
                <MessageSquare className="w-4 h-4" /> Kirim WhatsApp Sekarang
              </a>
              <button
                onClick={() => setWhatsappModal(null)}
                className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Lewati
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GANTI PASSWORD */}
      {gantiPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 relative shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Key className="w-5 h-5 text-emerald-600" /> Ganti Password</h3>
              <button onClick={() => {setGantiPasswordModal(false); setFormPassword({lama:'', baru:'', konfirmasi:''});}} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleGantiPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">PASSWORD LAMA</label>
                <input type="password" value={formPassword.lama} onChange={(e) => setFormPassword({ ...formPassword, lama: e.target.value })} className="w-full p-2.5 border rounded-xl text-xs bg-slate-50" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">PASSWORD BARU (MIN 6 KARAKTER)</label>
                <input type="password" value={formPassword.baru} onChange={(e) => setFormPassword({ ...formPassword, baru: e.target.value })} className="w-full p-2.5 border rounded-xl text-xs bg-slate-50" minLength="6" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">KONFIRMASI PASSWORD BARU</label>
                <input type="password" value={formPassword.konfirmasi} onChange={(e) => setFormPassword({ ...formPassword, konfirmasi: e.target.value })} className="w-full p-2.5 border rounded-xl text-xs bg-slate-50" minLength="6" required />
              </div>
              <button type="submit" disabled={loading} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow">
                {loading ? 'Memproses...' : 'Simpan Password Baru'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LUPA PASSWORD */}
      {lupaPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 relative shadow-2xl text-center">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-2">Lupa Password?</h3>
            <p className="text-sm text-slate-600 mb-6">
              Silakan hubungi <strong>Ketua RW.05</strong> atau <strong>IT Support Pengurus</strong> untuk meminta reset password Anda.
            </p>
            <button onClick={() => setLupaPasswordModal(false)} className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-sm transition">
              Mengerti, Tutup
            </button>
          </div>
        </div>
      )}

      {/* MODAL EDIT NASABAH */}
      {editNasabahModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Crown className="w-5 h-5 text-amber-500" /> Edit Data Nasabah</h3><button onClick={() => setEditNasabahModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSaveEditNasabah} className="space-y-4">
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">NO. REKENING</label><input type="text" value={editNasabahModal.no_rekening} disabled className="w-full p-2.5 bg-slate-100 border rounded-xl text-xs font-mono font-bold text-slate-500" /></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">NAMA NASABAH</label><input type="text" value={editNasabahModal.nama} onChange={(e) => setEditNasabahModal({ ...editNasabahModal, nama: e.target.value })} className="w-full p-2.5 border rounded-xl text-xs" required /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">RT</label>
                  <select value={editNasabahModal.rt} onChange={(e) => setEditNasabahModal({ ...editNasabahModal, rt: e.target.value })} className="w-full p-2.5 border rounded-xl text-xs">{Array.from({ length: 13 }, (_, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>RT {String(i + 1).padStart(2, '0')}</option>)}</select>
                </div>
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">NO. WHATSAPP</label><input type="text" value={editNasabahModal.no_hp || ''} onChange={(e) => setEditNasabahModal({ ...editNasabahModal, no_hp: e.target.value })} className="w-full p-2.5 border rounded-xl text-xs" /></div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow">Simpan Perubahan</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT KATEGORI */}
      {editKategoriModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 relative shadow-2xl">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Tag className="w-5 h-5 text-emerald-600" /> Edit Jenis Barang</h3><button onClick={() => setEditKategoriModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSaveEditKategori} className="space-y-4">
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">NAMA BARANG</label><input type="text" value={editKategoriModal.nama} onChange={(e) => setEditKategoriModal({ ...editKategoriModal, nama: e.target.value })} className="w-full p-2.5 border rounded-xl text-xs" required /></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">HARGA ACUAN (RP/KG)</label><input type="number" value={editKategoriModal.harga} onChange={(e) => setEditKategoriModal({ ...editKategoriModal, harga: e.target.value })} className="w-full p-2.5 border rounded-xl text-xs font-bold text-emerald-700" required /></div>
              <button type="submit" disabled={loading} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow">Update Harga</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT TRANSAKSI */}
      {editTransaksiModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Edit2 className="w-5 h-5 text-blue-600" /> Edit Transaksi</h3><button onClick={() => setEditTransaksiModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSaveEditTransaksi} className="space-y-4">
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">NASABAH</label><input type="text" value={`${editTransaksiModal.no_rekening} - ${editTransaksiModal.nama_nasabah}`} disabled className="w-full p-2.5 bg-slate-100 border rounded-xl text-xs font-bold text-slate-600" /></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">KATEGORI BARANG</label><input type="text" value={editTransaksiModal.kategori_sampah} onChange={(e) => setEditTransaksiModal({ ...editTransaksiModal, kategori_sampah: e.target.value })} className="w-full p-2.5 border rounded-xl text-xs" required /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">BERAT (KG)</label><input type="number" step="0.1" value={editTransaksiModal.berat_kg || 0} onChange={(e) => { const b = parseFloat(e.target.value) || 0; const h = parseFloat(editTransaksiModal.harga_per_kg) || 0; setEditTransaksiModal({ ...editTransaksiModal, berat_kg: b, total_harga: b * h }); }} className="w-full p-2.5 border rounded-xl text-xs" /></div>
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">HARGA / KG (RP)</label><input type="number" value={editTransaksiModal.harga_per_kg || 0} onChange={(e) => { const h = parseFloat(e.target.value) || 0; const b = parseFloat(editTransaksiModal.berat_kg) || 0; setEditTransaksiModal({ ...editTransaksiModal, harga_per_kg: h, total_harga: b * h }); }} className="w-full p-2.5 border rounded-xl text-xs" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">TOTAL NOMINAL TRANSAKSI (RP)</label><input type="number" value={editTransaksiModal.total_harga} onChange={(e) => setEditTransaksiModal({ ...editTransaksiModal, total_harga: parseFloat(e.target.value) || 0 })} className="w-full p-2.5 border rounded-xl text-xs font-extrabold text-emerald-800 bg-emerald-50" required /></div>
              <button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow">Simpan & Update Saldo Nasabah</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FOTO */}
      {modalFoto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 relative shadow-2xl">
            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Camera className="w-5 h-5 text-emerald-600" /> Bukti Timbangan</h4>
            <div className="rounded-xl overflow-hidden bg-slate-100 border max-h-96 flex items-center justify-center"><img src={modalFoto} alt="Bukti" className="max-h-96 w-full object-contain" /></div>
            <button onClick={() => setModalFoto(null)} className="mt-4 w-full py-2 bg-slate-800 text-white font-bold rounded-xl text-sm">Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
