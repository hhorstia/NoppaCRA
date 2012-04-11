from django.views.generic import View
from django.http import HttpResponse
from bs4 import BeautifulSoup
from urllib2 import urlopen
from models import Evaluation
from django.db.models import Avg
import json

class Noppa(View):
    
    def get(self, request, faculty = '', department = '', course = ''):
        """
        The get function returns list of faculties, departments or courses
        with the average grade given for them.
        """
        
        noppa_base_url = "https://noppa.aalto.fi/noppa/"        
        response_list = []

        if faculty == '' and department == '' and course == '':
            soup = BeautifulSoup(urlopen("%s%s" % (noppa_base_url,
                                                   "kurssit")),
                                 from_encoding="utf-8")
            faculty_list = soup.body.find_all('a','courses')
            
            #create the reponse JSON
            for faculty in faculty_list:
                slug_name = faculty.get('href').split('/')[-1]
                
                #get the average grade for faculty
                avg_grade = Evaluation.objects.filter(faculty = slug_name).aggregate(Avg('grade'))
                
                response_list.append({
                    'code': slug_name,
                    'name': faculty.string,
                    'grade': avg_grade['grade__avg']
                })
        
        elif department == '' and course == '':
            soup = BeautifulSoup(urlopen("%s%s/%s" % (noppa_base_url,
                                                     "kurssit",
                                                     faculty)),
                                 from_encoding="utf-8")
            
            department_list = soup.body.find_all('a','courses')
            
            #create the reponse JSON
            for department in department_list:
                
                slug_name = department.get('href').split('/')[-1]
                
                #get the average grade for department
                avg_grade = Evaluation.objects.filter(faculty = faculty).filter(department = slug_name).aggregate(Avg('grade'))
                
                response_list.append({
                    'code': slug_name,
                    'name': department.string,
                    'grade': avg_grade['grade__avg']
                })
        
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
                
                #get the average grade for department
                avg_grade = Evaluation.objects.filter(faculty = faculty).filter(department = department).filter(course = slug_name).aggregate(Avg('grade'))
                
                response_list.append({
                    'code': slug_name,
                    'name': course.string,
                    'grade': avg_grade['grade__avg']
                })
                
        else:
            soup = BeautifulSoup(urlopen("%s%s/%s/esite" % (noppa_base_url,
                                                      "kurssi",
                                                      course)),
                                 from_encoding="utf-8")
            
            descriptions = soup.body.find_all('tr', ['even', 'odd'])
                
            #get the average grade for department
            avg_grade = Evaluation.objects.filter(faculty = faculty).filter(department = department).filter(course = course).aggregate(Avg('grade'))
            
            course_dict = {
                'grade': avg_grade['grade__avg']
            }
            
            for description in descriptions:
                desc_id = description['id'] # starts with Any_***
                cells = description.find_all('td')
                desc_heading = cells[0].string.replace('\n', ' ')
                desc_text = cells[1].string
                if desc_text == None:
                    desc_text = ''
                desc_text = " ".join(desc_text.split())
                
                course_dict[desc_id] = {
                    'heading': desc_heading,
                    'text': desc_text
                }
            
            response_list.append(course_dict)
        
        response_list = sorted(response_list, key=lambda item: item['grade'])
        response_list.reverse()
        
        return HttpResponse(json.dumps(response_list,
                                       ensure_ascii = False),
                            content_type = 'application/json')
        
    def post(self, request, faculty = '', department = '', course = ''):
        """
        The post function is used for giving a grade or comment
        to a course
        """
        grade = request.POST['grade']
        comment = request.POST['comment']
        new_evaluation = Evaluation(faculty = faculty,
                                    department = department,
                                    course = course,
                                    grade = grade,
                                    comment = comment)
        new_evaluation.save()
        
        return HttpResponse('evaluation done')
        