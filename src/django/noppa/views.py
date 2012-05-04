from django.views.generic import View
from django.http import HttpResponse
from bs4 import BeautifulSoup
from urllib2 import urlopen
from models import Evaluation
from django.db.models import Avg
import json
import re

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
        
class Node(View):
    
    def get(self, request, course = ''):
        soup = BeautifulSoup(urlopen("https://noppa.aalto.fi/noppa/kurssi/%s/esite" % course),
                             from_encoding="utf-8")
        
        anchors = soup.find_all('a')
        json_dict = {
            "name": course,
            "children": []
        }
        regexp = re.compile('/kurssi/')
        fd_regexp = re.compile('/kurssit/')
        regexp_course = re.compile(course)
        for a in anchors:
            link = a.get('href')
            if regexp.search(link) and not regexp_course.search(link):
                json_dict['children'].append({
                    'link': link,
                    'name': link.split('/')[-1],
                    'type': 'course'
                    })
            elif fd_regexp.search(link):
                name = link.split('/')[-1]
                if name != 'kurssit' and name != '':
                    
                    if len(link.split('/')) == 4:
                        json_dict['children'].append({
                            'link': 'https://noppa.aalto.fi%s' % link,
                            'name': link.split('/')[-1],
                            'type': 'faculty'
                            })
                    else:
                        json_dict['children'].append({
                            'link': 'https://noppa.aalto.fi%s' % link,
                            'name': link.split('/')[-1],
                            'type': 'department'
                            })
                        
        
        return HttpResponse(json.dumps(json_dict),
                            content_type = 'application/json')
        
    def find_nodes(self, start_url, depth = 1, node_reg = '', node_ex_reg = ''):
        nodes = []
        
        if depth > 1:
            nodes.extend(self.find_nodes(start_url,
                                         depth = depth - 1,
                                         node_reg = node_reg,
                                         node_ex_reg = node_ex_reg))
            
        return nodes