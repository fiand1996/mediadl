export interface MediaFormatOption {
  formatId: string;
  quality: string;
  ext: string;
  url: string;
  filesize?: number;
  note?: string;
  isMerged?: boolean;
  requiresFFmpeg?: boolean;
}
