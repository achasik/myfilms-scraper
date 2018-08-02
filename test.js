const transform = require('./transform');

function assert(obj, property, expected) {
    console.assert(obj[property] === expected, 'Expected ' + property + '=' + expected + ' but was ' + obj[property]);
}

function testPossibleYear(){
    let torrent ={url: 'kinozal', title:'Мое лето любви / My Summer of Love / 2004 / ПД / WEB-DLRip (1080p)'};
    let film = transform.possible(torrent);
    assert(film,'year',2004);

    torrent ={url: 'kinozal', title:'Голодные игры: Сойка-пересмешница. Часть II / The Hunger Games: Mockingjay - Part 2 / 2015 / АП (Сербин) / BDRip'};
    film = transform.possible(torrent);
    assert(film,'year',2015);

    torrent ={url: 'rutor', title:'Три сестры (2017) WEBRip 720p'};
    film = transform.possible(torrent);
    assert(film,'year',2017);
    assert(film, 'nameRu','Три сестры');
}

testPossibleYear();
console.log('DONE');
