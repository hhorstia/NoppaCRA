from django.views.generic import View
from django.http import HttpResponse
from bs4 import BeautifulSoup
from urllib2 import urlopen
from models import Evaluation
from django.db.models import Avg

from django.utils import simplejson
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User, UserManager
from django.shortcuts import render_to_response
from django.template import Context, RequestContext

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
                'grade': avg_grade['grade__avg'],
                'name': ''
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
        
        response_list = sorted(response_list, key=lambda item: item['name'])
        '''response_list = sorted(response_list, key=lambda item: item['grade'])'''
        '''response_list.reverse()'''
        
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
        user = request.user.id
        new_evaluation = Evaluation(faculty = faculty,
                                    department = department,
                                    course = course,
                                    grade = grade,
                                    comment = comment,
                                    user = user)
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

class Auth(View):
    
    def post(self, request):
        response_data = {}
        response_data['method'] = request.POST['method']
    
    
        # authenticated - returns authentication status
    
        if request.POST['method'] == 'authenticated':
            response_data['value'] = request.user.is_authenticated()
            return HttpResponse(simplejson.dumps(response_data), mimetype="application/json")
        
        
        # reserved - returns an indication whether the username is taken
        
        elif request.POST['method'] == 'reserved':
            username = request.POST['username']
            
            # check the length of username:
            if len(username) == 0 or len(username) > 50:
                response_data['value'] = 'ERROR_LEN'
                return HttpResponse(simplejson.dumps(response_data), mimetype="application/json")
            
            try:
                user = User.objects.get(username__exact=username)
                response_data['value'] = 'RESERVED' # if previous get succeeded, a user with that username already exists
                return HttpResponse(simplejson.dumps(response_data), mimetype="application/json")
            except User.DoesNotExist:
                response_data['value'] = 'OK'
                return HttpResponse(simplejson.dumps(response_data), mimetype="application/json")
    
    
        # login - logs in the user with provided username and password
    
        elif request.POST['method'] == 'login':
            username = request.POST['username']
            password = request.POST['password']
            
            # check the length of username and password:
            if len(username) == 0 or len(password) == 0 or len(username) > 50:
                response_data['value'] = 'ERROR_LEN'
                return HttpResponse(simplejson.dumps(response_data), mimetype="application/json")
            
            user = authenticate(username=username, password=password) # try to login user
            
            if user != None:
                if user.is_active:
                    login(request, user)
                    # Success
                    response_data['value'] = request.user.is_authenticated()
                else:
                    # Disabled account
                    response_data['value'] = request.user.is_authenticated()
            else:
                # Invalid login
                response_data['value'] = request.user.is_authenticated()
            return HttpResponse(simplejson.dumps(response_data), mimetype="application/json")
    
    
        # register - register the user with provided username and password
        # NOTE: username does not need to be an email address
    
        elif request.POST['method'] == 'register':
            username = request.POST['username']
            password = request.POST['password']
            
            # check the length of username and password:
            if len(username) == 0 or len(password) == 0 or len(username) > 50 or len(password) > 500:
                response_data['value'] = 'ERROR_LEN'
                return HttpResponse(simplejson.dumps(response_data), mimetype="application/json")
            
            try:
                user = User.objects.get(username__exact=username)
                response_data['value'] = 'RESERVED' # if previous get succeeded, a user with that username already exists
                return HttpResponse(simplejson.dumps(response_data), mimetype="application/json")
            except User.DoesNotExist:
                user = User.objects.create_user(username, username, password) # create new user
                
                if user != None:
                    response_data['value'] = 'OK'
                    user = authenticate(username=username, password=password)
                    if user != None:
                        if user.is_active:
                            login(request, user) # login user automatically after registering
                else:
                    response_data['value'] = 'ERROR'
                return HttpResponse(simplejson.dumps(response_data), mimetype="application/json")
    
    
        # logout - logs out the logged in user
    
        elif request.POST['method'] == 'logout':
            if request.user != None: # if user was logged in, log them out
                logout(request)
                response_data['value'] = 'OK'
            else: # user was not logged in so no need to log out
                response_data['value'] = 'NOT_LOGGED_IN'
            return HttpResponse(simplejson.dumps(response_data), mimetype="application/json")
        
        
        # unresolved - returns an empty JSON
        
        else:
            return HttpResponse('{}')

class Webapp(View):
    
    def get(self, request):
        variables = Context({
            'user' : request.user
        })
        return render_to_response('index.html', variables, context_instance=RequestContext(request))
