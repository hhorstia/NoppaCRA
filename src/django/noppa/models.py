from django.db import models

class Evaluation(models.Model):
    
    faculty = models.CharField(max_length = 100)
    department = models.CharField(max_length = 100)
    course = models.CharField(max_length = 15)
    grade = models.PositiveSmallIntegerField(
        choices = zip( range(1,10), range(1,10) )
    )
    comment = models.TextField()
    user = models.IntegerField()
