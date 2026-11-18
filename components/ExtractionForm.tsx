import { Link as LinkIcon, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ExtractionFormProps {
  url: string;
  setUrl: (val: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  placeholderText: string;
  buttonText: string;
  processingText: string;
}

export function ExtractionForm({
  url,
  setUrl,
  loading,
  onSubmit,
  placeholderText,
  buttonText,
  processingText,
}: ExtractionFormProps) {
  return (
    <div className="w-full space-y-4">
      <form
        onSubmit={onSubmit}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
      >
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={placeholderText}
          icon={<LinkIcon className="w-5 h-5 text-slate-400" />}
          className="bg-white/80 dark:bg-slate-900/60 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm focus:border-pink-500 focus:ring-pink-500/20"
          required
        />
        <Button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-medium px-8 shadow-lg shadow-purple-600/25 transition-all cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {processingText}
            </>
          ) : (
            <>
              {buttonText}
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
