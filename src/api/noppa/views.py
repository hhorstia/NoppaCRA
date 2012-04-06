from django.views.generic import View
from django.http import HttpResponse

class Noppa(View):
    
    def get(self, request, faculty = '', department = '', course = ''):
        print faculty
        print department
        print course
        return HttpResponse("")