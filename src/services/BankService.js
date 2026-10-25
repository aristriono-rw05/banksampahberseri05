// src/services/BankService.js
import { db } from "../firebase";
import { 
  collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, 
  query, where, serverTimestamp, runTransaction 
} from "firebase/firestore";

// --- TAMBAHAN BARU: FIREBASE AUTHENTICATION ---
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

// Inisialisasi Auth
const auth = getAuth();

// 1. Fungsi Login dengan Username (Trik Dummy Domain)
export const loginAdmin = async (username, password) => {
  try {
    // Jika ada '@' berarti email asli (untuk bos), jika tidak ada tambahkan dummy domain (untuk petugas)
    const formatEmail = username.includes('@') ? username : `${username}@berseri.local`;
    
    const userCredential = await signInWithEmailAndPassword(auth, formatEmail, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    let errorMessage = "Terjadi kesalahan saat login.";
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      errorMessage = "Username atau Password salah!";
    }
    return { success: false, error: errorMessage };
  }
};

// 2. Fungsi Logout
export const logoutAdmin = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// 3. Listener / Pemantau Status Sesi Login
export const subscribeAuth = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

// 4. Fungsi Buat Akun Petugas Baru & Simpan Riwayat
export const tambahAkunPetugas = async (username, password) => {
  try {
    // Otomatis ubah username jadi format email gaib
    const formatEmail = username.includes('@') ? username : `${username}@berseri.local`;
    const apiKey = auth.app.options.apiKey; 
    
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: formatEmail, password, returnSecureToken: false })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    // --- TAMBAHAN: Simpan ke Firestore agar Admin bisa lihat password ---
    await addDoc(collection(db, "akun_petugas"), {
      username: username,
      password: password, // Menyimpan password secara kasat mata
      createdAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// 5. Fungsi Mengambil Daftar Petugas dari Firestore
export const getDaftarPetugas = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "akun_petugas"));
    const list = [];
    querySnapshot.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() }));
    return list;
  } catch (error) { return []; }
};

// 6. Fungsi Menghapus Riwayat Akun Petugas (Hanya Hapus Tampilan)
export const hapusRiwayatPetugas = async (id) => {
  try {
    await deleteDoc(doc(db, "akun_petugas", id));
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
};
// --- AKHIR TAMBAHAN FIREBASE AUTHENTICATION ---


// =========================================================
// 1. PENGATURAN PASSWORD LAMA (TETAP DIPERTAHANKAN)
// =========================================================
export const getPasswords = async () => {
  try {
    const docRef = doc(db, "pengaturan", "auth_password");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return docSnap.data();
    else {
      const defaultData = { admin: "berseri05", superadmin: "berseri123" };
      await setDoc(docRef, defaultData);
      return defaultData;
    }
  } catch (error) { return { admin: "berseri05", superadmin: "berseri123" }; }
};

export const updatePassword = async (role, newPassword) => {
  try {
    const docRef = doc(db, "pengaturan", "auth_password");
    await updateDoc(docRef, { [role]: newPassword });
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
};


// =========================================================
// 2. MANAJEMEN DATA NASABAH (TIDAK ADA YANG DIKURANGI)
// =========================================================
export const tambahNasabah = async (data) => {
  try {
    const docRef = await addDoc(collection(db, "nasabah"), {
      no_rekening: data.no_rekening, nama: data.nama, rt: data.rt,
      no_hp: data.no_hp || "", saldo: data.saldo || 0, total_sampah_kg: 0, createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) { return { success: false, error: error.message }; }
};

export const getAllNasabah = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "nasabah"));
    const list = [];
    querySnapshot.forEach((docSnap) => { list.push({ id: docSnap.id, ...docSnap.data() }); });
    return list;
  } catch (error) { return []; }
};

export const cariNasabahMulti = async (keyword) => {
  try {
    const listAll = await getAllNasabah();
    const kw = keyword.trim().toLowerCase();
    return listAll.filter((n) => {
      const matchRekening = n.no_rekening && n.no_rekening.toLowerCase().includes(kw);
      const matchNama = n.nama && n.nama.toLowerCase().includes(kw);
      return matchRekening || matchNama;
    });
  } catch (error) { return []; }
};

