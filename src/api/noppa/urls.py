from django.conf.urls import patterns, include, url
from views import Noppa

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'api.views.home', name='home'),
    (r'^$',
                Noppa.as_view()),
    (r'^(?P<user>@?[-+_\w\.]+)/$',
                Noppa.as_view()),
    (r'^(?P<user>@?[-+_\w\.]+)/(?P<group>@?[-+_\w]+)/$',
                Noppa.as_view()),
    (r'^(?P<user>@?[-+_\w\.]+)/(?P<group>@?[-+_\w]+)/(?P<feature>@?\d+)$',
                Noppa.as_view()),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
    # url(r'^noppa/', include('noppa.urls')),
)
