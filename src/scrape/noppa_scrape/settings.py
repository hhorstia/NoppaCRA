# Scrapy settings for noppa_scrape project
#
# For simplicity, this file contains only the most important settings by
# default. All the other settings are documented here:
#
#     http://doc.scrapy.org/topics/settings.html
#

BOT_NAME = 'noppa_scrape'
BOT_VERSION = '1.0'

SPIDER_MODULES = ['noppa_scrape.spiders']
NEWSPIDER_MODULE = 'noppa_scrape.spiders'
USER_AGENT = '%s/%s' % (BOT_NAME, BOT_VERSION)

ITEM_PIPELINES = [
    'noppa_scrape.pipelines.CourseLinkPipeline'
]

LOG_LEVEL = "INFO"

SPIDER_MIDDLEWARES = {
    'scrapy.contrib.spidermiddleware.referer.RefererMiddleware': 700,
}

import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'api.settings'