export const updateNasabah = async (nasabahDocId, dataBaru) => {
  try {
    const nasabahRef = doc(db, "nasabah", nasabahDocId);
    // Hanya update kolom yang dikirim (agar saldo aman jika tidak dikirim)
    const payload = {};
    if(dataBaru.nama !== undefined) payload.nama = dataBaru.nama;
    if(dataBaru.rt !== undefined) payload.rt = dataBaru.rt;
    if(dataBaru.no_hp !== undefined) payload.no_hp = dataBaru.no_hp;
    if(dataBaru.saldo !== undefined) payload.saldo = dataBaru.saldo;
    
    await updateDoc(nasabahRef, payload);
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
};

export const hapusNasabah = async (nasabahDocId) => {
  try {
    const nasabahRef = doc(db, "nasabah", nasabahDocId);
    await deleteDoc(nasabahRef);
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
};


// =========================================================
// 3. MANAJEMEN TRANSAKSI (TIDAK ADA YANG DIKURANGI)
// =========================================================
export const inputSetorSampah = async (data) => {
  try {
    await addDoc(collection(db, "transaksi"), {
      nasabah_doc_id: data.nasabah_doc_id, no_rekening: data.no_rekening,
      nama_nasabah: data.nama_nasabah, kategori_sampah: data.kategori_sampah,
      jenis_transaksi: "setor", berat_kg: data.berat_kg, harga_per_kg: data.harga_per_kg,
      total_harga: data.total_harga, foto_bukti: data.foto_bukti || "", tanggal: serverTimestamp()
    });

    const nasabahRef = doc(db, "nasabah", data.nasabah_doc_id);
    const nasabahList = await getAllNasabah();
    const currentNasabah = nasabahList.find(n => n.id === data.nasabah_doc_id);

    if (currentNasabah) {
      await updateDoc(nasabahRef, {
        saldo: (currentNasabah.saldo || 0) + data.total_harga,
        total_sampah_kg: (currentNasabah.total_sampah_kg || 0) + data.berat_kg
      });
    }
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
};

export const inputPenarikanSaldo = async (data) => {
  try {
    const trxData = {
      nasabah_doc_id: data.nasabah_doc_id || "", no_rekening: data.no_rekening || "",
      nama_nasabah: data.nama_nasabah || "", jenis_transaksi: 'penarikan',
      kategori_sampah: data.keterangan || "Pengambilan Tabungan", berat_kg: 0,
      harga_per_kg: 0, total_harga: -(Math.abs(data.jumlah_penarikan || 0)), tanggal: new Date()
    };
    const trxRef = await addDoc(collection(db, 'transaksi'), trxData);

    if (data.nasabah_doc_id) {
      const nasabahRef = doc(db, 'nasabah', data.nasabah_doc_id);
      const nasabahSnap = await getDoc(nasabahRef);
      if (nasabahSnap.exists()) {
        const saldoSekarang = nasabahSnap.data().saldo || 0;
        const nominalTarik = Math.abs(data.jumlah_penarikan || 0);
        await updateDoc(nasabahRef, { saldo: saldoSekarang - nominalTarik });
      }
    }
    return { success: true, id: trxRef.id };
  } catch (error) { return { success: false, error: error.message }; }
};

export const getRiwayatTransaksi = async (no_rekening) => {
  try {
    const querySnapshot = await getDocs(collection(db, "transaksi"));
    const list = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.no_rekening === no_rekening) list.push({ id: docSnap.id, ...data });
    });
    list.sort((a, b) => (b.tanggal?.seconds || 0) - (a.tanggal?.seconds || 0));
    return list;
  } catch (error) { return []; }
};

export const getAllTransaksi = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "transaksi"));
    const list = [];
    querySnapshot.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() }));
    list.sort((a, b) => (b.tanggal?.seconds || 0) - (a.tanggal?.seconds || 0));
    return list;
  } catch (error) { return []; }
};

