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

export interface MediaItem {
  id: string;
  type: "video" | "image";
  url: string;
  thumbnail: string;
  quality?: string;
  duration?: string;
  formats?: MediaFormatOption[];
}

export interface PostResult {
  id: string;
  platform: string;
  author: {
    username: string;
    avatar: string;
    verified: boolean;
  };
  caption: string;
  mediaType: "single_image" | "single_video" | "carousel" | "story";
  items: MediaItem[];
  timestamp: string;
}
