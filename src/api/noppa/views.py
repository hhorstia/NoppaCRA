from django.views.generic import View
from django.http import HttpResponse
from bs4 import BeautifulSoup
from urllib2 import urlopen
import json
import re

class Noppa(View):
    
    def get(self, request, faculty = '', department = '', course = ''):
        print faculty
        print department
        print course
        
        noppa_base_url = "https://noppa.aalto.fi/noppa/"        
        response_dict = {}

        if faculty == '' and department == '' and course == '':
            soup = BeautifulSoup(urlopen("%s%s" % (noppa_base_url,
                                                   "kurssit")),
                                 from_encoding="utf-8")
            faculty_list = soup.body.find_all('a','courses')
            
            #create the reponse JSON
            for faculty in faculty_list:
                slug_name = faculty.get('href').split('/')[-1]
                response_dict[slug_name] = unicode(faculty.string)
        
        elif department == '' and course == '':
            soup = BeautifulSoup(urlopen("%s%s/%s" % (noppa_base_url,
                                                     "kurssit",
                                                     faculty)),
                                 from_encoding="utf-8")
            
            department_list = soup.body.find_all('a','courses')
            
            #create the reponse JSON
            for department in department_list:
                slug_name = department.get('href').split('/')[-1]
                response_dict[slug_name] = unicode(department.string)
        
        elif course == '':
            soup = BeautifulSoup(urlopen("%s%s/%s/%s" % (noppa_base_url,
                                                         "kurssit",
                                                         faculty,
                                                         department)),
                                 from_encoding="utf-8")
            
            course_list = soup.body.find_all('a', 'courses')
            
            #create the reponse JSON
            for course in course_list:
                slug_name = course.get('href').split('/')[-2]
                response_dict[slug_name] = unicode(course.string)
                
        else:
            soup = BeautifulSoup(urlopen("%s%s/%s/esite" % (noppa_base_url,
                                                      "kurssi",
                                                      course)),
                                 from_encoding="utf-8")
            
            descriptions = soup.body.find_all('tr', ['even', 'odd'])
            
            for description in descriptions:
                desc_id = description['id'] # starts with Any_***
                cells = description.find_all('td')
                desc_heading = cells[0].string.replace('\n', ' ')
                desc_text = cells[1].string
                if desc_text == None:
                    desc_text = ''
                desc_text = " ".join(desc_text.split())
                
                response_dict[desc_id] = {
                    'heading': desc_heading,
                    'text': desc_text
                }
            
            
        
        return HttpResponse(json.dumps(response_dict,
                                       ensure_ascii = False))