const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FilmSchema = new Schema(
  {
    kp: {
      type: Number,
      unique: true,
      sparse: true
    },
    tmdb: {
      type: Number,
      unique: true,
      sparse: true
    },
    imdb: {
      type: String,
      unique: true,
      sparse: true
    },
    name: String,
    nameRu: String,
    description: String,
    year: {
      type: Number,
      required: true
    },
    poster: String,
    seen: Boolean,
    torrents: [
      {
        type: Schema.Types.ObjectId,
        ref: "torrent"
      }
    ],
    videos: [
      {
        id: String,
        name: String
      }
    ]
  },
  {
    timestamps: true,
    usePushEach: true
  }
);

const Film = mongoose.model("film", FilmSchema);
module.exports = Film;
