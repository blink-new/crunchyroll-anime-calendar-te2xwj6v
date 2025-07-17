// Jikan API (MyAnimeList unofficial API) for real anime data
const JIKAN_BASE_URL = 'https://api.jikan.moe/v4'

export interface JikanAnime {
  mal_id: number
  title: string
  title_english?: string
  images: {
    jpg: {
      image_url: string
      small_image_url: string
      large_image_url: string
    }
  }
  synopsis?: string
  episodes?: number
  status: string
  airing: boolean
  aired: {
    from: string
    to?: string
  }
  genres: Array<{
    mal_id: number
    name: string
  }>
  studios: Array<{
    mal_id: number
    name: string
  }>
  score?: number
  members: number
}

export interface JikanScheduleResponse {
  data: JikanAnime[]
  pagination: {
    last_visible_page: number
    has_next_page: boolean
    current_page: number
    items: {
      count: number
      total: number
      per_page: number
    }
  }
}

export interface JikanSearchResponse {
  data: JikanAnime[]
  pagination: {
    last_visible_page: number
    has_next_page: boolean
    current_page: number
    items: {
      count: number
      total: number
      per_page: number
    }
  }
}

class AnimeApiService {
  private async fetchWithRetry(url: string, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url)
        if (response.status === 429) {
          // Rate limited, wait and retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
          continue
        }
        return response
      } catch (error) {
        if (i === retries - 1) throw error
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    throw new Error('Max retries exceeded')
  }

  async getCurrentSeasonAnime(page = 1): Promise<JikanScheduleResponse> {
    const response = await this.fetchWithRetry(
      `${JIKAN_BASE_URL}/seasons/now?page=${page}&limit=25`
    )
    
    if (!response.ok) {
      throw new Error(`Failed to fetch current season anime: ${response.statusText}`)
    }
    
    return response.json()
  }

  async getScheduleForDay(day: string): Promise<JikanScheduleResponse> {
    // day should be: monday, tuesday, wednesday, thursday, friday, saturday, sunday
    const response = await this.fetchWithRetry(
      `${JIKAN_BASE_URL}/schedules/${day.toLowerCase()}`
    )
    
    if (!response.ok) {
      throw new Error(`Failed to fetch schedule for ${day}: ${response.statusText}`)
    }
    
    return response.json()
  }

  async searchAnime(query: string, page = 1): Promise<JikanSearchResponse> {
    const response = await this.fetchWithRetry(
      `${JIKAN_BASE_URL}/anime?q=${encodeURIComponent(query)}&page=${page}&limit=25&order_by=popularity&sort=asc`
    )
    
    if (!response.ok) {
      throw new Error(`Failed to search anime: ${response.statusText}`)
    }
    
    return response.json()
  }

  async getAnimeById(id: number): Promise<{ data: JikanAnime }> {
    const response = await this.fetchWithRetry(`${JIKAN_BASE_URL}/anime/${id}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch anime ${id}: ${response.statusText}`)
    }
    
    return response.json()
  }

  async getTopAnime(page = 1): Promise<JikanSearchResponse> {
    const response = await this.fetchWithRetry(
      `${JIKAN_BASE_URL}/top/anime?page=${page}&limit=25`
    )
    
    if (!response.ok) {
      throw new Error(`Failed to fetch top anime: ${response.statusText}`)
    }
    
    return response.json()
  }

  // Convert Jikan anime to our internal format
  convertToEpisodeFormat(anime: JikanAnime, episodeNumber = 1): {
    id: string
    animeId: string
    title: string
    episode: number
    series: string
    releaseTime: Date
    duration: string
    thumbnail: string
    description: string
    season: string
    genre: string[]
    crunchyrollUrl: string
  } {
    // Generate a realistic release time (next few days for airing anime)
    const now = new Date()
    const releaseTime = new Date(now.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
    
    return {
      id: `${anime.mal_id}-ep${episodeNumber}`,
      animeId: anime.mal_id.toString(),
      title: `Episode ${episodeNumber}`,
      episode: episodeNumber,
      series: anime.title_english || anime.title,
      releaseTime,
      duration: '24m',
      thumbnail: anime.images.jpg.large_image_url,
      description: anime.synopsis?.slice(0, 200) + '...' || 'No description available',
      season: anime.status === 'Currently Airing' ? 'Current Season' : 'Completed',
      genre: anime.genres?.map(g => g.name) || [],
      crunchyrollUrl: `https://crunchyroll.com/search?q=${encodeURIComponent(anime.title)}`
    }
  }
}

export const animeApi = new AnimeApiService()