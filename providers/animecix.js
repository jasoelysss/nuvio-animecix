const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36';
const TMDB_API_KEY = '439c478a771f35c05022f9feabcca01c';
const TMDB_BASE = 'https://api.themoviedb.org/3';

// TMDB'den anime adını al
function getTMDBTitle(tmdbId, mediaType) {
  const type = mediaType === 'tv' ? 'tv' : 'movie';
  return fetch(`${TMDB_BASE}/${type}/${tmdbId}?api_key=${TMDB_API_KEY}`)
    .then(r => r.ok ? r.json() : null)
    .then(d => d ? (d.name || d.title) : null);
}

// AnimeCix'te ara
function searchAnimeCix(query) {
  const url = `https://animecix.tv/secure/search/${encodeURIComponent(query)}?type=undefined&limit=8&provider=null`;
  return fetch(url, {
    headers: { 'User-Agent': UA, 'Accept': 'application/json', 'Referer': 'https://animecix.tv/' }
  })
    .then(r => r.ok ? r.json() : null)
    .then(d => d?.results || []);
}

// first-video'dan embed URL ve vid al
function getFirstVideo(titleId) {
  const url = `https://animecix.tv/secure/first-video?titleId=${titleId}`;
  return fetch(url, {
    headers: { 'User-Agent': UA, 'Accept': 'application/json', 'Referer': 'https://animecix.tv/' }
  })
    .then(r => r.ok ? r.json() : null);
}

// tau-video'dan MP4 linklerini al
function getTauStreams(embedUrl, vid) {
  const videoId = embedUrl.match(/\/embed\/([a-f0-9]+)/)?.[1];
  if (!videoId) return Promise.resolve(null);
  
  const url = `https://tau-video.xyz/api/video/${videoId}?vid=${vid}`;
  return fetch(url, {
    headers: { 'User-Agent': UA, 'Accept': '*/*', 'Referer': embedUrl, 'Origin': 'https://tau-video.xyz' }
  })
    .then(r => r.ok ? r.json() : null);
}

// Ana fonksiyon - Nuvio bunu çağırır
function getStreams(tmdbId, mediaType, season, episode) {
  return getTMDBTitle(tmdbId, mediaType)
    .then(title => {
      if (!title) return [];
      console.log(`[AnimeCix] Aranıyor: "${title}" (tmdbId=${tmdbId})`);
      return searchAnimeCix(title);
    })
    .then(results => {
      if (!results || results.length === 0) return [];
      
      // TMDB ID eşleştirmesi (en güvenilir)
      let anime = results.find(r => String(r.tmdb_id) === String(tmdbId));
      
      // Eşleşme yoksa ilk sonucu al
      if (!anime) anime = results[0];
      
      console.log(`[AnimeCix] Seçilen: ${anime.name_english || anime.name} (id=${anime.id})`);
      return getFirstVideo(anime.id).then(fv => ({ anime, fv }));
    })
    .then(({ anime, fv }) => {
      if (!fv || !fv.url) return [];
      console.log(`[AnimeCix] Embed: ${fv.url} vid=${fv.id}`);
      return getTauStreams(fv.url, fv.id).then(tau => ({ anime, tau }));
    })
    .then(({ anime, tau }) => {
      if (!tau || !tau.urls) return [];
      
      const streams = tau.urls.map(u => ({
        name: `AnimeCix ${u.label}`,
        title: `${anime.name_english || anime.name} S${tau.season_number}E${tau.episode_number} [${u.label}]`,
        url: u.url,
        quality: u.label,
        size: u.size,
        headers: {
          'User-Agent': UA,
          'Referer': u.url
        }
      }));
      
      console.log(`[AnimeCix] ${streams.length} stream bulundu`);
      return streams;
    })
    .catch(err => {
      console.error('[AnimeCix] Hata:', err.message);
      return [];
    });
}

// Nuvio export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getStreams };
} else {
  global.getStreams = { getStreams };
}