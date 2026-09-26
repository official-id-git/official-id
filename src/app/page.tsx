import { ShieldCheck, Database, Cloud, Layers, Terminal, Sparkles, CheckCircle2 } from "lucide-react";

export default function Home() {
  const stackItems = [
    {
      name: "Next.js 16 (App Router)",
      desc: "React 19, Server Components & TypeScript",
      icon: Layers,
      status: "Ready",
      color: "from-blue-500 to-cyan-500",
    },
    {
      name: "Supabase",
      desc: "PostgreSQL Database, Auth & Realtime Ready",
      icon: Database,
      status: "Connected",
      color: "from-emerald-500 to-teal-500",
    },
    {
      name: "Cloudinary",
      desc: "High-Performance Media & Asset Pipeline",
      icon: Cloud,
      status: "Configured",
      color: "from-sky-500 to-indigo-500",
    },
    {
      name: "Vercel & GitHub",
      desc: "CI/CD Deployment & Global Edge Network",
      icon: ShieldCheck,
      status: "Clean Slate",
      color: "from-purple-500 to-pink-500",
    },
  ];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between overflow-hidden bg-slate-950 px-4 py-12 md:py-20">
      {/* Background Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-blue-500/10 blur-[130px] rounded-full" />
      <div className="pointer-events-none absolute bottom-0 right-10 w-[400px] h-[400px] bg-gradient-to-br from-emerald-500/10 to-teal-500/5 blur-[100px] rounded-full" />

      {/* Header Badge */}
      <header className="relative z-10 flex flex-col items-center gap-4 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
          <span>Official.ID • New Project Scaffolding Initialized</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
          Selamat Datang di{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            official.id
          </span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl">
          Aplikasi lama telah dibersihkan secara total. Fondasi baru yang bersih, modern, dan siap produksi telah disiapkan dengan ekosistem Next.js, Supabase, Cloudinary, dan Vercel.
        </p>
      </header>

      {/* Tech Stack Cards */}
      <main className="relative z-10 w-full max-w-4xl my-12 grid grid-cols-1 md:grid-cols-2 gap-4">
        {stackItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.name}
              className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl transition duration-300 hover:border-slate-700 hover:bg-slate-900/90 shadow-lg shadow-black/40"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} p-2.5 text-white shadow-md`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-100 text-base">{item.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" />
                  {item.status}
                </span>
              </div>
            </div>
          );
        })}
      </main>

      {/* Action / Next Steps Box */}
      <div className="relative z-10 w-full max-w-4xl rounded-2xl border border-indigo-900/40 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/40 p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-indigo-400" />
              <h4 className="text-sm font-semibold text-slate-200">
                Tahap Selanjutnya: Spesifikasi & Fitur Official.ID
              </h4>
            </div>
            <p className="text-xs text-slate-400">
              Silakan kirimkan konsep, arsitektur data, atau fitur yang ingin dibangun. Kita akan mulai mengimplementasikannya secara terstruktur.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400">
              branch: main (clean)
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-12 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} official.id. Built with Next.js, Supabase, Cloudinary & Vercel.
      </footer>
    </div>
  );
}
