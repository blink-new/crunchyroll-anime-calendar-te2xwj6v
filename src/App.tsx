import { useState, useEffect } from 'react'
import { Calendar, Clock, Search, Filter, Play, ExternalLink, Heart, User, LogOut } from 'lucide-react'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Input } from './components/ui/input'
import { Badge } from './components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './components/ui/dropdown-menu'
import { blink } from './lib/blink'
import { animeApi, type JikanAnime } from './services/animeApi'
import { favoritesService } from './services/favoritesService'
import { FavoritesPage } from './components/FavoritesPage'

interface AnimeEpisode {
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
}

// Mock data for demonstration
const mockEpisodes: AnimeEpisode[] = [
  {
    id: '1',
    animeId: 'aot-final',
    title: 'The Beginning of Everything',
    episode: 1,
    series: 'Attack on Titan: Final Season',
    releaseTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    duration: '24m',
    thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=225&fit=crop',
    description: 'The final battle begins as humanity faces its greatest threat yet.',
    season: 'Final Season',
    genre: ['Action', 'Drama', 'Fantasy'],
    crunchyrollUrl: 'https://crunchyroll.com'
  },
  {
    id: '2',
    animeId: 'demon-slayer-hashira',
    title: 'New Horizons',
    episode: 12,
    series: 'Demon Slayer: Hashira Training Arc',
    releaseTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
    duration: '23m',
    thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=225&fit=crop',
    description: 'Tanjiro continues his training with the Hashira to prepare for the final battle.',
    season: 'Hashira Training Arc',
    genre: ['Action', 'Supernatural', 'Historical'],
    crunchyrollUrl: 'https://crunchyroll.com'
  },
  {
    id: '3',
    animeId: 'jjk-season2',
    title: 'The Power Within',
    episode: 8,
    series: 'Jujutsu Kaisen Season 2',
    releaseTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    duration: '24m',
    thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=225&fit=crop',
    description: 'Yuji discovers new abilities as the Shibuya Incident reaches its climax.',
    season: 'Season 2',
    genre: ['Action', 'Supernatural', 'School'],
    crunchyrollUrl: 'https://crunchyroll.com'
  },
  {
    id: '4',
    animeId: 'mha-season7',
    title: 'Bonds of Friendship',
    episode: 15,
    series: 'My Hero Academia Season 7',
    releaseTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
    duration: '23m',
    thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=225&fit=crop',
    description: 'Class 1-A faces their toughest challenge yet in the final war arc.',
    season: 'Season 7',
    genre: ['Action', 'Superhero', 'School'],
    crunchyrollUrl: 'https://crunchyroll.com'
  },
  {
    id: '5',
    animeId: 'one-piece-egghead',
    title: 'The Ultimate Technique',
    episode: 3,
    series: 'One Piece: Egghead Arc',
    releaseTime: new Date(Date.now() + 72 * 60 * 60 * 1000), // 3 days from now
    duration: '24m',
    thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=225&fit=crop',
    description: 'Luffy and the crew explore the futuristic Egghead Island.',
    season: 'Egghead Arc',
    genre: ['Action', 'Adventure', 'Comedy'],
    crunchyrollUrl: 'https://crunchyroll.com'
  }
]

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<'calendar' | 'favorites'>('calendar')
  const [episodes, setEpisodes] = useState<AnimeEpisode[]>([])
  const [filteredEpisodes, setFilteredEpisodes] = useState<AnimeEpisode[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [favorites, setFavorites] = useState<string[]>([])
  const [loadingAnime, setLoadingAnime] = useState(false)

  // Authentication
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  // Load anime data and favorites when user is authenticated
  useEffect(() => {
    if (user) {
      loadAnimeData()
      loadFavorites()
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const loadAnimeData = async () => {
    setLoadingAnime(true)
    try {
      // Load current season anime
      const currentSeason = await animeApi.getCurrentSeasonAnime()
      
      // Convert to episode format with realistic release times
      const episodeData = currentSeason.data
        .filter(anime => anime.airing) // Only currently airing anime
        .slice(0, 20) // Limit to 20 for performance
        .map(anime => animeApi.convertToEpisodeFormat(anime, Math.floor(Math.random() * 12) + 1))

      setEpisodes(episodeData)
    } catch (error) {
      console.error('Error loading anime data:', error)
      // Fallback to mock data if API fails
      setEpisodes(mockEpisodes)
    } finally {
      setLoadingAnime(false)
    }
  }

  const loadFavorites = async () => {
    if (!user) return
    try {
      const userFavorites = await favoritesService.getFavorites(user.id)
      setFavorites(userFavorites.map(fav => fav.animeId))
    } catch (error) {
      console.error('Error loading favorites:', error)
    }
  }

  const handleToggleFavorite = async (animeId: string, animeTitle: string, animeImage?: string) => {
    if (!user) return

    try {
      const isFav = favorites.includes(animeId)
      if (isFav) {
        await favoritesService.removeFavorite(user.id, animeId)
        setFavorites(prev => prev.filter(id => id !== animeId))
      } else {
        await favoritesService.addFavorite(user.id, animeId, animeTitle, animeImage)
        setFavorites(prev => [...prev, animeId])
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  // Filter episodes based on search and genre
  useEffect(() => {
    let filtered = episodes

    if (searchQuery) {
      filtered = filtered.filter(episode =>
        episode.series.toLowerCase().includes(searchQuery.toLowerCase()) ||
        episode.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedGenre !== 'all') {
      filtered = filtered.filter(episode =>
        (episode.genre || []).includes(selectedGenre)
      )
    }

    setFilteredEpisodes(filtered)
  }, [episodes, searchQuery, selectedGenre])

  const formatTimeUntilRelease = (releaseTime: Date) => {
    const now = currentTime
    const diff = releaseTime.getTime() - now.getTime()
    
    if (diff <= 0) return 'Available now'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    }
    
    return `${hours}h ${minutes}m`
  }

  const getDailyEpisodes = () => {
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    return filteredEpisodes.filter(episode => 
      episode.releaseTime >= today && episode.releaseTime <= nextWeek
    ).sort((a, b) => a.releaseTime.getTime() - b.releaseTime.getTime())
  }

  const getEpisodesForDate = (date: Date) => {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    
    return filteredEpisodes.filter(episode => 
      episode.releaseTime >= startOfDay && episode.releaseTime <= endOfDay
    )
  }

  const generateCalendarDays = () => {
    const today = new Date()
    const days = []
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      days.push(date)
    }
    
    return days
  }

  const allGenres = ['all', ...Array.from(new Set(episodes.flatMap(ep => ep.genre || [])))]

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 crunchyroll-gradient rounded-lg flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Crunchyroll Calendar
          </h1>
          <p className="text-muted-foreground mb-6">
            Track your favorite anime releases and never miss an episode
          </p>
          <Button 
            onClick={() => blink.auth.login()}
            className="crunchyroll-gradient text-white w-full"
          >
            Sign In to Continue
          </Button>
        </Card>
      </div>
    )
  }

  // Show favorites page
  if (currentPage === 'favorites') {
    return (
      <FavoritesPage 
        userId={user.id} 
        onBack={() => setCurrentPage('calendar')} 
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 crunchyroll-gradient rounded-lg flex items-center justify-center">
                <Play className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Crunchyroll Calendar
                </h1>
                <p className="text-sm text-muted-foreground">Upcoming anime releases</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search anime..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-32">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allGenres.map(genre => (
                    <SelectItem key={genre} value={genre}>
                      {genre === 'all' ? 'All Genres' : genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setCurrentPage('favorites')}
                className="flex items-center space-x-2"
              >
                <Heart className="w-4 h-4" />
                <span>Favorites</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => blink.auth.logout()}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loadingAnime ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading anime releases...</p>
          </div>
        ) : (
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'daily' | 'monthly')}>
            <div className="flex items-center justify-between mb-8">
              <TabsList className="grid w-fit grid-cols-2">
                <TabsTrigger value="daily" className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Daily View</span>
                </TabsTrigger>
                <TabsTrigger value="monthly" className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Monthly View</span>
                </TabsTrigger>
              </TabsList>
              
              <div className="text-sm text-muted-foreground">
                {filteredEpisodes.length} episodes found
              </div>
            </div>

          {/* Daily View */}
          <TabsContent value="daily" className="space-y-6">
            <div className="grid gap-6">
              {getDailyEpisodes().length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No episodes found matching your criteria</p>
                  </div>
                </Card>
              ) : (
                getDailyEpisodes().map((episode) => (
                  <Card key={episode.id} className="episode-card-hover overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex">
                        <div className="relative w-48 h-32 flex-shrink-0">
                          <img
                            src={episode.thumbnail}
                            alt={episode.series}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
                          <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
                            EP {episode.episode}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2 h-8 w-8 p-0 bg-black/50 hover:bg-black/70"
                            onClick={() => handleToggleFavorite(episode.animeId, episode.series, episode.thumbnail)}
                          >
                            <Heart 
                              className={`w-4 h-4 ${favorites.includes(episode.animeId) ? 'fill-red-500 text-red-500' : 'text-white'}`} 
                            />
                          </Button>
                        </div>
                        
                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-foreground mb-1">
                                {episode.series}
                              </h3>
                              <p className="text-muted-foreground mb-2">{episode.title}</p>
                              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                {episode.description}
                              </p>
                              
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{episode.duration}</span>
                                </span>
                                <span>{episode.releaseTime.toLocaleDateString()}</span>
                                <span>{episode.releaseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2 mt-3">
                                {(episode.genre || []).slice(0, 3).map(genre => (
                                  <Badge key={genre} variant="secondary" className="text-xs">
                                    {genre}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div className="text-right ml-6">
                              <div className="text-sm font-medium text-primary mb-2">
                                {formatTimeUntilRelease(episode.releaseTime)}
                              </div>
                              
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="mb-2">
                                    Details
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>{episode.series} - Episode {episode.episode}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <img
                                      src={episode.thumbnail}
                                      alt={episode.series}
                                      className="w-full h-48 object-cover rounded-lg"
                                    />
                                    <div>
                                      <h4 className="font-semibold mb-2">{episode.title}</h4>
                                      <p className="text-muted-foreground mb-4">{episode.description}</p>
                                      
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <span className="font-medium">Release Time:</span>
                                          <p>{episode.releaseTime.toLocaleString()}</p>
                                        </div>
                                        <div>
                                          <span className="font-medium">Duration:</span>
                                          <p>{episode.duration}</p>
                                        </div>
                                        <div>
                                          <span className="font-medium">Season:</span>
                                          <p>{episode.season}</p>
                                        </div>
                                        <div>
                                          <span className="font-medium">Genres:</span>
                                          <p>{episode.genre?.join(', ') || 'No genres available'}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              
                              <Button 
                                size="sm" 
                                className="crunchyroll-gradient text-white w-full"
                                onClick={() => window.open(episode.crunchyrollUrl, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Watch
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Monthly View */}
          <TabsContent value="monthly">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {generateCalendarDays().map((date, index) => {
                const dayEpisodes = getEpisodesForDate(date)
                const isToday = date.toDateString() === new Date().toDateString()
                
                return (
                  <Card key={index} className={`${isToday ? 'ring-2 ring-primary' : ''} episode-card-hover`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        {date.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                        {isToday && <Badge className="ml-2 text-xs">Today</Badge>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {dayEpisodes.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No releases</p>
                      ) : (
                        <div className="space-y-2">
                          {dayEpisodes.slice(0, 3).map((episode) => (
                            <div key={episode.id} className="text-xs">
                              <p className="font-medium truncate">{episode.series}</p>
                              <p className="text-muted-foreground">EP {episode.episode}</p>
                              <p className="text-primary">
                                {episode.releaseTime.toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                          ))}
                          {dayEpisodes.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{dayEpisodes.length - 3} more
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
        )}
      </main>
    </div>
  )
}

export default App