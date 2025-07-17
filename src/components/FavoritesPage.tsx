import { useState, useEffect } from 'react'
import { Heart, Search, Trash2, ExternalLink, Calendar } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { favoritesService } from '../services/favoritesService'
import { animeApi, type JikanAnime } from '../services/animeApi'
import type { FavoriteAnime } from '../lib/blink'

interface FavoritesPageProps {
  userId: string
  onBack: () => void
}

export function FavoritesPage({ userId, onBack }: FavoritesPageProps) {
  const [favorites, setFavorites] = useState<FavoriteAnime[]>([])
  const [searchResults, setSearchResults] = useState<JikanAnime[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFavorites()
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadFavorites = async () => {
    try {
      const userFavorites = await favoritesService.getFavorites(userId)
      setFavorites(userFavorites)
    } catch (error) {
      console.error('Error loading favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await animeApi.searchAnime(searchQuery)
      setSearchResults(response.data)
    } catch (error) {
      console.error('Error searching anime:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddFavorite = async (anime: JikanAnime) => {
    try {
      await favoritesService.addFavorite(
        userId,
        anime.mal_id.toString(),
        anime.title_english || anime.title,
        anime.images.jpg.large_image_url
      )
      await loadFavorites()
    } catch (error) {
      console.error('Error adding favorite:', error)
    }
  }

  const handleRemoveFavorite = async (animeId: string) => {
    try {
      await favoritesService.removeFavorite(userId, animeId)
      await loadFavorites()
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  const isFavorited = (animeId: string) => {
    return favorites.some(fav => fav.animeId === animeId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading favorites...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" onClick={onBack}>
                <Calendar className="w-4 h-4 mr-2" />
                Back to Calendar
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center space-x-2">
                <Heart className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  My Favorites
                </h1>
              </div>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="crunchyroll-gradient text-white">
                  <Search className="w-4 h-4 mr-2" />
                  Add Anime
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Search & Add Anime</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Search for anime..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="flex-1"
                    />
                    <Button onClick={handleSearch} disabled={isSearching}>
                      {isSearching ? 'Searching...' : 'Search'}
                    </Button>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {searchResults.map((anime) => (
                      <div key={anime.mal_id} className="flex items-center space-x-4 p-3 border rounded-lg">
                        <img
                          src={anime.images.jpg.small_image_url}
                          alt={anime.title}
                          className="w-16 h-20 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{anime.title_english || anime.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {anime.synopsis?.slice(0, 100)}...
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            {anime.genres.slice(0, 3).map(genre => (
                              <Badge key={genre.mal_id} variant="secondary" className="text-xs">
                                {genre.name}
                              </Badge>
                            ))}
                            {anime.score && (
                              <Badge variant="outline" className="text-xs">
                                ⭐ {anime.score}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleAddFavorite(anime)}
                          disabled={isFavorited(anime.mal_id.toString())}
                          variant={isFavorited(anime.mal_id.toString()) ? "secondary" : "default"}
                        >
                          {isFavorited(anime.mal_id.toString()) ? (
                            <Heart className="w-4 h-4 fill-current" />
                          ) : (
                            <Heart className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {favorites.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-muted-foreground">
              <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
              <p className="mb-6">Start building your anime collection by adding your favorite series!</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="crunchyroll-gradient text-white">
                    <Search className="w-4 h-4 mr-2" />
                    Browse Anime
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>Search & Add Anime</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Search for anime..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="flex-1"
                      />
                      <Button onClick={handleSearch} disabled={isSearching}>
                        {isSearching ? 'Searching...' : 'Search'}
                      </Button>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto space-y-3">
                      {searchResults.map((anime) => (
                        <div key={anime.mal_id} className="flex items-center space-x-4 p-3 border rounded-lg">
                          <img
                            src={anime.images.jpg.small_image_url}
                            alt={anime.title}
                            className="w-16 h-20 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold">{anime.title_english || anime.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {anime.synopsis?.slice(0, 100)}...
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              {anime.genres.slice(0, 3).map(genre => (
                                <Badge key={genre.mal_id} variant="secondary" className="text-xs">
                                  {genre.name}
                                </Badge>
                              ))}
                              {anime.score && (
                                <Badge variant="outline" className="text-xs">
                                  ⭐ {anime.score}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleAddFavorite(anime)}
                            disabled={isFavorited(anime.mal_id.toString())}
                            variant={isFavorited(anime.mal_id.toString()) ? "secondary" : "default"}
                          >
                            {isFavorited(anime.mal_id.toString()) ? (
                              <Heart className="w-4 h-4 fill-current" />
                            ) : (
                              <Heart className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((favorite) => (
              <Card key={favorite.id} className="episode-card-hover overflow-hidden">
                <div className="relative">
                  {favorite.animeImage && (
                    <img
                      src={favorite.animeImage}
                      alt={favorite.animeTitle}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="absolute top-2 right-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveFavorite(favorite.animeId)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-2">{favorite.animeTitle}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      <Heart className="w-3 h-3 mr-1 fill-current" />
                      Favorite
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`https://crunchyroll.com/search?q=${encodeURIComponent(favorite.animeTitle)}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Watch
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Added {new Date(favorite.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}