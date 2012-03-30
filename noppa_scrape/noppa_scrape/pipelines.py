import sqlite3
from items import CourseOverviewItem

class NoppaScrapePipeline(object):# This pipeline takes the Item and stuffs it into scrapedata.db
    def __init__(self):
        # Possible we should be doing this in spider_open instead, but okay
        self.connection = sqlite3.connect('./noppa.sql')
        self.cursor = self.connection.cursor()
        self.cursor.execute('CREATE TABLE IF NOT EXISTS kayttaja '
                            '(id INTEGER PRIMARY KEY,'
                            'opiskelijanumero TEXT UNIQUE NOT NULL,'
                            'kayttajatunnus TEXT,'
                            'etunimi TEXT NOT NULL,'
                            'sukunimi TEXT NOT NULL, '
                            'sahkopostiosoite TEXT, '
                            'aktiivinen INTEGER NOT NULL)')
        self.cursor.execute('CREATE TABLE IF NOT EXISTS kurssi '
                            '(id INTEGER PRIMARY KEY, '
                            'koodi TEXT UNIQUE NOT NULL, '
                            'nimi TEXT NOT NULL, '
                            'laajuus TEXT, sisalto TEXT, '
                            'periodi TEXT, '
                            'aktiivinen INTEGER NOT NULL)')
        self.cursor.execute('CREATE TABLE IF NOT EXISTS omat_kurssit '
                            '(id INTEGER PRIMARY KEY, '
                            'henkilo_id INTEGER NOT NULL, '
                            'kurssi_id INTEGER NOT NULL, '
                            'vanha INTEGER NOT NULL, '
                            'aktiivinen INTEGER NOT NULL, '
                            'CONSTRAINT x UNIQUE (henkilo_id, kurssi_id))')
        self.cursor.execute('CREATE TABLE IF NOT EXISTS arviot '
                            '(id INTEGER PRIMARY KEY, '
                            'henkilo_id INTEGER NOT NULL, '
                            'kurssi_id INTEGER NOT NULL, '
                            'arvio INTEGER NOT NULL, '
                            'kommentti TEXT, '
                            'CONSTRAINT x UNIQUE (henkilo_id, kurssi_id))')

    # Take the item and put it in database - do not allow duplicates
    def process_item(self, item, spider):
        try:
            self.cursor.execute(
                "INSERT INTO kurssi "
                "(koodi, nimi, laajuus, sisalto, periodi, aktiivinen) "
                "VALUES (?, ?, ?, ?, ?, ?);",
                    (item['course']['code'],
                     item['course']['name'],
                     item['extent'],
                     item['content'],
                     item['teaching_period'],
                     1))          
            self.connection.commit()
        except KeyError:
            pass
    
        return item
