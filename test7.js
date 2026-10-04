const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36';

async function searchAnimeCix(query) {
  const url = `https://animecix.tv/secure/search/${encodeURIComponent(query)}?type=undefined&limit=8&provider=null`;
  const res = await axios.get(url, {
    headers: { 'User-Agent': UA, 'Accept': 'application/json', 'Referer': 'https://animecix.tv/' }
  });
  return res.data.results || [];
}

async function getFirstVideo(titleId) {
  const url = `https://animecix.tv/secure/first-video?titleId=${titleId}`;
  const res = await axios.get(url, {
    headers: { 'User-Agent': UA, 'Accept': 'application/json', 'Referer': 'https://animecix.tv/' }
  });
  return res.data;
}

async function getStreamsFromTau(embedUrl, vid) {
  const videoId = embedUrl.match(/\/embed\/([a-f0-9]+)/)[1];
  const url = `https://tau-video.xyz/api/video/${videoId}?vid=${vid}`;
  const res = await axios.get(url, {
    headers: { 'User-Agent': UA, 'Accept': '*/*', 'Referer': embedUrl, 'Origin': 'https://tau-video.xyz' }
  });
  return res.data;
}

async function main() {
  // 1. Ara
  const results = await searchAnimeCix('Solo Leveling');
  console.log('🔍 Sonuçlar:', results.length);
  
  // 2. Doğru animeyi bul (tmdb_id ile eşleştirme yapacağız, şimdilik ilk sonuç)
  const anime = results[0];
  console.log('✅ Seçilen:', anime.name_english, '| id:', anime.id);
  
  // 3. first-video
  const firstVideo = await getFirstVideo(anime.id);
  console.log('✅ Embed:', firstVideo.url, '| vid:', firstVideo.id);
  
  // 4. tau-video
  const tauData = await getStreamsFromTau(firstVideo.url, firstVideo.id);
  console.log('✅ Kalite sayısı:', tauData.urls.length);
  
  // 5. Nuvio stream objeleri
  const streams = tauData.urls.map(u => ({
    name: `AnimeCix ${u.label}`,
    title: `${anime.name_english} S${tauData.season_number}E${tauData.episode_number} [${u.label}]`,
    url: u.url,
    quality: u.label,
    size: u.size,
    headers: { 'User-Agent': UA, 'Referer': u.url }
  }));
  
  console.log('\n🎉 TAM ZİNCİR ÇALIŞTI!\n');
  console.log(JSON.stringify(streams, null, 2));
}

main().catch(e => console.error('💥', e.message));