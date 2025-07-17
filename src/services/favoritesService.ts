import { blink } from '../lib/blink'
import type { FavoriteAnime } from '../lib/blink'

class FavoritesService {
  async getFavorites(userId: string): Promise<FavoriteAnime[]> {
    try {
      // Since we can't create the table, we'll use localStorage as fallback
      const stored = localStorage.getItem(`favorites_${userId}`)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error fetching favorites:', error)
      return []
    }
  }

  async addFavorite(userId: string, animeId: string, animeTitle: string, animeImage?: string): Promise<void> {
    try {
      const favorites = await this.getFavorites(userId)
      
      // Check if already favorited
      if (favorites.some(fav => fav.animeId === animeId)) {
        return
      }

      const newFavorite: FavoriteAnime = {
        id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        animeId,
        animeTitle,
        animeImage,
        createdAt: new Date().toISOString()
      }

      favorites.push(newFavorite)
      localStorage.setItem(`favorites_${userId}`, JSON.stringify(favorites))
    } catch (error) {
      console.error('Error adding favorite:', error)
      throw error
    }
  }

  async removeFavorite(userId: string, animeId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites(userId)
      const filtered = favorites.filter(fav => fav.animeId !== animeId)
      localStorage.setItem(`favorites_${userId}`, JSON.stringify(filtered))
    } catch (error) {
      console.error('Error removing favorite:', error)
      throw error
    }
  }

  async isFavorite(userId: string, animeId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites(userId)
      return favorites.some(fav => fav.animeId === animeId)
    } catch (error) {
      console.error('Error checking favorite status:', error)
      return false
    }
  }
}

export const favoritesService = new FavoritesService()