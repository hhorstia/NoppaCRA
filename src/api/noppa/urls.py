from django.conf.urls import patterns, include, url
from views import Noppa, Node

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'api.views.home', name='home'),
    (r'^noppa/$',
                Noppa.as_view()),
    (r'^noppa/(?P<faculty>@?[-+_\w\.]+)/$',
                Noppa.as_view()),
    (r'^noppa/(?P<faculty>@?[-+_\w\.]+)/(?P<department>@?[-+_\w]+)/$',
                Noppa.as_view()),
    (r'^noppa/(?P<faculty>@?[-+_\w\.]+)/(?P<department>@?[-+_\w]+)/(?P<course>@?[-+_\.\w]+)/$',
                Noppa.as_view()),
    
    (r'^node/(?P<course>@?[-+_\w\.]+)/$',
                Node.as_view()),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
    # url(r'^noppa/', include('noppa.urls')),
)

