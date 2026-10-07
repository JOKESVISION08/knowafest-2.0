export interface LiveSymposium {
  id: string;
  title: string;
  college: string;
  city: string;
  date: string;
  category: string;
  knowafestUrl: string;
  description?: string;
  about?: string;
  eventsList?: string[];
  whoCanAttend?: string;
  accommodation?: string;
}

export interface EventFullDetails {
  url: string;
  title?: string;
  description?: string;
  about?: string;
  eventsList?: string[];
  whoCanAttend?: string;
  accommodation?: string;
  college?: string;
  date?: string;
  category?: string;
  city?: string;
}