export const updateTransaksi = async (transaksiDocId, dataBaru) => {
  try {
    await runTransaction(db, async (transaction) => {
      const trxRef = doc(db, "transaksi", transaksiDocId);
      const trxSnap = await transaction.get(trxRef);
      if (!trxSnap.exists()) throw new Error("Transaksi tidak ditemukan!");

      const trxLama = trxSnap.data();
      const selisihHarga = Number(dataBaru.total_harga || 0) - Number(trxLama.total_harga || 0);
      const selisihBerat = Number(dataBaru.berat_kg || 0) - Number(trxLama.berat_kg || 0);

      let nasabahRef = null;
      if (trxLama.nasabah_doc_id) { nasabahRef = doc(db, "nasabah", trxLama.nasabah_doc_id); } 
      else if (trxLama.no_rekening) {
        const q = query(collection(db, "nasabah"), where("no_rekening", "==", trxLama.no_rekening));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) nasabahRef = qSnap.docs[0].ref;
      }

      if (nasabahRef) {
        const nasabahSnap = await transaction.get(nasabahRef);
        if (nasabahSnap.exists()) {
          transaction.update(nasabahRef, {
            saldo: Number(nasabahSnap.data().saldo || 0) + selisihHarga,
            total_sampah_kg: Math.max(0, Number(nasabahSnap.data().total_sampah_kg || 0) + selisihBerat)
          });
        }
      }

      transaction.update(trxRef, {
        kategori_sampah: dataBaru.kategori_sampah, berat_kg: Number(dataBaru.berat_kg || 0),
        harga_per_kg: Number(dataBaru.harga_per_kg || 0), total_harga: Number(dataBaru.total_harga || 0),
        keterangan: dataBaru.keterangan || ""
      });
    });
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
};

export const hapusTransaksi = async (transaksiDocId, nasabahDocIdAtauNoRek, totalHarga, beratKg) => {
  try {
    await runTransaction(db, async (transaction) => {
      const trxRef = doc(db, "transaksi", transaksiDocId);
      let nasabahRef = null;
      if (nasabahDocIdAtauNoRek) {
        const directRef = doc(db, "nasabah", nasabahDocIdAtauNoRek);
        const directSnap = await transaction.get(directRef);
        if (directSnap.exists()) { nasabahRef = directRef; } 
        else {
          const q = query(collection(db, "nasabah"), where("no_rekening", "==", nasabahDocIdAtauNoRek));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) nasabahRef = qSnap.docs[0].ref;
        }
      }

      if (nasabahRef) {
        const nasabahSnap = await transaction.get(nasabahRef);
        if (nasabahSnap.exists()) {
          transaction.update(nasabahRef, {
            saldo: Math.max(0, Number(nasabahSnap.data().saldo || 0) - Number(totalHarga || 0)),
            total_sampah_kg: Math.max(0, Number(nasabahSnap.data().total_sampah_kg || 0) - Number(beratKg || 0))
          });
        }
      }
      transaction.delete(trxRef);
    });
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
};


// =========================================================
// 4. MANAJEMEN JENIS SAMPAH / KATEGORI BARANG
// =========================================================
export const getKategoriSampah = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "kategori"));
    const list = [];
    querySnapshot.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() }));
    return list;
  } catch (error) { return []; }
};

export const tambahKategoriSampah = async (data) => {
  try {
    const docRef = await addDoc(collection(db, "kategori"), {
      nama: data.nama, harga: Number(data.harga), createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) { return { success: false, error: error.message }; }
};

export const updateKategoriSampah = async (kategoriId, dataBaru) => {
  try {
    const kategoriRef = doc(db, "kategori", kategoriId);
    await updateDoc(kategoriRef, { nama: dataBaru.nama, harga: Number(dataBaru.harga || 0) });
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
};

export const hapusKategoriSampah = async (kategoriId) => {
  try {
    const kategoriRef = doc(db, "kategori", kategoriId);
    await deleteDoc(kategoriRef);
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
};