import sqlite3
from items import CourseOverviewItem

    
class CourseLinkPipeline(object):# This pipeline takes the Item and stuffs it into scrapedata.db
    def __init__(self):
        # Possible we should be doing this in spider_open instead, but okay
        self.connection = sqlite3.connect('/Users/kristoffer/Projects/noppa_us/src/api/noppa.sqlite3')
        self.cursor = self.connection.cursor()
        self.cursor.execute('CREATE TABLE IF NOT EXISTS "noppa_courselink"'
                            '("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,'
                            '"webpage" varchar(700) NOT NULL,'
                            '"course_url" varchar(700) NOT NULL,'
                            'CONSTRAINT x UNIQUE (webpage, course_url))')

    # Take the item and put it in database - do not allow duplicates
    def process_item(self, item, spider):
        try:
            self.cursor.execute(
                "INSERT INTO noppa_courselink "
                "(webpage, course_url) "
                "VALUES (?, ?);",
                    (item['webpage'],
                     item['course_url']))          
            self.connection.commit()
        except KeyError:
            print "Key error"
            pass
        except sqlite3.IntegrityError:
            print "Integrity error"
            pass
        
        return item
