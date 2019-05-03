const tmdbclient = require("themoviedbclient");
const api = new tmdbclient(process.env.TMDB_KEY);
//const Film = require('./models/film');

module.exports = {
  search: async possible => {
    var json = null;
    if (possible.tmdb) {
      json = await api.call(`/movie/${possible.tmdb}`);
    } else if (possible.imdb) {
      json = await api.call(`/find/${possible.imdb}`, {
        external_source: "imdb_id"
      });
    } else {
      json = await api.call("/search/movie", {
        query: possible.name || possible.nameRu,
        year: possible.year
      });
    }
    const found = await jsonToFilm(json, possible);
    if (found) return found;
    if (possible.kp) return possible;
    return null;
  },
  getVideos: this.getVideos
};

const jsonToFilm = async function(json, possible) {
  var movie = null;
  if (json.movie_results && json.movie_results.length > 0) {
    movie = json.movie_results[0];
  } else if (json.results && json.results.length > 0) {
    movie = json.results[0];
  } else if (json.id) {
    movie = json;
  } else {
    return null;
  }
  possible.tmdb = movie.id;
  possible.name = movie.original_title;
  possible.poster = movie.poster_path;
  const description = await getRu(movie.id);
  possible.description = description || movie.overview;
  if (possible.tmdb) possible.videos = await getVideos(possible.tmdb);
  return possible;
};

const getRu = async function(id) {
  const json = await api.call(`/movie/${id}`, { language: "ru" });
  return json ? json.overview : null;
};

const getVideos = async function(id) {
  const json = await api.call(`/movie/${id}/videos`);
  return json & json.results
    ? json.results.map(r => {
        name: r.name;
        id: r.key;
      })
    : null;
};
