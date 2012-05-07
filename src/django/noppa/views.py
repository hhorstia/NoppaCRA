from django.views.generic import View
from django.http import HttpResponse
from bs4 import BeautifulSoup
from urllib2 import urlopen
from models import Evaluation
from django.db.models import Avg

from django.utils import simplejson
from django.core import serializers

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User, UserManager
from django.shortcuts import render_to_response
from django.template import Context, RequestContext

import time
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
                avg_grade = Evaluation.objects.filter(course = slug_name).aggregate(Avg('grade')) #.filter(faculty = faculty).filter(department = department)
                
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
            
            #TODO: should sort the course details by heading
            descriptions = sorted(descriptions, key=lambda item: item.find_all('td')[0].string.replace('\n', ' '))
            descriptions.reverse()
            
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
        
        sort_by = request.GET.get('sort_by', 'grade')
        response_list = sorted(response_list, key=lambda item: item[sort_by])
        
        if sort_by == 'grade':
            response_list.reverse()
        
        return HttpResponse(json.dumps(response_list,
                                       ensure_ascii = False),
                            content_type = 'application/json')
        
    def post(self, request, faculty = '', department = '', course = ''):
        """
        The post function is used for giving a grade or comment
        to a course
        """
        
        if request.user.is_authenticated() != True:
            return HttpResponse('evaluation error: not authenticated')
        
        grade = int(request.POST['grade'])
        
        if grade > 10 or grade < 0:
            return HttpResponse('evaluation error: invalid grade')
        
        comment = request.POST['comment']
        
        if len(comment) > 2000:
            return HttpResponse('evaluation error: comment too long')
        
        user = request.user.id
        
        if faculty == 'null' or department == 'null':
            r = get_faculty_department(course)
            faculty = r[0]
            department = r[1]
        
        review = Evaluation.objects.filter(user=user, faculty=faculty, department=department, course=course)
        if len(review) > 0:
            review = Evaluation.objects.get(id=review[0].id)
            review.delete()
        
        new_evaluation = Evaluation(faculty = faculty,
                                    department = department,
                                    course = course,
                                    grade = grade,
                                    comment = comment,
                                    user = user)
        new_evaluation.save()
        
        return HttpResponse('evaluation done')

def get_faculty_department(course):

    soup = BeautifulSoup(urlopen("https://noppa.aalto.fi/noppa/kurssi/%s/esite" % course),
                         from_encoding="utf-8")
    
    anchors = soup.find_all('a')
    faulty = ''
    department = ''
    
    fd_regexp = re.compile('/kurssit/')
    for a in anchors:
        link = a.get('href')
        if fd_regexp.search(link):
            name = link.split('/')[-1]
            if name != 'kurssit' and name != '':
                
                if len(link.split('/')) == 4:
                    faculty = link.split('/')[-1]
                else:
                    department = link.split('/')[-1]
                        
    return (faculty, department)

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
    
class Search(View):
    
    def get(self, request, search_string = ''):
        
        soup = BeautifulSoup(urlopen("https://noppa.aalto.fi/noppa/haku/%s" % search_string),
                             from_encoding="utf-8")
        
            
        course_list = soup.body.find_all('a', 'courses')
        
        #print course_list
        response_list = []
        
        #create the reponse JSON
        for course in course_list:
            
            slug_name = course.get('href').split('/')[-2]
            
            #get the average grade for department
            avg_grade = Evaluation.objects.filter(course = slug_name).aggregate(Avg('grade'))
            
            response_list.append({
                'code': slug_name,
                'name': course.string,
                'grade': avg_grade['grade__avg']
            })
            
        
        sort_by = request.GET.get('sort_by', 'grade')
        response_list = sorted(response_list, key=lambda item: item[sort_by])
        
        if sort_by == 'grade':
            response_list.reverse()
        
        
        return HttpResponse(json.dumps(response_list,
                                       ensure_ascii = False),
                            content_type = 'application/json')


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
            time.sleep(0.5)
            
            if user != None:
                if user.is_active:
                    login(request, user)
                    time.sleep(0.5)
                    # Success
                    response_data['value'] = request.user.is_authenticated()
                else:
                    # Disabled account
                    user = authenticate(username=username, password=password) # try to login user
                    time.sleep(0.5)
                    response_data['value'] = request.user.is_authenticated()
            else:
                # Invalid login
                user = authenticate(username=username, password=password) # try to login user
                time.sleep(0.5)
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
        
        
        # reviews - return the reviews done by the user
        
        elif request.POST['method'] == 'reviews':
            if request.user.is_authenticated():
                reviews = Evaluation.objects.filter(user=request.user.id).order_by('id')
                reviews = reviews.reverse()
                response_data['value'] = serializers.serialize("json", reviews)
            else:
                response_data['value'] = 'ERROR'
            return HttpResponse(simplejson.dumps(response_data), mimetype="application/json")
        
        
        # review - returns the review done by the user for one course
        
        elif request.POST['method'] == 'review':
            if request.user.is_authenticated():
                faculty = request.POST['faculty']
                department = request.POST['department']
                course = request.POST['course']
                reviews = Evaluation.objects.filter(user=request.user.id, faculty=faculty, department=department, course=course)
                response_data['value'] = serializers.serialize("json", reviews)
            else:
                response_data['value'] = 'ERROR'
            return HttpResponse(simplejson.dumps(response_data), mimetype="application/json")
        
        
        # course - returns all the reviews of one course
        
        elif request.POST['method'] == 'course':
            faculty = request.POST['faculty']
            department = request.POST['department']
            course = request.POST['course']
            reviews = Evaluation.objects.filter(faculty=faculty, department=department, course=course)
            response_data['value'] = serializers.serialize("json", reviews)
            return HttpResponse(simplejson.dumps(response_data), mimetype="application/json")
        
        
        # drop - removes the review done by the user for the course
        
        elif request.POST['method'] == 'drop':
            if request.user.is_authenticated():
                course = request.POST['course']
                review = Evaluation.objects.filter(user=request.user.id, course=course)
                if len(review) > 0:
                    review = Evaluation.objects.get(id=review[0].id)
                    review.delete()
                    response_data['value'] = 'OK'
                else:
                    response_data['value'] = 'ERROR'
            else:
                response_data['value'] = 'ERROR'
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
