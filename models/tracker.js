const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TrackerSchema = new Schema(
   {
      myId: {
         type: Number,
         index: true,
         unique: true
      },
      name: String,
      active: Boolean,
      feeds: [
         {
            name: String,
            active: Boolean,
            url: String
         }
      ],
      torrents: [
         {
            type: Schema.Types.ObjectId,
            ref: 'torrent'
         }
      ]
   },
   {
      usePushEach: true
   }
);

const Tracker = mongoose.model('tracker', TrackerSchema);
module.exports = Tracker;
