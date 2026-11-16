interface FooterProps {
  text: string;
  privacy: string;
}

export function Footer({ text, privacy }: FooterProps) {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-white/10 py-6 px-6 bg-white/60 dark:bg-black/40 backdrop-blur-md transition-colors">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-500">
        <p>{text}</p>
        <p className="text-slate-700 dark:text-slate-400 font-medium">{privacy}</p>
      </div>
    </footer>
  );
}
