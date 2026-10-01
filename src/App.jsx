// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
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
  MessageSquare,
  FileSpreadsheet,
  ListOrdered,
  Filter,
  LayoutDashboard,
  ArrowDownLeft,
  ArrowUpRight
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

export default function App() {
  const [activeRole, setActiveRole] = useState('user');
  const [adminTab, setAdminTab] = useState('nasabah');

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

  // State Laporan Penjualan & Laba Rugi
  const [daftarPenjualan, setDaftarPenjualan] = useState(() => {
    const saved = localStorage.getItem('penjualanList');
    return saved ? JSON.parse(saved) : [];
  });
  const [formPenjualan, setFormPenjualan] = useState({ tanggal: '', pembeli: '', kategori: '', berat: '', totalUangMasuk: '' });

  // State Filter Menu Daftar Nasabah per RT
  const [filterRtNasabah, setFilterRtNasabah] = useState('semua');

  // State Modal
  const [editNasabahModal, setEditNasabahModal] = useState(null);
  const [editKategoriModal, setEditKategoriModal] = useState(null);
  const [editTransaksiModal, setEditTransaksiModal] = useState(null);
  const [modalFoto, setModalFoto] = useState(null);
  const [gantiPasswordModal, setGantiPasswordModal] = useState(false);
  const [lupaPasswordModal, setLupaPasswordModal] = useState(false);
  const [whatsappModal, setWhatsappModal] = useState(null); 
  
  // State Import Excel
  const [importModal, setImportModal] = useState(false);
  const [importText, setImportText] = useState("");

  // Form State
  const [formKategori, setFormKategori] = useState({ nama: '', harga: '' });
  const [formNasabah, setFormNasabah] = useState({ nama: '', rt: '01', no_hp: '' });
  
  // Form Setor & Tarik dengan Auto-Suggest
  const [formSetor, setFormSetor] = useState({ nasabahId: '', kategoriNama: '', hargaCustom: '', berat_kg: '', fotoBase64: '' });
  const [searchSetor, setSearchSetor] = useState('');
  const [showSuggestionsSetor, setShowSuggestionsSetor] = useState(false);

  const [formTarik, setFormTarik] = useState({ nasabahId: '', jumlahPenarikan: '', keterangan: '' });
  const [searchTarik, setSearchTarik] = useState('');
  const [showSuggestionsTarik, setShowSuggestionsTarik] = useState(false);

  const [previewFoto, setPreviewFoto] = useState('');
  
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

  // --- HANDLER IMPORT EXCEL (SUPERADMIN) ---
  const handleImportExcel = async (e) => {
    e.preventDefault();
    if (!importText.trim()) return tampilkanPesan('error', 'Kotak data masih kosong!');
    setLoading(true);
    try {
      const rows = importText.trim().split('\n');
      let imported = 0;
      const listNasabahSekarang = await getAllNasabah() || [];
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i].trim();
        if (!row) continue;
        
        const cols = row.split(/\t|,|;/);
        
        if (cols.length >= 3) {
          const no_rekening = cols[0] ? cols[0].trim() : '';
          const rt = cols[1] ? cols[1].trim() : '01';
          
          let nama = '';
          let saldoRaw = '';

          if (isNaN(cols[2])) {
            nama = cols[2].trim();
            saldoRaw = cols[3] ? cols[3] : '0';
          } else {
            nama = cols[1].trim();
            saldoRaw = cols[2] ? cols[2] : '0';
          }
          
          const cleanSaldoStr = String(saldoRaw).replace(/[^0-9,-]/g, "").replace(',', '.');
          const saldoAwal = parseFloat(cleanSaldoStr) || 0;
          
          if (no_rekening.toLowerCase().includes('no') || nama.toLowerCase().includes('nama')) continue;

          const existingNasabah = listNasabahSekarang.find(n => n.no_rekening === no_rekening);
          
          if (existingNasabah) {
            const totalSaldoBaru = (existingNasabah.saldo || 0) + saldoAwal;
            await updateNasabah(existingNasabah.id, { 
              nama: nama || existingNasabah.nama, 
              rt: rt || existingNasabah.rt, 
              saldo: totalSaldoBaru 
            });
          } else {
            await tambahNasabah({ 
              no_rekening, 
              rt, 
              nama, 
              saldo: saldoAwal, 
              no_hp: '',
              total_sampah_kg: 0 
            });

            if (saldoAwal > 0) {
              await inputSetorSampah({
                nasabah_doc_id: no_rekening,
                no_rekening: no_rekening,
                nama_nasabah: nama,
                kategori_sampah: 'Saldo Awal / Migrasi',
                berat_kg: 0,
                harga_per_kg: 0,
                total_harga: saldoAwal,
                foto_bukti: ''
              });
            }
          }
          imported++;
        }
      }
      
      tampilkanPesan('success', `${imported} Data Warga & Saldo Berhasil Di-Import!`);
      setImportModal(false);
      setImportText('');
      loadData();
    } catch (err) {
      console.error(err);
      tampilkanPesan('error', 'Format salah. Pastikan kolom: No. Rekening | RT | Nama | Saldo Awal.');
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER LABA RUGI & PENJUALAN ---
  const handleTambahPenjualan = (e) => {
    e.preventDefault();
    if (!formPenjualan.pembeli || !formPenjualan.totalUangMasuk) return tampilkanPesan('error', 'Wajib diisi!');
    
    const itemBaru = {
      id: Date.now().toString(),
      tanggal: formPenjualan.tanggal || new Date().toISOString().split('T')[0],
      pembeli: formPenjualan.pembeli,
      kategori: formPenjualan.kategori || 'Campur/Umum',
      berat: Number(formPenjualan.berat || 0),
      totalUangMasuk: Number(formPenjualan.totalUangMasuk)
    };

    const updatedList = [itemBaru, ...daftarPenjualan];
    setDaftarPenjualan(updatedList);
    localStorage.setItem('penjualanList', JSON.stringify(updatedList));

    tampilkanPesan('success', `Hasil penjualan Rp ${itemBaru.totalUangMasuk.toLocaleString('id-ID')} berhasil dicatat!`);
    setFormPenjualan({ tanggal: '', pembeli: '', kategori: '', berat: '', totalUangMasuk: '' });
  };

  const handleHapusPenjualan = (id) => {
    if (currentRoleLoggedIn !== 'superadmin') return tampilkanPesan('error', 'Akses ditolak! Hanya Super Admin.');
    if (window.confirm('Yakin ingin menghapus catatan penjualan ini?')) {
      const updatedList = daftarPenjualan.filter(p => p.id !== id);
      setDaftarPenjualan(updatedList);
      localStorage.setItem('penjualanList', JSON.stringify(updatedList));
      tampilkanPesan('success', 'Catatan penjualan dihapus.');
    }
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
      const res = await tambahNasabah({ no_rekening: autoNoRek, nama: formNasabah.nama, rt: formNasabah.rt, no_hp: formNasabah.no_hp, saldo: 0 });
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

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      
      reader.onloadend = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          
          setFormSetor(prev => ({ ...prev, fotoBase64: compressedBase64 }));
          setPreviewFoto(compressedBase64);
        };
      };
      
      reader.onerror = () => {
        tampilkanPesan('error', 'Gagal memproses atau membaca foto.');
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleSetorSampah = async (e) => {
    e.preventDefault();
    const nasabahSelected = daftarNasabah.find(n => n.id === formSetor.nasabahId);
    if (!nasabahSelected) return tampilkanPesan('error', 'Pilih nasabah yang valid dari daftar auto-suggest!');
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
        
        setWhatsappModal({
          no_hp: nasabahSelected.no_hp || '',
          nama: nasabahSelected.nama,
          no_rekening: nasabahSelected.no_rekening,
          pesan: `Halo *${nasabahSelected.nama}* (Rek: *${nasabahSelected.no_rekening}*),\n\nSetoran sampah berhasil dicatat di Bank Sampah BERSERI RW.05:\n- Jenis: ${formSetor.kategoriNama}\n- Berat: ${berat} kg\n- Penambahan Saldo: *+Rp ${totalHarga.toLocaleString('id-ID')}*\n- Total Saldo Anda Sekarang: *Rp ${saldoTerbaru.toLocaleString('id-ID')}*\n\nTerima kasih telah berpartisipasi menjaga lingkungan bersama kami! ♻️`
        });

        setFormSetor({ nasabahId: '', kategoriNama: '', hargaCustom: '', berat_kg: '', fotoBase64: '' });
        setSearchSetor('');
        setPreviewFoto('');
        loadData();
      }
    } finally { setLoading(false); }
  };

  const handlePenarikanSaldo = async (e) => {
    e.preventDefault();
    const nasabahSelected = daftarNasabah.find(n => n.id === formTarik.nasabahId);
    if (!nasabahSelected) return tampilkanPesan('error', 'Pilih nasabah yang valid dari daftar auto-suggest!');
    const nominal = parseFloat(formTarik.jumlahPenarikan);
    if (!nominal || nominal <= 0) return tampilkanPesan('error', 'Nominal tidak valid!');
    
    // Hitung saldo terkini secara akurat dari riwayat transaksi langsung agar valid
    const riwayatAktif = await getRiwayatTransaksi(nasabahSelected.no_rekening);
    const saldoAktifReal = (riwayatAktif || []).reduce((acc, t) => acc + (t.total_harga || 0), 0);

    if (nominal > saldoAktifReal) return tampilkanPesan('error', 'Saldo tidak cukup!');
    
    setLoading(true);
    try {
      const saldoTerbaru = saldoAktifReal - nominal;
      const res = await inputPenarikanSaldo({
        nasabah_doc_id: nasabahSelected.id,
        no_rekening: nasabahSelected.no_rekening,
        nama_nasabah: nasabahSelected.nama,
        jumlah_penarikan: nominal,
        keterangan: formTarik.keterangan
      });

      if (res.success) {
        tampilkanPesan('success', `Tarik Rp ${nominal.toLocaleString('id-ID')} berhasil!`);

        setWhatsappModal({
          no_hp: nasabahSelected.no_hp || '',
          nama: nasabahSelected.nama,
          no_rekening: nasabahSelected.no_rekening,
          pesan: `Halo *${nasabahSelected.nama}* (Rek: *${nasabahSelected.no_rekening}*),\n\nTelah dilakukan penarikan tabungan di Bank Sampah BERSERI RW.05:\n- Nominal Penarikan: *-Rp ${nominal.toLocaleString('id-ID')}*\n- Keterangan: ${formTarik.keterangan || 'Pengambilan Tabungan'}\n- Sisa Saldo Anda Sekarang: *Rp ${saldoTerbaru.toLocaleString('id-ID')}*\n\nTerima kasih.`
        });

        setFormTarik({ nasabahId: '', jumlahPenarikan: '', keterangan: '' });
        setSearchTarik('');
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

  // Kalkulasi Laba Rugi
  const totalOmsetPenjualan = daftarPenjualan.reduce((acc, p) => acc + p.totalUangMasuk, 0);
  const totalModalPembelianWarga = semuaTransaksi
    .filter(t => t.total_harga > 0 && t.jenis_transaksi !== 'penarikan')
    .reduce((acc, t) => acc + t.total_harga, 0);
  const labaBersih = totalOmsetPenjualan - totalModalPembelianWarga;

  // Filter Daftar Nasabah Berdasarkan RT yang dipilih
  const daftarNasabahTerdfilter = daftarNasabah.filter(n => {
    if (filterRtNasabah === 'semua') return true;
    return String(n.rt) === String(filterRtNasabah);
  });

  // Akumulasi Total Saldo Semua Nasabah berdasarkan riwayat transaksi langsung agar selalu akurat
  const totalSaldoSemuaNasabah = daftarNasabahTerdfilter.reduce((acc, n) => {
    const trxWarga = semuaTransaksi.filter(t => t.no_rekening === n.no_rekening);
    const saldoWargaReal = trxWarga.reduce((sum, t) => sum + (t.total_harga || 0), 0);
    return acc + Math.max(saldoWargaReal, n.saldo || 0);
  }, 0);

  // Auto-Suggest List Filtering
  const filteredNasabahSetor = searchSetor.trim() === '' ? [] : daftarNasabah.filter(n => 
    n.nama.toLowerCase().includes(searchSetor.toLowerCase()) || 
    n.no_rekening.toLowerCase().includes(searchSetor.toLowerCase())
  );

  const filteredNasabahTarik = searchTarik.trim() === '' ? [] : daftarNasabah.filter(n => 
    n.nama.toLowerCase().includes(searchTarik.toLowerCase()) || 
    n.no_rekening.toLowerCase().includes(searchTarik.toLowerCase())
  );

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

  // Hitung total saldo real secara dinamis dari riwayat user yang sedang aktif
  const saldoTotalRealAktif = riwayatUser.reduce((acc, t) => acc + (t.total_harga || 0), 0);
  const finalSaldoNasabahAktif = Math.max(saldoTotalRealAktif, nasabahAktif?.saldo || 0);

  const nasabahTarikSelected = daftarNasabah.find(n => n.id === formTarik.nasabahId);
  const totalEstimasi = (formSetor.berat_kg && formSetor.hargaCustom) ? parseFloat(formSetor.berat_kg) * parseFloat(formSetor.hargaCustom) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12 flex flex-col justify-between">
      <div>
        {/* HEADER NAVBAR */}
        <header className="bg-emerald-700 text-white shadow-lg sticky top-0 z-30 print:hidden">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full overflow-hidden shadow-md border-2 border-emerald-500/50 flex items-center justify-center bg-emerald-800">
                <img 
                  src="/logo.jpg" 
                  alt="Logo BERSERI" 
                  className="w-full h-full object-cover scale-110" 
                  onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=logo.jpg"; }} 
                />
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
          
          {/* LOGIN FORM */}
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

          {/* DASHBOARD ADMIN / SUPER ADMIN DENGAN 5 HALAMAN TERPISAH */}
          {activeRole === 'admin' && currentRoleLoggedIn && (
            <div className="space-y-6">
              
              {/* HEADER INFO & GANTI PASSWORD */}
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

              {/* TOMBOL NAVIGASI / TAB HALAMAN ADMIN */}
              <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-2 print:hidden">
                <button
                  onClick={() => setAdminTab('nasabah')}
                  className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${adminTab === 'nasabah' ? 'bg-emerald-700 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  <ListOrdered className="w-4 h-4" /> 1. Daftar Nasabah
                </button>
                <button
                  onClick={() => setAdminTab('penjualan')}
                  className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${adminTab === 'penjualan' ? 'bg-emerald-700 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  <Wallet className="w-4 h-4" /> 2. Penjualan & Laba Rugi
                </button>
                <button
                  onClick={() => setAdminTab('transaksi')}
                  className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${adminTab === 'transaksi' ? 'bg-emerald-700 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  <UserPlus className="w-4 h-4" /> 3. Transaksi Warga
                </button>
                <button
                  onClick={() => setAdminTab('kategori')}
                  className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${adminTab === 'kategori' ? 'bg-emerald-700 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  <Tag className="w-4 h-4" /> 4. Jenis Sampah & Harga
                </button>
                <button
                  onClick={() => setAdminTab('laporan')}
                  className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${adminTab === 'laporan' ? 'bg-emerald-700 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  <FileText className="w-4 h-4" /> 5. Laporan Periodik
                </button>
              </div>

              <div className="hidden print:block text-center mb-6 pb-4 border-b-2 border-slate-800">
                <h2 className="text-xl font-extrabold uppercase">LAPORAN BANK SAMPAH "BERSERI" RW.05</h2>
                <p className="text-sm font-semibold">KELURAHAN TAMBAKREJA, KECAMATAN CILACAP SELATAN</p>
              </div>

              {/* ========================================================= */}
              {/* HALAMAN 1: DAFTAR NASABAH & SALDO                         */}
              {/* ========================================================= */}
              {adminTab === 'nasabah' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 print:shadow-none print:border-none print:p-0">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                      <ListOrdered className="w-5 h-5 text-emerald-600 print:hidden" />
                      <h2>Daftar Nasabah & Saldo Tabungan</h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 print:hidden">
                      <div className="flex items-center gap-2 bg-slate-50 border px-3 py-1.5 rounded-xl text-xs">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-600">Filter RT:</span>
                        <select 
                          value={filterRtNasabah} 
                          onChange={(e) => setFilterRtNasabah(e.target.value)}
                          className="bg-transparent font-bold text-emerald-700 focus:outline-none"
                        >
                          <option value="semua">Seluruh RT (RW 05)</option>
                          {Array.from({ length: 13 }, (_, i) => (
                            <option key={i} value={String(i + 1).padStart(2, '0')}>
                              RT {String(i + 1).padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button onClick={() => window.print()} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow flex items-center gap-2">
                        <Printer className="w-4 h-4" /> Cetak Daftar
                      </button>

                      {currentRoleLoggedIn === 'superadmin' && (
                        <button 
                          onClick={() => setImportModal(true)} 
                          className="px-3.5 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                        >
                          <FileSpreadsheet className="w-4 h-4" /> Import Excel
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="text-xs text-emerald-800 font-semibold block uppercase">Total Warga Terdaftar</span>
                        <span className="text-2xl font-extrabold text-emerald-900">{daftarNasabahTerdfilter.length} Orang</span>
                      </div>
                      <Users className="w-8 h-8 text-emerald-600/50" />
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="text-xs text-blue-800 font-semibold block uppercase">Total Saldo Tabungan ({filterRtNasabah === 'semua' ? 'Seluruh RT' : `RT ${filterRtNasabah}`})</span>
                        <span className="text-2xl font-extrabold text-blue-900">Rp {totalSaldoSemuaNasabah.toLocaleString('id-ID')}</span>
                      </div>
                      <Wallet className="w-8 h-8 text-blue-600/50" />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 print:bg-slate-200 border-b text-xs text-slate-500 font-semibold uppercase">
                          <th className="p-3">No. Rekening</th>
                          <th className="p-3">Nama Lengkap Warga</th>
                          <th className="p-3">Wilayah RT</th>
                          <th className="p-3">No. HP / WhatsApp</th>
                          <th className="p-3">Total Sampah</th>
                          <th className="p-3 text-right">Saldo Tabungan</th>
                          {currentRoleLoggedIn === 'superadmin' && <th className="p-3 text-center print:hidden">Aksi</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y text-sm">
                        {daftarNasabahTerdfilter.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="p-6 text-center text-slate-400">Tidak ada data nasabah untuk filter ini.</td>
                          </tr>
                        ) : (
                          daftarNasabahTerdfilter.map((n) => {
                            // Hitung saldo real dari transaksi agar tabel selalu menampilkan saldo terakumulasi akurat
                            const trxListWarga = semuaTransaksi.filter(t => t.no_rekening === n.no_rekening);
                            const realSaldo = trxListWarga.reduce((sum, t) => sum + (t.total_harga || 0), 0);
                            const finalSaldo = Math.max(realSaldo, n.saldo || 0);

                            return (
                              <tr key={n.id} className="hover:bg-slate-50 transition">
                                <td className="p-3 font-mono font-bold text-emerald-700">{n.no_rekening}</td>
                                <td className="p-3 font-medium text-slate-800">{n.nama}</td>
                                <td className="p-3 text-xs text-slate-600 font-semibold">RT {n.rt}</td>
                                <td className="p-3 text-slate-600 text-xs">{n.no_hp || '-'}</td>
                                <td className="p-3 font-semibold text-slate-700 text-xs">{n.total_sampah_kg || 0} kg</td>
                                <td className="p-3 text-right font-bold text-emerald-700">Rp {finalSaldo.toLocaleString('id-ID')}</td>
                                {currentRoleLoggedIn === 'superadmin' && (
                                  <td className="p-3 text-center print:hidden">
                                    <div className="flex justify-center items-center gap-1">
                                      <button onClick={() => setEditNasabahModal(n)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                      <button onClick={() => handleHapusNasabah(n.id, n.nama)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* HALAMAN 2: KELOLA HASIL PENJUALAN & LAPORAN LABA RUGI     */}
              {/* ========================================================= */}
              {adminTab === 'penjualan' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-lg mb-4 pb-2 border-b">
                    <Wallet className="w-5 h-5" />
                    <h2>Kelola Hasil Penjualan & Laporan Laba Rugi</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <span className="text-xs text-blue-800 font-semibold block">TOTAL OMSET PENJUALAN (KE PENGEPUL)</span>
                      <span className="text-xl font-extrabold text-blue-900">Rp {totalOmsetPenjualan.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <span className="text-xs text-amber-800 font-semibold block">TOTAL MODAL BELI SAMPAH (DARI WARGA)</span>
                      <span className="text-xl font-extrabold text-amber-900">Rp {totalModalPembelianWarga.toLocaleString('id-ID')}</span>
                    </div>
                    <div className={`p-4 border rounded-xl ${labaBersih >= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                      <span className="text-xs font-semibold block">ESTIMASI LABA BERSIH (MARGIN)</span>
                      <span className="text-xl font-extrabold">Rp {labaBersih.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1">
                        <Plus className="w-4 h-4 text-emerald-600" /> Catat Penjualan ke Pengepul
                      </h3>
                      <form onSubmit={handleTambahPenjualan} className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">TANGGAL</label>
                          <input type="date" value={formPenjualan.tanggal} onChange={(e) => setFormPenjualan({ ...formPenjualan, tanggal: e.target.value })} className="w-full p-2 border rounded-lg text-xs bg-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">NAMA PEMBELI / PENGEPUL</label>
                          <input type="text" placeholder="Contoh: Pengepul UD Berkah" value={formPenjualan.pembeli} onChange={(e) => setFormPenjualan({ ...formPenjualan, pembeli: e.target.value })} className="w-full p-2 border rounded-lg text-xs bg-white" required />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">BERAT (KG)</label>
                            <input type="number" step="0.1" placeholder="100" value={formPenjualan.berat} onChange={(e) => setFormPenjualan({ ...formPenjualan, berat: e.target.value })} className="w-full p-2 border rounded-lg text-xs bg-white" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">KATEGORI</label>
                            <input type="text" placeholder="Plastik / Kertas" value={formPenjualan.kategori} onChange={(e) => setFormPenjualan({ ...formPenjualan, kategori: e.target.value })} className="w-full p-2 border rounded-lg text-xs bg-white" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">TOTAL UANG MASUK (RP)</label>
                          <input type="number" placeholder="500000" value={formPenjualan.totalUangMasuk} onChange={(e) => setFormPenjualan({ ...formPenjualan, totalUangMasuk: e.target.value })} className="w-full p-2 border rounded-lg text-xs font-bold text-emerald-700 bg-white" required />
                        </div>
                        <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow transition">
                          + Simpan Hasil Penjualan
                        </button>
                      </form>
                    </div>

                    <div className="md:col-span-2">
                      <h3 className="text-sm font-bold text-slate-700 mb-3">Riwayat Penjualan ke Pengepul</h3>
                      <div className="overflow-x-auto max-h-96 overflow-y-auto border rounded-xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-100 border-b text-slate-600 uppercase">
                              <th className="p-2.5">Tanggal</th>
                              <th className="p-2.5">Pengepul</th>
                              <th className="p-2.5">Kategori & Berat</th>
                              <th className="p-2.5 text-right">Uang Masuk</th>
                              {currentRoleLoggedIn === 'superadmin' && <th className="p-2.5 text-center">Aksi</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {daftarPenjualan.length === 0 ? (
                              <tr>
                                <td colSpan="5" className="p-6 text-center text-slate-400">Belum ada data penjualan tercatat.</td>
                              </tr>
                            ) : (
                              daftarPenjualan.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50">
                                  <td className="p-2.5 text-slate-600">{p.tanggal}</td>
                                  <td className="p-2.5 font-bold text-slate-800">{p.pembeli}</td>
                                  <td className="p-2.5">{p.kategori} ({p.berat} kg)</td>
                                  <td className="p-2.5 text-right font-bold text-emerald-700">+ Rp {p.totalUangMasuk.toLocaleString('id-ID')}</td>
                                  {currentRoleLoggedIn === 'superadmin' && (
                                    <td className="p-2.5 text-center">
                                      <button onClick={() => handleHapusPenjualan(p.id)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* HALAMAN 3: TRANSAKSI (SETOR, TARIK, PENDAFTARAN)          */}
              {/* ========================================================= */}
              {adminTab === 'transaksi' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Setor Sampah */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between relative">
                    <div>
                      <div className="flex items-center gap-2 text-emerald-700 font-bold text-base mb-4 pb-2 border-b">
                        <img 
                          src="/logo.jpg" 
                          alt="Logo" 
                          className="w-6 h-6 rounded-full object-cover border border-emerald-300 shadow-sm" 
                          onError={(e) => { e.target.style.display = 'none'; }} 
                        />
                        <h2>Setor Sampah</h2>
                      </div>
                      <form onSubmit={handleSetorSampah} className="space-y-3">
                        
                        {/* Auto-Suggest Input Nasabah */}
                        <div className="relative">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">CARI NASABAH (NAMA / NO. REK)</label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Ketik Nama / No Rekening..."
                              value={searchSetor}
                              onChange={(e) => {
                                setSearchSetor(e.target.value);
                                setShowSuggestionsSetor(true);
                                if (!e.target.value) setFormSetor(prev => ({ ...prev, nasabahId: '' }));
                              }}
                              onFocus={() => setShowSuggestionsSetor(true)}
                              className="w-full p-2.5 pl-8 border rounded-xl text-xs bg-slate-50 font-medium"
                              required
                            />
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                          </div>

                          {/* Dropdown Suggestions */}
                          {showSuggestionsSetor && filteredNasabahSetor.length > 0 && (
                            <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                              {filteredNasabahSetor.map((n) => (
                                <div
                                  key={n.id}
                                  onClick={() => {
                                    setFormSetor(prev => ({ ...prev, nasabahId: n.id }));
                                    setSearchSetor(`${n.no_rekening} - ${n.nama} (RT ${n.rt})`);
                                    setShowSuggestionsSetor(false);
                                  }}
                                  className="p-2.5 hover:bg-emerald-50 cursor-pointer text-xs border-b last:border-none flex justify-between items-center"
                                >
                                  <div>
                                    <span className="font-bold text-emerald-700">{n.no_rekening}</span> - <span className="font-semibold text-slate-800">{n.nama}</span>
                                    <p className="text-[10px] text-slate-500">RT {n.rt} | Saldo: Rp {(n.saldo || 0).toLocaleString('id-ID')}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
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
                          </div>
                          
                          {previewFoto && (
                            <div className="mt-3 relative w-32 h-32 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-md">
                              <img src={previewFoto} alt="Preview Bukti" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => { setPreviewFoto(''); setFormSetor(prev => ({ ...prev, fotoBase64: '' })); }}
                                className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-md shadow-sm"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition text-xs mt-2">
                          {loading ? 'Memproses...' : 'Simpan Transaksi Setoran'}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Pengambilan Tabungan */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between relative">
                    <div>
                      <div className="flex items-center gap-2 text-rose-700 font-bold text-base mb-4 pb-2 border-b">
                        <Wallet className="w-5 h-5 text-rose-600" /><h2>Pengambilan Tabungan</h2>
                      </div>
                      <form onSubmit={handlePenarikanSaldo} className="space-y-3">
                        
                        {/* Auto-Suggest Input Nasabah */}
                        <div className="relative">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">CARI NASABAH (NAMA / NO. REK)</label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Ketik Nama / No Rekening..."
                              value={searchTarik}
                              onChange={(e) => {
                                setSearchTarik(e.target.value);
                                setShowSuggestionsTarik(true);
                                if (!e.target.value) setFormTarik(prev => ({ ...prev, nasabahId: '' }));
                              }}
                              onFocus={() => setShowSuggestionsTarik(true)}
                              className="w-full p-2.5 pl-8 border rounded-xl text-xs bg-slate-50 font-medium"
                              required
                            />
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                          </div>

                          {/* Dropdown Suggestions */}
                          {showSuggestionsTarik && filteredNasabahTarik.length > 0 && (
                            <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                              {filteredNasabahTarik.map((n) => (
                                <div
                                  key={n.id}
                                  onClick={() => {
                                    setFormTarik(prev => ({ ...prev, nasabahId: n.id }));
                                    setSearchTarik(`${n.no_rekening} - ${n.nama} (RT ${n.rt})`);
                                    setShowSuggestionsTarik(false);
                                  }}
                                  className="p-2.5 hover:bg-rose-50 cursor-pointer text-xs border-b last:border-none flex justify-between items-center"
                                >
                                  <div>
                                    <span className="font-bold text-rose-700">{n.no_rekening}</span> - <span className="font-semibold text-slate-800">{n.nama}</span>
                                    <p className="text-[10px] text-slate-500">RT {n.rt} | Saldo: Rp {(n.saldo || 0).toLocaleString('id-ID')}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
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

                  {/* Pendaftaran Nasabah */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-slate-800 font-bold text-base mb-4 pb-2 border-b">
                        <UserPlus className="w-5 h-5 text-emerald-600" /><h2>Pendaftaran Nasabah Baru</h2>
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
              )}

              {/* ========================================================= */}
              {/* HALAMAN 4: KELOLA JENIS SAMPAH & HARGA ACUAN              */}
              {/* ========================================================= */}
              {adminTab === 'kategori' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
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
              )}

              {/* ========================================================= */}
              {/* HALAMAN 5: LAPORAN TRANSAKSI PERIODIK                     */}
              {/* ========================================================= */}
              {adminTab === 'laporan' && (
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
              )}

            </div>
          )}

          {/* DASHBOARD USER / NASABAH */}
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
                      <span className="text-3xl font-black text-amber-300">Rp {finalSaldoNasabahAktif.toLocaleString('id-ID')}</span>
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
      <footer className="mt-16 bg-white border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <p className="font-bold text-slate-800 text-sm">BANK SAMPAH "BERSERI" RW.05</p>
            <p className="text-xs text-slate-500 mt-0.5">Kelurahan Tambakreja, Kecamatan Cilacap Selatan, Kabupaten Cilacap</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 justify-center md:justify-end">
            <a 
              href="https://www.instagram.com/rw_05_tambakreja" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 hover:opacity-90 text-white font-bold rounded-xl transition shadow-md group"
            >
              <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span className="text-xs font-semibold">@rw_05_tambakreja</span>
              <ExternalLink className="w-3 h-3 text-white/70 group-hover:text-white" />
            </a>

            <a 
              href="https://www.tiktok.com/@rw_05_tambakreja" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-900 border border-gray-800 text-white font-bold rounded-xl transition shadow-md group"
            >
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/3/34/Ionicons_logo-tiktok.svg" 
                alt="TikTok Logo" 
                className="w-5 h-5 shrink-0 brightness-0 invert" 
              />
              <span className="text-xs font-semibold">@rw_05_tambakreja</span>
              <ExternalLink className="w-3 h-3 text-white/70 group-hover:text-white" />
            </a>
          </div>
        </div>
      </footer>

      {/* MODAL IMPORT EXCEL */}
      {importModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 relative shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" /> Import Data Warga
              </h3>
              <button onClick={() => setImportModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl mb-4 text-xs text-blue-800 text-left">
              <strong>Cara Import (Copy-Paste):</strong> Buka Microsoft Excel Anda, blok dan <i>copy</i> (Ctrl+C) data Anda dengan urutan 4 kolom: <b>No. Rekening, RT, Nama, Saldo Awal</b>. Lalu tempel (Ctrl+V) ke dalam kotak teks di bawah ini.
            </div>
            <form onSubmit={handleImportExcel}>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={`05-001\t01\tBudi Santoso\t50000\n05-002\t02\tSiti Aminah\t25000`}
                className="w-full h-48 p-3 border rounded-xl text-xs font-mono whitespace-pre overflow-x-auto bg-slate-50 focus:ring-2 focus:ring-blue-500 text-left"
                required
              ></textarea>
              <button type="submit" disabled={loading} className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition">
                {loading ? 'Memproses Data...' : 'Mulai Import Data'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOTIFIKASI WHATSAPP OTOMATIS */}
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

      {/* MODAL FOTO BUKTI TIMBANGAN */}
      {modalFoto !== null && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative shadow-2xl text-center">
            <h4 className="font-bold text-slate-800 mb-3 flex items-center justify-center gap-2 text-base">
              <Camera className="w-5 h-5 text-emerald-600" /> Bukti Timbangan
            </h4>
            
            {modalFoto && modalFoto.startsWith('data:image') ? (
              <div className="rounded-xl overflow-hidden bg-slate-100 border max-h-96 flex items-center justify-center p-2">
                <img 
                  src={modalFoto} 
                  alt="Bukti Penimbangan" 
                  className="max-h-96 w-full object-contain rounded-lg" 
                  onError={(e) => {
                    console.error("Gagal merender gambar Base64:", modalFoto.substring(0, 50));
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium">
                ⚠️ Data foto tidak valid atau kosong di database (Format Base64 tidak ditemukan). 
                <br/><span className="text-[10px] text-slate-500 mt-1 block">Nilai data: {String(modalFoto).substring(0, 40)}...</span>
              </div>
            )}

            <button
              onClick={() => setModalFoto(null)}
              className="mt-5 w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition shadow"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}