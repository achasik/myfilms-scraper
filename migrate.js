const sqlite =require('./mysql');
const mongo = require('./mongodb');

async function migrateTrackers() {
    const trackers = await sqlite.trackers.get();
    for(tracker of trackers){
        await sqlite.trackers.populateFeeds(tracker);                       
    }
    await mongo.migrateTrackers(trackers);
    console.log('Trackers migrated');
}

async function migrateFilms(){
    const films = await sqlite.films.get();
    await mongo.migrateFilms(films);
    console.log('Films migrated');
}

void async function (){
    try {
        //await migrateTrackers();
        //await migrateFilms();
        console.log('Done');
    } catch (err) {
        console.error(err);
    }
    //process.exit();
}();
