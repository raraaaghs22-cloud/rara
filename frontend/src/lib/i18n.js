import { createContext, createElement, useContext, useState } from "react";

const DICT = {
  id: {
    navSubmit: "Kumpulkan Tugas",
    navResults: "Cek Nilai",
    overline: "Seni Musik · Kelas XI",
    project: "Musik di Sekitar Kita",
    projectPre: "Creative Video Project",
    intro: "Kumpulkan link video tugasmu dari TikTok, Instagram, Facebook, atau YouTube. Guru akan meninjau setiap kiriman.",
    req: ["Durasi 60–90 detik", "Format vertikal 9:16", "Jelaskan fungsi musik + contoh nyata", "Pakai subtitle", "#FungsiMusik & tag @Mr. Ocha"],
    namePh: "Contoh: Ayu Lestari",
    klassPh: "Pilih kelas",
    linkPh: "https://www.tiktok.com/@kamu/video/…",
    linkInvalid: "Link harus dari TikTok, Instagram, Facebook, atau YouTube.",
    detected: "Terdeteksi",
    submit: "Kirim Tugas",
    sending: "Mengirim…",
    fillAll: "Lengkapi semua kolom terlebih dahulu.",
    again: "Kirim link lain",
    formTitle: "Formulir Pengumpulan",
    formNote: "Tanpa login. Pastikan link dapat dibuka publik.",
    resultsTitle: "Cek Status & Nilai",
    resultsIntro: "Masukkan kelas dan nomor absen untuk melihat status pengumpulan dan nilai akhir yang sudah difinalkan guru.",
    search: "Cari",
    noResults: "Belum ada pengumpulan untuk kelas dan nomor absen ini.",
    disabled: "Halaman nilai belum dibuka oleh guru. Silakan cek kembali nanti.",
    submitted: "Terkumpul",
    finalScore: "Nilai Akhir",
    notPublished: "Belum difinalkan",
    submittedAt: "Dikirim",
  },
  en: {
    navSubmit: "Submit Assignment",
    navResults: "Check Grades",
    overline: "Music Arts · Grade XI",
    project: "Music Around Us",
    projectPre: "Creative Video Project",
    intro: "Submit your assignment video link from TikTok, Instagram, Facebook, or YouTube. Your teacher will review every submission.",
    req: ["60–90 seconds long", "Vertical 9:16 format", "Explain music's function + real examples", "Include subtitles", "#FungsiMusik & tag @Mr. Ocha"],
    namePh: "e.g. Ayu Lestari",
    klassPh: "Select class",
    linkPh: "https://www.tiktok.com/@you/video/…",
    linkInvalid: "Link must be from TikTok, Instagram, Facebook, or YouTube.",
    detected: "Detected",
    submit: "Submit Assignment",
    sending: "Submitting…",
    fillAll: "Please complete all fields first.",
    again: "Submit another link",
    formTitle: "Submission Form",
    formNote: "No login needed. Make sure the link is publicly viewable.",
    resultsTitle: "Check Status & Grades",
    resultsIntro: "Enter your class and attendance number to see your submission status and any final grade your teacher has finalized.",
    search: "Search",
    noResults: "No submissions found for this class and attendance number.",
    disabled: "The grades page has not been opened by the teacher yet. Please check back later.",
    submitted: "Submitted",
    finalScore: "Final Score",
    notPublished: "Not finalized yet",
    submittedAt: "Submitted",
  },
};

// Bilingual form labels (always shown in both languages)
export const BI = {
  name: ["Full Name", "Nama Lengkap"],
  klass: ["Class", "Kelas"],
  absen: ["Attendance Number", "Nomor Absen"],
  link: ["Assignment Video Link", "Link Video"],
};

export const SUCCESS_MSG = "Your video assignment link has been successfully submitted / Tugas link video Anda berhasil dikirimkan";

const LangCtx = createContext(null);

export const LangProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => localStorage.getItem("lang") || "id");
  const setLang = (l) => {
    localStorage.setItem("lang", l);
    setLangState(l);
  };
  return createElement(LangCtx.Provider, { value: { lang, setLang, t: DICT[lang] } }, children);
};

export const useLang = () => useContext(LangCtx);
