const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  links: {
    html: string;
    download_location: string;
  };
  user: {
    name: string;
    username: string;
    links: {
      html: string;
    };
  };
  alt_description: string | null;
}

export interface SearchImagesResponse {
  total: number;
  total_pages: number;
  results: UnsplashImage[];
}

export async function searchImages(
  query: string,
  page: number = 1,
  perPage: number = 9,
  token: string,
): Promise<SearchImagesResponse> {
  const url = `${API_URL}/images/search?query=${encodeURIComponent(query)}&page=${page}&perPage=${perPage}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to search images: ${response.statusText}`);
  }

  return response.json();
}

export async function trackImageDownload(
  downloadUrl: string,
  token: string,
): Promise<void> {
  const url = `${API_URL}/images/download`;
  
  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ downloadUrl }),
  });
}

