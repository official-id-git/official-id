export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: "online" | "offline";
  status: "upcoming" | "past";
  location?: string;
  googleMapUrl?: string;
  zoomLink?: string;
  maxParticipants: number;
  registeredCount: number;
  image: string;
  category: string;
}

export interface Participant {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  registrationDate: string;
  status: "confirmed" | "pending" | "cancelled";
  certificateIssued: boolean;
}

export interface FormField {
  id: string;
  label: string;
  type: "text" | "email" | "phone" | "select" | "textarea";
  required: boolean;
  options?: string[];
}

export interface Certificate {
  id: string;
  eventId: string;
  templateName: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
}

export const mockEvents: Event[] = [
  {
    id: "1",
    title: "Workshop Digital Marketing 2026",
    description: "Pelajari strategi digital marketing terkini untuk mengembangkan bisnis Anda di era digital.",
    date: "2026-03-15",
    time: "09:00",
    type: "online",
    status: "upcoming",
    zoomLink: "https://zoom.us/j/123456789",
    maxParticipants: 100,
    registeredCount: 67,
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop",
    category: "Workshop",
  },
  {
    id: "2",
    title: "Seminar Kepemimpinan Muda",
    description: "Mengembangkan jiwa kepemimpinan untuk generasi muda Indonesia.",
    date: "2026-03-20",
    time: "13:00",
    type: "offline",
    status: "upcoming",
    location: "Gedung Serbaguna, Jakarta Pusat",
    googleMapUrl: "https://maps.google.com/?q=-6.200000,106.816666",
    maxParticipants: 200,
    registeredCount: 145,
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop",
    category: "Seminar",
  },
  {
    id: "3",
    title: "Pelatihan Web Development",
    description: "Belajar membuat website modern dengan React dan Tailwind CSS.",
    date: "2026-02-10",
    time: "10:00",
    type: "online",
    status: "past",
    zoomLink: "https://zoom.us/j/987654321",
    maxParticipants: 150,
    registeredCount: 150,
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop",
    category: "Pelatihan",
  },
  {
    id: "4",
    title: "Talkshow Kewirausahaan",
    description: "Berbagi pengalaman membangun startup dari nol bersama founder sukses.",
    date: "2026-02-05",
    time: "14:00",
    type: "offline",
    status: "past",
    location: "Auditorium Universitas Indonesia",
    googleMapUrl: "https://maps.google.com/?q=-6.362000,106.828000",
    maxParticipants: 300,
    registeredCount: 280,
    image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=400&fit=crop",
    category: "Talkshow",
  },
];

export const mockParticipants: Participant[] = [
  {
    id: "1",
    eventId: "1",
    name: "Budi Santoso",
    email: "budi.santoso@email.com",
    phone: "081234567890",
    registrationDate: "2026-02-28",
    status: "confirmed",
    certificateIssued: false,
  },
  {
    id: "2",
    eventId: "1",
    name: "Ani Wijaya",
    email: "ani.wijaya@email.com",
    phone: "081234567891",
    registrationDate: "2026-02-27",
    status: "confirmed",
    certificateIssued: false,
  },
  {
    id: "3",
    eventId: "1",
    name: "Citra Dewi",
    email: "citra.dewi@email.com",
    phone: "081234567892",
    registrationDate: "2026-02-26",
    status: "pending",
    certificateIssued: false,
  },
];

export const defaultFormFields: FormField[] = [
  { id: "1", label: "Nama Lengkap", type: "text", required: true },
  { id: "2", label: "Email", type: "email", required: true },
  { id: "3", label: "Nomor Telepon", type: "phone", required: true },
  { id: "4", label: "Institusi/Perusahaan", type: "text", required: false },
];

export const mockCertificates: Certificate[] = [
  {
    id: "1",
    eventId: "3",
    templateName: "Template Modern",
    backgroundColor: "#1e3a8a",
    textColor: "#ffffff",
    fontFamily: "serif",
  },
  {
    id: "2",
    eventId: "4",
    templateName: "Template Klasik",
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    fontFamily: "sans-serif",
  },
];
