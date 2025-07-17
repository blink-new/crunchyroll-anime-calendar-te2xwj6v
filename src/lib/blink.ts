import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: 'crunchyroll-anime-calendar-te2xwj6v',
  authRequired: true
})

export interface FavoriteAnime {
  id: string
  userId: string
  animeId: string
  animeTitle: string
  animeImage?: string
  createdAt: string
}

export interface AnimeEpisode {
  id: string
  animeId: string
  title: string
  episodeNumber: number
  seriesTitle: string
  releaseTime: string
  duration?: string
  thumbnail?: string
  description?: string
  season?: string
  genres: string[] // Will be stored as JSON string in DB
  crunchyrollUrl?: string
  createdAt: string
  updatedAt: string
}